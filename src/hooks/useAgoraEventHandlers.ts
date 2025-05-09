
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { AgoraState } from "@/types/agora";
import { IAgoraRTCClient, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { MeetingUser } from "@/types/meeting";
import { supabase } from "@/integrations/supabase/client";
import { apiLeaveMeeting } from "@/api/meetingApi";

export function useAgoraEventHandlers(
  agoraState: AgoraState,
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>,
  stopScreenShare: () => Promise<void>,
  isScreenSharing: boolean,
  startRecording: () => Promise<boolean>,
  stopRecording: () => Promise<boolean>,
  currentUser: MeetingUser | null,
  participants: Record<string, MeetingUser>,
  setParticipants: React.Dispatch<React.SetStateAction<Record<string, MeetingUser>>>
) {
  const client = agoraState.client;
  const channelName = agoraState.channelName;

  // Effect for participant list synchronization when joining
  useEffect(() => {
    if (!client || !currentUser || !agoraState.joinState || !channelName) return;

    // When we join successfully, add ourselves to the database
    const registerPresence = async () => {
      try {
        // Small delay to ensure connection is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update the meeting_participants table in Supabase to add ourselves
        const { error } = await supabase
          .from("meeting_participants")
          .upsert({
            meeting_id: channelName,
            user_id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            role: currentUser.role,
            audio_enabled: !agoraState.localAudioTrack?.muted
          }, { onConflict: 'meeting_id,user_id' });
          
        if (error) {
          console.error("Failed to register presence in Supabase:", error);
        } else {
          console.log(`Successfully registered presence for ${currentUser.name} in channel ${channelName}`);
        }
      } catch (error) {
        console.error("Failed to initialize participant sync:", error);
      }
    };

    registerPresence();
    
    // Clean up when leaving
    return () => {
      // When we leave the meeting, remove ourselves from the participants table
      if (currentUser && channelName) {
        apiLeaveMeeting(channelName, currentUser.id).catch(err => {
          console.error("Error removing participant on cleanup:", err);
        });
      }
    };
  }, [client, currentUser, agoraState.joinState, agoraState.localAudioTrack?.muted, channelName]);

  useEffect(() => {
    if (!client) return;

    // Set up event handlers
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      
      // Handle different media types
      if (mediaType === "audio") {
        const remoteAudioTrack = user.audioTrack;
        if (remoteAudioTrack) {
          remoteAudioTrack.play();
          
          // Notify about new user with audio
          const userId = user.uid.toString();
          const participantName = participants[userId]?.name || `User ${userId}`;
          
          toast({
            title: "User connected audio",
            description: `${participantName} joined the call`,
          });
          
          // Update audio status in Supabase if the user already exists in participants
          if (participants[userId] && channelName) {
            console.log(`Updating audio status for user ${userId} to enabled`);
            supabase.from("meeting_participants")
              .update({ audio_enabled: true })
              .eq("meeting_id", channelName)
              .eq("user_id", userId)
              .then(({ error }) => {
                if (error) console.error("Error updating audio status:", error);
              });
          }
        }
      }
      
      if (mediaType === "video") {
        // User is sharing screen - check if someone else is already sharing
        setAgoraState(prev => ({
          ...prev,
          screenShareUserId: user.uid
        }));
        
        const userId = user.uid.toString();
        const participantName = participants[userId]?.name || `User ${userId}`;
        
        toast({
          title: "Screen sharing started",
          description: `${participantName} started sharing their screen`,
        });
        
        // If I was sharing, stop my sharing
        if (isScreenSharing) {
          await stopScreenShare();
          toast({
            title: "Your screen sharing was interrupted",
            description: "Another user started sharing their screen",
            variant: "destructive"
          });
        }
      }
      
      // Add user to remote users list if not already there
      setAgoraState(prev => {
        const newState = {
          ...prev,
          remoteUsers: [...prev.remoteUsers.filter(u => u.uid !== user.uid), user]
        };
        return newState;
      });
    });

    client.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "audio") {
        if (user.audioTrack) {
          user.audioTrack.stop();
        }
        
        // Update audio status in Supabase
        const userId = user.uid.toString();
        if (channelName) {
          console.log(`Updating audio status for user ${userId} to disabled`);
          supabase.from("meeting_participants")
            .update({ audio_enabled: false })
            .eq("meeting_id", channelName)
            .eq("user_id", userId)
            .then(({ error }) => {
              if (error) console.error("Error updating audio status:", error);
            });
        }
      }
      
      if (mediaType === "video") {
        // User stopped sharing screen
        if (user.videoTrack) {
          user.videoTrack.stop();
        }
        
        const userId = user.uid.toString();
        const participantName = participants[userId]?.name || `User ${userId}`;
        
        setAgoraState(prev => ({
          ...prev,
          screenShareUserId: prev.screenShareUserId === user.uid ? undefined : prev.screenShareUserId
        }));
        toast({
          title: "Screen sharing ended",
          description: `${participantName} stopped sharing their screen`,
        });
      }
    });

    client.on("user-left", (user) => {
      // Make sure to check if the leaving user was sharing screen
      setAgoraState(prev => {
        // Check if the leaving user was sharing screen
        const wasShareUser = prev.screenShareUserId === user.uid;
        
        // Update state
        const newRemoteUsers = prev.remoteUsers.filter(u => u.uid !== user.uid);
        const newState = {
          ...prev,
          remoteUsers: newRemoteUsers,
          screenShareUserId: wasShareUser ? undefined : prev.screenShareUserId
        };
        
        return newState;
      });
      
      // Remove participant from the database
      const userId = user.uid.toString();
      
      if (channelName) {
        apiLeaveMeeting(channelName, userId).catch(err => {
          console.error("Error removing participant when user left:", err);
        });
      }
      
      if (participants[userId]) {
        const userName = participants[userId].name;
        
        // Show toast notification to all remaining users
        toast({
          title: "User left",
          description: `${userName} left the call`,
        });
      } else {
        toast({
          title: "User left",
          description: `User ${user.uid} left the call`,
        });
      }
    });

    // Clean up
    return () => {
      client.removeAllListeners();
    };
  }, [client, isScreenSharing, stopScreenShare, setAgoraState, startRecording, stopRecording, participants, setParticipants, currentUser, channelName]);
}

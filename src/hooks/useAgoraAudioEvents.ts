
import { useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { AgoraState } from "@/types/agora";
import { IAgoraRTCClient, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { MeetingUser } from "@/types/meeting";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to handle audio-related events
 */
export function useAgoraAudioEvents(
  agoraState: AgoraState,
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>,
  participants: Record<string, MeetingUser>,
  channelName?: string
) {
  const client = agoraState.client;
  
  // Reference to track audio states for each user
  const audioStatesRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!client) return;
    
    // Flag to control notification of audio events
    // to avoid duplicate or unwanted messages
    const notifiedUsers = new Set<string>();

    const handleUserAudioPublished = async (user: IAgoraRTCRemoteUser, mediaType: string) => {
      if (mediaType !== "audio") return;
      
      await client.subscribe(user, mediaType);
      
      const remoteAudioTrack = user.audioTrack;
      if (remoteAudioTrack) {
        remoteAudioTrack.play();
        
        // Only notify about new user with audio if not previously notified
        const userId = user.uid.toString();
        
        if (!notifiedUsers.has(userId)) {
          const participantName = participants[userId]?.name || `User ${userId}`;
          
          console.log(`User ${userId} (${participantName}) connected audio for the first time`);
          
          toast({
            title: "User connected audio",
            description: `${participantName} joined the call`,
          });
          
          // Mark as notified to avoid duplicate messages
          notifiedUsers.add(userId);
        }
        
        // Store the current audio state
        audioStatesRef.current[userId] = true;
        
        // Update audio status in Supabase if the user already exists in participants
        if (channelName) {
          console.log(`Updating audio status for user ${userId} to unmuted`);
          supabase.from("meeting_participants")
            .update({ 
              audio_enabled: true,
              audio_muted: false 
            })
            .eq("meeting_id", channelName)
            .eq("user_id", userId)
            .then(({ error }) => {
              if (error) console.error("Error updating audio status:", error);
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
    };
    
    const handleUserAudioUnpublished = async (user: IAgoraRTCRemoteUser, mediaType: string) => {
      if (mediaType !== "audio") return;
      
      if (user.audioTrack) {
        user.audioTrack.stop();
      }
      
      // We don't show a notification when a user disables audio
      // This prevents messages like "user left" when they just muted themselves
      
      const userId = user.uid.toString();
      
      // Update the stored audio state
      audioStatesRef.current[userId] = false;
      
      // Update audio status in Supabase
      if (channelName) {
        console.log(`Updating audio status for user ${userId} to muted`);
        supabase.from("meeting_participants")
          .update({ 
            audio_enabled: false,
            audio_muted: true 
          })
          .eq("meeting_id", channelName)
          .eq("user_id", userId)
          .then(({ error }) => {
            if (error) console.error("Error updating audio status:", error);
          });
      }
    };

    client.on("user-published", handleUserAudioPublished);
    client.on("user-unpublished", handleUserAudioUnpublished);

    // Clean up
    return () => {
      client.off("user-published", handleUserAudioPublished);
      client.off("user-unpublished", handleUserAudioUnpublished);
    };
  }, [client, setAgoraState, participants, channelName]);
}

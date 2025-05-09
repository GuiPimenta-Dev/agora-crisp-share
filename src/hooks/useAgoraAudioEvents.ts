
import { useEffect } from "react";
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

  useEffect(() => {
    if (!client) return;

    const handleUserAudioPublished = async (user: IAgoraRTCRemoteUser, mediaType: string) => {
      if (mediaType !== "audio") return;
      
      await client.subscribe(user, mediaType);
      
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
        if (channelName) {
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

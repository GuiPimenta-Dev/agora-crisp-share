
import { useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { AgoraState } from "@/types/agora";
import { IAgoraRTCClient, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { MeetingUser } from "@/types/meeting";

/**
 * Hook to handle audio-related events without Supabase synchronization
 */
export function useAgoraAudioEvents(
  agoraState: AgoraState,
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>,
  participants: Record<string, MeetingUser>
) {
  const client = agoraState.client;
  
  // Reference to store notified users that persists across rerenders
  const notifiedUsersRef = useRef<Set<string>>(new Set<string>());

  useEffect(() => {
    if (!client) return;

    const handleUserAudioPublished = async (user: IAgoraRTCRemoteUser, mediaType: string) => {
      if (mediaType !== "audio") return;
      
      await client.subscribe(user, mediaType);
      
      const remoteAudioTrack = user.audioTrack;
      if (remoteAudioTrack) {
        remoteAudioTrack.play();
        
        // Only notify about new user with audio if not previously notified
        const userId = user.uid.toString();
        
        if (!notifiedUsersRef.current.has(userId)) {
          const participantName = participants[userId]?.name || `User ${userId}`;
          
          console.log(`User ${userId} (${participantName}) connected audio`);
          
          toast({
            title: "User connected audio",
            description: `${participantName} joined the call`,
          });
          
          // Mark as notified to avoid duplicate messages
          notifiedUsersRef.current.add(userId);
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
    };

    client.on("user-published", handleUserAudioPublished);
    client.on("user-unpublished", handleUserAudioUnpublished);

    // Clean up
    return () => {
      client.off("user-published", handleUserAudioPublished);
      client.off("user-unpublished", handleUserAudioUnpublished);
    };
  }, [client, setAgoraState, participants]);
}

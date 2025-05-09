
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { AgoraState } from "@/types/agora";
import { IAgoraRTCClient, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { MeetingUser } from "@/types/meeting";

/**
 * Hook to handle screen sharing events
 */
export function useAgoraScreenShareEvents(
  agoraState: AgoraState,
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>,
  stopScreenShare: () => Promise<void>,
  isScreenSharing: boolean,
  participants: Record<string, MeetingUser>
) {
  const client = agoraState.client;

  useEffect(() => {
    if (!client) return;

    const handleUserScreenPublished = async (user: IAgoraRTCRemoteUser, mediaType: string) => {
      if (mediaType !== "video") return;
      
      await client.subscribe(user, mediaType);
      
      // User is sharing screen - check if someone else is already sharing
      setAgoraState(prev => ({
        ...prev,
        screenShareUserId: user.uid,
        remoteUsers: [...prev.remoteUsers.filter(u => u.uid !== user.uid), user]
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
    };
    
    const handleUserScreenUnpublished = async (user: IAgoraRTCRemoteUser, mediaType: string) => {
      if (mediaType !== "video") return;
      
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
    };

    client.on("user-published", handleUserScreenPublished);
    client.on("user-unpublished", handleUserScreenUnpublished);

    // Clean up
    return () => {
      client.off("user-published", handleUserScreenPublished);
      client.off("user-unpublished", handleUserScreenUnpublished);
    };
  }, [client, isScreenSharing, stopScreenShare, setAgoraState, participants]);
}

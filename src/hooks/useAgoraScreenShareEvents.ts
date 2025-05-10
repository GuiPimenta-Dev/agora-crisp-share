
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { AgoraState } from "@/types/agora";
import { IAgoraRTCClient, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { MeetingUser } from "@/types/meeting";

/**
 * Hook to handle screen sharing events without Supabase synchronization
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
      
      console.log("Remote user published video track (screen share) - attempting to subscribe", user.uid);
      
      try {
        // Subscribe to the remote user's video track (screen share)
        await client.subscribe(user, mediaType);
        console.log("Successfully subscribed to remote screen share");
        
        // Update Agora state with the screen sharing user ID
        setAgoraState(prev => ({
          ...prev,
          screenShareUserId: user.uid,
          remoteUsers: [...prev.remoteUsers.filter(u => u.uid !== user.uid), user]
        }));
        
        // Find user info for notification
        const userId = user.uid.toString();
        const participantName = participants[userId]?.name || `User ${userId}`;
        
        // Show toast notification
        toast({
          title: "Screen sharing started",
          description: `${participantName} started sharing their screen`,
        });
        
        // If current user was sharing, stop their sharing
        if (isScreenSharing) {
          await stopScreenShare();
          toast({
            title: "Your screen sharing was interrupted",
            description: "Another user started sharing their screen",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error subscribing to remote screen share:", error);
        toast({
          title: "Error viewing shared screen",
          description: "Could not connect to the shared screen. Please try refreshing.",
          variant: "destructive"
        });
      }
    };
    
    const handleUserScreenUnpublished = async (user: IAgoraRTCRemoteUser, mediaType: string) => {
      if (mediaType !== "video") return;
      
      console.log("Remote user unpublished video track - cleaning up", user.uid);
      
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

    // Register event handlers
    client.on("user-published", handleUserScreenPublished);
    client.on("user-unpublished", handleUserScreenUnpublished);

    return () => {
      client.off("user-published", handleUserScreenPublished);
      client.off("user-unpublished", handleUserScreenUnpublished);
    };
  }, [client, isScreenSharing, stopScreenShare, setAgoraState, participants]);
}

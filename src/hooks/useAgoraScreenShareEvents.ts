
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { AgoraState } from "@/types/agora";
import { IAgoraRTCClient, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { MeetingUser } from "@/types/meeting";
import { supabase } from "@/integrations/supabase/client";

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
  const channelName = agoraState.channelName;

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
      
      // Update the Supabase database to mark this user as sharing screen
      if (channelName) {
        const userId = user.uid.toString();
        await updateScreenSharingStatus(channelName, userId, true);
      }
      
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
      
      // Update the Supabase database to mark this user as not sharing screen
      if (channelName) {
        const userId = user.uid.toString();
        await updateScreenSharingStatus(channelName, userId, false);
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

    // Helper function to update screen sharing status in Supabase
    async function updateScreenSharingStatus(meetingId: string, userId: string, isSharing: boolean) {
      try {
        const { error } = await supabase
          .from("meeting_participants")
          .update({ screen_sharing: isSharing })
          .eq("meeting_id", meetingId)
          .eq("user_id", userId);
          
        if (error) {
          console.error("Failed to update screen sharing status in Supabase:", error);
        }
      } catch (error) {
        console.error("Error updating screen sharing status:", error);
      }
    }

    client.on("user-published", handleUserScreenPublished);
    client.on("user-unpublished", handleUserScreenUnpublished);

    // Clean up
    return () => {
      client.off("user-published", handleUserScreenPublished);
      client.off("user-unpublished", handleUserScreenUnpublished);
    };
  }, [client, isScreenSharing, stopScreenShare, setAgoraState, participants, channelName]);
}

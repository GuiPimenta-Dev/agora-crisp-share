
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { AgoraState } from "@/types/agora";
import { IAgoraRTCClient, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { MeetingUser } from "@/types/meeting";
import { supabase } from "@/integrations/supabase/client";
import { apiLeaveMeeting } from "@/api/meetingApi";

/**
 * Hook to handle remote users joining and leaving
 */
export function useAgoraRemoteUsers(
  agoraState: AgoraState,
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>,
  stopScreenShare: () => Promise<void>,
  isScreenSharing: boolean,
  participants: Record<string, MeetingUser>,
  channelName?: string
) {
  const client = agoraState.client;

  useEffect(() => {
    if (!client) return;

    // Set up event handlers for remote users
    const handleUserLeft = async (user: IAgoraRTCRemoteUser) => {
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
    };

    client.on("user-left", handleUserLeft);

    // Clean up
    return () => {
      client.off("user-left", handleUserLeft);
    };
  }, [client, setAgoraState, channelName]);
}

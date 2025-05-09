
import { useEffect } from "react";
import { AgoraState } from "@/types/agora";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { apiLeaveMeeting } from "@/api/meetingApi";

/**
 * Hook to handle remote users leaving the call
 */
export function useUserLeftHandler(
  agoraState: AgoraState,
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>,
  channelName?: string
) {
  const client = agoraState.client;

  useEffect(() => {
    if (!client) return;

    const handleUserLeft = async (user: IAgoraRTCRemoteUser) => {
      // Check if the leaving user was sharing screen
      setAgoraState(prev => {
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

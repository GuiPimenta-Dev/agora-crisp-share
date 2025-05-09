
import { useEffect } from "react";
import { callGetParticipants } from "@/api/MeetingApiRoutes";
import { MeetingUser } from "@/types/meeting";

/**
 * Simplified hook to fetch initial participants and manage participant list
 */
export function useAgoraParticipants(
  channelName?: string,
  setParticipants?: React.Dispatch<React.SetStateAction<Record<string, MeetingUser>>>,
  currentUser?: MeetingUser | null
) {
  // Fetch initial participants when channelName changes
  useEffect(() => {
    if (!channelName || !setParticipants) return;

    const fetchParticipants = async () => {
      try {
        console.log(`Fetching initial participants for channel ${channelName}`);
        const result = await callGetParticipants(channelName);
        
        if (result.success && result.participants) {
          console.log(`Loaded ${Object.keys(result.participants).length} participants`);
          
          // Set initial participants
          setParticipants(result.participants);
        }
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };

    // Get initial participants
    fetchParticipants();
    
    // Add current user to participants if available
    if (currentUser) {
      const user = { ...currentUser, isCurrent: true };
      setParticipants(prev => ({
        ...prev,
        [user.id]: user
      }));
    }
    
  }, [channelName, setParticipants, currentUser]);
}

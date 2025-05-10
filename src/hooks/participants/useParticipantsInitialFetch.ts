
import { useEffect } from "react";
import { MeetingUser } from "@/types/meeting";
import { callGetParticipants } from "@/api/MeetingApiRoutes";

/**
 * Hook to handle the initial fetching of participants
 */
export function useParticipantsInitialFetch(
  channelName?: string,
  setParticipants?: React.Dispatch<React.SetStateAction<Record<string, MeetingUser>>>,
  currentUser?: MeetingUser | null,
  setLoadingComplete?: () => void,
  setError?: (message: string) => void
) {
  // Fetch participants when channel name changes
  useEffect(() => {
    if (!channelName || !setParticipants) {
      // Call setLoadingComplete if provided even when there's nothing to fetch
      if (setLoadingComplete) setLoadingComplete();
      return;
    }

    const fetchParticipants = async () => {
      try {
        console.log(`Fetching participants for channel ${channelName}`);
        const result = await callGetParticipants(channelName);
        
        if (result.success && result.participants) {
          console.log(`Got ${Object.keys(result.participants).length} participants`);
          setParticipants(result.participants);
        } else if (setError && result.error) {
          setError(result.error);
        }
      } catch (error) {
        console.error("Error fetching participants:", error);
        if (setError) {
          setError("Failed to load participants");
        }
      } finally {
        // Signal that loading is complete
        if (setLoadingComplete) {
          setLoadingComplete();
        }
      }
    };

    // Initial fetch
    fetchParticipants();
    
    // Add current user to participants if available
    if (currentUser) {
      const user = { ...currentUser, isCurrent: true };
      setParticipants(prev => ({
        ...prev,
        [user.id]: user
      }));
    }
  }, [channelName, setParticipants, currentUser, setLoadingComplete, setError]);
}

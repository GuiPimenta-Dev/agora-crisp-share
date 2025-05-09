
import { MeetingUser } from "@/types/meeting";
import { useFetchParticipants } from "./useFetchParticipants";
import { useParticipantsRealtime } from "./useParticipantsRealtime";
import { sortParticipantsByRoleAndTime } from "@/utils/participantSorting";

/**
 * Custom hook for managing the participants list with realtime updates and proper sorting
 */
export function useParticipantsList(meetingId?: string) {
  // Fetch initial participants data
  const { 
    participants, 
    setParticipants, 
    isLoading, 
    error 
  } = useFetchParticipants(meetingId);

  // Set up realtime updates
  useParticipantsRealtime(meetingId, setParticipants);

  // Function to get sorted participants
  const getSortedParticipants = (): MeetingUser[] => {
    return sortParticipantsByRoleAndTime(Object.values(participants));
  };

  return {
    participants,
    sortedParticipants: getSortedParticipants(),
    isLoading,
    error
  };
}

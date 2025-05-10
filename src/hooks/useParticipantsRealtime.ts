
import { MeetingUser } from "@/types/meeting";
import { useParticipantsRealtime as useRealtimeParticipants } from "./participants";

/**
 * Hook for handling realtime updates to meeting participants
 * @deprecated Use hooks/participants/useParticipantsRealtime instead
 */
export function useParticipantsRealtime(
  meetingId: string | undefined,
  setParticipants: React.Dispatch<React.SetStateAction<Record<string, MeetingUser>>>
) {
  // Simply forward to our refactored hook with the proper signature
  return useRealtimeParticipants(meetingId, setParticipants);
}

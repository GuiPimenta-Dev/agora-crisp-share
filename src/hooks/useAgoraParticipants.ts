
import { useParticipantsInitialFetch } from "./participants/useParticipantsInitialFetch";
import { useParticipantsRealtime } from "./participants/useParticipantsRealtime";
import { MeetingUser } from "@/types/meeting";

/**
 * Hook to manage participants list and handle realtime updates
 */
export function useAgoraParticipants(
  channelName?: string,
  setParticipants?: React.Dispatch<React.SetStateAction<Record<string, MeetingUser>>>,
  currentUser?: MeetingUser | null
) {
  // Handle initial fetching of participants
  useParticipantsInitialFetch(channelName, setParticipants, currentUser);

  // Set up realtime subscription for participant changes
  useParticipantsRealtime(channelName, setParticipants, currentUser);
}


import { useState } from "react";
import { MeetingUser } from "@/types/meeting";
import { useParticipantsInitialFetch } from "./participants";

type ParticipantWithTimestamp = MeetingUser & {
  joinedAt: string;
};

/**
 * Hook for fetching meeting participants with their profile data
 */
export function useFetchParticipants(meetingId?: string) {
  const [participants, setParticipants] = useState<Record<string, ParticipantWithTimestamp>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use our refactored hook for initial fetch
  useParticipantsInitialFetch(
    meetingId,
    setParticipants,
    null, // No current user in this context
    // Additional callbacks for loading and error states
    () => setIsLoading(false),
    (errorMessage) => {
      setError(errorMessage);
      setIsLoading(false);
    }
  );

  return { participants, setParticipants, isLoading, error };
}

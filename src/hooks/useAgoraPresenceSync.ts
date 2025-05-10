
import { MeetingUser } from "@/types/meeting";
import { AgoraState } from "@/types/agora";
import { usePresenceRegistration } from "./usePresenceRegistration";

/**
 * Hook to handle user presence synchronization with Supabase
 * This is a composition hook that combines more specialized hooks
 */
export function useAgoraPresenceSync(
  agoraState: AgoraState,
  currentUser: MeetingUser | null,
  channelName?: string
) {
  // Handle initial presence registration and cleanup
  usePresenceRegistration(agoraState, currentUser, channelName);
}


import { MeetingUser } from "@/types/meeting";
import { AgoraState } from "@/types/agora";
import { usePresenceRegistration } from "./usePresenceRegistration";
import { useScreenShareSync } from "./useScreenShareSync";

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
  
  // Sync screen sharing status with Supabase
  useScreenShareSync(agoraState, currentUser, channelName);
  
  // Audio sync removed as requested
}

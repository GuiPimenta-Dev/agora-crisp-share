
import { MeetingUser } from "@/types/meeting";
import { AgoraState } from "@/types/agora";
import { useAudioStatusSync } from "./useAudioStatusSync";
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
  // Sync audio status with Supabase
  useAudioStatusSync(agoraState, currentUser, channelName);
  
  // Handle initial presence registration and cleanup
  usePresenceRegistration(agoraState, currentUser, channelName);
  
  // Sync screen sharing status with Supabase
  useScreenShareSync(agoraState, currentUser, channelName);
}

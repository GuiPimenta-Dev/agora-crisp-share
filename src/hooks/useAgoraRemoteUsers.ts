
import { AgoraState } from "@/types/agora";
import { MeetingUser } from "@/types/meeting";
import { useUserLeftHandler } from "./useUserLeftHandler";

/**
 * Hook to handle remote users joining and leaving
 */
export function useAgoraRemoteUsers(
  agoraState: AgoraState,
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>,
  stopScreenShare: () => Promise<void>,
  isScreenSharing: boolean,
  participants: Record<string, MeetingUser>,
  channelName?: string
) {
  // Handle user left events
  useUserLeftHandler(agoraState, setAgoraState, channelName);
}

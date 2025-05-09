
import { useEffect } from "react";
import { AgoraState } from "@/types/agora";
import { MeetingUser } from "@/types/meeting";
import { useAgoraPresenceSync } from "./useAgoraPresenceSync";
import { useAgoraRemoteUsers } from "./useAgoraRemoteUsers";
import { useAgoraAudioEvents } from "./useAgoraAudioEvents";
import { useAgoraScreenShareEvents } from "./useAgoraScreenShareEvents";

/**
 * Main hook that composes all the Agora event handlers together
 */
export function useAgoraEventHandlers(
  agoraState: AgoraState,
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>,
  stopScreenShare: () => Promise<void>,
  isScreenSharing: boolean,
  startRecording: () => Promise<boolean>,
  stopRecording: () => Promise<boolean>,
  currentUser: MeetingUser | null,
  participants: Record<string, MeetingUser>,
  setParticipants: React.Dispatch<React.SetStateAction<Record<string, MeetingUser>>>
) {
  const channelName = agoraState.channelName;

  // Handle user presence synchronization with Supabase
  useAgoraPresenceSync(agoraState, currentUser, channelName);

  // Handle remote users joining and leaving events
  useAgoraRemoteUsers(
    agoraState,
    setAgoraState,
    stopScreenShare,
    isScreenSharing,
    participants,
    channelName
  );

  // Handle audio-related events
  useAgoraAudioEvents(
    agoraState,
    setAgoraState,
    participants,
    channelName
  );

  // Handle screen sharing events
  useAgoraScreenShareEvents(
    agoraState,
    setAgoraState,
    stopScreenShare,
    isScreenSharing,
    participants
  );
}

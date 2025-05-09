
import { useState, useRef } from 'react';
import { AgoraState } from '@/types/agora';
import { MeetingUser } from '@/types/meeting';
import { IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import { AgoraStateManager } from '@/types/agoraContext';

/**
 * Hook to manage all Agora-related state
 */
export const useAgoraState = (): AgoraStateManager => {
  const [agoraState, setAgoraState] = useState<AgoraState>({
    client: undefined,
    localAudioTrack: undefined,
    screenVideoTrack: undefined,
    screenShareUserId: undefined,
    remoteUsers: [],
    joinState: false,
    isRecording: false,
    participants: {},
    channelName: undefined,
    joinAudioCallFunc: undefined,
    recordingId: undefined
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [currentUser, setCurrentUser] = useState<MeetingUser | null>(null);
  const [participants, setParticipants] = useState<Record<string, MeetingUser>>({});
  const [clientInitialized, setClientInitialized] = useState(false);
  const [joinInProgress, setJoinInProgress] = useState(false);
  const [participantsLastUpdated, setParticipantsLastUpdated] = useState<number>(Date.now());
  
  const clientRef = useRef<IAgoraRTCClient | undefined>();
  const leaveInProgress = useRef<boolean>(false);

  return {
    agoraState,
    setAgoraState,
    isMuted,
    setIsMuted,
    isScreenSharing,
    setIsScreenSharing,
    currentUser,
    setCurrentUser,
    participants,
    setParticipants,
    clientRef,
    leaveInProgress,
    clientInitialized,
    setClientInitialized,
    joinInProgress,
    setJoinInProgress,
    participantsLastUpdated,
    setParticipantsLastUpdated
  };
};

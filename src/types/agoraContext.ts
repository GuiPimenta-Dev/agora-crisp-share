
import { AgoraState, AgoraContextType } from '@/types/agora';
import { MeetingUser } from '@/types/meeting';
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

export interface AgoraProviderProps {
  children: React.ReactNode;
}

export interface AgoraStateManager {
  agoraState: AgoraState;
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  isScreenSharing: boolean;
  setIsScreenSharing: React.Dispatch<React.SetStateAction<boolean>>;
  currentUser: MeetingUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<MeetingUser | null>>;
  participants: Record<string, MeetingUser>;
  setParticipants: React.Dispatch<React.SetStateAction<Record<string, MeetingUser>>>;
  clientRef: React.MutableRefObject<import('agora-rtc-sdk-ng').IAgoraRTCClient | undefined>;
  leaveInProgress: React.MutableRefObject<boolean>;
  clientInitialized: boolean;
  setClientInitialized: React.Dispatch<React.SetStateAction<boolean>>;
  joinInProgress: boolean;
  setJoinInProgress: React.Dispatch<React.SetStateAction<boolean>>;
  participantsLastUpdated: number;
  setParticipantsLastUpdated: React.Dispatch<React.SetStateAction<number>>;
}

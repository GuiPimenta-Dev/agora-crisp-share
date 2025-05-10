
import { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  IMicrophoneAudioTrack, 
  ILocalVideoTrack,
  UID,
} from "agora-rtc-sdk-ng";
import { MeetingUser } from "./meeting";

// Define types for our Agora client state
export interface AgoraState {
  client?: IAgoraRTCClient;
  localAudioTrack?: IMicrophoneAudioTrack;
  screenVideoTrack?: ILocalVideoTrack;
  screenShareUserId?: UID;  // Keep as UID type here, we'll handle conversion when passing to components
  remoteUsers: IAgoraRTCRemoteUser[];
  joinState: boolean;
  isRecording: boolean;
  recordingId?: string;
  channelName?: string;
}

export interface AgoraContextType {
  agoraState: AgoraState;
  joinAudioCall: (channelName: string, audioEnabled?: boolean) => Promise<boolean>;
  leaveAudioCall: () => Promise<void>;
  toggleMute: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  isScreenSharing: boolean;
  isMuted: boolean;
  remoteScreenShareUser: IAgoraRTCRemoteUser | undefined;
  generateMeetingLink: () => string;
  downloadRecording: () => Promise<void>;
  isScreenRecording: boolean;
  toggleScreenRecording: () => void;
  // Meeting functionality
  currentUser: MeetingUser | null;
  participants: Record<string, MeetingUser>;
  setParticipants: React.Dispatch<React.SetStateAction<Record<string, MeetingUser>>>;
  joinWithUser: (channelName: string, user: MeetingUser) => Promise<boolean>;
}

export interface RecordingSettings {
  channelName: string;
  uid: string;
  token: string;
  resourceId?: string;
  recordingId?: string;
}

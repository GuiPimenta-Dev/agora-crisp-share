
import { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  IMicrophoneAudioTrack, 
  ILocalVideoTrack,
  UID,
} from "agora-rtc-sdk-ng";

// Define types for our Agora client state
export interface AgoraState {
  client?: IAgoraRTCClient;
  localAudioTrack?: IMicrophoneAudioTrack;
  screenVideoTrack?: ILocalVideoTrack;
  screenShareUserId?: UID;
  remoteUsers: IAgoraRTCRemoteUser[];
  joinState: boolean;
  isRecording: boolean;
  recordingId?: string;
  channelName?: string;
}

export interface AgoraContextType {
  agoraState: AgoraState;
  joinAudioCall: (channelName: string) => Promise<boolean>;
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
}

export interface RecordingSettings {
  channelName: string;
  uid: string;
  token: string;
  resourceId?: string;
  recordingId?: string;
}


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
}

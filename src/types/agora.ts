
import { IAgoraRTCClient, IAgoraRTCRemoteUser, IMicrophoneAudioTrack, ILocalVideoTrack, UID } from "agora-rtc-sdk-ng";
import { MeetingUser } from "./meeting";

export interface AgoraState {
  client?: IAgoraRTCClient;
  localAudioTrack?: IMicrophoneAudioTrack;
  screenVideoTrack?: ILocalVideoTrack;
  screenShareUserId?: UID;
  remoteUsers: IAgoraRTCRemoteUser[];
  joinState: boolean;
  isRecording?: boolean;
  channelName?: string;
  recordingId?: string;
  participants?: Record<string, MeetingUser>;
}

export interface AgoraContextType {
  agoraState: AgoraState;
  joinAudioCall: (channelName: string, audioEnabled: boolean) => Promise<boolean>;
  leaveAudioCall: () => Promise<void>;
  toggleMute: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  isScreenSharing: boolean;
  isMuted: boolean;
  remoteScreenShareUser?: IAgoraRTCRemoteUser;
  generateMeetingLink: () => string;
  downloadRecording: () => Promise<void>;
  isScreenRecording: boolean;
  toggleScreenRecording: () => void;
  // Meeting functionality
  currentUser: MeetingUser | null;
  participants: Record<string, MeetingUser>;
  setParticipants: React.Dispatch<React.SetStateAction<Record<string, MeetingUser>>>;
  joinWithUser: (channelName: string, user: MeetingUser) => Promise<boolean>;
  refreshParticipants: () => Promise<void>;
}

export interface RecordingSettings {
  channelName: string;
  uid: string;
  token: string;
  resourceId?: string;
  recordingId?: string;
}


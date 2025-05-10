
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { AgoraState } from "@/types/agora";
import { MeetingUser } from "@/types/meeting";

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

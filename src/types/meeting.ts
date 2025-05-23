
export type Role = "coach" | "student" | "listener";

export interface MeetingUser {
  id: string;
  name: string;
  summoner?: string; // Add summoner field
  avatar?: string;
  role: Role;
  audioEnabled?: boolean;
  audioMuted?: boolean;
  isCurrent?: boolean;
  screenSharing?: boolean;
}

export interface Meeting {
  id: string;
  coach_id: string;
  student_id: string;
  participants: Record<string, MeetingUser>;
  recordingUrl?: string; // Add recording URL field
}

export interface CreateMeetingRequest {
  id: string;
  coach_id: string;
  student_id: string;
}

export interface JoinMeetingRequest {
  meetingId: string;
  userId: string;
}

export interface CreateMeetingResponse {
  success: boolean;
  error?: string;
  meeting?: Meeting;
}

export interface JoinMeetingResponse {
  success: boolean;
  error?: string;
  user?: MeetingUser;
}

export interface GetParticipantsResponse {
  success: boolean;
  error?: string;
  participants?: Record<string, MeetingUser>;
}

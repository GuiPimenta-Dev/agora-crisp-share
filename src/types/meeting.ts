
export type Role = "coach" | "student" | "listener";

export interface MeetingUser {
  id: string;
  name: string;
  avatar: string;
  role: Role;
  audioEnabled: boolean;
}

export interface Meeting {
  id: string;
  coach_id: string;
  student_id: string;
  participants: Record<string, MeetingUser>;
}

export interface CreateMeetingRequest {
  id: string;
  coach_id: string;
  student_id: string;
}

export interface JoinMeetingRequest {
  id: string;
  name: string;
  avatar: string;
}


import { Meeting, MeetingUser, Role, CreateMeetingRequest } from "@/types/meeting";

// In-memory storage for bookings/meetings
const meetings: Record<string, Meeting> = {};

/**
 * Create a new meeting (agora usando bookings)
 */
export const createMeeting = (data: CreateMeetingRequest): Meeting => {
  const { id, coach_id, student_id } = data;
  
  if (meetings[id]) {
    throw new Error(`Meeting with ID ${id} already exists`);
  }
  
  const newMeeting: Meeting = {
    id,
    coach_id,
    student_id,
    participants: {}
  };
  
  meetings[id] = newMeeting;
  return newMeeting;
};

/**
 * Get a meeting by ID
 */
export const getMeeting = (id: string): Meeting | undefined => {
  return meetings[id];
};

/**
 * Add a participant to a meeting
 */
export const addParticipant = (
  meetingId: string,
  userId: string,
  name: string,
  avatar: string
): MeetingUser => {
  const meeting = getMeeting(meetingId);
  
  if (!meeting) {
    throw new Error(`Meeting ${meetingId} not found`);
  }
  
  // Determine role and audio permissions
  let role: Role = "listener";
  let audioEnabled = false;
  
  if (userId === meeting.coach_id) {
    role = "coach";
    audioEnabled = true;
  } else if (userId === meeting.student_id) {
    role = "student";
    audioEnabled = true;
  }
  
  // Create user object
  const user: MeetingUser = {
    id: userId,
    name,
    avatar,
    role,
    audioEnabled
  };
  
  // Add to participants
  meeting.participants[userId] = user;
  return user;
};

/**
 * Remove a participant from a meeting
 */
export const removeParticipant = (meetingId: string, userId: string): void => {
  const meeting = getMeeting(meetingId);
  
  if (!meeting) {
    return;
  }
  
  if (meeting.participants[userId]) {
    delete meeting.participants[userId];
  }
};

/**
 * Get all participants in a meeting
 */
export const getParticipants = (meetingId: string): Record<string, MeetingUser> => {
  const meeting = getMeeting(meetingId);
  
  if (!meeting) {
    return {};
  }
  
  return meeting.participants;
};

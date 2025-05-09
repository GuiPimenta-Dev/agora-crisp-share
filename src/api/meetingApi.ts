
import { CreateMeetingRequest, JoinMeetingRequest, MeetingUser } from "@/types/meeting";
import { createMeeting, getMeeting, addParticipant, removeParticipant } from "@/lib/meetingStore";

/**
 * Create a new meeting
 */
export const apiCreateMeeting = async (data: CreateMeetingRequest) => {
  try {
    const meeting = createMeeting(data);
    return { success: true, meeting };
  } catch (error: any) {
    console.error("Failed to create meeting:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Join a meeting
 */
export const apiJoinMeeting = async (channelId: string, data: JoinMeetingRequest): Promise<{ 
  success: boolean; 
  user?: MeetingUser; 
  error?: string;
  channelId?: string;
}> => {
  try {
    const meeting = getMeeting(channelId);
    
    if (!meeting) {
      return { success: false, error: `Meeting ${channelId} not found` };
    }
    
    const user = addParticipant(channelId, data.id, data.name, data.avatar);
    
    return { 
      success: true, 
      user,
      channelId 
    };
  } catch (error: any) {
    console.error("Failed to join meeting:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Leave a meeting
 */
export const apiLeaveMeeting = async (channelId: string, userId: string) => {
  try {
    removeParticipant(channelId, userId);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to leave meeting:", error);
    return { success: false, error: error.message };
  }
};

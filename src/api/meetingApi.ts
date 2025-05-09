
import { CreateMeetingRequest, JoinMeetingRequest, MeetingUser, Role } from "@/types/meeting";
import { supabase } from "@/integrations/supabase/client";

/**
 * Create a new meeting
 */
export const apiCreateMeeting = async (data: CreateMeetingRequest) => {
  try {
    // Check if meeting already exists
    const { data: existingMeeting } = await supabase
      .from("meetings")
      .select()
      .eq("id", data.id)
      .single();
      
    if (existingMeeting) {
      // Meeting already exists, just return it
      return { success: true, meeting: existingMeeting };
    }

    // Insert meeting into Supabase
    const { data: meeting, error } = await supabase
      .from("meetings")
      .insert({
        id: data.id,
        coach_id: data.coach_id,
        student_id: data.student_id
      })
      .select()
      .single();
    
    if (error) throw error;
    
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
    // Get meeting from Supabase
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select()
      .eq("id", channelId)
      .single();
    
    if (meetingError) {
      return { success: false, error: `Meeting ${channelId} not found` };
    }
    
    // Determine role and audio permissions
    let role: Role = "listener";
    let audioEnabled = false;
    
    if (data.id === meeting.coach_id) {
      role = "coach";
      audioEnabled = true;
    } else if (data.id === meeting.student_id) {
      role = "student";
      audioEnabled = true;
    }
    
    // Create user object
    const user: MeetingUser = {
      id: data.id,
      name: data.name,
      avatar: data.avatar,
      role,
      audioEnabled
    };
    
    // Add participant to the meeting in Supabase
    const { error: participantError } = await supabase
      .from("meeting_participants")
      .upsert({
        meeting_id: channelId,
        user_id: data.id,
        name: data.name,
        avatar: data.avatar,
        role,
        audio_enabled: audioEnabled
      }, { onConflict: 'meeting_id,user_id' });
    
    if (participantError) {
      console.error("Failed to add participant:", participantError);
      // Continue anyway, as this is not critical
    }
    
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
    // Remove participant from Supabase
    const { error } = await supabase
      .from("meeting_participants")
      .delete()
      .match({ meeting_id: channelId, user_id: userId });
    
    if (error) {
      console.error("Error removing participant:", error);
      // Continue anyway as this is not critical
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Failed to leave meeting:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all participants in a meeting
 */
export const apiGetParticipants = async (meetingId: string) => {
  try {
    const { data, error } = await supabase
      .from("meeting_participants")
      .select()
      .eq("meeting_id", meetingId);
    
    if (error) throw error;
    
    // Convert array to record object as expected by the application
    const participants: Record<string, MeetingUser> = {};
    data.forEach(participant => {
      participants[participant.user_id] = {
        id: participant.user_id,
        name: participant.name,
        avatar: participant.avatar,
        role: participant.role as Role,
        audioEnabled: participant.audio_enabled
      };
    });
    
    return { success: true, participants };
  } catch (error: any) {
    console.error("Failed to get participants:", error);
    return { success: false, error: error.message, participants: {} };
  }
};

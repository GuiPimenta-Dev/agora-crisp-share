
import { CreateMeetingRequest, MeetingUser, Role } from "@/types/meeting";
import { supabase } from "@/integrations/supabase/client";

/**
 * Create a new meeting
 */
export const apiCreateMeeting = async (data: CreateMeetingRequest) => {
  try {
    // Verificar se já existe um booking com este ID
    const { data: existingBooking } = await supabase
      .from("bookings")
      .select()
      .eq("id", data.id)
      .single();
      
    if (existingBooking) {
      // Booking já existe, apenas retorná-lo
      return { success: true, meeting: existingBooking };
    }

    // Inserir reunião como um booking
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        id: data.id,
        coach_id: data.coach_id,
        student_id: data.student_id,
        status: 'scheduled',
        date: new Date().toISOString().split('T')[0], // Data atual
        time: new Date().toTimeString().split(' ')[0], // Hora atual
        meeting_url: data.id // Usamos o ID como URL da reunião
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, meeting: booking };
  } catch (error: any) {
    console.error("Failed to create meeting:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Join a meeting
 */
export const apiJoinMeeting = async (channelId: string, userId: string): Promise<{ 
  success: boolean; 
  user?: MeetingUser; 
  error?: string;
  channelId?: string;
}> => {
  try {
    // Verificar se o usuário existe na tabela profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select()
      .eq("id", userId)
      .maybeSingle();
    
    if (profileError || !profile) {
      console.error("User profile not found:", profileError || "No data returned");
      return { success: false, error: "User not found in the system. Access denied." };
    }
    
    // Obter reunião da tabela bookings usando channelId como meeting_url ou id
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select()
      .or(`id.eq.${channelId},meeting_url.eq.${channelId}`)
      .maybeSingle();
    
    if (bookingError || !booking) {
      // Tentar criar um booking se não existir
      try {
        const { data: newBooking, error: createError } = await supabase
          .from("bookings")
          .insert({
            id: channelId,
            coach_id: userId, // Usuário atual se torna coach por padrão
            student_id: '', // Por enquanto vazio
            status: 'in_progress',
            date: new Date().toISOString().split('T')[0], // Data atual
            time: new Date().toTimeString().split(' ')[0], // Hora atual
            meeting_url: channelId // Usar ID como URL da reunião
          })
          .select()
          .single();
          
        if (createError) {
          return { success: false, error: `Meeting ${channelId} not found and could not be created` };
        }
        
        // Use o booking recém-criado
        booking = newBooking;
      } catch (createError: any) {
        return { success: false, error: `Meeting ${channelId} not found: ${createError.message}` };
      }
    }
    
    // Determinar função e permissões de áudio
    let role: Role = "listener";
    let audioEnabled = false;
    let audioMuted = true;
    
    if (userId === booking.coach_id) {
      role = "coach";
      audioEnabled = true;
      audioMuted = false;
    } else if (userId === booking.student_id) {
      role = "student";
      audioEnabled = true;
      audioMuted = false;
    }
    
    // Criar objeto de usuário usando dados do perfil do Supabase
    const user: MeetingUser = {
      id: userId,
      name: profile.name,
      avatar: profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`,
      role,
      audioEnabled,
      audioMuted
    };
    
    // Definir dados do participante
    const participantData = {
      meeting_id: booking.id,
      user_id: userId,
      name: profile.name,
      avatar: profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`,
      role,
      audio_enabled: audioEnabled,
      audio_muted: audioMuted,
      screen_sharing: false
    };
    
    console.log("Adding participant to meeting:", participantData);
    
    // Adicionar participante à reunião no Supabase
    const { error: participantError } = await supabase
      .from("meeting_participants")
      .upsert(participantData, { onConflict: 'meeting_id,user_id' });
    
    if (participantError) {
      console.error("Failed to add participant:", participantError);
      // Continue de qualquer forma, pois isso não é crítico
    }
    
    return { 
      success: true, 
      user,
      channelId: booking.id 
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
    console.log(`Removing participant ${userId} from meeting ${channelId}`);
    
    // Remover participante do Supabase
    const { error } = await supabase
      .from("meeting_participants")
      .delete()
      .match({ meeting_id: channelId, user_id: userId });
    
    if (error) {
      console.error("Error removing participant:", error);
      // Continue de qualquer forma, pois isso não é crítico
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
    console.log(`Getting participants for meeting ${meetingId}`);
    
    const { data, error } = await supabase
      .from("meeting_participants")
      .select("*")
      .eq("meeting_id", meetingId);
    
    if (error) throw error;
    
    console.log(`Found ${data?.length || 0} participants`);
    
    // Converter array para objeto conforme esperado pela aplicação
    const participants: Record<string, MeetingUser> = {};
    data?.forEach((participant: any) => {
      participants[participant.user_id] = {
        id: participant.user_id,
        name: participant.name,
        avatar: participant.avatar,
        role: participant.role as Role,
        audioEnabled: participant.audio_enabled,
        audioMuted: participant.audio_muted !== undefined ? participant.audio_muted : true, // Garantir que temos um valor
        screenSharing: participant.screen_sharing || false
      };
    });
    
    return { success: true, participants };
  } catch (error: any) {
    console.error("Failed to get participants:", error);
    return { success: false, error: error.message, participants: {} };
  }
};

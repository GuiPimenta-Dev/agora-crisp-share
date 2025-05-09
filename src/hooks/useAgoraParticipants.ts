
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MeetingUser } from "@/types/meeting";
import { callGetParticipants } from "@/api/MeetingApiRoutes";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to manage participants list and handle realtime updates
 */
export function useAgoraParticipants(
  channelName?: string,
  setParticipants?: React.Dispatch<React.SetStateAction<Record<string, MeetingUser>>>,
  currentUser?: MeetingUser | null
) {
  // Fetch participants when channel name changes
  useEffect(() => {
    if (!channelName || !setParticipants) return;

    const fetchParticipants = async () => {
      try {
        console.log(`Fetching participants for channel ${channelName}`);
        const result = await callGetParticipants(channelName);
        
        if (result.success && result.participants) {
          console.log(`Got ${Object.keys(result.participants).length} participants`);
          setParticipants(result.participants);
        }
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };

    // Initial fetch
    fetchParticipants();
    
    // Add current user to participants if available
    if (currentUser) {
      const user = { ...currentUser, isCurrent: true };
      setParticipants(prev => ({
        ...prev,
        [user.id]: user
      }));
    }

    // Create a unique channel name to prevent potential conflicts
    const realtimeChannelName = `meeting-${channelName}-participants-${Date.now()}`;

    // Set up realtime subscription for participant changes
    const participantsSubscription = supabase
      .channel(realtimeChannelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'meeting_participants',
        filter: `meeting_id=eq.${channelName}`
      }, (payload) => {
        console.log('Realtime participant update:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newParticipant = payload.new as any;
          
          // Don't notify for our own join
          const isSelf = currentUser && currentUser.id === newParticipant.user_id;
          
          if (!isSelf) {
            toast({
              title: "Participant joined",
              description: `${newParticipant.name} joined the meeting`
            });
          }

          setParticipants(prev => ({
            ...prev,
            [newParticipant.user_id]: {
              id: newParticipant.user_id,
              name: newParticipant.name,
              avatar: newParticipant.avatar,
              role: newParticipant.role,
              audioEnabled: newParticipant.audio_enabled,
              audioMuted: newParticipant.audio_muted,
              screenSharing: newParticipant.screen_sharing || false,
              isCurrent: isSelf
            }
          }));
        }
        else if (payload.eventType === 'UPDATE') {
          const updatedParticipant = payload.new as any;
          
          setParticipants(prev => ({
            ...prev,
            [updatedParticipant.user_id]: {
              ...prev[updatedParticipant.user_id],
              name: updatedParticipant.name,
              avatar: updatedParticipant.avatar,
              role: updatedParticipant.role,
              audioEnabled: updatedParticipant.audio_enabled,
              audioMuted: updatedParticipant.audio_muted,
              screenSharing: updatedParticipant.screen_sharing || false
            }
          }));
        }
        else if (payload.eventType === 'DELETE') {
          const deletedParticipant = payload.old as any;
          
          // Don't notify for our own leave
          const isSelf = currentUser && currentUser.id === deletedParticipant.user_id;
          
          if (!isSelf) {
            toast({
              title: "Participant left",
              description: `${deletedParticipant.name} left the meeting`
            });
          }

          setParticipants(prev => {
            const newParticipants = { ...prev };
            delete newParticipants[deletedParticipant.user_id];
            return newParticipants;
          });
        }
      })
      .subscribe();

    console.log("Realtime subscription set up for meeting participants:", channelName);

    // Clean up subscription
    return () => {
      console.log("Cleaning up participants subscription");
      participantsSubscription.unsubscribe();
    };
  }, [channelName, setParticipants, currentUser]);
}

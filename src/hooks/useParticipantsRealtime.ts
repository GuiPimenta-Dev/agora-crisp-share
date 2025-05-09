
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MeetingUser } from "@/types/meeting";
import { toast } from "@/hooks/use-toast";
import { generateRealtimeChannelName } from "@/lib/supabaseRealtime";

type ParticipantWithTimestamp = MeetingUser & {
  joinedAt: string;
};

/**
 * Hook for handling realtime updates to meeting participants
 */
export function useParticipantsRealtime(
  meetingId: string | undefined,
  setParticipants: React.Dispatch<React.SetStateAction<Record<string, ParticipantWithTimestamp>>>
) {
  useEffect(() => {
    if (!meetingId) return;

    // Set up realtime subscription with a unique channel name
    const realtimeChannelName = generateRealtimeChannelName('participants', meetingId);
    console.log(`Setting up realtime subscription on channel: ${realtimeChannelName}`);
    
    // Create the channel subscription
    const participantsSubscription = supabase
      .channel(realtimeChannelName)
      .on('postgres_changes', { 
        event: '*',
        schema: 'public', 
        table: 'meeting_participants',
        filter: `meeting_id=eq.${meetingId}`
      }, async (payload) => {
        console.log('Realtime participant update received:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newParticipant = payload.new as any;
          
          // Fetch the user profile for the new participant
          const { data: profileData } = await supabase
            .from("profiles")
            .select("name, summoner, avatar")
            .eq("id", newParticipant.user_id)
            .single();
          
          const displayName = profileData?.summoner || profileData?.name || `User-${newParticipant.user_id.substring(0, 4)}`;
          
          // Add the new participant
          setParticipants(prev => ({
            ...prev,
            [newParticipant.user_id]: {
              id: newParticipant.user_id,
              name: displayName,
              avatar: profileData?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
              role: newParticipant.role as any,
              audioEnabled: newParticipant.audio_enabled,
              screenSharing: newParticipant.screen_sharing || false,
              joinedAt: newParticipant.created_at
            }
          }));
          
          toast({
            title: "New participant",
            description: `${displayName} joined the meeting`
          });
        }
        else if (payload.eventType === 'UPDATE') {
          const updatedParticipant = payload.new as any;
          
          // Update the participant's data while preserving other properties
          setParticipants(prev => {
            const existing = prev[updatedParticipant.user_id];
            if (!existing) return prev;
            
            console.log(`Updating participant ${updatedParticipant.user_id}:`, {
              audioEnabled: updatedParticipant.audio_enabled,
              screenSharing: updatedParticipant.screen_sharing
            });
            
            return {
              ...prev,
              [updatedParticipant.user_id]: {
                ...existing,
                audioEnabled: updatedParticipant.audio_enabled,
                screenSharing: updatedParticipant.screen_sharing || false
              }
            };
          });
        }
        else if (payload.eventType === 'DELETE') {
          const deletedParticipant = payload.old as any;
          
          setParticipants(prev => {
            const participant = prev[deletedParticipant.user_id];
            
            if (participant) {
              toast({
                title: "Participant left",
                description: `${participant.name} left the meeting`
              });
            }
            
            const newParticipants = { ...prev };
            delete newParticipants[deletedParticipant.user_id];
            return newParticipants;
          });
        }
      })
      .subscribe((status) => {
        console.log(`Realtime subscription status: ${status}`);
      });

    console.log("Realtime subscription set up for meeting participants");

    // Clean up subscription when component unmounts
    return () => {
      console.log(`Cleaning up realtime subscription for ${realtimeChannelName}`);
      supabase.removeChannel(participantsSubscription);
    };
  }, [meetingId, setParticipants]);
}

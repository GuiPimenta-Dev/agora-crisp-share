
import { useEffect, useRef } from "react";
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
  // Persist notifiedUsers across rerenders
  const notifiedUsersRef = useRef<Set<string>>(new Set<string>());
  // Track status updates to avoid showing "joined" notifications for them
  const statusUpdateTimestampsRef = useRef<Record<string, number>>({});
  
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
        
        // Helper function to determine if an update is just a status change
        const isStatusUpdateOnly = (oldData: any, newData: any) => {
          // Check if only these specific fields changed
          const statusFields = ['audio_enabled', 'audio_muted', 'screen_sharing'];
          
          for (const key in newData) {
            if (!statusFields.includes(key) && newData[key] !== oldData[key]) {
              return false;
            }
          }
          return true;
        };
        
        if (payload.eventType === 'INSERT') {
          const newParticipant = payload.new as any;
          const userId = newParticipant.user_id;
          
          // Fetch the user profile for the new participant
          const { data: profileData } = await supabase
            .from("profiles")
            .select("name, summoner, avatar")
            .eq("id", userId)
            .maybeSingle();
          
          const displayName = profileData?.summoner || profileData?.name || `User-${userId.substring(0, 4)}`;
          
          // Add the new participant
          setParticipants(prev => ({
            ...prev,
            [userId]: {
              id: userId,
              name: displayName,
              avatar: profileData?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
              role: newParticipant.role as any,
              audioEnabled: newParticipant.audio_enabled,
              audioMuted: newParticipant.audio_muted,
              screenSharing: newParticipant.screen_sharing || false,
              joinedAt: newParticipant.created_at
            }
          }));
          
          // Only notify new participants once
          if (!notifiedUsersRef.current.has(userId)) {
            toast({
              title: "New participant",
              description: `${displayName} joined the meeting`
            });
            notifiedUsersRef.current.add(userId);
          }
        }
        else if (payload.eventType === 'UPDATE') {
          const updatedParticipant = payload.new as any;
          const oldParticipant = payload.old as any;
          const userId = updatedParticipant.user_id;
          
          // Record the timestamp of this status update
          statusUpdateTimestampsRef.current[userId] = Date.now();
          
          // Check if this is just a status update (mute/unmute/screen sharing)
          const isStatusUpdate = isStatusUpdateOnly(oldParticipant, updatedParticipant);
          
          if (isStatusUpdate) {
            console.log("This is just a status update, not showing participant joined notification");
          }
          
          // Update the participant's data while preserving other properties
          setParticipants(prev => {
            const existing = prev[userId];
            if (!existing) return prev;
            
            console.log(`Updating participant ${userId}:`, {
              audioEnabled: updatedParticipant.audio_enabled,
              audioMuted: updatedParticipant.audio_muted,
              screenSharing: updatedParticipant.screen_sharing
            });
            
            return {
              ...prev,
              [userId]: {
                ...existing,
                audioEnabled: updatedParticipant.audio_enabled,
                audioMuted: updatedParticipant.audio_muted,
                screenSharing: updatedParticipant.screen_sharing || false
              }
            };
          });
        }
        else if (payload.eventType === 'DELETE') {
          const deletedParticipant = payload.old as any;
          const userId = deletedParticipant.user_id;
          
          setParticipants(prev => {
            const participant = prev[userId];
            
            if (participant) {
              toast({
                title: "Participant left",
                description: `${participant.name} left the meeting`
              });
            }
            
            // Remove from our notification tracking set
            notifiedUsersRef.current.delete(userId);
            
            const newParticipants = { ...prev };
            delete newParticipants[userId];
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

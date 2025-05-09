
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MeetingUser } from "@/types/meeting";
import { toast } from "@/hooks/use-toast";
import { generateRealtimeChannelName } from "@/lib/supabaseRealtime";

type ParticipantWithTimestamp = MeetingUser & {
  joinedAt: string;
};

/**
 * Simplified hook for handling realtime updates to meeting participants
 */
export function useParticipantsRealtime(
  meetingId: string | undefined,
  setParticipants: React.Dispatch<React.SetStateAction<Record<string, ParticipantWithTimestamp>>>
) {
  // Track users we've notified about to prevent duplicate notifications
  const notifiedUsersRef = useRef<Set<string>>(new Set<string>());
  
  // Track users we've seen before (any event)
  const knownUsersRef = useRef<Set<string>>(new Set<string>());
  
  // Track last notification time for each user
  const lastNotificationTimeRef = useRef<Record<string, number>>({});
  
  useEffect(() => {
    if (!meetingId) return;
    
    // Generate a unique channel name to prevent conflicts
    const realtimeChannelName = generateRealtimeChannelName('participants', meetingId);
    console.log(`Setting up realtime subscription: ${realtimeChannelName}`);
    
    // Helper function to check if we should show a notification
    const shouldNotifyUser = (userId: string, eventType: string): boolean => {
      // Don't notify for users we've already notified about
      if (notifiedUsersRef.current.has(userId)) {
        return false;
      }
      
      // Check if we've shown a notification for this user recently
      const now = Date.now();
      const lastTime = lastNotificationTimeRef.current[userId] || 0;
      const timeSinceLastNotification = now - lastTime;
      
      // Don't notify more than once every 10 seconds for the same user
      if (timeSinceLastNotification < 10000) {
        return false;
      }
      
      // Update last notification time
      lastNotificationTimeRef.current[userId] = now;
      
      // For joins, add to the notified set so we don't notify again
      if (eventType === 'join') {
        notifiedUsersRef.current.add(userId);
      }
      
      return true;
    };
    
    // Create the channel subscription
    const participantsSubscription = supabase
      .channel(realtimeChannelName)
      .on('postgres_changes', { 
        event: '*',
        schema: 'public', 
        table: 'meeting_participants',
        filter: `meeting_id=eq.${meetingId}`
      }, (payload) => {
        console.log('Participant update received:', payload);
        
        // Helper to check if this is just a status update
        const isStatusUpdateOnly = (oldData: any, newData: any) => {
          // These fields can change without triggering notifications
          const statusFields = ['audio_enabled', 'audio_muted', 'screen_sharing'];
          
          // Check if only status fields changed
          for (const key in newData) {
            if (
              !statusFields.includes(key) && 
              newData[key] !== oldData?.[key]
            ) {
              return false;
            }
          }
          return true;
        };
        
        if (payload.eventType === 'INSERT') {
          const newParticipant = payload.new as any;
          const userId = newParticipant.user_id;
          
          // Skip if we already know this user
          if (knownUsersRef.current.has(userId)) {
            console.log(`User ${userId} is already known, treating as status update`);
            
            // Just update the participant data without notification
            setParticipants(prev => ({
              ...prev,
              [userId]: {
                id: userId,
                name: newParticipant.name,
                avatar: newParticipant.avatar,
                role: newParticipant.role,
                audioEnabled: newParticipant.audio_enabled,
                audioMuted: newParticipant.audio_muted,
                screenSharing: newParticipant.screen_sharing || false,
                joinedAt: newParticipant.created_at
              }
            }));
            return;
          }
          
          // Mark as known now
          knownUsersRef.current.add(userId);
          
          // Notify about new participant (if we should)
          if (shouldNotifyUser(userId, 'join')) {
            toast({
              title: "New participant",
              description: `${newParticipant.name} joined the meeting`
            });
          }

          // Add to participants state
          setParticipants(prev => ({
            ...prev,
            [userId]: {
              id: userId,
              name: newParticipant.name,
              avatar: newParticipant.avatar,
              role: newParticipant.role,
              audioEnabled: newParticipant.audio_enabled,
              audioMuted: newParticipant.audio_muted,
              screenSharing: newParticipant.screen_sharing || false,
              joinedAt: newParticipant.created_at
            }
          }));
        }
        else if (payload.eventType === 'UPDATE') {
          const updatedParticipant = payload.new as any;
          const oldParticipant = payload.old as any;
          const userId = updatedParticipant.user_id;
          
          // Add to known users
          knownUsersRef.current.add(userId);
          
          // Check if this is just a status update
          const statusOnly = isStatusUpdateOnly(oldParticipant, updatedParticipant);
          
          // Update the participant in state
          setParticipants(prev => {
            const existing = prev[userId];
            if (!existing) return prev;
            
            return {
              ...prev,
              [userId]: {
                ...existing,
                name: updatedParticipant.name || existing.name,
                avatar: updatedParticipant.avatar || existing.avatar,
                role: updatedParticipant.role || existing.role,
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
          
          // Only notify about leaves for known users
          if (knownUsersRef.current.has(userId) && shouldNotifyUser(userId, 'leave')) {
            toast({
              title: "Participant left",
              description: `${deletedParticipant.name} left the meeting`
            });
          }
          
          // Remove from tracked sets
          knownUsersRef.current.delete(userId);
          notifiedUsersRef.current.delete(userId);
          
          // Remove from state
          setParticipants(prev => {
            const newParticipants = { ...prev };
            delete newParticipants[userId];
            return newParticipants;
          });
        }
      })
      .subscribe((status) => {
        console.log(`Realtime subscription status: ${status}`);
      });
    
    // Cleanup on unmount
    return () => {
      console.log(`Cleaning up realtime subscription for ${realtimeChannelName}`);
      supabase.removeChannel(participantsSubscription);
    };
  }, [meetingId, setParticipants]);
}

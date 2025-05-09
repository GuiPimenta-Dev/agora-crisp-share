import { useEffect, useRef } from "react";
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
  // Use ref for notifiedUsers to persist across rerenders
  const notifiedUsersRef = useRef<Set<string>>(new Set<string>());
  
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
      
      // Add the current user to notified list to avoid notifications
      notifiedUsersRef.current.add(user.id);
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
        
        // Keep track of last update time for each user to detect rapid successive updates
        const updateTimestampRef = useRef<Record<string, number>>({});
        
        // Function to check if this might be a duplicate or redundant update
        const isDuplicateUpdate = (userId: string): boolean => {
          const now = Date.now();
          const lastUpdate = updateTimestampRef.current[userId] || 0;
          const timeDiff = now - lastUpdate;
          
          // If we got another update for the same user in less than 500ms, consider it a potential duplicate
          if (timeDiff < 500) {
            console.log(`Potential duplicate update for user ${userId} (${timeDiff}ms since last update)`);
            return true;
          }
          
          // Record this update time
          updateTimestampRef.current[userId] = now;
          return false;
        };
        
        if (payload.eventType === 'INSERT') {
          const newParticipant = payload.new as any;
          const userId = newParticipant.user_id;
          
          // Check if this might be a duplicate
          if (isDuplicateUpdate(userId)) return;
          
          // Don't notify for our own join
          const isSelf = currentUser && currentUser.id === userId;
          
          if (!isSelf && !notifiedUsersRef.current.has(userId)) {
            toast({
              title: "Participant joined",
              description: `${newParticipant.name} joined the meeting`
            });
            
            // Add to notified users set to avoid duplicate notifications
            notifiedUsersRef.current.add(userId);
          }

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
              isCurrent: isSelf
            }
          }));
        }
        else if (payload.eventType === 'UPDATE') {
          const updatedParticipant = payload.new as any;
          const oldParticipant = payload.old as any;
          const userId = updatedParticipant.user_id;
          
          // Only update if audio or screen sharing status changed
          // This is an audio/screen status update, not a participant joining
          const hasAudioChanged = 
            updatedParticipant.audio_enabled !== oldParticipant.audio_enabled ||
            updatedParticipant.audio_muted !== oldParticipant.audio_muted;
            
          const hasScreenSharingChanged = 
            updatedParticipant.screen_sharing !== oldParticipant.screen_sharing;
          
          // If both audio and screen sharing are unchanged, this might be another type of update
          // that we don't necessarily want to process here
          if (!hasAudioChanged && !hasScreenSharingChanged) {
            console.log("Update doesn't affect audio or screen sharing, skipping");
            return;
          }
          
          setParticipants(prev => ({
            ...prev,
            [userId]: {
              ...prev[userId],
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
          const userId = deletedParticipant.user_id;
          
          // Don't notify for our own leave
          const isSelf = currentUser && currentUser.id === userId;
          
          if (!isSelf) {
            toast({
              title: "Participant left",
              description: `${deletedParticipant.name} left the meeting`
            });
          }
          
          // Remove from notified users set
          notifiedUsersRef.current.delete(userId);

          setParticipants(prev => {
            const newParticipants = { ...prev };
            delete newParticipants[userId];
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

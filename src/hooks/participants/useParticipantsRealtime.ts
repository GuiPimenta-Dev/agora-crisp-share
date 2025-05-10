
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MeetingUser } from "@/types/meeting";
import { useParticipantNotifications } from "./useParticipantNotifications";

/**
 * Hook to handle realtime updates for participants
 */
export function useParticipantsRealtime(
  channelName?: string,
  setParticipants?: React.Dispatch<React.SetStateAction<Record<string, MeetingUser>>>,
  currentUser?: MeetingUser | null
) {
  const notifications = useParticipantNotifications();
  
  // Set up realtime subscription for participant changes
  useEffect(() => {
    if (!channelName || !setParticipants) return;
    
    // CRITICAL FIX: Use a consistent channel name pattern that all clients will share for the same meeting
    // This ensures all participants are subscribed to the same channel for the meeting
    const realtimeChannelName = `meeting-participants-${channelName}`;

    console.log(`Setting up realtime subscription for participants in ${channelName} on channel ${realtimeChannelName}`);

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
          handleInsertEvent(payload.new);
        }
        else if (payload.eventType === 'UPDATE') {
          handleUpdateEvent(payload.new, payload.old);
        }
        else if (payload.eventType === 'DELETE') {
          handleDeleteEvent(payload.old);
        }
      })
      .subscribe();

    console.log("Realtime subscription set up for meeting participants:", channelName);

    // Handle INSERT event
    function handleInsertEvent(newParticipant: Record<string, any>) {
      const userId = newParticipant.user_id;
      
      // Check if this might be a duplicate or if we already know this user
      if (notifications.isDuplicateUpdate(userId) || notifications.isUserKnown(userId)) {
        console.log(`User ${userId} is already known or duplicate, not treating as a new join`);
        
        // Update the participant data without showing notifications
        updateParticipantData(userId, newParticipant);
        return;
      }
      
      // Mark as known now
      notifications.markUserAsKnown(userId);
      
      // Don't notify for our own join
      const isSelf = currentUser && currentUser.id === userId;
      
      if (!isSelf) {
        notifications.showJoinNotification(userId, newParticipant.name || 'Unknown user');
      }

      updateParticipantData(userId, newParticipant, isSelf);
    }

    // Handle UPDATE event - Improved for audio status changes
    function handleUpdateEvent(updatedParticipant: Record<string, any>, oldParticipant: Record<string, any>) {
      const userId = updatedParticipant.user_id;
      
      // Detect audio-related changes
      const hasAudioEnabledChanged = updatedParticipant.audio_enabled !== oldParticipant.audio_enabled;
      const hasAudioMutedChanged = updatedParticipant.audio_muted !== oldParticipant.audio_muted;
      
      // IMPROVED: For audio updates, we bypass most filtering to ensure status is always reflected
      const isAudioUpdate = hasAudioEnabledChanged || hasAudioMutedChanged;
      
      // If this is an audio update, process it immediately with minimal filtering
      // For non-audio updates, still check for duplicates
      if (!isAudioUpdate && notifications.isDuplicateUpdate(userId)) {
        console.log(`Skipping duplicate update for non-audio change for user ${userId}`);
        return;
      }
      
      // Log important status changes
      if (isAudioUpdate) {
        console.log(
          `Processing AUDIO status change for ${userId}: ` +
          `muted=${updatedParticipant.audio_muted} (was ${oldParticipant.audio_muted}), ` +
          `enabled=${updatedParticipant.audio_enabled} (was ${oldParticipant.audio_enabled})`
        );
      }
      
      const hasScreenSharingChanged = updatedParticipant.screen_sharing !== oldParticipant.screen_sharing;
      
      // Process audio and screen sharing status changes with priority
      if (hasAudioEnabledChanged || hasAudioMutedChanged || hasScreenSharingChanged) {
        console.log(`Updating participant ${userId} with new audio/screen status`);
        
        setParticipants(prev => {
          const existing = (prev[userId] || {}) as MeetingUser;
          
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
        
        if (isAudioUpdate) {
          notifications.trackFieldUpdate(userId, hasAudioMutedChanged ? 'audio_muted' : 'audio_enabled');
        }
      }
    }

    // Handle DELETE event - Fixed TypeScript errors here
    function handleDeleteEvent(deletedParticipant: Record<string, any>) {
      if (!deletedParticipant) {
        console.error("Received DELETE event with null deletedParticipant");
        return;
      }
      
      const userId = deletedParticipant.user_id;
      if (!userId) {
        console.error("Received DELETE event with null user_id");
        return;
      }
      
      // Don't notify for our own leave
      const isSelf = currentUser && currentUser.id === userId;
      
      // Only notify if this wasn't caused by a status update
      const now = Date.now();
      const lastStatusUpdate = notifications.isDuplicateUpdate(userId) ? now - 2000 : now;
      const isLikelyStatusUpdate = now - lastStatusUpdate < 3000;
      
      if (!isSelf && !isLikelyStatusUpdate) {
        // Access properties safely with optional chaining and nullish coalescing
        const participantName = deletedParticipant?.name ?? 'Unknown user';
        notifications.showLeaveNotification(userId, participantName);
      }
      
      // Remove from known users on actual leave
      if (!isLikelyStatusUpdate) {
        notifications.removeUserFromKnown(userId);
      }

      setParticipants(prev => {
        const newParticipants = { ...prev };
        delete newParticipants[userId];
        return newParticipants;
      });
    }

    // Helper to update participant data
    function updateParticipantData(userId: string, participantData: Record<string, any>, isSelf: boolean = false) {
      setParticipants(prev => ({
        ...prev,
        [userId]: {
          id: userId,
          name: participantData.name || `User-${userId.substring(0, 4)}`,
          avatar: participantData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(participantData.name || "User")}&background=random`,
          role: participantData.role || "listener",
          audioEnabled: participantData.audio_enabled,
          audioMuted: participantData.audio_muted,
          screenSharing: participantData.screen_sharing || false,
          isCurrent: isSelf
        }
      }));
    }

    // Clean up subscription
    return () => {
      console.log("Cleaning up participants subscription");
      supabase.removeChannel(participantsSubscription);
    };
  }, [channelName, setParticipants, currentUser, notifications]);
}

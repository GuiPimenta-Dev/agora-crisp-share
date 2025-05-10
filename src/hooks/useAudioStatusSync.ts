
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MeetingUser } from "@/types/meeting";
import { AgoraState } from "@/types/agora";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to sync user's audio status with Supabase
 */
export function useAudioStatusSync(
  agoraState: AgoraState,
  currentUser: MeetingUser | null,
  channelName?: string
) {
  // Ref to track the previous muted state to avoid unnecessary updates
  const prevMutedStateRef = useRef<boolean | null>(null);
  
  // Ref to track if an update is in progress to prevent parallel updates
  const updateInProgressRef = useRef<boolean>(false);
  
  // Track last update time for throttling
  const lastUpdateTimeRef = useRef<number>(0);
  
  // Track the last database update we sent for audio mute state
  const lastSentMuteStateRef = useRef<boolean | null>(null);
  
  // Track audio status changes - only monitor the agoraState.audioMutedState change
  useEffect(() => {
    // Added debug logging to track issues
    console.log("useAudioStatusSync effect triggered with:", {
      hasCurrentUser: !!currentUser,
      channelName,
      hasAudioTrack: !!agoraState.localAudioTrack,
      audioMutedState: agoraState.audioMutedState
    });
    
    if (!currentUser || !channelName || !agoraState.localAudioTrack) {
      console.log("useAudioStatusSync: Missing required parameters", { 
        hasCurrentUser: !!currentUser, 
        channelName, 
        hasAudioTrack: !!agoraState.localAudioTrack 
      });
      return;
    }

    // Get current muted state directly from the track
    const audioMuted = agoraState.localAudioTrack.muted;
    
    // Skip redundant updates (if the state hasn't changed from what we last sent to DB)
    if (lastSentMuteStateRef.current === audioMuted) {
      console.log(`Skipping duplicate audio sync - muted state ${audioMuted} already in database`);
      return;
    }
    
    // Skip if an update is already in progress
    if (updateInProgressRef.current) {
      console.log(`Skipping audio sync - update already in progress`);
      return;
    }
    
    // Use shorter throttling (300ms) to be more responsive
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    if (timeSinceLastUpdate < 300) {
      console.log(`Throttling audio sync - last update was ${timeSinceLastUpdate}ms ago`);
      return;
    }
    
    // Update last update time and previous state ref before the async operation
    lastUpdateTimeRef.current = now;
    prevMutedStateRef.current = audioMuted;
    
    console.log(`Audio status change detected for ${currentUser.name}, muted: ${audioMuted}`);
    
    // Update audio status when it changes
    const updateAudioStatus = async () => {
      try {
        // Mark update as in progress
        updateInProgressRef.current = true;
        
        // Record that we're sending this state to the database
        const previousSentState = lastSentMuteStateRef.current;
        lastSentMuteStateRef.current = audioMuted;
        
        console.log(`Updating audio status in database for ${currentUser.name} to ${audioMuted ? 'muted' : 'unmuted'}`);
        
        // Create the update payload - explicitly setting both fields
        const updateData = { 
          audio_muted: audioMuted,
          audio_enabled: !audioMuted 
        };
        
        // Use a more detailed structure to capture response and error for better debugging
        const { error } = await supabase
          .from("meeting_participants")
          .update(updateData)
          .eq("meeting_id", channelName)
          .eq("user_id", currentUser.id);
          
        if (error) {
          console.error("Failed to update audio status in Supabase:", error);
          
          // Reset lastSentMuteStateRef to previous state since the update failed
          lastSentMuteStateRef.current = previousSentState;
          
          toast({
            title: "Sync Error",
            description: `Audio status update failed: ${error.message}`,
            variant: "destructive"
          });
        } else {
          console.log(`Successfully updated audio status in database for ${currentUser.name} to ${audioMuted ? 'muted' : 'unmuted'}`);
          
          // Success notification toast (optional)
          toast({
            title: audioMuted ? "Microphone Muted" : "Microphone Unmuted",
            description: audioMuted 
              ? "Others cannot hear you now" 
              : "Others can now hear you",
            duration: 1500
          });
        }
      } catch (error) {
        console.error("Exception in updateAudioStatus:", error);
        // Reset lastSentMuteStateRef since the update failed
        lastSentMuteStateRef.current = null;
      } finally {
        // CRITICAL FIX: Reset updateInProgressRef directly in finally block instead of using setTimeout
        // This ensures we release the lock immediately after the operation completes
        updateInProgressRef.current = false;
      }
    };
    
    updateAudioStatus();
    
  // Only depend on audioMutedState to prevent unwanted updates
  }, [agoraState.audioMutedState, currentUser, channelName, agoraState.localAudioTrack]);
}

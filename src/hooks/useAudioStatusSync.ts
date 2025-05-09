
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
  
  // Track last update time for stronger throttling
  const lastUpdateTimeRef = useRef<number>(0);
  
  // Track audio status changes
  useEffect(() => {
    if (!currentUser || !channelName || !agoraState.localAudioTrack) return;

    // Get current muted state directly from the track
    const audioMuted = agoraState.localAudioTrack.muted;
    
    // Skip redundant updates or if an update is already in progress
    if (prevMutedStateRef.current === audioMuted || updateInProgressRef.current) {
      return;
    }
    
    // Enhanced throttling - only allow updates every 800ms
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    if (timeSinceLastUpdate < 800) {
      console.log(`Throttling audio sync - last update was ${timeSinceLastUpdate}ms ago`);
      return;
    }
    
    // Update last update time
    lastUpdateTimeRef.current = now;
    
    // Update the previous state ref before the async operation
    // This prevents multiple rapid updates from being queued
    prevMutedStateRef.current = audioMuted;
    
    // Update audio status when it changes
    const updateAudioStatus = async () => {
      try {
        // Mark update as in progress
        updateInProgressRef.current = true;
        
        console.log(`Updating audio status for ${currentUser.name} to ${audioMuted ? 'muted' : 'unmuted'}`);
        
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
          
          toast({
            title: "Sync Error",
            description: `Audio status update failed: ${error.message}`,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Exception in updateAudioStatus:", error);
      } finally {
        // Mark update as completed
        updateInProgressRef.current = false;
      }
    };
    
    updateAudioStatus();
    
  // Add all relevant dependencies to trigger the effect
  }, [agoraState.localAudioTrack?.muted, currentUser, channelName, agoraState.audioMutedState]);
}

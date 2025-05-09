
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
  
  // Throttling timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Track audio status changes
  useEffect(() => {
    if (!currentUser || !channelName || !agoraState.localAudioTrack) return;

    // Get current muted state directly from the track
    const audioMuted = agoraState.localAudioTrack.muted;
    
    // Skip redundant updates or if an update is already in progress
    if (prevMutedStateRef.current === audioMuted || updateInProgressRef.current) {
      console.log("Skipping audio state update: redundant or update in progress");
      return;
    }
    
    // Throttle updates
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Use throttling to avoid rapid repeated updates
    timerRef.current = setTimeout(() => {
      // Update audio status when it changes
      const updateAudioStatus = async () => {
        try {
          // Mark update as in progress
          updateInProgressRef.current = true;
          
          // Update the previous state ref
          prevMutedStateRef.current = audioMuted;
          
          console.log(`Updating audio status for ${currentUser.name} to ${audioMuted ? 'muted' : 'unmuted'}`);
          
          // Create the update payload - explicitly setting both fields
          const updateData = { 
            audio_muted: audioMuted,
            audio_enabled: !audioMuted 
          };
          
          console.log("Audio status update payload:", updateData);
          console.log("User ID:", currentUser.id, "Channel:", channelName);
          
          // Use a more detailed structure to capture response and error for better debugging
          const { error, data, status, statusText } = await supabase
            .from("meeting_participants")
            .update(updateData)
            .eq("meeting_id", channelName)
            .eq("user_id", currentUser.id);
            
          if (error) {
            console.error("Failed to update audio status in Supabase:", error);
            console.error("Status:", status, statusText);
            
            toast({
              title: "Sync Error",
              description: `Audio status update failed: ${error.message}`,
              variant: "destructive"
            });
          } else {
            console.log("Successfully updated audio status in database:", data);
            console.log("Update status:", status, statusText);
          }
        } catch (error) {
          console.error("Exception in updateAudioStatus:", error);
        } finally {
          // Mark update as completed
          updateInProgressRef.current = false;
        }
      };
      
      updateAudioStatus();
      
    }, 300); // 300ms throttle
    
    return () => {
      // Clean up the timer if component unmounts during delay
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    
  // Add all relevant dependencies to trigger the effect
  }, [agoraState.localAudioTrack?.muted, currentUser, channelName, agoraState.audioMutedState]);
}

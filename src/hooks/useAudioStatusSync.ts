
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MeetingUser } from "@/types/meeting";
import { AgoraState } from "@/types/agora";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to sync user's audio status with Supabase
 * Completely rewritten for stability and reliability
 */
export function useAudioStatusSync(
  agoraState: AgoraState,
  currentUser: MeetingUser | null,
  channelName?: string
) {
  // Track last update time to implement debouncing
  const lastUpdateTimeRef = useRef<number>(0);
  
  // Track if an update is in progress
  const updateInProgressRef = useRef<boolean>(false);
  
  // Last known mute state that we've synced to the database
  const lastSyncedMuteStateRef = useRef<boolean | null>(null);
  
  // Monitor audio status changes through track muted property
  useEffect(() => {
    if (!currentUser || !channelName || !agoraState.localAudioTrack) {
      return;
    }

    // Get current muted state directly from the track
    const audioMuted = agoraState.localAudioTrack.muted;
    
    // Skip if this state is the same as what we last synced
    if (lastSyncedMuteStateRef.current === audioMuted) {
      return;
    }
    
    // Skip if an update is in progress
    if (updateInProgressRef.current) {
      return;
    }
    
    // Implement debouncing - only allow updates every 1 second
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 1000) {
      return;
    }
    
    // Update timestamps and state refs
    lastUpdateTimeRef.current = now;
    updateInProgressRef.current = true;
    
    console.log(`Syncing audio status for ${currentUser.name}: ${audioMuted ? 'muted' : 'unmuted'}`);
    
    // Update database
    const updateAudioStatus = async () => {
      try {
        // Record that we're syncing this state
        lastSyncedMuteStateRef.current = audioMuted;
        
        const { error } = await supabase
          .from("meeting_participants")
          .update({
            audio_muted: audioMuted,
            audio_enabled: !audioMuted
          })
          .eq("meeting_id", channelName)
          .eq("user_id", currentUser.id);
          
        if (error) {
          console.error("Failed to update audio status:", error);
          lastSyncedMuteStateRef.current = null; // Reset so we can try again
          
          toast({
            title: "Sync Error",
            description: "Failed to update audio status",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error syncing audio status:", error);
        lastSyncedMuteStateRef.current = null; // Reset so we can try again
      } finally {
        // Allow more updates after a delay
        setTimeout(() => {
          updateInProgressRef.current = false;
        }, 1000);
      }
    };
    
    updateAudioStatus();
    
  }, [agoraState.localAudioTrack?.muted, currentUser, channelName]);
}

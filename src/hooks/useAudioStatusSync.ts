
import { useEffect } from "react";
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
  // Track audio status changes
  useEffect(() => {
    if (!currentUser || !channelName || !agoraState.localAudioTrack) return;

    // Update audio status when it changes
    const updateAudioStatus = async () => {
      try {
        // Use the muted state directly from the track
        const audioMuted = agoraState.localAudioTrack.muted;
        
        console.log(`Updating audio status for ${currentUser.name} to ${audioMuted ? 'muted' : 'unmuted'}`);
        
        // Create the update payload - explicitly setting both fields
        const updateData = { 
          audio_muted: audioMuted,
          audio_enabled: !audioMuted 
        };
        
        console.log("Audio status update data:", updateData);
        
        const { error } = await supabase
          .from("meeting_participants")
          .update(updateData)
          .eq("meeting_id", channelName)
          .eq("user_id", currentUser.id);
          
        if (error) {
          console.error("Failed to update audio status in Supabase:", error);
          toast({
            title: "Sync Error",
            description: "Failed to update audio status",
            variant: "destructive"
          });
        } else {
          console.log("Successfully updated audio status in database");
        }
      } catch (error) {
        console.error("Failed to update audio status:", error);
      }
    };

    // Update status whenever the muted state changes
    updateAudioStatus();
  // Add the new audioMutedState as a dependency to trigger the effect
  }, [agoraState.localAudioTrack?.muted, agoraState.audioMutedState, currentUser, channelName]);
}

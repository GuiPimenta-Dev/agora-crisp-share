
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
    if (!currentUser || !channelName) return;

    // Update audio status when it changes
    const updateAudioStatus = async () => {
      try {
        // Use the muted state directly to determine if audio is enabled
        const audioEnabled = agoraState.localAudioTrack ? !agoraState.localAudioTrack.muted : false;
        
        console.log(`Updating audio status for ${currentUser.name} to ${audioEnabled ? 'enabled' : 'disabled'}`);
        
        const { error } = await supabase
          .from("meeting_participants")
          .update({ audio_enabled: audioEnabled })
          .eq("meeting_id", channelName)
          .eq("user_id", currentUser.id);
          
        if (error) {
          console.error("Failed to update audio status in Supabase:", error);
          
          // Only show toast for non-authentication errors to avoid spamming
          if (error.code !== "401" && error.code !== "PGRST116") {
            toast({
              title: "Sync Error",
              description: "Failed to update audio status",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error("Failed to update audio status:", error);
      }
    };

    // Update status whenever the muted state changes
    updateAudioStatus();
  }, [agoraState.localAudioTrack?.muted, currentUser, channelName]);
}

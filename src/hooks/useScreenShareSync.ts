
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MeetingUser } from "@/types/meeting";
import { AgoraState } from "@/types/agora";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to sync user's screen sharing status with Supabase
 */
export function useScreenShareSync(
  agoraState: AgoraState,
  currentUser: MeetingUser | null,
  channelName?: string
) {
  // Update screen sharing status
  useEffect(() => {
    if (!currentUser || !channelName) return;

    // Update screen sharing status when it changes
    const updateScreenShareStatus = async () => {
      try {
        // Check if this user is currently sharing screen
        const isScreenSharing = agoraState.screenShareUserId === currentUser.id;
        
        console.log(`Updating screen sharing status for ${currentUser.name} to ${isScreenSharing ? 'active' : 'inactive'}`);
        
        const { error } = await supabase
          .from("meeting_participants")
          .update({ screen_sharing: isScreenSharing })
          .eq("meeting_id", channelName)
          .eq("user_id", currentUser.id);
          
        if (error) {
          console.error("Failed to update screen sharing status in Supabase:", error);
          
          // Only show toast for non-authentication errors to avoid spamming
          if (error.code !== "401" && error.code !== "PGRST116") {
            toast({
              title: "Sync Error",
              description: "Failed to update screen sharing status",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error("Failed to update screen sharing status:", error);
      }
    };

    updateScreenShareStatus();
  }, [agoraState.screenShareUserId, currentUser, channelName]);
}

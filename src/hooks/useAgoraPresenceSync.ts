
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiLeaveMeeting } from "@/api/meetingApi";
import { MeetingUser } from "@/types/meeting";
import { AgoraState } from "@/types/agora";

/**
 * Hook to handle user presence synchronization with Supabase
 */
export function useAgoraPresenceSync(
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
        const audioEnabled = agoraState.localAudioTrack ? !agoraState.localAudioTrack.muted : false;
        
        console.log(`Updating audio status for ${currentUser.name} to ${audioEnabled ? 'enabled' : 'disabled'}`);
        
        const { error } = await supabase
          .from("meeting_participants")
          .update({ audio_enabled: audioEnabled })
          .eq("meeting_id", channelName)
          .eq("user_id", currentUser.id);
          
        if (error) {
          console.error("Failed to update audio status in Supabase:", error);
        }
      } catch (error) {
        console.error("Failed to update audio status:", error);
      }
    };

    updateAudioStatus();
  }, [agoraState.localAudioTrack?.muted, currentUser, channelName]);

  // Initial presence registration
  useEffect(() => {
    if (!currentUser || !agoraState.joinState || !channelName) return;

    // When we join successfully, add ourselves to the database
    const registerPresence = async () => {
      try {
        // Small delay to ensure connection is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update the meeting_participants table in Supabase to add ourselves
        const { error } = await supabase
          .from("meeting_participants")
          .upsert({
            meeting_id: channelName,
            user_id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            role: currentUser.role,
            audio_enabled: !agoraState.localAudioTrack?.muted
          }, { onConflict: 'meeting_id,user_id' });
          
        if (error) {
          console.error("Failed to register presence in Supabase:", error);
        } else {
          console.log(`Successfully registered presence for ${currentUser.name} in channel ${channelName}`);
        }
      } catch (error) {
        console.error("Failed to initialize participant sync:", error);
      }
    };

    registerPresence();
    
    // Clean up when leaving
    return () => {
      // When we leave the meeting, remove ourselves from the participants table
      if (currentUser && channelName) {
        apiLeaveMeeting(channelName, currentUser.id).catch(err => {
          console.error("Error removing participant on cleanup:", err);
        });
      }
    };
  }, [currentUser, agoraState.joinState, channelName]);
}

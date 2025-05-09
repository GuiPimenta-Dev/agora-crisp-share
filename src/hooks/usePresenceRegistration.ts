
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiLeaveMeeting } from "@/api/meetingApi";
import { MeetingUser } from "@/types/meeting";
import { AgoraState } from "@/types/agora";

/**
 * Hook to handle user's initial presence registration and cleanup
 */
export function usePresenceRegistration(
  agoraState: AgoraState,
  currentUser: MeetingUser | null,
  channelName?: string
) {
  // Initial presence registration
  useEffect(() => {
    if (!currentUser || !agoraState.joinState || !channelName) return;

    // When we join successfully, add ourselves to the database
    const registerPresence = async () => {
      try {
        // Small delay to ensure connection is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if profile exists
        const { data: profileData } = await supabase
          .from("profiles")
          .select("summoner, name, avatar")
          .eq("id", currentUser.id)
          .single();
          
        const displayName = profileData?.summoner || profileData?.name || currentUser.name;
        const avatarUrl = profileData?.avatar || currentUser.avatar;
        
        // Update the meeting_participants table in Supabase to add ourselves
        const { error } = await supabase
          .from("meeting_participants")
          .upsert({
            meeting_id: channelName,
            user_id: currentUser.id,
            name: displayName,
            avatar: avatarUrl,
            role: currentUser.role,
            audio_enabled: !agoraState.localAudioTrack?.muted,
            screen_sharing: false // Initialize with no screen sharing
          }, { onConflict: 'meeting_id,user_id' });
          
        if (error) {
          console.error("Failed to register presence in Supabase:", error);
        } else {
          console.log(`Successfully registered presence for ${displayName} in channel ${channelName}`);
        }
      } catch (error) {
        console.error("Failed to initialize participant sync:", error);
      }
    };

    registerPresence();
    
    // Handle tab close/browser close events to properly remove the participant
    const handleBeforeUnload = () => {
      if (currentUser && channelName) {
        // Using sendBeacon for more reliable delivery during page unload
        const endpoint = '/api/leave-meeting';
        const data = JSON.stringify({
          meetingId: channelName,
          userId: currentUser.id
        });
        navigator.sendBeacon(endpoint, data);
        
        console.log("Sent leave meeting beacon on page unload");
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up when leaving
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // When we leave the meeting or unmount the component, remove ourselves from the participants table
      if (currentUser && channelName) {
        apiLeaveMeeting(channelName, currentUser.id).catch(err => {
          console.error("Error removing participant on cleanup:", err);
        });
      }
    };
  }, [currentUser, agoraState.joinState, channelName, agoraState.localAudioTrack?.muted]);
}

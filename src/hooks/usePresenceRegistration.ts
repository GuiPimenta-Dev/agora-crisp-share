
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiLeaveMeeting } from "@/api/meetingApi";
import { MeetingUser } from "@/types/meeting";
import { AgoraState } from "@/types/agora";
import { toast } from "@/hooks/use-toast";

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
        console.log(`Registering presence for user ${currentUser.id} in channel ${channelName}`);
        
        // Update the meeting_participants table in Supabase to add ourselves
        const { error } = await supabase
          .from("meeting_participants")
          .upsert({
            meeting_id: channelName,
            user_id: currentUser.id,
            name: currentUser.name || "Anonymous User",
            avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random`,
            role: currentUser.role || "listener",
            audio_enabled: agoraState.localAudioTrack ? !agoraState.localAudioTrack.muted : false,
            screen_sharing: false // Initialize with no screen sharing
          }, { onConflict: 'meeting_id,user_id' });
          
        if (error) {
          console.error("Failed to register presence in Supabase:", error);
          
          // Show a more helpful error message based on the error type
          if (error.code === "401" || error.code === "PGRST116") {
            console.log("Authentication issue detected when registering presence");
            toast({
              title: "Authentication Not Required",
              description: "Continue using the meeting with limited synchronization",
              variant: "default"
            });
          } else {
            toast({
              title: "Sync Warning",
              description: "Participant list may not be fully synchronized",
              variant: "default"
            });
          }
        } else {
          console.log(`Successfully registered presence for ${currentUser.name} in channel ${channelName}`);
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

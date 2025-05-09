
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiLeaveMeeting } from "@/api/meetingApi";
import { MeetingUser } from "@/types/meeting";
import { AgoraState } from "@/types/agora";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to handle user's initial presence registration and cleanup
 * This hook has been updated to handle anonymous/unauthenticated users
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
        
        // Try to update via API instead of direct Supabase call to work around auth issues
        const response = await fetch('/api/register-presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meeting_id: channelName,
            user_id: currentUser.id,
            name: currentUser.name || "Anonymous User",
            avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || "User")}&background=random`,
            role: currentUser.role || "listener",
            audio_enabled: agoraState.localAudioTrack ? !agoraState.localAudioTrack.muted : false,
            audio_muted: agoraState.localAudioTrack ? agoraState.localAudioTrack.muted : true,
            screen_sharing: false
          })
        });
        
        // Fallback to direct Supabase call if API route is not available
        if (!response.ok && response.status === 404) {
          console.log("API route not available, falling back to direct Supabase call");
          
          // Try direct Supabase call (might fail with 401 but that's ok)
          const { error } = await supabase
            .from("meeting_participants")
            .upsert({
              meeting_id: channelName,
              user_id: currentUser.id,
              name: currentUser.name || "Anonymous User",
              avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || "User")}&background=random`,
              role: currentUser.role || "listener",
              audio_enabled: agoraState.localAudioTrack ? !agoraState.localAudioTrack.muted : false,
              audio_muted: agoraState.localAudioTrack ? agoraState.localAudioTrack.muted : true,
              screen_sharing: false
            }, { onConflict: 'meeting_id,user_id' });
            
          if (error) {
            console.error("Failed to register presence in Supabase:", error);
            
            // Don't show error toast for auth issues - this is expected for anonymous users
            if (error.code !== "401" && error.code !== "PGRST116") {
              toast({
                title: "Sync Warning",
                description: "Participant list may not be fully synchronized",
                variant: "default"
              });
            }
          } else {
            console.log(`Successfully registered presence for ${currentUser.name} in channel ${channelName}`);
          }
        } else if (response.ok) {
          console.log("Successfully registered presence via API");
        }
      } catch (error) {
        console.error("Failed to initialize participant sync:", error);
        // No toast here to avoid annoying users
      }
    };

    // Small delay to ensure connection is ready
    const timer = setTimeout(() => {
      registerPresence();
    }, 1000);
    
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
      clearTimeout(timer);
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

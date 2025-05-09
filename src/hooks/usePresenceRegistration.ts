
import { useEffect, useRef } from "react";
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
  // Track if we've already registered this user to avoid duplicate registrations
  const registeredRef = useRef<boolean>(false);
  
  // Track window unload handler to avoid removing it unnecessarily
  const unloadHandlerRef = useRef<(() => void) | null>(null);
  
  // Initial presence registration
  useEffect(() => {
    if (!currentUser || !agoraState.joinState || !channelName) return;

    // When we join successfully, add ourselves to the database
    const registerPresence = async () => {
      // Skip if we've already registered
      if (registeredRef.current) {
        console.log(`User ${currentUser.id} already registered, skipping redundant registration`);
        return;
      }
      
      try {
        console.log(`Registering presence for user ${currentUser.id} in channel ${channelName}`);
        
        // Create the payload with all required fields
        const participantData = {
          meeting_id: channelName,
          user_id: currentUser.id,
          name: currentUser.name || "Anonymous User",
          avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || "User")}&background=random`,
          role: currentUser.role || "listener",
          audio_enabled: agoraState.localAudioTrack ? !agoraState.localAudioTrack.muted : false,
          audio_muted: true,
          screen_sharing: false
        };

        console.log("Participant data to register:", participantData);
        
        // Direct Supabase call
        const { error } = await supabase
          .from("meeting_participants")
          .upsert(participantData, { onConflict: 'meeting_id,user_id' });
          
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
          registeredRef.current = true;
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
        // Direct Supabase call to leave meeting using navigator.sendBeacon for reliability
        navigator.sendBeacon('/api/leave-meeting', JSON.stringify({
          meetingId: channelName,
          userId: currentUser.id
        }));
        
        console.log("Sent leave meeting beacon on page unload");
      }
    };
    
    // Only add the listener if we haven't already
    if (!unloadHandlerRef.current) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      unloadHandlerRef.current = handleBeforeUnload;
    }
    
    // Clean up when leaving
    return () => {
      clearTimeout(timer);
      
      // Only remove the participant if the component is fully unmounting
      // Check if the window is still available (not closing/refreshing)
      if (typeof window !== 'undefined' && currentUser && channelName) {
        console.log(`Component unmounting, checking if we should remove participant ${currentUser.id}`);
        
        // Don't remove the participant here - we'll let the beforeunload handler do that
        // This prevents removal during status updates and other component re-renders
      }
    };
  }, [currentUser, agoraState.joinState, channelName]); 
  
  // Handle final cleanup on component unmount
  useEffect(() => {
    return () => {
      // Remove the unload handler if it exists
      if (unloadHandlerRef.current) {
        window.removeEventListener('beforeunload', unloadHandlerRef.current);
        unloadHandlerRef.current = null;
      }
      
      // Only remove participant when the app is fully closed
      // We now handle this with the beforeunload event instead
    };
  }, []);
}


import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiLeaveMeeting } from "@/api/meetingApi";
import { MeetingUser } from "@/types/meeting";
import { AgoraState } from "@/types/agora";

/**
 * Hook to handle user's presence registration and cleanup on unmount only
 */
export function usePresenceRegistration(
  agoraState: AgoraState,
  currentUser: MeetingUser | null,
  channelName?: string
) {
  // Track if we've registered this user
  const registeredRef = useRef<boolean>(false);
  
  // Reference to store the beforeunload handler
  const beforeUnloadHandlerRef = useRef<(() => void) | null>(null);
  
  // Provide a stable reference to the channelName value
  const channelNameRef = useRef<string | undefined>(channelName);
  
  // Update the ref when channelName changes
  useEffect(() => {
    channelNameRef.current = channelName;
  }, [channelName]);
  
  // Provide a stable reference to the currentUser value
  const currentUserRef = useRef<MeetingUser | null>(currentUser);
  
  // Update the ref when currentUser changes
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  
  // Initial presence registration
  useEffect(() => {
    if (!currentUser || !agoraState.joinState || !channelName) return;

    // Register user in database
    const registerPresence = async () => {
      if (registeredRef.current) {
        return;
      }
      
      try {
        console.log(`Registering presence for ${currentUser.name} in ${channelName}`);
        
        const participantData = {
          meeting_id: channelName,
          user_id: currentUser.id,
          name: currentUser.name || "Anonymous User",
          avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || "User")}&background=random`,
          role: currentUser.role || "listener",
          audio_enabled: agoraState.localAudioTrack ? !agoraState.localAudioTrack.muted : false,
          audio_muted: agoraState.localAudioTrack ? agoraState.localAudioTrack.muted : true,
          screen_sharing: false
        };
        
        const { error } = await supabase
          .from("meeting_participants")
          .upsert(participantData, { onConflict: 'meeting_id,user_id' });
          
        if (error) {
          console.error("Failed to register presence:", error);
        } else {
          console.log(`Successfully registered presence for ${currentUser.name}`);
          registeredRef.current = true;
        }
      } catch (error) {
        console.error("Error registering presence:", error);
      }
    };

    registerPresence();
    
    // Set up beforeunload handler to remove participant on page close/refresh
    const handleBeforeUnload = () => {
      if (currentUserRef.current && channelNameRef.current) {
        navigator.sendBeacon('/api/leave-meeting', JSON.stringify({
          meetingId: channelNameRef.current,
          userId: currentUserRef.current.id
        }));
      }
    };
    
    // Only add the handler if we haven't already
    if (!beforeUnloadHandlerRef.current) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      beforeUnloadHandlerRef.current = handleBeforeUnload;
    }
    
    // Cleanup function
    return () => {};
  }, [currentUser, agoraState.joinState, channelName]);
  
  // Final cleanup on component unmount
  useEffect(() => {
    return () => {
      // Remove the beforeunload handler
      if (beforeUnloadHandlerRef.current) {
        window.removeEventListener('beforeunload', beforeUnloadHandlerRef.current);
      }
      
      // Only remove the participant when the component is fully unmounting
      if (currentUser && channelName) {
        apiLeaveMeeting(channelName, currentUser.id).catch(err => {
          console.error("Failed to leave meeting on unmount:", err);
        });
      }
    };
  }, [currentUser, channelName]);
}


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
        
        // Small delay to ensure connection is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if profile exists
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("summoner, name, avatar")
          .eq("id", currentUser.id)
          .single();
          
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          toast({
            title: "Error",
            description: "Could not fetch user profile",
            variant: "destructive"
          });
          return;
        }
          
        const displayName = profileData?.summoner || profileData?.name || currentUser.name;
        const avatarUrl = profileData?.avatar || currentUser.avatar;
        
        // Check if the current session is valid
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          console.warn("No active Supabase session, participant sync will fail");
          toast({
            title: "Warning",
            description: "Not logged in to Supabase - participant sync disabled",
            variant: "warning"
          });
        }
        
        // Update the meeting_participants table in Supabase to add ourselves
        const { error } = await supabase
          .from("meeting_participants")
          .upsert({
            meeting_id: channelName,
            user_id: currentUser.id,
            name: displayName,
            avatar: avatarUrl,
            role: currentUser.role,
            audio_enabled: agoraState.localAudioTrack ? !agoraState.localAudioTrack.muted : false,
            screen_sharing: false // Initialize with no screen sharing
          }, { onConflict: 'meeting_id,user_id' });
          
        if (error) {
          console.error("Failed to register presence in Supabase:", error);
          
          // Show a more helpful error message based on the error type
          if (error.code === "401" || error.code === "PGRST116") {
            toast({
              title: "Authentication Error",
              description: "Not authenticated with Supabase. Participant sync unavailable.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Sync Error",
              description: "Failed to register presence in the meeting",
              variant: "destructive"
            });
          }
        } else {
          console.log(`Successfully registered presence for ${displayName} in channel ${channelName}`);
        }
      } catch (error) {
        console.error("Failed to initialize participant sync:", error);
        toast({
          title: "Error",
          description: "Failed to initialize participant synchronization",
          variant: "destructive"
        });
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

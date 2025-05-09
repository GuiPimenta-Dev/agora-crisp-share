
import { AgoraStateManager } from '@/types/agoraContext';
import { MeetingUser } from '@/types/meeting';
import { toast } from '@/hooks/use-toast';

/**
 * Hook to manage joining meetings
 */
export const useJoinMeeting = ({
  agoraState,
  currentUser,
  setCurrentUser,
  participants,
  setParticipants,
  setAgoraState,
  joinInProgress,
  setJoinInProgress
}: Pick<AgoraStateManager, 'agoraState' | 'currentUser' | 'setCurrentUser' | 'participants' | 'setParticipants' | 'setAgoraState' | 'joinInProgress' | 'setJoinInProgress'>) => {
  
  /**
   * Join a meeting with the specified user
   */
  const joinWithUser = async (channelName: string, user: MeetingUser): Promise<boolean> => {
    // Prevent multiple simultaneous join attempts
    if (joinInProgress) {
      console.log("Join already in progress, ignoring duplicate request");
      return false;
    }
    
    // Check if already joined the same channel
    if (agoraState.joinState && agoraState.channelName === channelName) {
      console.log(`Already joined channel ${channelName}, no need to rejoin`);
      
      // Still update current user and participants
      setCurrentUser(user);
      setParticipants(prev => ({
        ...prev,
        [user.id]: user
      }));
      
      // Also update participants in Agora state
      setAgoraState(prev => ({
        ...prev,
        participants: {
          ...prev.participants,
          [user.id]: user
        }
      }));
      
      return true;
    }
    
    if (!agoraState.client) {
      console.error("Cannot join: Agora client not initialized");
      toast({
        title: "Connection Error",
        description: "Audio service not initialized. Please refresh and try again.",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      setJoinInProgress(true);
      
      setCurrentUser(user);
      
      // Add user to participants
      setParticipants(prev => ({
        ...prev,
        [user.id]: user
      }));
      
      // Also update participants in Agora state
      setAgoraState(prev => ({
        ...prev,
        participants: {
          ...prev.participants,
          [user.id]: user
        }
      }));
      
      // Always enable audio for direct link joins
      const audioEnabled = true;
      
      // This is a callback to joinAudioCall which will be passed from the provider
      if (!agoraState.joinAudioCallFunc) {
        console.error("joinAudioCall function not available");
        return false;
      }
      
      console.log(`Joining audio call for channel ${channelName}...`);
      const joined = await agoraState.joinAudioCallFunc(channelName, audioEnabled);
      
      if (!joined) {
        console.error(`Failed to join audio call for channel ${channelName}`);
      }
      
      return joined;
    } catch (error) {
      console.error("Error in joinWithUser:", error);
      toast({
        title: "Join Error",
        description: "Failed to join the audio meeting. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setJoinInProgress(false);
    }
  };

  return { joinWithUser };
};

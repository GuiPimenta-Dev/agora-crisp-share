import { useState } from "react";
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
  setJoinInProgress,
  clientInitialized
}: Pick<AgoraStateManager, 'agoraState' | 'currentUser' | 'setCurrentUser' | 'participants' | 'setParticipants' | 'setAgoraState' | 'joinInProgress' | 'setJoinInProgress'> & { clientInitialized: boolean }) => {
  
  // Add a small delay to ensure client has time to initialize fully
  const waitForClientInitialization = (timeoutMs = 2000): Promise<boolean> => {
    console.log("Waiting for client initialization...");
    
    // If client is already available, resolve immediately
    if (agoraState.client) {
      console.log("Client already initialized, proceeding immediately");
      return Promise.resolve(true);
    }
    
    // Otherwise wait for the initialization to complete
    return new Promise((resolve) => {
      // Check every 100ms if client is ready
      const checkInterval = 100;
      let elapsedTime = 0;
      
      const checkClientReady = () => {
        if (agoraState.client) {
          console.log("Client initialized after waiting");
          resolve(true);
          return;
        }
        
        elapsedTime += checkInterval;
        if (elapsedTime >= timeoutMs) {
          console.error("Client initialization timeout after", timeoutMs, "ms");
          resolve(false);
          return;
        }
        
        setTimeout(checkClientReady, checkInterval);
      };
      
      checkClientReady();
    });
  };
  
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
    
    try {
      setJoinInProgress(true);
      
      // Wait for client to be initialized - with timeout
      const clientReady = await waitForClientInitialization(5000);
      
      // Ensure client is initialized - if not, we need to wait
      if (!clientReady || !agoraState.client) {
        console.error("Cannot join: Agora client not initialized after waiting");
        toast({
          title: "Connection Error",
          description: "Audio service not initialized. Please refresh the page and try again.",
          variant: "destructive"
        });
        setJoinInProgress(false);
        return false;
      }
      
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
        toast({
          title: "Connection Error",
          description: "Audio service not fully initialized. Please refresh and try again.",
          variant: "destructive"
        });
        setJoinInProgress(false);
        return false;
      }
      
      console.log(`Joining audio call for channel ${channelName}...`);
      const joined = await agoraState.joinAudioCallFunc(channelName, audioEnabled);
      
      if (!joined) {
        console.error(`Failed to join audio call for channel ${channelName}`);
        throw new Error("Falha ao entrar na sala de reunião");
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

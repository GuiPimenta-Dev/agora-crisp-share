
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
  
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 10;
  
  // Add a small delay to ensure client has time to initialize fully
  const waitForClientInitialization = (timeoutMs = 10000): Promise<boolean> => {
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
      let checks = 0;
      
      const checkClientReady = () => {
        // Increment check counter for logging
        checks++;
        
        // Log status every second
        if (checks % 10 === 0) {
          console.log(`Still waiting for client initialization... ${elapsedTime}ms elapsed`);
          
          // Check global object and client ref as well
          if (agoraState.client) {
            console.log("Client found in agoraState");
          }
        }
        
        if (agoraState.client) {
          console.log(`Client initialized after waiting ${elapsedTime}ms`);
          resolve(true);
          return;
        }
        
        elapsedTime += checkInterval;
        if (elapsedTime >= timeoutMs) {
          console.error(`Client initialization timeout after ${timeoutMs}ms`);
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
          [user.id]: {...user, isCurrent: true}
        }
      }));
      
      return true;
    }
    
    try {
      setJoinInProgress(true);
      
      // Increment retry count if this is a retry attempt
      if (retryCount > 0) {
        console.log(`Join attempt ${retryCount + 1}/${MAX_RETRIES}`);
      }
      
      // Wait for client to be initialized with increased timeout
      const clientReady = await waitForClientInitialization(15000);
      
      // Ensure client is initialized
      if (!clientReady || !agoraState.client) {
        console.error("Cannot join: Agora client not initialized after waiting");
        
        // Implement retry logic
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setJoinInProgress(false);
          
          // Retry with delay
          const delay = Math.min(1000 * (retryCount + 1), 5000); // Cap at 5 seconds
          console.log(`Will retry joining in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
          
          return new Promise(resolve => {
            setTimeout(async () => {
              const result = await joinWithUser(channelName, user);
              resolve(result);
            }, delay);
          });
        }
        
        toast({
          title: "Connection Error",
          description: "Audio service not initialized. Please refresh the page and try again.",
          variant: "destructive"
        });
        setJoinInProgress(false);
        return false;
      }
      
      setCurrentUser(user);
      
      // Add user to participants with isCurrent flag
      setParticipants(prev => ({
        ...prev,
        [user.id]: {...user, isCurrent: true}
      }));
      
      // Also update participants in Agora state
      setAgoraState(prev => ({
        ...prev,
        participants: {
          ...prev.participants,
          [user.id]: {...user, isCurrent: true}
        }
      }));
      
      // Always enable audio for direct link joins
      const audioEnabled = true;
      
      // Double-check joinAudioCallFunc availability
      if (!agoraState.joinAudioCallFunc) {
        console.error("joinAudioCall function not available");
        
        // Retry logic for missing join function
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setJoinInProgress(false);
          
          // Retry with delay
          const delay = Math.min(1000 * (retryCount + 1), 5000);
          console.log(`Will retry joining (missing joinAudioCallFunc) in ${delay}ms...`);
          
          return new Promise(resolve => {
            setTimeout(async () => {
              const result = await joinWithUser(channelName, user);
              resolve(result);
            }, delay);
          });
        }
        
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
      
      // Reset retry counter on success
      setRetryCount(0);
      
      return joined;
    } catch (error) {
      console.error("Error in joinWithUser:", error);
      
      // Retry join on failures
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setJoinInProgress(false);
        
        // Retry with exponential backoff
        const delay = Math.min(Math.pow(2, retryCount) * 1000, 8000);
        console.log(`Will retry joining after error in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        
        return new Promise(resolve => {
          setTimeout(async () => {
            const result = await joinWithUser(channelName, user);
            resolve(result);
          }, delay);
        });
      }
      
      toast({
        title: "Join Error",
        description: "Failed to join the audio meeting. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      if (retryCount >= MAX_RETRIES) {
        // Only reset join in progress if we've exhausted retries
        setJoinInProgress(false);
      }
    }
  };

  return { joinWithUser };
};

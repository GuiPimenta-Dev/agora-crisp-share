
import { useEffect } from 'react';
import { callGetParticipants } from '@/api/MeetingApiRoutes';
import { toast } from '@/hooks/use-toast';
import { AgoraStateManager } from '@/types/agoraContext';

/**
 * Hook to manage participants in a meeting
 */
export const useAgoraParticipants = ({
  agoraState,
  setAgoraState,
  participants,
  setParticipants,
  participantsLastUpdated,
  setParticipantsLastUpdated
}: Pick<AgoraStateManager, 'agoraState' | 'setAgoraState' | 'participants' | 'setParticipants' | 'participantsLastUpdated' | 'setParticipantsLastUpdated'>) => {
  
  // Update participants when remoteUsers changes or users join/leave
  useEffect(() => {
    const fetchParticipants = async () => {
      if (agoraState.channelName) {
        try {
          const result = await callGetParticipants(agoraState.channelName);
          if (result.success && result.participants) {
            // Check for new participants
            const prevParticipantCount = Object.keys(participants).length;
            
            // Update participants in Agora state
            setAgoraState(prev => ({
              ...prev,
              participants: result.participants
            }));
            
            setParticipants(result.participants);
            
            // Show toast if new participant joined
            const participantCount = Object.keys(result.participants).length;
            
            if (participantCount > prevParticipantCount && prevParticipantCount > 0) {
              const newParticipants = Object.entries(result.participants).filter(
                ([id]) => !participants[id]
              );
              
              if (newParticipants.length > 0) {
                const newUser = newParticipants[0][1];
                toast({
                  title: "Novo participante",
                  description: `${newUser.name} entrou na chamada`,
                });
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch participants:", error);
        }
      }
    };

    // Fetch immediately when remote users change
    if (agoraState.channelName) {
      fetchParticipants();
    }
    
    // Set up polling for participants update
    const intervalId = setInterval(() => {
      if (agoraState.channelName) {
        setParticipantsLastUpdated(Date.now());
        fetchParticipants();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [agoraState.remoteUsers, agoraState.channelName, participantsLastUpdated, participants]);

  // Fetch participants when channel name changes
  useEffect(() => {
    const fetchParticipants = async () => {
      if (agoraState.channelName) {
        const result = await callGetParticipants(agoraState.channelName);
        if (result.success && result.participants) {
          setParticipants(prev => ({
            ...prev,
            ...result.participants
          }));
          
          // Also update participants in Agora state
          setAgoraState(prev => ({
            ...prev,
            participants: result.participants
          }));
        }
      }
    };

    if (agoraState.channelName) {
      fetchParticipants();
    }
  }, [agoraState.channelName]);
};

/**
 * Function to refresh participants list on demand
 * Returns a Promise to satisfy the type definition
 */
export const refreshParticipants = async (
  agoraState: AgoraStateManager['agoraState'],
  setAgoraState: AgoraStateManager['setAgoraState'],
  setParticipants: AgoraStateManager['setParticipants'],
  setParticipantsLastUpdated: AgoraStateManager['setParticipantsLastUpdated']
): Promise<void> => {
  setParticipantsLastUpdated(Date.now());
  
  if (agoraState.channelName) {
    try {
      const result = await callGetParticipants(agoraState.channelName);
      if (result.success && result.participants) {
        setParticipants(result.participants);
        
        // Also update participants in Agora state
        setAgoraState(prev => ({
          ...prev,
          participants: result.participants
        }));
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Error refreshing participants:", error);
      return Promise.reject(error);
    }
  }
  return Promise.resolve();
};

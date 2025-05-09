import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { createClient } from "@/lib/agoraUtils";
import { AgoraState, AgoraContextType } from "@/types/agora";
import { useAgoraAudioCall } from "@/hooks/useAgoraAudioCall";
import { useAgoraScreenShare } from "@/hooks/useAgoraScreenShare";
import { useAgoraEventHandlers } from "@/hooks/useAgoraEventHandlers";
import { useAgoraRecording } from "@/hooks/useAgoraRecording";
import { useScreenRecording } from "@/hooks/useScreenRecording";
import { generateShareableLink } from "@/lib/tokenGenerator";
import { toast } from "@/hooks/use-toast";
import { MeetingUser } from "@/types/meeting";
import { callGetParticipants } from "@/api/MeetingApiRoutes";

const AgoraContext = createContext<AgoraContextType | undefined>(undefined);

export const useAgora = () => {
  const context = useContext(AgoraContext);
  if (!context) {
    throw new Error("useAgora must be used within an AgoraProvider");
  }
  return context;
};

export const AgoraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State management
  const [agoraState, setAgoraState] = useState<AgoraState>({
    client: undefined,
    localAudioTrack: undefined,
    screenVideoTrack: undefined,
    screenShareUserId: undefined,
    remoteUsers: [],
    joinState: false,
    isRecording: false,
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [currentUser, setCurrentUser] = useState<MeetingUser | null>(null);
  const [participants, setParticipants] = useState<Record<string, MeetingUser>>({});
  const [clientInitialized, setClientInitialized] = useState(false);
  const [joinInProgress, setJoinInProgress] = useState(false);
  const clientRef = useRef<IAgoraRTCClient | undefined>();
  const [participantsLastUpdated, setParticipantsLastUpdated] = useState<number>(Date.now());

  // Initialize Agora client immediately on component mount
  useEffect(() => {
    const initializeClient = async () => {
      try {
        console.log("Initializing Agora client...");
        const client = createClient();
        clientRef.current = client;
        
        setAgoraState((prev) => ({
          ...prev,
          client
        }));
        
        setClientInitialized(true);
        console.log("Agora client initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Agora client:", error);
        toast({
          title: "Error",
          description: "Failed to initialize audio service. Please refresh the page.",
          variant: "destructive"
        });
      }
    };
    
    initializeClient();
  }, []);

  // Initialize hooks with our shared state
  const { joinAudioCall, leaveAudioCall, toggleMute } = useAgoraAudioCall(
    agoraState, 
    setAgoraState, 
    setIsMuted,
    setIsScreenSharing
  );

  const { startScreenShare, stopScreenShare } = useAgoraScreenShare(
    agoraState,
    setAgoraState,
    setIsScreenSharing
  );
  
  const { startRecording, stopRecording, downloadRecording } = useAgoraRecording(
    agoraState,
    setAgoraState
  );
  
  // New screen recording hook
  const { isRecording: isScreenRecording, toggleRecording: toggleScreenRecording } = useScreenRecording();

  // Set up event handlers using our hook
  useAgoraEventHandlers(
    agoraState,
    setAgoraState, 
    stopScreenShare, 
    isScreenSharing,
    startRecording,
    stopRecording
  );

  // Update participants list when remoteUsers changes or when users join/leave
  useEffect(() => {
    const fetchParticipants = async () => {
      if (agoraState.channelName) {
        try {
          const result = await callGetParticipants(agoraState.channelName);
          if (result.success && result.participants) {
            // Check for new participants
            const prevParticipantCount = Object.keys(participants).length;
            
            setParticipants(result.participants);
            
            // Caso novo participante tenha entrado, mostrar um toast
            const participantCount = Object.keys(result.participants).length;
            
            if (participantCount > prevParticipantCount && prevParticipantCount > 0) {
              const newParticipants = Object.entries(result.participants).filter(
                ([id]) => !participants[id]
              );
              
              if (newParticipants.length > 0) {
                // Fixed type error by ensuring newParticipants[0][1] is a MeetingUser
                const newUser = newParticipants[0][1] as MeetingUser;
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
    
    // Set up polling for participants update (a cada 5 segundos)
    const intervalId = setInterval(() => {
      if (agoraState.channelName) {
        setParticipantsLastUpdated(Date.now());
        fetchParticipants();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [agoraState.remoteUsers, agoraState.channelName, participantsLastUpdated, participants]);

  // Find remote user who is sharing screen (if any)
  const remoteScreenShareUser = agoraState.remoteUsers.find(
    user => user.uid === agoraState.screenShareUserId
  );

  // Generate meeting link based on current channel
  const generateMeetingLink = () => {
    if (!agoraState.channelName) {
      throw new Error("No active channel to generate link for");
    }
    return generateShareableLink(agoraState.channelName);
  };

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
        }
      }
    };

    if (agoraState.channelName) {
      fetchParticipants();
    }
  }, [agoraState.channelName]);

  const joinWithUser = async (channelName: string, user: MeetingUser) => {
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
      
      // Always enable audio for direct link joins
      const audioEnabled = true;
      
      console.log(`Joining audio call for channel ${channelName}...`);
      const joined = await joinAudioCall(channelName, audioEnabled);
      
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

  // Create context value
  const contextValue: AgoraContextType = {
    agoraState,
    joinAudioCall,
    leaveAudioCall,
    toggleMute,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    isMuted,
    remoteScreenShareUser,
    generateMeetingLink,
    downloadRecording,
    isScreenRecording,
    toggleScreenRecording,
    // Meeting functionality
    currentUser,
    participants,
    setParticipants,
    joinWithUser,
    refreshParticipants: () => setParticipantsLastUpdated(Date.now())
  };

  return <AgoraContext.Provider value={contextValue}>{children}</AgoraContext.Provider>;
};

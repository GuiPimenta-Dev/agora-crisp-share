
import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import AgoraRTC, { IAgoraRTCClient } from "agora-rtc-sdk-ng";
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
import { useAgoraParticipants } from "@/hooks/useAgoraParticipants";

// Create context with undefined initial value
const AgoraContext = createContext<AgoraContextType | undefined>(undefined);

// Hook to access the context
export const useAgora = () => {
  const context = useContext(AgoraContext);
  if (!context) {
    throw new Error("useAgora must be used within an AgoraProvider");
  }
  return context;
};

// Provider component
export const AgoraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core state
  const [agoraState, setAgoraState] = useState<AgoraState>({
    client: undefined,
    localAudioTrack: undefined,
    screenVideoTrack: undefined,
    screenShareUserId: undefined,
    remoteUsers: [],
    joinState: false,
    isRecording: false,
  });

  // UI states
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [currentUser, setCurrentUser] = useState<MeetingUser | null>(null);
  const [participants, setParticipants] = useState<Record<string, MeetingUser>>({});
  
  // Initialization state
  const [clientInitialized, setClientInitialized] = useState(false);
  const [joinInProgress, setJoinInProgress] = useState(false);
  const clientRef = useRef<IAgoraRTCClient | undefined>();

  // Initialize Agora client
  useEffect(() => {
    const initializeClient = async () => {
      try {
        console.log("Initializing Agora client");
        const client = createClient();
        clientRef.current = client;
        
        setAgoraState(prev => ({
          ...prev,
          client
        }));
        
        setClientInitialized(true);
      } catch (error) {
        console.error("Failed to initialize Agora client:", error);
        toast({
          title: "Error",
          description: "Audio service initialization failed",
          variant: "destructive"
        });
      }
    };
    
    initializeClient();
  }, []);

  // Initialize hooks with shared state
  const { joinAudioCall, leaveAudioCall, toggleMute, isActionInProgress } = useAgoraAudioCall(
    agoraState, 
    setAgoraState, 
    setIsMuted,
    setIsScreenSharing
  );

  const { startScreenShare, stopScreenShare } = useAgoraScreenShare(
    agoraState,
    setAgoraState,
    setIsScreenSharing,
    currentUser
  );
  
  const { startRecording, stopRecording, downloadRecording } = useAgoraRecording(
    agoraState,
    setAgoraState,
    currentUser
  );
  
  // Screen recording
  const { isRecording: isScreenRecording, toggleRecording: toggleScreenRecording } = useScreenRecording();

  // Set up event handlers
  useAgoraEventHandlers(
    agoraState,
    setAgoraState, 
    stopScreenShare, 
    isScreenSharing,
    startRecording,
    stopRecording,
    currentUser,
    participants,
    setParticipants
  );

  // Use participants hook
  useAgoraParticipants(agoraState.channelName, setParticipants, currentUser);
  
  // Find remote screen sharing user
  const remoteScreenShareUser = agoraState.remoteUsers.find(
    user => user.uid === agoraState.screenShareUserId
  );

  // Generate meeting link
  const generateMeetingLink = () => {
    if (!agoraState.channelName) {
      throw new Error("No active channel");
    }
    return generateShareableLink(agoraState.channelName);
  };

  // Join with user details
  const joinWithUser = async (channelName: string, user: MeetingUser) => {
    if (joinInProgress) {
      return false;
    }
    
    if (agoraState.joinState && agoraState.channelName === channelName) {
      console.log(`Already joined ${channelName}`);
      
      setCurrentUser(user);
      setParticipants(prev => ({
        ...prev,
        [user.id]: { ...user, isCurrent: true }
      }));
      
      return true;
    }
    
    if (!agoraState.client) {
      toast({
        title: "Connection Error",
        description: "Audio service not initialized",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      setJoinInProgress(true);
      
      setCurrentUser({ ...user, isCurrent: true });
      
      setParticipants(prev => ({
        ...prev,
        [user.id]: { ...user, isCurrent: true }
      }));
      
      // Always enable audio for direct link joins
      const joined = await joinAudioCall(channelName, true);
      
      return joined;
    } catch (error) {
      console.error("Error joining:", error);
      toast({
        title: "Join Error",
        description: "Failed to join meeting",
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
    currentUser,
    participants,
    setParticipants,
    joinWithUser,
    isActionInProgress
  };

  return <AgoraContext.Provider value={contextValue}>{children}</AgoraContext.Provider>;
};

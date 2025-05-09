
import React, { createContext, useContext, useState, useRef } from "react";
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { createClient } from "@/lib/agoraUtils";
import { AgoraState, AgoraContextType } from "@/types/agora";
import { useAgoraAudioCall } from "@/hooks/useAgoraAudioCall";
import { useAgoraScreenShare } from "@/hooks/useAgoraScreenShare";
import { useAgoraEventHandlers } from "@/hooks/useAgoraEventHandlers";
import { useAgoraRecording } from "@/hooks/useAgoraRecording";
import { useScreenRecording } from "@/hooks/useScreenRecording";
import { generateShareableLink } from "@/lib/tokenGenerator";
import { useToast } from "@/hooks/use-toast";
import { MeetingUser } from "@/types/meeting";

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
  const clientRef = useRef<IAgoraRTCClient | undefined>();
  const { toast } = useToast();

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

  // Initialize Agora client
  React.useEffect(() => {
    const client = createClient();
    clientRef.current = client;
    
    setAgoraState((prev) => ({
      ...prev,
      client
    }));
  }, []);

  // Set up event handlers using our hook
  useAgoraEventHandlers(
    agoraState,
    setAgoraState, 
    stopScreenShare, 
    isScreenSharing,
    startRecording,
    stopRecording
  );

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

  const joinWithUser = async (channelName: string, user: MeetingUser) => {
    setCurrentUser(user);
    
    // Add user to participants
    setParticipants(prev => ({
      ...prev,
      [user.id]: user
    }));
    
    // Enable audio only if user has permission
    const audioEnabled = user.role === "coach" || user.role === "student";
    const joined = await joinAudioCall(channelName, audioEnabled);
    
    return joined;
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
    // New meeting functionality
    currentUser,
    participants,
    setParticipants,
    joinWithUser,
  };

  return <AgoraContext.Provider value={contextValue}>{children}</AgoraContext.Provider>;
};

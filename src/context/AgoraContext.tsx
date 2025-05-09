
import React, { createContext, useContext, useState, useRef } from "react";
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { createClient } from "@/lib/agoraUtils";
import { AgoraState, AgoraContextType } from "@/types/agora";
import { useAgoraAudioCall } from "@/hooks/useAgoraAudioCall";
import { useAgoraScreenShare } from "@/hooks/useAgoraScreenShare";
import { useAgoraEventHandlers } from "@/hooks/useAgoraEventHandlers";

const AgoraContext = createContext<AgoraContextType | undefined>(undefined);

export const useAgora = () => {
  const context = useContext(AgoraContext);
  if (!context) {
    throw new Error("useAgora must be used within an AgoraProvider");
  }
  return context;
};

export const AgoraProvider = ({ children }: { children: React.ReactNode }) => {
  // State management
  const [agoraState, setAgoraState] = useState<AgoraState>({
    client: undefined,
    localAudioTrack: undefined,
    screenVideoTrack: undefined,
    screenShareUserId: undefined,
    remoteUsers: [],
    joinState: false
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const clientRef = useRef<IAgoraRTCClient | undefined>();

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
    agoraState.client, 
    setAgoraState, 
    stopScreenShare, 
    isScreenSharing
  );

  // Find remote user who is sharing screen (if any)
  const remoteScreenShareUser = agoraState.remoteUsers.find(
    user => user.uid === agoraState.screenShareUserId
  );

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
  };

  return <AgoraContext.Provider value={contextValue}>{children}</AgoraContext.Provider>;
};

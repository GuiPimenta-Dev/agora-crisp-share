
import React, { createContext, useContext } from "react";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { AgoraState, AgoraContextType } from "@/types/agora";
import { useAgoraAudioCall } from "@/hooks/useAgoraAudioCall";
import { useAgoraScreenShare } from "@/hooks/useAgoraScreenShare";
import { useAgoraEventHandlers } from "@/hooks/useAgoraEventHandlers";
import { useAgoraRecording } from "@/hooks/useAgoraRecording";
import { useScreenRecording } from "@/hooks/useScreenRecording";
import { generateShareableLink } from "@/lib/tokenGenerator";
import { MeetingUser } from "@/types/meeting";
import { AgoraProviderProps } from "@/types/agoraContext";
import { useAgoraState } from "@/hooks/useAgoraState";
import { useAgoraInit } from "@/hooks/useAgoraInit";
import { useAgoraParticipants, refreshParticipants as refreshParticipantsFn } from "@/hooks/useAgoraParticipants";
import { useJoinMeeting } from "@/hooks/useJoinMeeting";

const AgoraContext = createContext<AgoraContextType | undefined>(undefined);

export const useAgora = () => {
  const context = useContext(AgoraContext);
  if (!context) {
    throw new Error("useAgora must be used within an AgoraProvider");
  }
  return context;
};

export const AgoraProvider: React.FC<AgoraProviderProps> = ({ children }) => {
  // Initialize all state using our custom hook
  const stateManager = useAgoraState();
  const {
    agoraState, 
    setAgoraState,
    isMuted, 
    setIsMuted,
    isScreenSharing, 
    setIsScreenSharing,
    currentUser, 
    setCurrentUser,
    participants, 
    setParticipants,
    clientRef,
    leaveInProgress,
    clientInitialized,
    setClientInitialized,
    joinInProgress,
    setJoinInProgress,
    participantsLastUpdated,
    setParticipantsLastUpdated
  } = stateManager;

  // Initialize Agora client
  useAgoraInit({
    agoraState, 
    setAgoraState, 
    clientRef, 
    setClientInitialized,
    leaveInProgress
  });

  // Initialize hooks with our shared state
  const { joinAudioCall, leaveAudioCall, toggleMute } = useAgoraAudioCall(
    agoraState, 
    setAgoraState, 
    setIsMuted,
    setIsScreenSharing
  );

  // Set audio call function in the state so it can be used by joinWithUser
  if (!agoraState.joinAudioCallFunc && joinAudioCall) {
    setAgoraState(prev => ({
      ...prev,
      joinAudioCallFunc: joinAudioCall
    }));
  }

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

  // Manage participants
  useAgoraParticipants({
    agoraState,
    setAgoraState,
    participants,
    setParticipants,
    participantsLastUpdated,
    setParticipantsLastUpdated
  });

  // Meeting join functionality
  const { joinWithUser } = useJoinMeeting({
    agoraState,
    currentUser,
    setCurrentUser,
    participants,
    setParticipants,
    setAgoraState,
    joinInProgress,
    setJoinInProgress
  });

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

  // Wrapper for the refreshParticipants function
  const refreshParticipants = async (): Promise<void> => {
    return refreshParticipantsFn(
      agoraState,
      setAgoraState,
      setParticipants,
      setParticipantsLastUpdated
    );
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
    refreshParticipants
  };

  return <AgoraContext.Provider value={contextValue}>{children}</AgoraContext.Provider>;
};

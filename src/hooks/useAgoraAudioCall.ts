
import { useState, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { 
  createMicrophoneAudioTrack, 
  joinChannel, 
  leaveChannel 
} from "@/lib/agoraUtils";
import { AgoraState } from "@/types/agora";
import { IAgoraRTCClient } from "agora-rtc-sdk-ng";

export function useAgoraAudioCall(
  agoraState: AgoraState,
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>,
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>,
  setIsScreenSharing: React.Dispatch<React.SetStateAction<boolean>>
) {
  // Use ref to prevent rapid state changes and track mute operations
  const lastActionTimeRef = useRef<number>(0);
  const actionInProgressRef = useRef<boolean>(false);
  const pendingMuteOperationRef = useRef<boolean | null>(null);

  // Sync UI mute state with track mute state when track changes
  useEffect(() => {
    if (agoraState.localAudioTrack) {
      setIsMuted(agoraState.localAudioTrack.muted);
    }
  }, [agoraState.localAudioTrack, setIsMuted]);

  const joinAudioCall = async (channelName: string, audioEnabled: boolean = false): Promise<boolean> => {
    if (!agoraState.client) {
      toast({
        title: "Error",
        description: "Audio client not initialized",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      // Check if already joined
      if (agoraState.joinState && agoraState.localAudioTrack) {
        return true;
      }

      // Create microphone track
      console.log("Creating audio track, enabled:", audioEnabled);
      const localAudioTrack = await createMicrophoneAudioTrack();
      
      // Set initial mute state
      localAudioTrack.setMuted(!audioEnabled);
      
      console.log("Joining channel:", channelName);
      const joined = await joinChannel(
        agoraState.client,
        channelName,
        null,
        localAudioTrack
      );

      if (joined) {
        setAgoraState(prev => ({
          ...prev,
          localAudioTrack,
          joinState: true,
          channelName
        }));
        
        // Always mute by default
        localAudioTrack.setMuted(true);
        setIsMuted(true);
        
        toast({
          title: "Connected",
          description: `Joined meeting ${channelName}`,
        });
      }
      
      return joined;
    } catch (error) {
      console.error("Error joining call:", error);
      toast({
        title: "Connection failed",
        description: "Could not join call",
        variant: "destructive",
      });
      return false;
    }
  };

  const leaveAudioCall = async (): Promise<void> => {
    if (!agoraState.client) return;
    
    // Handle ongoing recording if present
    if (agoraState.recordingId) {
      toast({
        title: "Preparing recording",
        description: "Saving recording before leaving...",
      });
    }
    
    // Close all tracks
    const tracksToClose = [
      agoraState.localAudioTrack,
      agoraState.screenVideoTrack
    ].filter(Boolean) as any[];
    
    await leaveChannel(agoraState.client, tracksToClose);
    
    setAgoraState({
      client: agoraState.client,
      localAudioTrack: undefined,
      screenVideoTrack: undefined,
      screenShareUserId: undefined,
      remoteUsers: [],
      joinState: false,
      isRecording: false,
      recordingId: agoraState.recordingId,
    });
    
    setIsScreenSharing(false);
    setIsMuted(false);
    
    toast({
      title: "Left call",
      description: "You have left the audio call",
    });
  };

  const toggleMute = () => {
    if (!agoraState.localAudioTrack) return;
    
    // Implement throttling to prevent rapid toggling
    const now = Date.now();
    if (now - lastActionTimeRef.current < 500 || actionInProgressRef.current) {
      console.log("Throttling mute toggle");
      return;
    }
    
    // Update refs to track this operation
    lastActionTimeRef.current = now;
    actionInProgressRef.current = true;
    
    // Get current state
    const currentMuted = agoraState.localAudioTrack.muted;
    const newMuted = !currentMuted;
    
    console.log(`Toggling mute from ${currentMuted} to ${newMuted}`);
    
    // Set the track's muted state
    agoraState.localAudioTrack.setMuted(newMuted);
    
    // Update UI immediately
    setIsMuted(newMuted);
    
    // Store the pending state to avoid duplicate notifications
    pendingMuteOperationRef.current = newMuted;
    
    // Show toast
    toast({
      title: newMuted ? "Microphone muted" : "Microphone unmuted",
      description: newMuted ? "Others cannot hear you" : "Others can now hear you",
    });
    
    // Allow more operations after a delay
    setTimeout(() => {
      actionInProgressRef.current = false;
      pendingMuteOperationRef.current = null;
    }, 2000);
  };

  return {
    joinAudioCall,
    leaveAudioCall,
    toggleMute,
    isActionInProgress: actionInProgressRef.current
  };
}

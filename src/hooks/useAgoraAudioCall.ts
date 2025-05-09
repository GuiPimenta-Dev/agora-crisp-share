
import { useState } from "react";
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
  const joinAudioCall = async (channelName: string, audioEnabled: boolean = true): Promise<boolean> => {
    if (!agoraState.client) {
      console.error("Agora client not initialized in joinAudioCall");
      toast({
        title: "Error",
        description: "Agora client not initialized",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      // Check if we're already in a channel
      if (agoraState.joinState && agoraState.localAudioTrack) {
        console.log("Already joined a channel, reusing existing connection");
        return true;
      }

      console.log("Creating microphone track, audioEnabled:", audioEnabled);
      const localAudioTrack = await createMicrophoneAudioTrack();
      
      // IMPORTANT: Always enable the track before publishing to avoid TRACK_IS_DISABLED error
      localAudioTrack.setEnabled(true);
      
      console.log("Track created and enabled, joining channel:", channelName);
      const joined = await joinChannel(
        agoraState.client,
        channelName,
        null,
        localAudioTrack
      );

      if (joined) {
        console.log("Successfully joined channel:", channelName);
        setAgoraState(prev => ({
          ...prev,
          localAudioTrack,
          joinState: true,
          channelName
        }));
        
        // After joining successfully, we can update the mute state
        if (!audioEnabled) {
          console.log("Audio disabled by settings, muting microphone");
          localAudioTrack.setEnabled(false);
          setIsMuted(true);
        } else {
          console.log("Audio enabled");
          setIsMuted(false);
        }
        
        toast({
          title: "Connected",
          description: `You've joined channel ${channelName}`,
        });
      } else {
        console.error("Failed to join channel:", channelName);
      }
      
      return joined;
    } catch (error) {
      console.error("Error joining audio call:", error);
      toast({
        title: "Connection failed",
        description: "Unable to join call. Please check your permissions.",
        variant: "destructive",
      });
      return false;
    }
  };

  const leaveAudioCall = async (): Promise<void> => {
    if (!agoraState.client) return;
    
    // If recording is active, download before leaving
    if (agoraState.recordingId) {
      toast({
        title: "Preparando gravação",
        description: "Salvando a gravação da chamada antes de sair...",
      });
    }
    
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
      // Keep recordingId so we can download after leaving
      recordingId: agoraState.recordingId,
    });
    
    setIsScreenSharing(false);
    setIsMuted(false);
    
    toast({
      title: "Saiu da chamada",
      description: "Você saiu da chamada de áudio",
    });
  };

  const toggleMute = () => {
    if (!agoraState.localAudioTrack) return;
    
    const newMuteState = !agoraState.localAudioTrack.enabled;
    
    agoraState.localAudioTrack.setEnabled(newMuteState);
    setIsMuted(!newMuteState);
    
    toast({
      title: newMuteState ? "Microfone ativado" : "Microfone silenciado",
      description: newMuteState 
        ? "Os outros participantes podem ouvir você agora" 
        : "Os outros participantes não podem ouvir você",
    });
  };

  return {
    joinAudioCall,
    leaveAudioCall,
    toggleMute
  };
}

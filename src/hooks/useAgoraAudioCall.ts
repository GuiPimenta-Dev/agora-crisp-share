
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { 
  createMicrophoneAudioTrack, 
  joinChannel, 
  leaveChannel 
} from "@/lib/agoraUtils";
import { AgoraState } from "@/types/agora";
import { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { supabase } from "@/integrations/supabase/client";

export function useAgoraAudioCall(
  agoraState: AgoraState,
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>,
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>,
  setIsScreenSharing: React.Dispatch<React.SetStateAction<boolean>>
) {
  const joinAudioCall = async (channelName: string, audioEnabled: boolean = false): Promise<boolean> => {
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
      
      // IMPORTANT: Set muted state directly instead of using setEnabled
      // We must use setMuted(true) instead of setEnabled(false) to avoid the TRACK_STATE_UNREACHABLE error
      localAudioTrack.setMuted(!audioEnabled);
      
      console.log("Track created and muted, joining channel:", channelName);
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
        
        // Always mute the microphone by default when joining
        localAudioTrack.setMuted(true);
        setIsMuted(true);
        
        toast({
          title: "Conectado",
          description: `Você entrou na sala ${channelName} com microfone mutado`,
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
    
    // IMPORTANT: Use setMuted instead of setEnabled to avoid the TRACK_STATE_UNREACHABLE error
    const currentMuted = agoraState.localAudioTrack.muted;
    console.log("Toggling mute state from", currentMuted, "to", !currentMuted);
    
    // Set the track muted state
    agoraState.localAudioTrack.setMuted(!currentMuted);
    
    // Update the UI state
    setIsMuted(!currentMuted);
    
    // Force update AgoraState to trigger the useEffect in useAudioStatusSync
    // We use a custom audioMutedState property to trigger the useEffect without modifying the track
    setAgoraState(prev => ({
      ...prev,
      audioMutedState: !currentMuted, // Add this as a trigger property
    }));
    
    toast({
      title: !currentMuted ? "Microfone silenciado" : "Microfone ativado",
      description: !currentMuted 
        ? "Os outros participantes não podem ouvir você" 
        : "Os outros participantes podem ouvir você agora",
    });
  };

  return {
    joinAudioCall,
    leaveAudioCall,
    toggleMute
  };
}

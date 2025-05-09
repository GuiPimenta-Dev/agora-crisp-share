
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

  const joinAudioCall = async (channelName: string): Promise<boolean> => {
    if (!agoraState.client) {
      toast({
        title: "Erro",
        description: "Cliente Agora não inicializado",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      const localAudioTrack = await createMicrophoneAudioTrack();
      
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
          channelName // Store the channel name for link generation
        }));
        
        toast({
          title: "Conectado",
          description: `Você entrou no canal ${channelName}`,
        });
      }
      
      return joined;
    } catch (error) {
      console.error("Error joining audio call:", error);
      toast({
        title: "Falha ao conectar",
        description: "Não foi possível entrar na chamada. Por favor, verifique as permissões.",
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

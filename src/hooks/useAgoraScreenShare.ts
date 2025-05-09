
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  createScreenVideoTrack
} from "@/lib/agoraUtils";
import { AgoraState } from "@/types/agora";
import { IAgoraRTCClient } from "agora-rtc-sdk-ng";

export function useAgoraScreenShare(
  agoraState: AgoraState,
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>,
  setIsScreenSharing: React.Dispatch<React.SetStateAction<boolean>>
) {
  const { toast } = useToast();

  const startScreenShare = async (): Promise<void> => {
    if (!agoraState.client || !agoraState.joinState) {
      toast({
        title: "Erro",
        description: "Por favor, conecte-se à chamada primeiro",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se já existe alguém compartilhando tela
    if (agoraState.screenShareUserId) {
      toast({
        title: "Não é possível compartilhar",
        description: "Outro participante já está compartilhando a tela",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const screenTrack = await createScreenVideoTrack();
      
      // Publicar o track de vídeo
      await agoraState.client.publish(screenTrack);
      
      setAgoraState(prev => ({
        ...prev,
        screenVideoTrack: screenTrack,
      }));
      
      setIsScreenSharing(true);
      
      // Handle screen share ended by user through browser UI
      screenTrack.on("track-ended", async () => {
        await stopScreenShare();
      });
      
      toast({
        title: "Compartilhamento iniciado",
        description: "Você está compartilhando sua tela agora",
      });
    } catch (error) {
      console.error("Error starting screen share:", error);
      toast({
        title: "Falha ao compartilhar tela",
        description: error instanceof Error ? error.message : "Não foi possível iniciar o compartilhamento de tela. Verifique as permissões.",
        variant: "destructive",
      });
    }
  };

  const stopScreenShare = async (): Promise<void> => {
    if (!agoraState.client || !agoraState.screenVideoTrack) return;
    
    try {
      // Importante: fazer o unpublish antes de parar o track
      await agoraState.client.unpublish(agoraState.screenVideoTrack);
      
      // Agora podemos parar e fechar o track com segurança
      agoraState.screenVideoTrack.stop();
      agoraState.screenVideoTrack.close();
      
      setAgoraState(prev => ({
        ...prev,
        screenVideoTrack: undefined,
      }));
      
      setIsScreenSharing(false);
      
      toast({
        title: "Compartilhamento finalizado",
        description: "Você não está mais compartilhando sua tela",
      });
    } catch (error) {
      console.error("Erro ao parar o compartilhamento de tela:", error);
      toast({
        title: "Erro ao finalizar compartilhamento",
        description: "Ocorreu um erro ao tentar parar o compartilhamento. Tente novamente.",
        variant: "destructive",
      });
      
      // Forçar o estado como não compartilhando mesmo se houver erro
      setIsScreenSharing(false);
      setAgoraState(prev => ({
        ...prev,
        screenVideoTrack: undefined,
      }));
    }
  };

  return {
    startScreenShare,
    stopScreenShare
  };
}


import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { 
  createScreenVideoTrack
} from "@/lib/agoraUtils";
import { AgoraState } from "@/types/agora";
import { MeetingUser } from "@/types/meeting";

export function useAgoraScreenShare(
  agoraState: AgoraState,
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>,
  setIsScreenSharing: React.Dispatch<React.SetStateAction<boolean>>,
  currentUser?: MeetingUser | null
) {
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
    
    // Verificar se o usuário tem permissões para compartilhar tela
    if (currentUser && currentUser.role !== 'coach' && currentUser.role !== 'student') {
      toast({
        title: "Permissão negada",
        description: "Apenas professores e alunos podem compartilhar a tela",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log("Creating screen video track...");
      const screenTrack = await createScreenVideoTrack();
      console.log("Screen track created successfully:", screenTrack);
      
      if (!screenTrack) {
        throw new Error("Failed to create screen track");
      }
      
      // Publicar o track de vídeo
      console.log("Publishing screen track to Agora...");
      await agoraState.client.publish(screenTrack);
      console.log("Screen track published successfully");
      
      // Update the AgoraState with the current user's ID as the screen sharer
      const userId = currentUser?.id || "unknown";
      console.log("Setting screen share user ID:", userId);
      
      setAgoraState(prev => ({
        ...prev,
        screenVideoTrack: screenTrack,
        screenShareUserId: userId, // Use current user ID passed as prop
      }));
      
      setIsScreenSharing(true);
      
      // Handle screen share ended by user through browser UI
      screenTrack.on("track-ended", async () => {
        console.log("Track ended by browser UI");
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
      console.log("Stopping screen share...");
      // Importante: fazer o unpublish antes de parar o track
      await agoraState.client.unpublish(agoraState.screenVideoTrack);
      console.log("Screen track unpublished successfully");
      
      // Agora podemos parar e fechar o track com segurança
      agoraState.screenVideoTrack.stop();
      agoraState.screenVideoTrack.close();
      console.log("Screen track stopped and closed");
      
      // Update the AgoraState to remove screen sharing info
      setAgoraState(prev => ({
        ...prev,
        screenVideoTrack: undefined,
        screenShareUserId: undefined,  // Clear the screen sharer ID
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
        screenShareUserId: undefined,
      }));
    }
  };

  return {
    startScreenShare,
    stopScreenShare
  };
}

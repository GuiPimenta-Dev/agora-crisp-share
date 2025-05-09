
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { AgoraState } from "@/types/agora";
import { IAgoraRTCClient } from "agora-rtc-sdk-ng";

export function useAgoraEventHandlers(
  agoraState: AgoraState,
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>,
  stopScreenShare: () => Promise<void>,
  isScreenSharing: boolean,
  startRecording: () => Promise<boolean>,
  stopRecording: () => Promise<boolean>
) {
  const client = agoraState.client;

  useEffect(() => {
    if (!client) return;

    // Set up event handlers
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      
      // Handle different media types
      if (mediaType === "audio") {
        const remoteAudioTrack = user.audioTrack;
        if (remoteAudioTrack) {
          remoteAudioTrack.play();
          toast({
            title: "Usuário conectou o áudio",
            description: `Usuário ${user.uid} entrou na chamada`,
          });
        }
      }
      
      if (mediaType === "video") {
        // User is sharing screen - verificamos se já há alguém compartilhando
        setAgoraState(prev => ({
          ...prev,
          screenShareUserId: user.uid
        }));
        toast({
          title: "Compartilhamento iniciado",
          description: `Usuário ${user.uid} começou a compartilhar a tela`,
        });
        
        // Se eu estava compartilhando, paro meu compartilhamento
        if (isScreenSharing) {
          await stopScreenShare();
          toast({
            title: "Seu compartilhamento foi interrompido",
            description: "Outro usuário começou a compartilhar a tela",
            variant: "destructive"
          });
        }
      }
      
      // Add user to remote users list if not already there
      setAgoraState(prev => {
        const newState = {
          ...prev,
          remoteUsers: [...prev.remoteUsers.filter(u => u.uid !== user.uid), user]
        };
        
        // Verificar se temos coach e aluno para iniciar gravação automaticamente
        if (prev.participants) {
          const participants = Object.values(prev.participants);
          const hasCoach = participants.some(p => p.role === "coach");
          const hasStudent = participants.some(p => p.role === "student");
          
          if (hasCoach && hasStudent && !prev.isRecording) {
            console.log("Coach e aluno presentes, iniciando gravação automática");
            startRecording().then(success => {
              if (success) {
                console.log("Gravação iniciada automaticamente com coach e aluno");
              }
            });
          }
        }
        
        return newState;
      });
    });

    client.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "audio") {
        if (user.audioTrack) {
          user.audioTrack.stop();
        }
      }
      
      if (mediaType === "video") {
        // User stopped sharing screen
        if (user.videoTrack) {
          user.videoTrack.stop();
        }
        
        setAgoraState(prev => ({
          ...prev,
          screenShareUserId: prev.screenShareUserId === user.uid ? undefined : prev.screenShareUserId
        }));
        toast({
          title: "Compartilhamento finalizado",
          description: `Usuário ${user.uid} parou de compartilhar a tela`,
        });
      }
    });

    client.on("user-left", (user) => {
      // Make sure to check if the leaving user was sharing screen
      setAgoraState(prev => {
        // Check if the leaving user was sharing screen
        const wasShareUser = prev.screenShareUserId === user.uid;
        
        // Update state
        const newRemoteUsers = prev.remoteUsers.filter(u => u.uid !== user.uid);
        const newState = {
          ...prev,
          remoteUsers: newRemoteUsers,
          screenShareUserId: wasShareUser ? undefined : prev.screenShareUserId
        };
        
        // If no remote users left and recording is active, stop recording
        if (newRemoteUsers.length === 0 && prev.isRecording) {
          stopRecording().then(success => {
            if (success) {
              console.log("Recording stopped automatically as last participant left");
            }
          });
        }
        
        return newState;
      });
      
      toast({
        title: "Usuário saiu",
        description: `Usuário ${user.uid} saiu da chamada`,
      });
      
      // Check if the leaving user was sharing screen based on the state comparison
      setAgoraState(prev => {
        if (prev.screenShareUserId === user.uid) {
          toast({
            title: "Compartilhamento finalizado",
            description: "O usuário que estava compartilhando a tela saiu da chamada",
          });
        }
        return prev;
      });
    });

    // Clean up
    return () => {
      client.removeAllListeners();
    };
  }, [client, isScreenSharing, stopScreenShare, setAgoraState, startRecording, stopRecording]);
}


import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  IMicrophoneAudioTrack, 
  ILocalVideoTrack,
  UID,
} from "agora-rtc-sdk-ng";
import { 
  AgoraState, 
  createClient, 
  createMicrophoneAudioTrack, 
  createScreenVideoTrack, 
  joinChannel, 
  leaveChannel, 
  startScreenSharing, 
  stopScreenSharing 
} from "@/lib/agoraUtils";
import { useToast } from "@/components/ui/use-toast";

interface AgoraContextType {
  agoraState: AgoraState;
  joinAudioCall: (channelName: string) => Promise<boolean>;
  leaveAudioCall: () => Promise<void>;
  toggleMute: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  isScreenSharing: boolean;
  isMuted: boolean;
  remoteScreenShareUser: IAgoraRTCRemoteUser | undefined;
}

const AgoraContext = createContext<AgoraContextType | undefined>(undefined);

export const useAgora = () => {
  const context = useContext(AgoraContext);
  if (!context) {
    throw new Error("useAgora must be used within an AgoraProvider");
  }
  return context;
};

export const AgoraProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  
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

  // Initialize Agora client
  useEffect(() => {
    const client = createClient();
    clientRef.current = client;
    
    setAgoraState((prev) => ({
      ...prev,
      client
    }));

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
      setAgoraState(prev => ({
        ...prev,
        remoteUsers: [...prev.remoteUsers.filter(u => u.uid !== user.uid), user]
      }));
    });

    client.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "audio") {
        if (user.audioTrack) {
          user.audioTrack.stop();
        }
      }
      
      if (mediaType === "video") {
        // User stopped sharing screen
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
      setAgoraState(prev => ({
        ...prev,
        remoteUsers: prev.remoteUsers.filter(u => u.uid !== user.uid),
        screenShareUserId: prev.screenShareUserId === user.uid ? undefined : prev.screenShareUserId
      }));
      toast({
        title: "Usuário saiu",
        description: `Usuário ${user.uid} saiu da chamada`,
      });
    });

    // Clean up
    return () => {
      client.removeAllListeners();
    };
  }, [toast, isScreenSharing]);

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
          joinState: true
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
      joinState: false
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
    
    if (isMuted) {
      agoraState.localAudioTrack.setEnabled(true);
      setIsMuted(false);
      toast({
        title: "Microfone ativado",
        description: "Os outros participantes podem ouvir você agora",
      });
    } else {
      agoraState.localAudioTrack.setEnabled(false);
      setIsMuted(true);
      toast({
        title: "Microfone silenciado",
        description: "Os outros participantes não podem ouvir você",
      });
    }
  };

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
      
      await startScreenSharing(agoraState.client, screenTrack);
      
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
    
    await stopScreenSharing(agoraState.client, agoraState.screenVideoTrack);
    
    setAgoraState(prev => ({
      ...prev,
      screenVideoTrack: undefined,
    }));
    
    setIsScreenSharing(false);
    
    toast({
      title: "Compartilhamento finalizado",
      description: "Você não está mais compartilhando sua tela",
    });
  };
  
  // Find remote user who is sharing screen (if any)
  const remoteScreenShareUser = agoraState.remoteUsers.find(
    user => user.uid === agoraState.screenShareUserId
  );

  const value = {
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

  return <AgoraContext.Provider value={value}>{children}</AgoraContext.Provider>;
};

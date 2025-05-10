
import { useEffect, useState } from "react";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { useAgora } from "@/context/AgoraContext";
import { useToast } from "@/components/ui/use-toast";

export function useScreenShare() {
  const { startScreenShare, stopScreenShare, agoraState, isScreenSharing, remoteScreenShareUser } = useAgora();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resolution, setResolution] = useState<string>("Ultra HD");
  
  const isScreenBeingShared = isScreenSharing || !!remoteScreenShareUser;
  const isOtherUserSharing = !!remoteScreenShareUser;

  const handleScreenShare = async () => {
    if (isLoading || isOtherUserSharing) return; // Prevent when loading or other is sharing
    
    setIsLoading(true);
    try {
      toast({
        title: "Iniciando compartilhamento",
        description: "Preparando streaming em ultra alta qualidade...",
      });
      await startScreenShare();
      toast({
        title: "Compartilhamento ativo",
        description: "Seu conteúdo está sendo transmitido em ultra HD (até 4K/2160p)",
      });
    } catch (error) {
      console.error("Screen sharing error:", error);
      toast({
        title: "Falha no compartilhamento",
        description: "Verifique se você concedeu permissões de compartilhamento de tela e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isScreenBeingShared,
    isOtherUserSharing,
    isLoading,
    isScreenSharing,
    remoteScreenShareUser,
    resolution,
    setResolution,
    handleScreenShare,
    stopScreenShare
  };
}


import React, { useEffect, useRef, useState } from "react";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { Monitor, Share2, Shield, AlertCircle, Maximize2, Minimize2 } from "lucide-react";
import { useAgora } from "@/context/AgoraContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface ScreenShareViewProps {
  localSharing: boolean;
  remoteScreenUser?: IAgoraRTCRemoteUser;
}

const ScreenShareView: React.FC<ScreenShareViewProps> = ({
  localSharing,
  remoteScreenUser,
}) => {
  const { startScreenShare, stopScreenShare, agoraState } = useAgora();
  const { toast } = useToast();
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle remote screen share
  useEffect(() => {
    if (remoteScreenUser && remoteScreenUser.videoTrack && remoteVideoRef.current) {
      remoteScreenUser.videoTrack.play(remoteVideoRef.current);
      return () => {
        remoteScreenUser.videoTrack?.stop();
      };
    }
  }, [remoteScreenUser]);
  
  // Handle local screen share
  useEffect(() => {
    if (localSharing && agoraState.screenVideoTrack && localVideoRef.current) {
      agoraState.screenVideoTrack.play(localVideoRef.current);
      return () => {
        // Cleanup function - don't stop the track here to avoid interrupting broadcast
      };
    }
  }, [localSharing, agoraState.screenVideoTrack]);
  
  const isScreenBeingShared = localSharing || remoteScreenUser;
  const isOtherUserSharing = !!remoteScreenUser;

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

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  return (
    <div ref={containerRef} className="screen-share-container h-full w-full relative">
      {isScreenBeingShared ? (
        <div className="relative w-full h-full">
          {remoteScreenUser ? (
            <div ref={remoteVideoRef} className="w-full h-full" />
          ) : localSharing ? (
            <div ref={localVideoRef} className="w-full h-full" />
          ) : null}
          
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-blue-600/90 text-white px-3 py-1.5 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>Ultra HD 4K</span>
            </Badge>
          </div>

          {/* Botão de maximizar/minimizar */}
          <Button 
            variant="secondary" 
            size="icon"
            className="absolute top-3 right-3 bg-black/50 hover:bg-black/70"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      ) : (
        <div className="screen-share-placeholder h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-900/90 to-blue-800/90">
          <div className="flex flex-col items-center gap-4 text-center p-4">
            <Monitor className="h-16 w-16 text-blue-300 opacity-70" />
            <div>
              <h3 className="text-xl font-medium mb-2">Nenhuma tela está sendo compartilhada</h3>
              <p className="text-blue-200 max-w-md">
                {isOtherUserSharing 
                  ? "Outro participante já está compartilhando a tela. Aguarde ele finalizar para compartilhar a sua."
                  : "Clique no botão abaixo para compartilhar sua tela com ultra alta resolução (até 4K/2160p)"}
              </p>
              
              <Button
                className="mt-6"
                onClick={localSharing ? stopScreenShare : handleScreenShare}
                disabled={isLoading || isOtherUserSharing}
              >
                {isLoading ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2 animate-pulse" />
                    Aguarde...
                  </>
                ) : isOtherUserSharing ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Outro usuário compartilhando
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar sua tela
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenShareView;

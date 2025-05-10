import React, { useEffect, useRef, useState } from "react";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { Monitor, Share2, Shield, AlertCircle, Maximize2, Minimize2, Zap } from "lucide-react";
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
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [resolution, setResolution] = useState<string>("Ultra HD");
  
  // Handle remote screen share
  useEffect(() => {
    if (remoteScreenUser && remoteScreenUser.videoTrack && remoteVideoRef.current) {
      // Play the video track in the container
      const remoteVideoElement = document.getElementById("remote-video-player");
      if (remoteVideoElement) {
        remoteScreenUser.videoTrack.play();
        // Move the video player to our container
        const playerElement = document.querySelector('.agora_video_player');
        if (playerElement && remoteVideoElement) {
          remoteVideoElement.appendChild(playerElement);
        }
      }
      
      // Try to determine resolution
      const onStats = (stats: any) => {
        if (stats.width && stats.height) {
          const width = stats.width;
          if (width >= 3840) setResolution("4K Ultra HD");
          else if (width >= 2560) setResolution("2K Quad HD");
          else if (width >= 1920) setResolution("Full HD");
          else setResolution("HD");
        }
      };
      
      const statsInterval = setInterval(() => {
        if (remoteScreenUser.videoTrack) {
          remoteScreenUser.videoTrack.getStats(onStats);
        }
      }, 5000);
      
      return () => {
        if (remoteScreenUser.videoTrack) {
          remoteScreenUser.videoTrack.stop();
        }
        clearInterval(statsInterval);
      };
    }
  }, [remoteScreenUser]);
  
  // Handle local screen share
  useEffect(() => {
    if (localSharing && agoraState.screenVideoTrack && localVideoRef.current) {
      // Play the video track in the container
      const localVideoElement = document.getElementById("local-video-player");
      if (localVideoElement) {
        agoraState.screenVideoTrack.play();
        // Move the video player to our container
        const playerElement = document.querySelector('.agora_video_player');
        if (playerElement && localVideoElement) {
          localVideoElement.appendChild(playerElement);
        }
      }
      
      // Try to determine local resolution
      const onStats = (stats: any) => {
        if (stats.captureWidth && stats.captureHeight) {
          const width = stats.captureWidth;
          if (width >= 3840) setResolution("4K Ultra HD");
          else if (width >= 2560) setResolution("2K Quad HD");
          else if (width >= 1920) setResolution("Full HD");
          else setResolution("HD");
        }
      };
      
      const statsInterval = setInterval(() => {
        if (agoraState.screenVideoTrack) {
          agoraState.screenVideoTrack.getStats(onStats);
        }
      }, 5000);
      
      return () => {
        // Cleanup when unmounting only
        if (agoraState.screenVideoTrack && !localSharing) {
          agoraState.screenVideoTrack.stop();
        }
        clearInterval(statsInterval);
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
    if (!containerRef) return;

    if (!isFullscreen) {
      if (containerRef.requestFullscreen) {
        containerRef.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(err => console.error("Falha ao entrar em fullscreen:", err));
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(err => console.error("Falha ao sair do fullscreen:", err));
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
    <div ref={setContainerRef} className="screen-share-container h-full w-full relative rounded-md overflow-hidden">
      {isScreenBeingShared ? (
        <div className="relative w-full h-full">
          {remoteScreenUser ? (
            <div ref={remoteVideoRef} className="w-full h-full bg-black">
              <div id="remote-video-player" className="w-full h-full"></div>
            </div>
          ) : localSharing ? (
            <div ref={localVideoRef} className="w-full h-full bg-black">
              <div id="local-video-player" className="w-full h-full"></div>
            </div>
          ) : null}
          
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-blue-600/90 text-white px-3 py-1.5 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              <span>{resolution}</span>
            </Badge>
            
            <Badge variant="secondary" className="bg-blue-900/90 text-white px-3 py-1.5 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>8 Mbps Ultra Quality</span>
            </Badge>
          </div>

          {/* Maximizar/minimizar button - more prominent */}
          <Button 
            variant="secondary" 
            size="icon"
            className="absolute top-3 right-3 bg-blue-600 hover:bg-blue-700 text-white shadow-lg z-50"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
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
                ) : localSharing ? (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Parar compartilhamento
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

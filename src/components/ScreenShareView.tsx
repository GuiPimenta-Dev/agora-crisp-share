
import React, { useEffect, useRef, useState } from "react";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { Monitor, Share2, Shield, AlertCircle } from "lucide-react";
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
  const { startScreenShare, stopScreenShare } = useAgora();
  const { toast } = useToast();
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle remote screen share
  useEffect(() => {
    if (remoteScreenUser && remoteScreenUser.videoTrack && remoteVideoRef.current) {
      remoteScreenUser.videoTrack.play(remoteVideoRef.current);
      return () => {
        remoteScreenUser.videoTrack?.stop();
      };
    }
  }, [remoteScreenUser]);
  
  const isScreenBeingShared = localSharing || remoteScreenUser;

  const handleScreenShare = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    setIsLoading(true);
    try {
      toast({
        title: "Iniciando compartilhamento",
        description: "Preparando streaming em alta qualidade...",
      });
      await startScreenShare();
      toast({
        title: "Compartilhamento ativo",
        description: "Seu conteúdo está sendo transmitido em ultra HD (2K/1440p)",
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
  
  return (
    <div className="screen-share-container h-full w-full">
      {isScreenBeingShared ? (
        <div className="relative w-full h-full">
          <div ref={remoteVideoRef} className="w-full h-full" />
          {localSharing && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary" className="bg-blue-600/90 text-white px-3 py-1.5 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                <span>Ultra HD 2K</span>
              </Badge>
            </div>
          )}
        </div>
      ) : (
        <div className="screen-share-placeholder h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-900/90 to-blue-800/90">
          <div className="flex flex-col items-center gap-4 text-center p-4">
            <Monitor className="h-16 w-16 text-blue-300 opacity-70" />
            <div>
              <h3 className="text-xl font-medium mb-2">Nenhuma tela está sendo compartilhada</h3>
              <p className="text-blue-200 max-w-md">
                Clique no botão abaixo para compartilhar sua tela com ultra alta resolução (2K/1440p)
              </p>
              
              <Button
                className="mt-6"
                onClick={localSharing ? stopScreenShare : handleScreenShare}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2 animate-pulse" />
                    Aguarde...
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

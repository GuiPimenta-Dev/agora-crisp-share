
import React from "react";
import { Monitor, Share2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScreenSharePlaceholderProps {
  isLoading: boolean;
  isOtherUserSharing: boolean;
  localSharing: boolean;
  handleScreenShare: () => void;
  stopScreenShare: () => void;
}

const ScreenSharePlaceholder: React.FC<ScreenSharePlaceholderProps> = ({
  isLoading,
  isOtherUserSharing,
  localSharing,
  handleScreenShare,
  stopScreenShare
}) => {
  return (
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
  );
};

export default ScreenSharePlaceholder;

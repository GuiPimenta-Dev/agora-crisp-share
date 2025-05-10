
import React from "react";
import { Maximize2, Minimize2, Zap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ScreenShareControlsProps {
  resolution: string;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const ScreenShareControls: React.FC<ScreenShareControlsProps> = ({
  resolution,
  isFullscreen,
  toggleFullscreen
}) => {
  return (
    <>
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

      <Button 
        variant="secondary" 
        size="icon"
        className="absolute top-3 right-3 bg-blue-600 hover:bg-blue-700 text-white shadow-lg z-50"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
      >
        {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
      </Button>
    </>
  );
};

export default ScreenShareControls;

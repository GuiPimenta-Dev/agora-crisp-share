
import React from "react";
import { Button } from "@/components/ui/button";
import { MonitorX, Share2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ScreenShareButtonProps {
  isScreenSharing: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

const ScreenShareButton: React.FC<ScreenShareButtonProps> = ({
  isScreenSharing,
  isDisabled,
  onClick
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isScreenSharing ? "destructive" : "default"}
          size="icon"
          onClick={onClick}
          className="h-12 w-12 rounded-full"
          disabled={isDisabled}
        >
          {isScreenSharing ? <MonitorX className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isScreenSharing ? "Stop sharing" : "Share screen"}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ScreenShareButton;

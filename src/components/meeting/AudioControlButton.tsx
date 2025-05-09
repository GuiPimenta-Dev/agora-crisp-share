
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AudioControlButtonProps {
  isMuted: boolean;
  isDisabled: boolean;
  onClick: () => void;
  canUseAudio: boolean;
}

const AudioControlButton: React.FC<AudioControlButtonProps> = ({
  isMuted,
  isDisabled,
  onClick,
  canUseAudio
}) => {
  if (!canUseAudio) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled
            className="h-12 w-12 rounded-full opacity-50 cursor-not-allowed"
          >
            <MicOff className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Audio disabled for listeners</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isMuted ? "outline" : "default"}
          size="icon"
          onClick={onClick}
          className="h-12 w-12 rounded-full"
          disabled={isDisabled}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isMuted ? "Unmute" : "Mute"}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default AudioControlButton;


import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, MonitorX, Phone, Share2 } from "lucide-react";
import { useAgora } from "@/context/AgoraContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MeetingControlsProps {
  className?: string;
}

const MeetingControls: React.FC<MeetingControlsProps> = ({ className }) => {
  const { isMuted, toggleMute, isScreenSharing, startScreenShare, stopScreenShare, leaveAudioCall } = useAgora();

  return (
    <div className={`flex items-center justify-center gap-4 p-4 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isMuted ? "outline" : "default"}
            size="icon"
            onClick={toggleMute}
            className="h-12 w-12 rounded-full"
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isMuted ? "Unmute" : "Mute"}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isScreenSharing ? "destructive" : "default"}
            size="icon"
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className="h-12 w-12 rounded-full"
          >
            {isScreenSharing ? <MonitorX className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isScreenSharing ? "Stop sharing" : "Share screen"}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="destructive"
            size="icon"
            onClick={leaveAudioCall}
            className="h-12 w-12 rounded-full"
          >
            <Phone className="h-5 w-5 rotate-[135deg]" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Leave meeting</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default MeetingControls;

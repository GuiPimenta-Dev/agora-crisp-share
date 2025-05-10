
import React from "react";
import { Button } from "@/components/ui/button";
import { Video, VideoOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RecordingButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

const RecordingButton: React.FC<RecordingButtonProps> = ({
  isRecording,
  onClick
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isRecording ? "destructive" : "default"}
          size="icon"
          onClick={onClick}
          className="h-12 w-12 rounded-full"
        >
          {isRecording ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isRecording ? "Stop recording" : "Record screen"}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default RecordingButton;

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, MonitorX, Phone, Share2, Video, VideoOff } from "lucide-react";
import { useAgora } from "@/context/AgoraContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface MeetingControlsProps {
  className?: string;
}

const MeetingControls: React.FC<MeetingControlsProps> = ({ className }) => {
  const {
    isMuted,
    toggleMute,
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    leaveAudioCall,
    isScreenRecording,
    toggleScreenRecording,
    currentUser,
    agoraState
  } = useAgora();
  
  // Use refs to prevent rapid state changes
  const lastActionTimeRef = useRef<number>(0);
  const actionInProgressRef = useRef<boolean>(false);

  const canUseAudio = currentUser?.role === "coach" || currentUser?.role === "student";
  const canShareScreen = currentUser?.role === "coach" || currentUser?.role === "student";

  const handleToggleMute = async () => {
    // Prevent rapid clicks - enforced 3s cooldown
    const now = Date.now();
    if (now - lastActionTimeRef.current < 3000 || actionInProgressRef.current) {
      console.log("Action cooldown active or action in progress, ignoring click");
      return;
    }
    
    // Update refs to prevent further clicks
    lastActionTimeRef.current = now;
    actionInProgressRef.current = true;
    
    try {
      // Simply call toggleMute - the sync will happen via the effect in useAudioStatusSync
      toggleMute();
      
      // No need to manually update the database here, as the useAudioStatusSync
      // will handle this when it detects the change in the audio track's muted state
    } finally {
      // Allow new actions after a longer delay
      setTimeout(() => {
        actionInProgressRef.current = false;
      }, 3000);
    }
  };

  const handleToggleScreenShare = async () => {
    // Prevent rapid clicks - enforced 3s cooldown
    const now = Date.now();
    if (now - lastActionTimeRef.current < 3000 || actionInProgressRef.current) {
      return;
    }
    
    lastActionTimeRef.current = now;
    actionInProgressRef.current = true;
    
    try {
      if (isScreenSharing) {
        await stopScreenShare();
      } else {
        try {
          await startScreenShare();
        } catch (error) {
          console.error("Screen share failed:", error);
          toast({
            title: "Screen Sharing Failed",
            description: error instanceof Error ? error.message : "Could not start screen sharing",
            variant: "destructive"
          });
        }
      }
    } finally {
      // Allow new actions after a longer delay
      setTimeout(() => {
        actionInProgressRef.current = false;
      }, 3000);
    }
  };

  return (
    <div className={`flex items-center justify-center gap-4 p-4 ${className}`}>
      {canUseAudio ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isMuted ? "outline" : "default"}
              size="icon"
              onClick={handleToggleMute}
              className="h-12 w-12 rounded-full"
              disabled={actionInProgressRef.current}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isMuted ? "Unmute" : "Mute"}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
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
      )}

      {canShareScreen && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isScreenSharing ? "destructive" : "default"}
              size="icon"
              onClick={handleToggleScreenShare}
              className="h-12 w-12 rounded-full"
              disabled={actionInProgressRef.current}
            >
              {isScreenSharing ? <MonitorX className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isScreenSharing ? "Stop sharing" : "Share screen"}</p>
          </TooltipContent>
        </Tooltip>
      )}

      {currentUser?.role === "coach" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isScreenRecording ? "destructive" : "default"}
              size="icon"
              onClick={toggleScreenRecording}
              className="h-12 w-12 rounded-full"
            >
              {isScreenRecording ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isScreenRecording ? "Stop recording" : "Record screen"}</p>
          </TooltipContent>
        </Tooltip>
      )}

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

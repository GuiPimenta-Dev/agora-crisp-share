import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, MonitorX, Phone, Share2, Video, VideoOff } from "lucide-react";
import { useAgora } from "@/context/AgoraContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabaseClient"; // <== Adicione isso se ainda não tiver

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
    channelId // <== canal da reunião, necessário para o .eq no update
  } = useAgora();

  const canUseAudio = currentUser?.role === "coach" || currentUser?.role === "student";
  const canShareScreen = currentUser?.role === "coach" || currentUser?.role === "student";

  const updateState = async (field: "audio_muted" | "screen_sharing", value: boolean) => {
    if (!currentUser?.id || !channelId) return;
    const { error } = await supabase
      .from("meeting_participants")
      .update({ [field]: value })
      .eq("user_id", currentUser.id)
      .eq("meeting_id", channelId);

    if (error) {
      console.error(`Failed to update ${field}:`, error.message);
    }
  };

  const handleToggleMute = async () => {
    toggleMute();
    await updateState("audio_muted", !isMuted);
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      await updateState("screen_sharing", false);
    } else {
      startScreenShare();
      await updateState("screen_sharing", true);
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

import React, { useEffect } from "react";
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

  const canUseAudio = currentUser?.role === "coach" || currentUser?.role === "student";
  const canShareScreen = currentUser?.role === "coach" || currentUser?.role === "student";

  // Guaranteed atomic update of participant state in Supabase
  const updateState = async (field: "audio_muted" | "screen_sharing", value: boolean) => {
    const userId = currentUser?.id;
    const meetingId = agoraState?.channelName;

    console.log(`Updating participant state: ${field} = ${value}`);
    console.log("User ID:", userId, "Channel:", meetingId);

    if (!userId || !meetingId) {
      console.warn("Missing userId or meetingId for update");
      return false;
    }

    try {
      // If updating audio_muted, also update audio_enabled (opposite value)
      const updateData = field === "audio_muted" 
        ? { [field]: value, audio_enabled: !value }
        : { [field]: value };
      
      console.log("Update payload:", updateData);
      
      // Use a more detailed structure to capture response and error info
      const { error, data, status, statusText } = await supabase
        .from("meeting_participants")
        .update(updateData)
        .eq("user_id", userId)
        .eq("meeting_id", meetingId);

      if (error) {
        console.error(`Error updating ${field}:`, error.message, error.details);
        console.error("Status:", status, statusText);
        
        toast({
          title: "Sync Error",
          description: `Could not update ${field.replace('_', ' ')} status: ${error.message}`,
          variant: "destructive"
        });
        return false;
      } else {
        console.log(`Successfully updated ${field}:`, data);
        console.log("Update status:", status, statusText);
        return true;
      }
    } catch (err) {
      console.error(`Exception updating ${field}:`, err);
      return false;
    }
  };

  const handleToggleMute = async () => {
    console.log("Toggle mute clicked, current state:", isMuted);
    
    // First update the database with the new state
    const success = await updateState("audio_muted", !isMuted);
    
    // Only if the database update is successful, toggle the mute state locally
    if (success) {
      // Then toggle the mute state in the UI and Agora
      toggleMute();
    }
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      // First update database
      await updateState("screen_sharing", false);
      // Then stop screen share locally
      stopScreenShare();
    } else {
      try {
        // First start screen share
        await startScreenShare();
        // If successful, update database
        await updateState("screen_sharing", true);
      } catch (error) {
        console.error("Screen share failed:", error);
        toast({
          title: "Screen Sharing Failed",
          description: error instanceof Error ? error.message : "Could not start screen sharing",
          variant: "destructive"
        });
      }
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

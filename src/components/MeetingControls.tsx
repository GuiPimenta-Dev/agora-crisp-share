import React, { useState } from "react";
import { useAgora } from "@/context/AgoraContext";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Monitor, MonitorOff, Phone, PhoneOff, Video, VideoOff, ScreenShare, ScreenShareOff, CircleDot, Loader2 } from "lucide-react";
import { useScreenRecording } from "@/hooks/useScreenRecording";

interface MeetingControlsProps {
  className?: string;
}

const MeetingControls: React.FC<MeetingControlsProps> = ({ className }) => {
  const { 
    agoraState,
    leaveAudioCall,
    toggleMute,
    startScreenShare,
    stopScreenShare,
    isMuted,
    isScreenSharing
  } = useAgora();
  
  const [isLeaving, setIsLeaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { toggleScreenRecording, isScreenRecording } = useScreenRecording();

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveAudioCall();
    } finally {
      setIsLeaving(false);
    }
  };

  const handleMuteToggle = async () => {
    setIsToggling(true);
    try {
      await toggleMute();
    } finally {
      setIsToggling(false);
    }
  };

  const handleScreenShareToggle = async () => {
    setIsSharing(true);
    try {
      if (isScreenSharing) {
        await stopScreenShare();
      } else {
        await startScreenShare();
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleRecordingToggle = () => {
    toggleScreenRecording(agoraState.channelName);
  };

  return (
    <div className={`flex items-center justify-center gap-4 p-4 bg-black/60 rounded-lg ${className || ''}`}>
      <Button 
        variant="secondary"
        onClick={handleMuteToggle}
        disabled={isToggling}
      >
        {isMuted ? (
          <>
            <MicOff className="mr-2 h-4 w-4" />
            Unmute
          </>
        ) : (
          <>
            <Mic className="mr-2 h-4 w-4" />
            Mute
          </>
        )}
      </Button>

      <Button
        variant="secondary"
        onClick={handleScreenShareToggle}
        disabled={isSharing}
      >
        {isScreenSharing ? (
          <>
            <ScreenShareOff className="mr-2 h-4 w-4" />
            Stop Share
          </>
        ) : (
          <>
            <ScreenShare className="mr-2 h-4 w-4" />
            Share Screen
          </>
        )}
      </Button>
      
      <Button
        variant="secondary"
        onClick={handleRecordingToggle}
        disabled={isSharing}
      >
        {isScreenRecording ? (
          <>
            <CircleDot className="mr-2 h-4 w-4 animate-pulse" />
            Stop Recording
          </>
        ) : (
          <>
            <Monitor className="mr-2 h-4 w-4" />
            Record Screen
          </>
        )}
      </Button>

      <Button 
        variant="destructive"
        onClick={handleLeave}
        disabled={isLeaving}
      >
        {isLeaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Leaving...
          </>
        ) : (
          <>
            <PhoneOff className="mr-2 h-4 w-4" />
            Leave
          </>
        )}
      </Button>
    </div>
  );
};

export default MeetingControls;

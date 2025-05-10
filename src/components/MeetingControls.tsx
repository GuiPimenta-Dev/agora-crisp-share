
import React from "react";
import { useControlsActions } from "./meeting/useControlsActions";
import AudioControlButton from "./meeting/AudioControlButton";
import ScreenShareButton from "./meeting/ScreenShareButton";
import RecordingButton from "./meeting/RecordingButton";
import LeaveCallButton from "./meeting/LeaveCallButton";

interface MeetingControlsProps {
  className?: string;
}

const MeetingControls: React.FC<MeetingControlsProps> = ({ className }) => {
  const {
    isMuted,
    isScreenSharing,
    isScreenRecording,
    actionInProgress,
    canUseAudio,
    canShareScreen,
    handleToggleMute,
    handleToggleScreenShare,
    toggleScreenRecording,
    leaveAudioCall,
    currentUser
  } = useControlsActions();

  return (
    <div className={`flex items-center justify-center gap-4 p-4 ${className}`}>
      {/* Audio Button */}
      <AudioControlButton
        isMuted={isMuted}
        isDisabled={actionInProgress}
        onClick={handleToggleMute}
        canUseAudio={canUseAudio}
      />

      {/* Screen Share Button */}
      {canShareScreen && (
        <ScreenShareButton
          isScreenSharing={isScreenSharing}
          isDisabled={actionInProgress}
          onClick={handleToggleScreenShare}
        />
      )}

      {/* Recording Button */}
      {currentUser?.role === "coach" && (
        <RecordingButton
          isRecording={isScreenRecording}
          onClick={toggleScreenRecording}
        />
      )}

      {/* Leave Call Button */}
      <LeaveCallButton onClick={leaveAudioCall} />
    </div>
  );
};

export default MeetingControls;

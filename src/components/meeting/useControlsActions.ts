
import { useState, useRef } from 'react';
import { useAgora } from "@/context/AgoraContext";
import { toast } from "@/hooks/use-toast";

export function useControlsActions() {
  const {
    isMuted,
    toggleMute,
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    leaveAudioCall,
    isScreenRecording,
    toggleScreenRecording,
    currentUser
  } = useAgora();

  // Use refs to prevent rapid state changes
  const lastActionTimeRef = useRef<number>(0);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);

  const handleToggleMute = async () => {
    // Prevent rapid clicks - enforced 3s cooldown
    const now = Date.now();
    if (now - lastActionTimeRef.current < 3000 || actionInProgress) {
      console.log("Action cooldown active or action in progress, ignoring click");
      return;
    }
    
    // Update refs to prevent further clicks
    lastActionTimeRef.current = now;
    setActionInProgress(true);
    
    try {
      // Simply call toggleMute - the sync will happen via the effect in useAudioStatusSync
      toggleMute();
    } finally {
      // Allow new actions after a longer delay
      setTimeout(() => {
        setActionInProgress(false);
      }, 3000);
    }
  };

  const handleToggleScreenShare = async () => {
    // Prevent rapid clicks - enforced 3s cooldown
    const now = Date.now();
    if (now - lastActionTimeRef.current < 3000 || actionInProgress) {
      return;
    }
    
    lastActionTimeRef.current = now;
    setActionInProgress(true);
    
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
        setActionInProgress(false);
      }, 3000);
    }
  };

  const canUseAudio = currentUser?.role === "coach" || currentUser?.role === "student";
  const canShareScreen = currentUser?.role === "coach" || currentUser?.role === "student";

  return {
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
  };
}

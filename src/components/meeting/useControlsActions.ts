
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
    // Prevent rapid clicks - use a shorter cooldown (800ms) for better responsiveness
    const now = Date.now();
    if (now - lastActionTimeRef.current < 800 || actionInProgress) {
      console.log("Action cooldown active or action in progress, ignoring click");
      return;
    }
    
    // Update refs to prevent further clicks
    lastActionTimeRef.current = now;
    setActionInProgress(true);
    
    try {
      console.log("Toggle mute requested, current state:", isMuted);
      
      // Simply call toggleMute - the sync will happen via the effect in useAudioStatusSync
      toggleMute();
      
      // Show feedback toast with nicer language
      toast({
        title: isMuted ? "Unmuting microphone..." : "Muting microphone...",
        description: "Updating for all participants..."
      });
    } finally {
      // Allow new actions after a shorter delay
      setTimeout(() => {
        setActionInProgress(false);
      }, 1000); // Reduced from 3000ms to 1000ms
    }
  };

  const handleToggleScreenShare = async () => {
    // Prevent rapid clicks - enforced shorter cooldown
    const now = Date.now();
    if (now - lastActionTimeRef.current < 1500 || actionInProgress) {
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
      // Allow new actions after a shorter delay
      setTimeout(() => {
        setActionInProgress(false);
      }, 1500); // Reduced from 3000ms to 1500ms
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


import { useState, useRef, useEffect } from 'react';
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
  
  // Track the last mute toggle to avoid UI flickering
  const lastMuteToggleRef = useRef<number>(0);
  
  // Reset action in progress state automatically after timeout
  useEffect(() => {
    if (actionInProgress) {
      const timer = setTimeout(() => {
        setActionInProgress(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [actionInProgress]);

  const handleToggleMute = async () => {
    // Get current time for throttling
    const now = Date.now();
    
    // Prevent very rapid clicks - reduced to 500ms for better responsiveness
    if (now - lastMuteToggleRef.current < 500) {
      console.log("Mute toggle cooldown active, ignoring click");
      return;
    }
    
    // Update toggle timestamp
    lastMuteToggleRef.current = now;
    
    // Show action in progress briefly for visual feedback
    setActionInProgress(true);
    
    try {
      console.log("Toggle mute requested, current state:", isMuted);
      
      // Call toggleMute - the sync will happen via the effect in useAudioStatusSync
      toggleMute();
      
      // We don't need a toast here since useAudioStatusSync already shows one
    } catch (error) {
      console.error("Error toggling mute:", error);
      toast({
        title: "Error",
        description: "Could not change microphone state",
        variant: "destructive"
      });
    }
  };

  const handleToggleScreenShare = async () => {
    // Prevent rapid clicks - enforced shorter cooldown
    const now = Date.now();
    if (now - lastActionTimeRef.current < 1000 || actionInProgress) {
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
      }, 1000); 
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


import { useEffect } from 'react';
import { createClient } from '@/lib/agoraUtils';
import { toast } from '@/hooks/use-toast';
import { AgoraStateManager } from '@/types/agoraContext';

/**
 * Hook to initialize the Agora client and handle cleanup
 */
export const useAgoraInit = ({
  agoraState,
  setAgoraState,
  clientRef,
  setClientInitialized,
  leaveInProgress
}: Pick<AgoraStateManager, 'agoraState' | 'setAgoraState' | 'clientRef' | 'setClientInitialized' | 'leaveInProgress'>) => {
  // Initialize Agora client on component mount
  useEffect(() => {
    const initializeClient = async () => {
      try {
        console.log("Initializing Agora client...");
        const client = createClient();
        clientRef.current = client;
        
        setAgoraState((prev) => ({
          ...prev,
          client
        }));
        
        setClientInitialized(true);
        console.log("Agora client initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Agora client:", error);
        toast({
          title: "Error",
          description: "Failed to initialize audio service. Please refresh the page.",
          variant: "destructive"
        });
      }
    };
    
    // Initialize immediately, don't delay
    initializeClient();

    // Add listener for page exit to stop recording and download
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // If recording, stop and download
      if (agoraState.isRecording && !leaveInProgress.current) {
        // Prevent immediate exit to allow download
        event.preventDefault();
        event.returnValue = "";
        
        // Mark that we're leaving to avoid multiple downloads
        leaveInProgress.current = true;
        
        // This will be handled by the provider which has access to stopRecording
        return "You have an active recording. Are you sure you want to leave?";
      }
      return undefined;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
};

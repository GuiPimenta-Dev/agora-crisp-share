
import { useEffect, useState } from 'react';
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
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Initialize Agora client on component mount
  useEffect(() => {
    // Initialize client function with retry logic
    const initializeClient = async () => {
      try {
        console.log(`Initializing Agora client... (attempt ${retryCount + 1})`);
        const client = createClient();
        
        // Store client in ref for immediate access
        clientRef.current = client;
        
        // Store client in state
        setAgoraState((prev) => ({
          ...prev,
          client
        }));
        
        // Mark client as initialized
        setClientInitialized(true);
        setInitializationComplete(true);
        console.log("Agora client initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Agora client:", error);
        
        // Implement retry with backoff
        if (retryCount < MAX_RETRIES) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`Retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          
          setRetryCount(prev => prev + 1);
          setTimeout(initializeClient, delay);
        } else {
          toast({
            title: "Error",
            description: "Failed to initialize audio service. Please refresh the page.",
            variant: "destructive"
          });
        }
      }
    };
    
    // Start initialization process
    if (!clientRef.current && !initializationComplete && retryCount < MAX_RETRIES) {
      initializeClient();
    }

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
  }, [retryCount, agoraState.isRecording, clientRef, initializationComplete, leaveInProgress, setAgoraState, setClientInitialized]);

  return { initializationComplete };
};

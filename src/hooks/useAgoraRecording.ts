
import { useState, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { AgoraState, RecordingSettings } from "@/types/agora";
import { generateToken } from "@/lib/tokenGenerator";
import { MeetingUser } from "@/types/meeting";

export function useAgoraRecording(
  agoraState: AgoraState,
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>,
  currentUser: MeetingUser | null
) {
  const [recordingSettings, setRecordingSettings] = useState<RecordingSettings | null>(null);
  const reminderTimerRef = useRef<number | null>(null);

  // Cloud recording API endpoints
  const RECORDING_API_URL = "https://api.agora.io/v1/apps/52556fe6809a4624b3227a074c550aca/cloud_recording";

  // Set up recording reminder for coach
  useEffect(() => {
    // Clear any existing timer when component unmounts or user changes
    return () => {
      if (reminderTimerRef.current !== null) {
        clearInterval(reminderTimerRef.current);
      }
    };
  }, []);

  // Set up recording reminder for coach when channel is joined
  useEffect(() => {
    // Only set up reminder if user is a coach and channel is joined
    if (currentUser?.role === 'coach' && agoraState.joinState && agoraState.channelName) {
      // Start a reminder timer that checks every 3 minutes
      reminderTimerRef.current = window.setInterval(() => {
        // Only show reminder if not already recording
        if (!agoraState.isRecording) {
          toast({
            title: "Lembrete de gravação",
            description: "Você ainda não está gravando esta reunião. Clique no botão de gravação para começar.",
          });
        }
      }, 3 * 60 * 1000); // 3 minutes in milliseconds
    }
    
    return () => {
      if (reminderTimerRef.current !== null) {
        clearInterval(reminderTimerRef.current);
        reminderTimerRef.current = null;
      }
    };
  }, [currentUser?.role, agoraState.joinState, agoraState.channelName, agoraState.isRecording]);

  // Start cloud recording
  const startRecording = async () => {
    if (!agoraState.channelName || agoraState.isRecording) {
      return false;
    }

    try {
      // Generate recording settings
      const channelName = agoraState.channelName;
      const token = generateToken(channelName);
      const uid = "recorder-" + Date.now().toString().slice(-8); // Create a unique recorder UID
      
      // Store recording settings
      const settings: RecordingSettings = {
        channelName,
        uid,
        token
      };
      
      setRecordingSettings(settings);
      
      // In a real implementation, you would call Agora Cloud Recording API here
      // Since this requires backend integration, we'll simulate it for this demo
      
      // Simulate successful recording start
      setTimeout(() => {
        const mockResourceId = "mock-resource-" + Date.now();
        const mockRecordingId = "mock-recording-" + Date.now();
        
        setRecordingSettings(prev => prev ? {
          ...prev,
          resourceId: mockResourceId,
          recordingId: mockRecordingId
        } : null);
        
        setAgoraState(prev => ({
          ...prev,
          isRecording: true,
          recordingId: mockRecordingId
        }));
        
        toast({
          title: "Recording Started",
          description: "This call is now being recorded",
        });
      }, 1500);
      
      return true;
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Stop cloud recording
  const stopRecording = async () => {
    if (!agoraState.isRecording || !recordingSettings?.resourceId || !recordingSettings?.recordingId) {
      return false;
    }

    try {
      // In a real implementation, you would call Agora Cloud Recording API to stop recording
      // Since this requires backend integration, we'll simulate it
      
      // Simulate successful recording stop
      setTimeout(() => {
        setAgoraState(prev => ({
          ...prev,
          isRecording: false,
        }));
        
        toast({
          title: "Recording Stopped",
          description: "Recording has ended and is being processed. Download will be available shortly.",
        });
      }, 1500);
      
      return true;
    } catch (error) {
      console.error("Error stopping recording:", error);
      toast({
        title: "Error",
        description: "Failed to stop recording. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Download recording (simulated)
  const downloadRecording = async () => {
    if (!agoraState.recordingId) {
      toast({
        title: "No Recording Available",
        description: "There is no recording available for download.",
        variant: "destructive"
      });
      return;
    }

    try {
      // This is a simulation - in a real implementation, you would generate
      // a download URL from the Agora Cloud Recording service
      
      toast({
        title: "Preparing Download",
        description: "Your recording is being prepared for download...",
      });
      
      // Simulate download preparation
      setTimeout(() => {
        // Create a dummy blob to demonstrate downloading
        const dummyText = "This is a simulated recording file. In a real implementation, this would be the actual recording.";
        const blob = new Blob([dummyText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `recording-${agoraState.channelName}-${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download Started",
          description: "Your recording download has started.",
        });
      }, 2000);
    } catch (error) {
      console.error("Error downloading recording:", error);
      toast({
        title: "Download Error",
        description: "Failed to download recording. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    startRecording,
    stopRecording,
    downloadRecording
  };
}

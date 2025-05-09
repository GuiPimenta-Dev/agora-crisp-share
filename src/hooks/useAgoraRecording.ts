
import { useState, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { AgoraState, RecordingSettings } from "@/types/agora";
import { generateToken } from "@/lib/tokenGenerator";

// Som de notificação quando a gravação inicia
const RECORDING_START_SOUND = "https://assets.mixkit.co/active_storage/sfx/214/214-preview.mp3";

export function useAgoraRecording(
  agoraState: AgoraState,
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>
) {
  const [recordingSettings, setRecordingSettings] = useState<RecordingSettings | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoRecordingAttempted = useRef<boolean>(false);

  // Criar elemento de áudio para tocar som de início de gravação
  useEffect(() => {
    audioRef.current = new Audio(RECORDING_START_SOUND);
    audioRef.current.preload = "auto";
    
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  // Monitorar participantes para iniciar gravação quando coach e student estiverem presentes
  useEffect(() => {
    // Verifica se já tentou iniciar a gravação automática
    if (autoRecordingAttempted.current) return;
    
    if (agoraState.participants) {
      const participants = Object.values(agoraState.participants);
      const hasCoach = participants.some(p => p.role === "coach");
      const hasStudent = participants.some(p => p.role === "student");
      
      // Iniciar gravação apenas se tiver coach e aluno, e não estiver já gravando
      if (hasCoach && hasStudent && !agoraState.isRecording) {
        console.log("Coach e aluno presentes, iniciando gravação automática");
        autoRecordingAttempted.current = true;
        startRecording();
      }
    }
  }, [agoraState.participants, agoraState.isRecording]);

  // Cloud recording API endpoints
  const RECORDING_API_URL = "https://api.agora.io/v1/apps/52556fe6809a4624b3227a074c550aca/cloud_recording";

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
        
        // Tocar som de início de gravação
        if (audioRef.current) {
          audioRef.current.play().catch(err => console.error("Erro ao tocar som de gravação:", err));
        }
        
        toast({
          title: "Gravação Iniciada",
          description: "Esta chamada está sendo gravada agora",
          variant: "default",
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
        
        // Iniciar download automático após parar a gravação
        setTimeout(() => {
          downloadRecording();
        }, 2000);
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

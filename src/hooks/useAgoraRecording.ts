
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
  const recordingStartTime = useRef<number | null>(null);

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
        startRecording().catch(err => {
          console.error("Erro ao iniciar gravação automática:", err);
          // Reset para tentar novamente
          setTimeout(() => {
            autoRecordingAttempted.current = false;
          }, 10000);
        });
      }
    }
  }, [agoraState.participants, agoraState.isRecording]);

  // Simulated recording functions (browser-based)
  const startRecording = async () => {
    if (!agoraState.channelName || agoraState.isRecording) {
      return false;
    }

    try {
      console.log("Iniciando gravação para o canal:", agoraState.channelName);
      
      // Gerar identificador único para esta gravação
      const recordingId = `rec-${Date.now()}`;
      recordingStartTime.current = Date.now();
      
      // Atualizar o estado da aplicação
      setAgoraState(prev => ({
        ...prev,
        isRecording: true,
        recordingId: recordingId
      }));
      
      // Tocar som de início de gravação
      if (audioRef.current) {
        try {
          await audioRef.current.play();
        } catch (err) {
          console.warn("Não foi possível tocar som de gravação:", err);
        }
      }
      
      toast({
        title: "Gravação Iniciada",
        description: "Esta chamada está sendo gravada agora",
        variant: "default",
      });
      
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

  // Simulação do fim de gravação
  const stopRecording = async () => {
    if (!agoraState.isRecording || !agoraState.recordingId) {
      return false;
    }

    try {
      console.log("Parando gravação para o canal:", agoraState.channelName);
      
      // Calcular a duração da gravação
      const durationMs = recordingStartTime.current 
        ? Date.now() - recordingStartTime.current
        : 0;
      const durationMinutes = Math.round(durationMs / 60000);
      
      setAgoraState(prev => ({
        ...prev,
        isRecording: false,
      }));
      
      toast({
        title: "Gravação Finalizada",
        description: `A gravação terminou após ${durationMinutes} minutos. O download começará em breve.`,
      });
      
      // Iniciar download automático após parar a gravação
      setTimeout(() => {
        downloadRecording();
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
        // Criar um JSON com metadados da gravação para simular um arquivo real
        const recordingMetadata = {
          recordingId: agoraState.recordingId,
          channelName: agoraState.channelName,
          startTime: recordingStartTime.current,
          endTime: Date.now(),
          participants: agoraState.participants ? Object.values(agoraState.participants).map(p => ({
            id: p.id,
            name: p.name,
            role: p.role
          })) : []
        };
        
        // Criar um arquivo de texto simulado com os metadados da sessão
        const jsonContent = JSON.stringify(recordingMetadata, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        // Criar elemento para download e disparar o clique
        const a = document.createElement("a");
        const date = new Date().toISOString().slice(0,19).replace(/:/g, '-');
        a.href = url;
        a.download = `recording-${agoraState.channelName}-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download Iniciado",
          description: "O arquivo da sua gravação está sendo baixado.",
        });
      }, 1000);
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

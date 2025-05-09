
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export function useScreenRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    recordedChunksRef.current = [];
    
    try {
      // Get the current tab's ID - this ensures we're recording the current meeting tab
      const currentTab = { audio: true, video: true, preferCurrentTab: true };
      
      // Request screen capture with audio from current tab
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          suppressLocalAudioPlayback: false,
        },
        preferCurrentTab: true,
      });
      
      // Add audio track from system audio if available
      const audioContext = new AudioContext();
      const audioDestination = audioContext.createMediaStreamDestination();
      
      // Add system audio to the stream if possible
      const userAudio = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioSource = audioContext.createMediaStreamSource(userAudio);
      audioSource.connect(audioDestination);
      
      // Create a combined stream with system audio and screen capture
      const combinedTracks = [
        ...stream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks(),
      ];
      
      const combinedStream = new MediaStream(combinedTracks);
      
      // Create MediaRecorder instance with high quality
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 3000000, // 3 Mbps for good quality
      });
      
      // Event handler for data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      // Event handler for recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm"
        });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        a.href = url;
        a.download = `screen-recording-${timestamp}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Release resources
        URL.revokeObjectURL(url);
        stopTracks(stream);
        stopTracks(userAudio);
        audioContext.close();
        
        setIsRecording(false);
        toast({
          title: "Recording saved",
          description: "Your screen recording with audio has been downloaded",
        });
      };
      
      // Start recording
      mediaRecorder.start(200); // Collect data every 200ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Your screen and audio are now being recorded",
      });
      
      // Setup safety handler for when user cancels via browser UI
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current && isRecording) {
          stopRecording();
        }
      };
      
    } catch (error) {
      console.error("Error starting screen recording:", error);
      toast({
        title: "Recording error",
        description: "Could not start recording. Please check permissions.",
        variant: "destructive"
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      toast({
        title: "Recording stopped",
        description: "Preparing download...",
      });
    }
  };
  
  // Helper function to clean up media tracks
  const stopTracks = (stream: MediaStream) => {
    stream.getTracks().forEach(track => track.stop());
  };
  
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  return {
    isRecording,
    toggleRecording,
    startRecording,
    stopRecording
  };
}

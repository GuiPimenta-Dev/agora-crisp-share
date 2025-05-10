
import { useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useScreenRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<Date | null>(null);
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);

  const startRecording = async (meetingId?: string) => {
    recordedChunksRef.current = [];
    // Armazenar o ID da reunião para uso posterior ao salvar a gravação
    if (meetingId) {
      setCurrentMeetingId(meetingId);
    }
    
    try {
      // Get the current tab's ID - this ensures we're recording the current meeting tab
      const currentTab = { audio: true, video: true, preferCurrentTab: true };
      
      // Request screen capture with audio from current tab
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser", // Prioritize browser tab for recording
          width: { ideal: 3840 }, // 4K resolution
          height: { ideal: 2160 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000, // Higher audio quality
        },
        preferCurrentTab: true,
      } as any); // Use type assertion to allow preferCurrentTab
      
      // Add audio track from system audio if available
      const audioContext = new AudioContext();
      const audioDestination = audioContext.createMediaStreamDestination();
      
      // Add system audio to the stream if possible
      try {
        const userAudio = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioSource = audioContext.createMediaStreamSource(userAudio);
        audioSource.connect(audioDestination);
        
        // Create a combined stream with system audio and screen capture
        const combinedTracks = [
          ...stream.getVideoTracks(),
          ...audioDestination.stream.getAudioTracks(),
        ];
        
        const combinedStream = new MediaStream(combinedTracks);
        
        // Create MediaRecorder instance with higher quality
        const mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType: 'video/webm;codecs=vp9,opus',
          videoBitsPerSecond: 8000000, // 8 Mbps for superior quality
          audioBitsPerSecond: 128000, // 128 kbps audio
        });
      
        // Event handler for data available
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
      
        // Set up event handler for stopping
        setupStopHandler(mediaRecorder, stream, userAudio, audioContext);
        
        // Start recording with data collection every 200ms
        mediaRecorder.start(200);
        mediaRecorderRef.current = mediaRecorder;
        recordingStartTimeRef.current = new Date();
        setIsRecording(true);
        
        toast({
          title: "Recording started",
          description: "Your screen and audio are now being recorded in high quality",
        });
        
        // Setup safety handler for when user cancels via browser UI
        stream.getVideoTracks()[0].onended = () => {
          if (mediaRecorderRef.current && isRecording) {
            stopRecording();
          }
        };
      } catch (audioError) {
        console.warn("Could not capture system audio, recording screen only:", audioError);
        
        // Create MediaRecorder instance with just screen
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 8000000, // 8 Mbps for superior quality
        });
        
        // Event handler for data available
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
        
        // Set up event handler for stopping
        setupStopHandler(mediaRecorder, stream, null, audioContext);
        
        // Start recording with data collection every 200ms
        mediaRecorder.start(200);
        mediaRecorderRef.current = mediaRecorder;
        recordingStartTimeRef.current = new Date();
        setIsRecording(true);
        
        toast({
          title: "Recording started (video only)",
          description: "Your screen is being recorded in high quality (without audio)",
        });
        
        // Setup safety handler for when user cancels via browser UI
        stream.getVideoTracks()[0].onended = () => {
          if (mediaRecorderRef.current && isRecording) {
            stopRecording();
          }
        };
      }
    } catch (error) {
      console.error("Error starting screen recording:", error);
      toast({
        title: "Recording error",
        description: "Could not start recording. Please check permissions.",
        variant: "destructive"
      });
    }
  };
  
  // Updated to use the bucket we've already created via SQL migration
  const ensureBucketExists = async () => {
    try {
      // Simply check if we can access the bucket
      const { data: objects, error } = await supabase.storage
        .from('meeting-recordings')
        .list('', { limit: 1 });
      
      if (error) {
        console.warn("Error checking bucket: ", error);
        // We'll still attempt to upload anyway, as the bucket may exist
        // but the user might not have list permissions
      }
    } catch (checkError) {
      console.warn("Error checking bucket existence:", checkError);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      toast({
        title: "Recording stopped",
        description: "Preparing download and cloud storage upload...",
      });
    }
  };
  
  // Helper function to clean up media tracks
  const stopTracks = (stream: MediaStream) => {
    stream.getTracks().forEach(track => track.stop());
  };
  
  // Função para atualizar o booking com a URL da gravação
  const updateBookingWithRecordingUrl = async (meetingId: string | null, recordingUrl: string) => {
    if (!meetingId) {
      console.warn("No meeting ID provided to update booking with recording URL");
      return false;
    }

    try {
      console.log(`Updating booking ${meetingId} with recording URL: ${recordingUrl}`);
      
      // Atualizar a coluna recording_url na tabela bookings
      const { error } = await supabase
        .from('bookings')
        .update({ recording_url: recordingUrl })
        .eq('id', meetingId);
      
      if (error) {
        console.error("Error updating booking with recording URL:", error);
        return false;
      }
      
      console.log("Successfully updated booking with recording URL");
      return true;
    } catch (error) {
      console.error("Error updating booking with recording URL:", error);
      return false;
    }
  };
  
  // Set up stop handler
  const setupStopHandler = (
    mediaRecorder: MediaRecorder, 
    stream: MediaStream, 
    userAudio: MediaStream | null, 
    audioContext: AudioContext
  ) => {
    // Event handler for recording stop
    mediaRecorder.onstop = async () => {
      setIsSaving(true);
      
      try {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm"
        });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `screen-recording-${timestamp}.webm`;
        
        // First, offer a direct download as a backup
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Then, upload to Supabase storage
        toast({
          title: "Uploading recording",
          description: "Saving to cloud storage, please wait...",
        });
        
        // Make sure the bucket exists (our SQL migration already created it)
        await ensureBucketExists();
        
        // Upload the recording
        const { data, error } = await supabase.storage
          .from('meeting-recordings')
          .upload(filename, blob, {
            contentType: 'video/webm',
            cacheControl: '3600',
            upsert: true
          });
        
        if (error) {
          console.error("Upload error:", error);
          throw error;
        }
        
        // Get public URL for the stored file
        const { data: { publicUrl } } = supabase.storage
          .from('meeting-recordings')
          .getPublicUrl(data.path);
        
        // Atualizar o booking com a URL da gravação
        await updateBookingWithRecordingUrl(currentMeetingId, publicUrl);
        
        toast({
          title: "Recording saved",
          description: "Your screen recording has been saved to cloud storage",
        });
        
        // Release resources
        URL.revokeObjectURL(url);
        stopTracks(stream);
        if (userAudio) stopTracks(userAudio);
        audioContext.close();
      } catch (error) {
        console.error("Error processing recording:", error);
        toast({
          title: "Error saving recording",
          description: "There was a problem saving your recording to cloud storage",
          variant: "destructive"
        });
      } finally {
        setIsRecording(false);
        setIsSaving(false);
        setCurrentMeetingId(null); // Limpar o ID da reunião atual
      }
    };
  };
  
  const toggleRecording = (meetingId?: string) => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording(meetingId);
    }
  };
  
  return {
    isRecording,
    isSaving,
    toggleRecording,
    startRecording,
    stopRecording
  };
}

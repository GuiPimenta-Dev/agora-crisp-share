
import { useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useScreenRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<Date | null>(null);

  const startRecording = async () => {
    recordedChunksRef.current = [];
    
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
        // If we can't get audio, just use the screen capture
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
        
        // Make sure the bucket exists first
        await ensureBucketExists();
        
        // Upload the recording
        const { data, error } = await supabase.storage
          .from('meeting-recordings')
          .upload(filename, blob, {
            contentType: 'video/webm',
            cacheControl: '3600'
          });
        
        if (error) {
          throw error;
        }
        
        // Get public URL for the stored file
        const { data: { publicUrl } } = supabase.storage
          .from('meeting-recordings')
          .getPublicUrl(data.path);
        
        toast({
          title: "Recording saved",
          description: "Your screen recording has been saved to cloud storage",
        });
        
        // Store the recording URL in the booking table if needed
        // This part would need to be implemented if the meeting is associated with a booking
        
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
      }
    };
  };
  
  // Ensure the storage bucket exists
  const ensureBucketExists = async () => {
    try {
      // Check if bucket exists using storage API instead of RPC
      const { data: bucketList, error } = await supabase.storage.listBuckets();
      
      // If we can't check buckets due to permissions, just try the upload directly
      if (error) {
        console.warn("Could not check if bucket exists, will try upload directly:", error);
        return;
      }
      
      // Check if the bucket exists in the list
      const bucketExists = bucketList && Array.isArray(bucketList) && 
        bucketList.some(bucket => bucket.name === 'meeting-recordings');
      
      if (!bucketExists) {
        // Try to create the bucket if it doesn't exist
        try {
          await supabase.storage.createBucket('meeting-recordings', {
            public: false,
            fileSizeLimit: 100000000 // 100MB limit
          });
          console.log("Created 'meeting-recordings' bucket");
        } catch (createError) {
          console.warn("Error creating bucket:", createError);
        }
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
  
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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

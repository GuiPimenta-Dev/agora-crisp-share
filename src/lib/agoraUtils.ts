
import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack, 
  IRemoteAudioTrack,
  ILocalAudioTrack,
  ILocalTrack,
  UID,
  IScreenVideoTrack
} from "agora-rtc-sdk-ng";

// Define types for our Agora client state
export interface AgoraState {
  client?: IAgoraRTCClient;
  localAudioTrack?: IMicrophoneAudioTrack;
  screenVideoTrack?: IScreenVideoTrack;
  screenShareUserId?: UID;
  remoteUsers: IAgoraRTCRemoteUser[];
  joinState: boolean;
}

// Define channel and app ID
const APP_ID = ""; // You'll need to provide your Agora App ID
const DEFAULT_CHANNEL = "main";

// Create Agora client with optimal settings for audio and screen sharing
export const createClient = (): IAgoraRTCClient => {
  return AgoraRTC.createClient({ 
    mode: "rtc", 
    codec: "vp8",
    role: "host"
  });
};

// Create microphone audio track with echo cancellation and noise suppression
export const createMicrophoneAudioTrack = async (): Promise<IMicrophoneAudioTrack> => {
  return await AgoraRTC.createMicrophoneAudioTrack({
    AEC: true, // Echo cancellation
    ANS: true, // Auto noise suppression
    AGC: true  // Auto gain control
  });
};

// Create screen video track with maximum quality
export const createScreenVideoTrack = async (): Promise<IScreenVideoTrack> => {
  return await AgoraRTC.createScreenVideoTrack(
    {
      encoderConfig: {
        width: { max: 1920, min: 1280 },
        height: { max: 1080, min: 720 },
        frameRate: 30,
        bitrateMax: 3000 // Higher bitrate for better quality
      },
      optimizationMode: "detail", // Prioritize visual quality
      screenAudioTrack: false,
    },
    "auto"
  );
};

// Join channel and set up event listeners
export const joinChannel = async (
  client: IAgoraRTCClient,
  channel: string,
  token: string | null,
  uid: string | null,
  localAudioTrack: IMicrophoneAudioTrack
) => {
  if (!client) return false;
  
  try {
    await client.join(
      APP_ID,
      channel || DEFAULT_CHANNEL,
      token || null,
      uid || null
    );
    
    // Publish local audio track
    await client.publish(localAudioTrack);
    
    console.log("Successfully joined channel and published audio track");
    return true;
  } catch (error) {
    console.error("Error joining channel:", error);
    return false;
  }
};

// Leave channel and clean up tracks
export const leaveChannel = async (
  client: IAgoraRTCClient,
  localTracks: ILocalTrack[]
) => {
  // Unpublish and close local tracks
  for (const track of localTracks) {
    if (track) {
      track.stop();
      track.close();
    }
  }
  
  // Leave the channel
  if (client) {
    await client.leave();
  }
};

// Start screen sharing
export const startScreenSharing = async (
  client: IAgoraRTCClient,
  screenVideoTrack: IScreenVideoTrack
) => {
  if (!client || !screenVideoTrack) return;
  
  try {
    await client.publish(screenVideoTrack);
    console.log("Screen sharing started");
  } catch (error) {
    console.error("Error starting screen sharing:", error);
  }
};

// Stop screen sharing
export const stopScreenSharing = async (
  client: IAgoraRTCClient,
  screenVideoTrack: IScreenVideoTrack
) => {
  if (!client || !screenVideoTrack) return;
  
  try {
    await client.unpublish(screenVideoTrack);
    screenVideoTrack.stop();
    screenVideoTrack.close();
    console.log("Screen sharing stopped");
  } catch (error) {
    console.error("Error stopping screen sharing:", error);
  }
};


import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  IMicrophoneAudioTrack, 
  IRemoteAudioTrack,
  ILocalAudioTrack,
  ILocalTrack,
  ILocalVideoTrack,
  UID,
} from "agora-rtc-sdk-ng";

// Define types for our Agora client state
export interface AgoraState {
  client?: IAgoraRTCClient;
  localAudioTrack?: IMicrophoneAudioTrack;
  screenVideoTrack?: ILocalVideoTrack;
  screenShareUserId?: UID;
  remoteUsers: IAgoraRTCRemoteUser[];
  joinState: boolean;
}

// Define channel and app ID
const APP_ID = "52556fe6809a4624b3227a074c550aca"; // Agora App ID
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

// Create screen video track with ultra high quality settings (4K)
export const createScreenVideoTrack = async (): Promise<ILocalVideoTrack> => {
  const tryCreateTrack = async (width: number, height: number, label: string): Promise<ILocalVideoTrack | null> => {
    try {
      const track = await AgoraRTC.createScreenVideoTrack(
        {
          encoderConfig: {
            width,
            height,
            frameRate: 30,
            bitrateMax: 8000 // Increased to 8 Mbps for superior quality
          },
          optimizationMode: "detail", // prioritize details and quality
          screenSourceType: "screen"
        },
        "disable" // no audio from tab
      );
      console.log(`✅ Screen sharing started in ${label} @30FPS with 8Mbps bitrate`);
      return track;
    } catch (error) {
      console.warn(`⚠️ Failed to start ${label} @30FPS:`, error);
      return null;
    }
  };

  // 1. Try in 4K (3840x2160) with enhanced bitrate
  let track = await tryCreateTrack(3840, 2160, "4K Ultra HD");

  // 2. Fallback to 2K (2560x1440)
  if (!track) {
    track = await tryCreateTrack(2560, 1440, "2K Quad HD");
  }

  // 3. Fallback to 1080p
  if (!track) {
    track = await tryCreateTrack(1920, 1080, "1080p Full HD");
  }

  // 4. If still failing, final fallback to 720p
  if (!track) {
    track = await tryCreateTrack(1280, 720, "720p HD");
  }

  // 5. If all attempts fail, throw error
  if (!track) {
    throw new Error("❌ Could not start screen sharing. Please check browser permissions or supported resolution.");
  }

  return track;
};

// Join channel and set up event listeners
export const joinChannel = async (
  client: IAgoraRTCClient,
  channel: string,
  uid: string | null,
  localAudioTrack: IMicrophoneAudioTrack
) => {
  if (!client) return false;
  
  try {
    if (!APP_ID) {
      console.error("Error: Agora App ID is not configured");
      return false;
    }
    
    await client.join(
      APP_ID,
      channel || DEFAULT_CHANNEL,
      null,
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
  screenVideoTrack: ILocalVideoTrack
) => {
  if (!client || !screenVideoTrack) return;
  
  try {
    await client.publish(screenVideoTrack);
    console.log("Screen sharing started");
    return true;
  } catch (error) {
    console.error("Error starting screen sharing:", error);
    throw new Error("Failed to publish screen share. Please check your connection.");
  }
};

// Stop screen sharing
export const stopScreenSharing = async (
  client: IAgoraRTCClient,
  screenVideoTrack: ILocalVideoTrack
) => {
  if (!client || !screenVideoTrack) return;
  
  try {
    // Make sure to unpublish the track before stopping and closing
    await client.unpublish(screenVideoTrack);
    
    // Stop and close the track to release resources and permissions
    screenVideoTrack.stop();
    screenVideoTrack.close();
    
    console.log("Screen sharing stopped successfully");
  } catch (error) {
    console.error("Error stopping screen sharing:", error);
  }
};

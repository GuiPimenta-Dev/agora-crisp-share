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
            bitrateMax: 5000 // 5 Mbps para alta qualidade
          },
          optimizationMode: "detail", // priorizar detalhes e qualidade
          screenSourceType: "screen"
        },
        "disable" // sem áudio da aba
      );
      console.log(`✅ Compartilhamento iniciado em ${label} @30FPS`);
      return track;
    } catch (error) {
      console.warn(`⚠️ Falha ao iniciar ${label} @30FPS:`, error);
      return null;
    }
  };

  // 1. Tenta em 4K (3840x2160)
  let track = await tryCreateTrack(3840, 2160, "4K");

  // 2. Fallback para 2K (2560x1440)
  if (!track) {
    track = await tryCreateTrack(2560, 1440, "2K");
  }

  // 3. Fallback para 1080p
  if (!track) {
    track = await tryCreateTrack(1920, 1080, "1080p");
  }

  // 4. Se ainda falhar, erro final
  if (!track) {
    throw new Error("❌ Não foi possível iniciar o compartilhamento de tela. Verifique as permissões do navegador ou a resolução suportada.");
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
    await client.unpublish(screenVideoTrack);
    screenVideoTrack.stop();
    screenVideoTrack.close();
    console.log("Screen sharing stopped");
  } catch (error) {
    console.error("Error stopping screen sharing:", error);
  }
};

import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  IMicrophoneAudioTrack, 
  IRemoteAudioTrack,
  ILocalAudioTrack,
  ILocalTrack,
  ILocalVideoTrack,
  UID,
  ScreenVideoTrackInitConfig
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
export const createScreenVideoTrack = async (config?: Partial<ScreenVideoTrackInitConfig>): Promise<ILocalVideoTrack> => {
  // Configuração padrão para compartilhamento de tela
  const defaultConfig: ScreenVideoTrackInitConfig = {
    encoderConfig: {
      width: 3840,  // 4K
      height: 2160,
      frameRate: 30,
      bitrateMax: 5000 // 5 Mbps para alta qualidade
    },
    optimizationMode: "detail", // priorizar detalhes e qualidade
    screenSourceType: "screen", // tela inteira por padrão
  };

  // Merge das configurações padrão com as opções passadas
  const mergedConfig = {
    ...defaultConfig,
    ...config
  };

  try {
    console.log("📺 Iniciando compartilhamento de tela com configurações:", mergedConfig);
    const track = await AgoraRTC.createScreenVideoTrack(
      mergedConfig,
      "disable" // sem áudio da tela
    );
    console.log("✅ Compartilhamento iniciado em 4K @30FPS");
    return track;
  } catch (error) {
    console.error("❌ Erro ao iniciar compartilhamento em 4K, tentando em 1080p:", error);
    
    // Fallback para 1080p
    try {
      const track = await AgoraRTC.createScreenVideoTrack(
        {
          ...mergedConfig,
          encoderConfig: {
            width: 1920,
            height: 1080,
            frameRate: 30,
            bitrateMax: 2500
          }
        },
        "disable"
      );
      console.log("✅ Compartilhamento iniciado em 1080p @30FPS");
      return track;
    } catch (secondError) {
      console.error("❌ Falha no compartilhamento de tela:", secondError);
      throw new Error("Não foi possível iniciar o compartilhamento de tela. Verifique as permissões do navegador.");
    }
  }
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

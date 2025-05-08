import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  IMicrophoneAudioTrack, 
  ILocalVideoTrack,
  UID,
} from "agora-rtc-sdk-ng";
import { 
  AgoraState, 
  createClient, 
  createMicrophoneAudioTrack, 
  createScreenVideoTrack, 
  joinChannel, 
  leaveChannel, 
  startScreenSharing, 
  stopScreenSharing 
} from "@/lib/agoraUtils";
import { useToast } from "@/components/ui/use-toast";

interface AgoraContextType {
  agoraState: AgoraState;
  joinAudioCall: (channelName: string) => Promise<boolean>;
  leaveAudioCall: () => Promise<void>;
  toggleMute: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  isScreenSharing: boolean;
  isMuted: boolean;
  remoteScreenShareUser: IAgoraRTCRemoteUser | undefined;
}

const AgoraContext = createContext<AgoraContextType | undefined>(undefined);

export const useAgora = () => {
  const context = useContext(AgoraContext);
  if (!context) {
    throw new Error("useAgora must be used within an AgoraProvider");
  }
  return context;
};

export const AgoraProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  
  const [agoraState, setAgoraState] = useState<AgoraState>({
    client: undefined,
    localAudioTrack: undefined,
    screenVideoTrack: undefined,
    screenShareUserId: undefined,
    remoteUsers: [],
    joinState: false
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const clientRef = useRef<IAgoraRTCClient | undefined>();

  // Initialize Agora client
  useEffect(() => {
    const client = createClient();
    clientRef.current = client;
    
    setAgoraState((prev) => ({
      ...prev,
      client
    }));

    // Set up event handlers
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      
      // Handle different media types
      if (mediaType === "audio") {
        const remoteAudioTrack = user.audioTrack;
        if (remoteAudioTrack) {
          remoteAudioTrack.play();
          toast({
            title: "User joined with audio",
            description: `User ${user.uid} has joined the call`,
          });
        }
      }
      
      if (mediaType === "video") {
        // User is sharing screen
        setAgoraState(prev => ({
          ...prev,
          screenShareUserId: user.uid
        }));
        toast({
          title: "Screen share started",
          description: `User ${user.uid} started sharing their screen`,
        });
      }
      
      // Add user to remote users list if not already there
      setAgoraState(prev => ({
        ...prev,
        remoteUsers: [...prev.remoteUsers.filter(u => u.uid !== user.uid), user]
      }));
    });

    client.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "audio") {
        if (user.audioTrack) {
          user.audioTrack.stop();
        }
      }
      
      if (mediaType === "video") {
        // User stopped sharing screen
        setAgoraState(prev => ({
          ...prev,
          screenShareUserId: prev.screenShareUserId === user.uid ? undefined : prev.screenShareUserId
        }));
        toast({
          title: "Screen share stopped",
          description: `User ${user.uid} stopped sharing their screen`,
        });
      }
    });

    client.on("user-left", (user) => {
      setAgoraState(prev => ({
        ...prev,
        remoteUsers: prev.remoteUsers.filter(u => u.uid !== user.uid),
        screenShareUserId: prev.screenShareUserId === user.uid ? undefined : prev.screenShareUserId
      }));
      toast({
        title: "User left",
        description: `User ${user.uid} has left the call`,
      });
    });

    // Clean up
    return () => {
      client.removeAllListeners();
    };
  }, [toast]);

  const joinAudioCall = async (channelName: string): Promise<boolean> => {
    if (!agoraState.client) {
      toast({
        title: "Error",
        description: "Agora client not initialized",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      const localAudioTrack = await createMicrophoneAudioTrack();
      
      const joined = await joinChannel(
        agoraState.client,
        channelName,
        null,
        localAudioTrack
      );

      if (joined) {
        setAgoraState(prev => ({
          ...prev,
          localAudioTrack,
          joinState: true
        }));
        
        toast({
          title: "Success",
          description: `You've joined channel ${channelName}`,
        });
      }
      
      return joined;
    } catch (error) {
      console.error("Error joining audio call:", error);
      toast({
        title: "Failed to join",
        description: "Could not join the audio call. Please check permissions.",
        variant: "destructive",
      });
      return false;
    }
  };

  const leaveAudioCall = async (): Promise<void> => {
    if (!agoraState.client) return;
    
    const tracksToClose = [
      agoraState.localAudioTrack,
      agoraState.screenVideoTrack
    ].filter(Boolean) as any[];
    
    await leaveChannel(agoraState.client, tracksToClose);
    
    setAgoraState({
      client: agoraState.client,
      localAudioTrack: undefined,
      screenVideoTrack: undefined,
      screenShareUserId: undefined,
      remoteUsers: [],
      joinState: false
    });
    
    setIsScreenSharing(false);
    setIsMuted(false);
    
    toast({
      title: "Left call",
      description: "You've left the audio call",
    });
  };

  const toggleMute = () => {
    if (!agoraState.localAudioTrack) return;
    
    if (isMuted) {
      agoraState.localAudioTrack.setEnabled(true);
      setIsMuted(false);
      toast({
        title: "Microphone unmuted",
        description: "Others can now hear you",
      });
    } else {
      agoraState.localAudioTrack.setEnabled(false);
      setIsMuted(true);
      toast({
        title: "Microphone muted",
        description: "Others cannot hear you",
      });
    }
  };

  const startScreenShare = async (): Promise<void> => {
    if (!agoraState.client || !agoraState.joinState) {
      toast({
        title: "Error",
        description: "Please join the call first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const screenTrack = await createScreenVideoTrack();
      
      await startScreenSharing(agoraState.client, screenTrack);
      
      setAgoraState(prev => ({
        ...prev,
        screenVideoTrack: screenTrack,
      }));
      
      setIsScreenSharing(true);
      
      // Handle screen share ended by user through browser UI
      screenTrack.on("track-ended", async () => {
        await stopScreenShare();
      });
      
      toast({
        title: "Screen sharing started",
        description: "You are now sharing your screen",
      });
    } catch (error) {
      console.error("Error starting screen share:", error);
      toast({
        title: "Failed to share screen",
        description: error instanceof Error ? error.message : "Could not start screen sharing. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopScreenShare = async (): Promise<void> => {
    if (!agoraState.client || !agoraState.screenVideoTrack) return;
    
    await stopScreenSharing(agoraState.client, agoraState.screenVideoTrack);
    
    setAgoraState(prev => ({
      ...prev,
      screenVideoTrack: undefined,
    }));
    
    setIsScreenSharing(false);
    
    toast({
      title: "Screen sharing stopped",
      description: "You are no longer sharing your screen",
    });
  };
  
  // Find remote user who is sharing screen (if any)
  const remoteScreenShareUser = agoraState.remoteUsers.find(
    user => user.uid === agoraState.screenShareUserId
  );

  const value = {
    agoraState,
    joinAudioCall,
    leaveAudioCall,
    toggleMute,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    isMuted,
    remoteScreenShareUser,
  };

  return <AgoraContext.Provider value={value}>{children}</AgoraContext.Provider>;
};

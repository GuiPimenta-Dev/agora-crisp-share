
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { AgoraState } from "@/types/agora";
import { IAgoraRTCClient, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { MeetingUser } from "@/types/meeting";

export function useAgoraEventHandlers(
  agoraState: AgoraState,
  setAgoraState: React.Dispatch<React.SetStateAction<AgoraState>>,
  stopScreenShare: () => Promise<void>,
  isScreenSharing: boolean,
  startRecording: () => Promise<boolean>,
  stopRecording: () => Promise<boolean>,
  currentUser: MeetingUser | null,
  participants: Record<string, MeetingUser>,
  setParticipants: React.Dispatch<React.SetStateAction<Record<string, MeetingUser>>>
) {
  const client = agoraState.client;

  // Effect for participant list synchronization when joining
  useEffect(() => {
    if (!client || !currentUser || !agoraState.joinState) return;

    // When we join successfully, broadcast our presence to other participants
    const broadcastPresence = async () => {
      try {
        // Small delay to ensure connection is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Instead of using stream messages, we'll use the "user-joined" event
        // and update our local state based on that event.
        // We don't need to explicitly broadcast since Agora handles the presence.
        
        // Add ourselves to the participants list
        setParticipants(prev => {
          // Only add if not already in the list
          if (currentUser && !prev[currentUser.id]) {
            console.log(`Adding current user ${currentUser.name} to participants`);
            return {
              ...prev,
              [currentUser.id]: { ...currentUser, isCurrent: true }
            };
          }
          return prev;
        });
        
        console.log("Current user added to participants list");
      } catch (error) {
        console.error("Failed to initialize participant sync:", error);
      }
    };

    broadcastPresence();
  }, [client, currentUser, agoraState.joinState, setParticipants]);

  useEffect(() => {
    if (!client) return;

    // Set up event handlers
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      
      // Handle different media types
      if (mediaType === "audio") {
        const remoteAudioTrack = user.audioTrack;
        if (remoteAudioTrack) {
          remoteAudioTrack.play();
          
          // Notify about new user with audio
          const userId = user.uid.toString();
          const participantName = participants[userId]?.name || `Usuário ${userId}`;
          
          toast({
            title: "Usuário conectou o áudio",
            description: `${participantName} entrou na chamada`,
          });
          
          // Update the participants list with this user if not already there
          // Note: This assumes the userId in our participants list matches uid from Agora
          if (!participants[userId] && currentUser) {
            console.log(`Adding new remote user ${userId} to participants via audio publish`);
            
            // Create a generic user entry
            setParticipants(prev => ({
              ...prev,
              [userId]: {
                id: userId,
                name: `Usuário ${userId}`,
                avatar: `https://ui-avatars.com/api/?name=User&background=random`,
                role: "listener", // Default role
                audioEnabled: true,
                isCurrent: false
              }
            }));
          }
        }
      }
      
      if (mediaType === "video") {
        // User is sharing screen - verificamos se já há alguém compartilhando
        setAgoraState(prev => ({
          ...prev,
          screenShareUserId: user.uid
        }));
        
        const userId = user.uid.toString();
        const participantName = participants[userId]?.name || `Usuário ${userId}`;
        
        toast({
          title: "Compartilhamento iniciado",
          description: `${participantName} começou a compartilhar a tela`,
        });
        
        // Se eu estava compartilhando, paro meu compartilhamento
        if (isScreenSharing) {
          await stopScreenShare();
          toast({
            title: "Seu compartilhamento foi interrompido",
            description: "Outro usuário começou a compartilhar a tela",
            variant: "destructive"
          });
        }
      }
      
      // Add user to remote users list if not already there
      setAgoraState(prev => {
        const newState = {
          ...prev,
          remoteUsers: [...prev.remoteUsers.filter(u => u.uid !== user.uid), user]
        };
        return newState;
      });
    });

    client.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "audio") {
        if (user.audioTrack) {
          user.audioTrack.stop();
        }
      }
      
      if (mediaType === "video") {
        // User stopped sharing screen
        if (user.videoTrack) {
          user.videoTrack.stop();
        }
        
        const userId = user.uid.toString();
        const participantName = participants[userId]?.name || `Usuário ${userId}`;
        
        setAgoraState(prev => ({
          ...prev,
          screenShareUserId: prev.screenShareUserId === user.uid ? undefined : prev.screenShareUserId
        }));
        toast({
          title: "Compartilhamento finalizado",
          description: `${participantName} parou de compartilhar a tela`,
        });
      }
    });

    client.on("user-left", (user) => {
      // Make sure to check if the leaving user was sharing screen
      setAgoraState(prev => {
        // Check if the leaving user was sharing screen
        const wasShareUser = prev.screenShareUserId === user.uid;
        
        // Update state
        const newRemoteUsers = prev.remoteUsers.filter(u => u.uid !== user.uid);
        const newState = {
          ...prev,
          remoteUsers: newRemoteUsers,
          screenShareUserId: wasShareUser ? undefined : prev.screenShareUserId
        };
        
        return newState;
      });
      
      // Remove participant from the participants list
      const userId = user.uid.toString();
      if (participants[userId]) {
        const userName = participants[userId].name;
        
        // Remove from participants and notify others
        setParticipants(prev => {
          const newParticipants = { ...prev };
          delete newParticipants[userId];
          return newParticipants;
        });
        
        // Show toast notification to all remaining users
        toast({
          title: "Usuário saiu",
          description: `${userName} saiu da chamada`,
        });
      } else {
        toast({
          title: "Usuário saiu",
          description: `Usuário ${user.uid} saiu da chamada`,
        });
      }
    });

    // Since we can't use direct messaging through the Agora SDK's RTC client,
    // we'll use custom events when new users join or leave to update our participant list.
    // The main ways are:
    // 1. When users publish audio (handled in user-published)
    // 2. When users leave (handled in user-left)
    
    // For incoming API-created participants, they will be added directly to the participants list
    // when they join the meeting through the API, no need for additional message handling.

    // Clean up
    return () => {
      client.removeAllListeners();
    };
  }, [client, isScreenSharing, stopScreenShare, setAgoraState, startRecording, stopRecording, participants, setParticipants, currentUser]);
}

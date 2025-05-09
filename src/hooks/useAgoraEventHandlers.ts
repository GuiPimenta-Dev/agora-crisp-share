
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { AgoraState } from "@/types/agora";
import { IAgoraRTCClient } from "agora-rtc-sdk-ng";
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
        
        // Send a custom message to all users in the channel
        // This contains our user information for others to add to their participant list
        if (client.channelName) {
          await client.sendStreamMessage(Buffer.from(JSON.stringify({
            type: "user_joined",
            user: currentUser
          })));
          
          console.log("Broadcast presence message sent");
        }
      } catch (error) {
        console.error("Failed to broadcast presence:", error);
      }
    };

    broadcastPresence();
  }, [client, currentUser, agoraState.joinState]);

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

    // Add custom message handler for participant synchronization
    client.on("stream-message", (user, data) => {
      try {
        const message = JSON.parse(Buffer.from(data).toString());
        
        if (message.type === "user_joined" && message.user) {
          const newUser = message.user as MeetingUser;
          
          // Add the user to our participants list if not already there
          setParticipants(prev => {
            // Don't add if already in the list or if it's us
            if (prev[newUser.id] || (currentUser && newUser.id === currentUser.id)) {
              return prev;
            }
            
            console.log(`Adding user ${newUser.name} to participants via message`);
            return {
              ...prev,
              [newUser.id]: { ...newUser, isCurrent: false }
            };
          });
        }
      } catch (error) {
        console.error("Error processing stream message:", error);
      }
    });

    // Clean up
    return () => {
      client.removeAllListeners();
    };
  }, [client, isScreenSharing, stopScreenShare, setAgoraState, startRecording, stopRecording, participants, setParticipants, currentUser]);
}

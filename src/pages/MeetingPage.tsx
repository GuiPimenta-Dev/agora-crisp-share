
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAgora } from "@/context/AgoraContext";
import MeetingRoom from "@/components/MeetingRoom";
import { useToast } from "@/hooks/use-toast";
import { callJoinMeeting } from "@/api/MeetingApiRoutes";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const MeetingPage: React.FC = () => {
  const { meetingId } = useParams();
  const [searchParams] = useSearchParams();
  const { joinWithUser, agoraState, refreshParticipants } = useAgora();
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [joinRetries, setJoinRetries] = useState(0);
  const [joinAttempted, setJoinAttempted] = useState(false);
  
  // Memoize join function to avoid recreating it on each render
  const joinMeeting = useCallback(async () => {
    if (!meetingId) {
      setError("ID da reunião inválido");
      setIsJoining(false);
      return;
    }

    try {
      // Set join attempted flag to prevent multiple attempts
      setJoinAttempted(true);
      
      // Check for URL parameters first (direct access via link)
      const urlUserId = searchParams.get("id");
      const urlUserName = searchParams.get("name");
      const urlUserAvatar = searchParams.get("profile_pic");
      
      // If URL parameters exist, use them; otherwise, fall back to localStorage
      const userId = urlUserId || localStorage.getItem("userId") || `user-${Date.now()}`;
      // Always save the userId to localStorage for future use
      if (!urlUserId) {
        localStorage.setItem("userId", userId);
      }
      
      const userName = urlUserName || localStorage.getItem("userName") || "Guest User";
      const userAvatar = urlUserAvatar || 
        localStorage.getItem("userAvatar") || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`;
      
      // If we got params from URL, save them to localStorage for consistency
      if (!urlUserId && userId) localStorage.setItem("userId", userId);
      if (!urlUserName && userName) localStorage.setItem("userName", userName);
      if (!urlUserAvatar && userAvatar) localStorage.setItem("userAvatar", userAvatar);
      
      // User object to join the meeting
      const user = {
        id: userId,
        name: userName,
        avatar: userAvatar
      };
      
      console.log(`Tentando entrar na reunião ${meetingId} como ${userName}`);
      const result = await callJoinMeeting(meetingId, user);
      
      if (result.success && result.user) {
        console.log("Registrado com sucesso na API da reunião");
        // Set audioEnabled to true for direct link joins to avoid disabled track issue
        const joinSuccess = await joinWithUser(meetingId, result.user);
        
        if (!joinSuccess) {
          console.error("Falha ao entrar na reunião com o usuário");
          throw new Error("Falha ao entrar na sala de reunião");
        } else {
          // Atualizar participantes ao entrar com sucesso
          await refreshParticipants();
        }
      } else {
        setError(result.error || "Falha ao entrar na reunião");
        toast({
          title: "Erro",
          description: result.error || "Falha ao entrar na reunião",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Erro ao entrar na reunião:", err);
      setError("Ocorreu um erro inesperado");
    } finally {
      setIsJoining(false);
    }
  }, [meetingId, joinWithUser, toast, searchParams, refreshParticipants]);
  
  useEffect(() => {
    // Check if we're already in the correct channel
    if (agoraState.joinState && agoraState.channelName === meetingId) {
      console.log(`Já conectado à reunião ${meetingId}, atualizando participantes`);
      setIsJoining(false);
      
      // Atualizar a lista de participantes quando entrar na página
      refreshParticipants();
      return;
    }
    
    // Check if the client is initialized
    if (!agoraState.client) {
      // If we've already tried a few times and still no client, show error
      if (joinRetries > 6) {
        setError("Falha ao inicializar o cliente de áudio. Tente atualizar a página.");
        setIsJoining(false);
        return;
      }
      
      // Add a small delay and increment retry counter
      const timer = setTimeout(() => {
        console.log("Tentando inicializar o cliente novamente...", joinRetries);
        setJoinRetries(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } 
    // Client is initialized but we haven't attempted to join yet
    else if (!joinAttempted) {
      joinMeeting();
    }
  }, [agoraState.client, agoraState.joinState, agoraState.channelName, 
      meetingId, joinRetries, joinAttempted, refreshParticipants, joinMeeting]);

  // Configurar um intervalo para atualizar regularmente a lista de participantes
  useEffect(() => {
    if (!isJoining && !error && meetingId) {
      const intervalId = setInterval(() => {
        refreshParticipants();
      }, 10000); // Atualiza a cada 10 segundos
      
      return () => clearInterval(intervalId);
    }
  }, [isJoining, error, meetingId, refreshParticipants]);
  
  if (isJoining) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h2 className="mt-4 text-lg font-medium">Entrando na reunião...</h2>
          {joinRetries > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Conectando ao serviço de áudio... (tentativa {joinRetries})
            </p>
          )}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold text-destructive mb-4">Erro</h2>
        <p className="text-center text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => navigate("/")}>Voltar para Home</Button>
      </div>
    );
  }
  
  return <MeetingRoom />;
};

export default MeetingPage;

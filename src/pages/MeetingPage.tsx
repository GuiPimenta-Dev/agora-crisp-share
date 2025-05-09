
import React, { useEffect, useState, useCallback, useRef } from "react";
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
  
  // Use ref to track max retries to avoid re-renders
  const maxRetriesRef = useRef(20); // Increase max retries
  const retryIntervalRef = useRef(2000); // Increase time between retries
  
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
      
      console.log(`Tentando entrar na reunião ${meetingId} como ${userName} (tentativa ${joinRetries + 1}/${maxRetriesRef.current})`);
      const result = await callJoinMeeting(meetingId, user);
      
      if (result.success && result.user) {
        console.log("Registrado com sucesso na API da reunião");
        
        // Extra safety: check if agoraState.client exists before attempting to join
        if (!agoraState.client) {
          console.log("Agora client not initialized yet, will retry");
          throw new Error("Agora client not initialized yet");
        }
        
        // Set audioEnabled to true for direct link joins to avoid disabled track issue
        const joinSuccess = await joinWithUser(meetingId, result.user);
        
        if (!joinSuccess) {
          console.error("Falha ao entrar na reunião com o usuário");
          throw new Error("Falha ao entrar na sala de reunião");
        } else {
          // Reset retry count on success
          setJoinRetries(0);
          
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
      
      // Check if we should retry
      if (joinRetries < maxRetriesRef.current) {
        console.log(`Agendando nova tentativa (${joinRetries + 1}/${maxRetriesRef.current})...`);
        
        // Set joinAttempted to false to trigger another join attempt
        setJoinAttempted(false);
        
        // Increment retry counter
        setJoinRetries(prev => prev + 1);
      } else {
        setError("Número máximo de tentativas excedido. Por favor, atualize a página e tente novamente.");
        toast({
          title: "Erro de conexão",
          description: "Não foi possível conectar após várias tentativas. Por favor, atualize a página.",
          variant: "destructive"
        });
      }
    } finally {
      // Only set isJoining to false when we've either succeeded or exhausted retries
      if (agoraState.joinState || joinRetries >= maxRetriesRef.current) {
        setIsJoining(false);
      }
    }
  }, [meetingId, joinWithUser, toast, searchParams, refreshParticipants, joinRetries, agoraState.client, agoraState.joinState]);
  
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
      if (joinRetries > maxRetriesRef.current) {
        setError("Falha ao inicializar o cliente de áudio. Tente atualizar a página.");
        setIsJoining(false);
        return;
      }
      
      // Add a delay and increment retry counter
      const timer = setTimeout(() => {
        console.log(`Aguardando inicialização do cliente... (tentativa ${joinRetries + 1}/${maxRetriesRef.current})`);
        setJoinRetries(prev => prev + 1);
      }, retryIntervalRef.current);
      
      return () => clearTimeout(timer);
    } 
    // Client is initialized but we haven't attempted to join yet or need to retry
    else if (!joinAttempted || (joinRetries > 0 && !agoraState.joinState)) {
      // Add a small delay before joining to ensure client is fully ready
      // Increase delay based on retry count for exponential backoff
      const delay = Math.min(500 + joinRetries * 500, 5000);
      
      const joinTimer = setTimeout(() => {
        joinMeeting();
      }, delay);
      
      return () => clearTimeout(joinTimer);
    }
  }, [agoraState.client, agoraState.joinState, agoraState.channelName, 
      meetingId, joinRetries, joinAttempted, refreshParticipants, joinMeeting]);

  // Configurar um intervalo para atualizar regularmente a lista de participantes
  useEffect(() => {
    if (!isJoining && !error && meetingId && agoraState.joinState) {
      const intervalId = setInterval(() => {
        refreshParticipants();
      }, 10000); // Atualiza a cada 10 segundos
      
      return () => clearInterval(intervalId);
    }
  }, [isJoining, error, meetingId, refreshParticipants, agoraState.joinState]);
  
  if (isJoining) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h2 className="mt-4 text-lg font-medium">Entrando na reunião...</h2>
          {joinRetries > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Conectando ao serviço de áudio... (tentativa {joinRetries}/{maxRetriesRef.current})
            </p>
          )}
          {joinRetries > 5 && (
            <p className="text-xs text-muted-foreground mt-2 max-w-md text-center">
              Isso está demorando mais que o esperado. Por favor, verifique sua conexão com a internet.
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
        <div className="flex gap-4">
          <Button onClick={() => {
            setError("");
            setJoinAttempted(false);
            setJoinRetries(0);
            setIsJoining(true);
          }}>
            Tentar novamente
          </Button>
          <Button variant="outline" onClick={() => navigate("/")}>Voltar para Home</Button>
        </div>
      </div>
    );
  }
  
  return <MeetingRoom />;
};

export default MeetingPage;

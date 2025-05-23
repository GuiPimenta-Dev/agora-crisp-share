import React, { useEffect, useState } from "react";
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
  const { joinWithUser, agoraState } = useAgora();
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [joinRetries, setJoinRetries] = useState(0);
  const [joinAttempted, setJoinAttempted] = useState(false);
  
  useEffect(() => {
    if (!meetingId) {
      setError("ID de reunião inválido");
      setIsJoining(false);
      return;
    }
    
    // Check if we're already in the correct channel
    if (agoraState.joinState && agoraState.channelName === meetingId) {
      console.log(`Already joined ${meetingId}, no need to rejoin`);
      setIsJoining(false);
      return;
    }
    
    // Check if the client is initialized
    if (!agoraState.client) {
      // If we've already tried a few times and still no client, show error
      if (joinRetries > 3) {
        setError("Falha ao inicializar o cliente de áudio. Por favor, atualize a página.");
        setIsJoining(false);
        return;
      }
      
      // Add a small delay and increment retry counter
      const timer = setTimeout(() => {
        console.log("Retrying client initialization...");
        setJoinRetries(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    // Only join if we haven't attempted yet
    if (agoraState.client && !joinAttempted) {
      joinMeeting();
    }
    
    async function joinMeeting() {
      try {
        // Set join attempted flag to prevent multiple attempts
        setJoinAttempted(true);
        
        // Get userId from URL parameter or localStorage
        const userId = searchParams.get("id") || localStorage.getItem("userId");
        
        if (!userId) {
          setError("ID do usuário é necessário para entrar na reunião");
          toast({
            title: "Erro",
            description: "ID do usuário é necessário para entrar na reunião",
            variant: "destructive"
          });
          setIsJoining(false);
          return;
        }
        
        console.log(`Tentando entrar na reunião ${meetingId} como usuário ${userId}`);
        
        const result = await callJoinMeeting(meetingId, userId);
        
        if (result.success && result.user) {
          console.log("Successfully registered with meeting API", result.user);
          
          // Join with the user information retrieved from Supabase
          const joinSuccess = await joinWithUser(meetingId, result.user);
          
          if (!joinSuccess) {
            console.error("Failed to join with user");
            throw new Error("Falha ao entrar na sala de reunião");
          }
        } else {
          const errorMessage = result.error || "Falha ao entrar na reunião";
          setError(errorMessage);
          toast({
            title: "Erro",
            description: errorMessage,
            variant: "destructive"
          });
          setIsJoining(false);
        }
      } catch (err) {
        console.error("Error joining meeting:", err);
        setError("Um erro inesperado ocorreu");
        setIsJoining(false);
      } finally {
        setIsJoining(false);
      }
    }
  }, [meetingId, agoraState.client, joinWithUser, toast, searchParams, joinRetries, joinAttempted, agoraState.joinState, agoraState.channelName]);
  
  if (isJoining) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h2 className="mt-4 text-lg font-medium">Joining meeting...</h2>
          {joinRetries > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Connecting to audio service... (attempt {joinRetries})
            </p>
          )}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
        <p className="text-center text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => navigate("/")}>Go to Home</Button>
      </div>
    );
  }
  
  return <MeetingRoom />;
};

export default MeetingPage;

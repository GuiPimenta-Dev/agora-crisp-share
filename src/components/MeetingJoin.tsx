
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgora } from "@/context/AgoraContext";
import { Loader2, Copy, Link, Check, MonitorPlay } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { callCreateMeeting, callJoinMeeting } from "@/api/MeetingApiRoutes";
import { useNavigate } from "react-router-dom";

const MeetingJoin = () => {
  const [channelName, setChannelName] = useState("");
  const [userId, setUserId] = useState(localStorage.getItem("userId") || "");
  const [isJoining, setIsJoining] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const createMeeting = async () => {
    if (!channelName.trim() || !userId.trim()) {
      toast({
        title: "Error",
        description: "Meeting ID and your user ID are required",
        variant: "destructive",
      });
      return;
    }
    
    setIsJoining(true);
    
    // Save user ID for future use
    localStorage.setItem("userId", userId);
    
    try {
      // Create a new meeting
      const meetingId = channelName || `meeting-${Date.now()}`;
      
      const createResult = await callCreateMeeting({
        id: meetingId,
        coach_id: userId, // Current user becomes the coach
        student_id: "", // No student yet
      });
      
      if (!createResult.success) {
        toast({
          title: "Error creating meeting",
          description: createResult.error || "Failed to create meeting",
          variant: "destructive",
        });
        setIsJoining(false);
        return;
      }
      
      // Navigate to meeting with only the user ID in the URL
      navigate(`/meeting/${meetingId}?id=${userId}`);
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      setIsJoining(false);
    }
  };

  const joinMeeting = async () => {
    if (!channelName.trim() || !userId.trim()) {
      toast({
        title: "Error",
        description: "Meeting ID and your User ID are required",
        variant: "destructive",
      });
      return;
    }
    
    // Save user ID for future use
    localStorage.setItem("userId", userId);
    
    // Navigate to meeting with only the user ID in the URL
    navigate(`/meeting/${channelName}?id=${userId}`);
  };

  const copyLinkToClipboard = () => {
    if (!channelName.trim()) return;
    
    // Generate a link that includes a placeholder for the user ID
    const link = `${window.location.origin}/meeting/${channelName}?id=`;
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link da reunião foi copiado. Adicione o ID do usuário ao final para compartilhar.",
      });
      
      // Reset the "Copied" status after a short delay
      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="absolute inset-0 z-[-1] opacity-20">
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black to-transparent" />
      </div>
      
      <Card className="w-full max-w-md glass-card intense-shadow">
        <div className="absolute inset-x-0 top-0 h-1 sunset-gradient rounded-t-lg" />
        
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center sunset-text">SUNSET</CardTitle>
          <CardTitle className="text-2xl font-bold text-center">Join Audio Meeting</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Connect with high-quality audio and screen sharing
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="userId" className="text-sm font-medium">
                Your User ID
              </label>
              <Input
                id="userId"
                placeholder="Enter your user ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full bg-secondary/50 border-secondary glowing-border"
              />
              <p className="text-xs text-muted-foreground">
                Este ID deve estar cadastrado no sistema para poder entrar na reunião.
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="channel" className="text-sm font-medium">
                Meeting ID
              </label>
              <div className="relative">
                <Input
                  id="channel"
                  placeholder="Enter meeting ID"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full bg-secondary/50 border-secondary glowing-border"
                />
              </div>
            </div>
            
            {channelName.trim() && (
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 border-primary/30 hover:bg-secondary/80"
                  onClick={copyLinkToClipboard}
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-4 w-4 text-primary" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4 text-primary" /> Gerar link compartilhável
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="grid grid-cols-2 gap-4 w-full">
            <Button 
              className="w-full sunset-button glow"
              onClick={createMeeting} 
              disabled={isJoining || !channelName.trim() || !userId.trim()}
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Criando...
                </>
              ) : (
                <>
                  Criar Reunião
                </>
              )}
            </Button>
            
            <Button 
              className="w-full sunset-button glow"
              onClick={joinMeeting} 
              disabled={isJoining || !channelName.trim() || !userId.trim()}
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Entrando...
                </>
              ) : (
                <>
                  <MonitorPlay className="mr-2 h-5 w-5" /> Entrar na Reunião
                </>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Ao entrar, você concorda com nossos Termos de Serviço e Política de Privacidade
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MeetingJoin;

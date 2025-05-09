
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgora } from "@/context/AgoraContext";
import { Loader2, Copy, Link, Check, MonitorPlay } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getChannelFromUrl } from "@/lib/tokenGenerator";
import { callCreateMeeting, callJoinMeeting } from "@/api/MeetingApiRoutes";
import { useNavigate } from "react-router-dom";

const MeetingJoin = () => {
  const [channelName, setChannelName] = useState("");
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "");
  const [isJoining, setIsJoining] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { joinWithUser } = useAgora();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Generate a mock user ID if needed
  useEffect(() => {
    if (!localStorage.getItem("userId")) {
      localStorage.setItem("userId", `user-${Date.now()}`);
    }
  }, []);

  const createMeeting = async () => {
    if (!channelName.trim() || !userName.trim()) {
      toast({
        title: "Error",
        description: "Meeting ID and your name are required",
        variant: "destructive",
      });
      return;
    }
    
    setIsJoining(true);
    
    // Save user name for future use
    localStorage.setItem("userName", userName);
    
    try {
      // Create a new meeting
      const meetingId = channelName || `meeting-${Date.now()}`;
      const userId = localStorage.getItem("userId") || `user-${Date.now()}`;
      
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
      
      // Join the created meeting
      const joinResult = await callJoinMeeting(meetingId, {
        id: userId,
        name: userName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`,
      });
      
      if (joinResult.success && joinResult.user) {
        await joinWithUser(meetingId, joinResult.user);
        // Redirect to meeting page
        navigate(`/meeting/${meetingId}`);
      } else {
        toast({
          title: "Error joining meeting",
          description: joinResult.error || "Failed to join meeting",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating/joining meeting:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const joinMeeting = async () => {
    if (!channelName.trim() || !userName.trim()) {
      toast({
        title: "Error",
        description: "Meeting ID and your name are required",
        variant: "destructive",
      });
      return;
    }
    
    // Redirect to meeting page - the join logic will happen there
    navigate(`/meeting/${channelName}`);
  };

  const copyLinkToClipboard = () => {
    if (!channelName.trim()) return;
    
    const link = `${window.location.origin}/meeting/${channelName}`;
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      toast({
        title: "Link copied!",
        description: "Meeting link has been copied to clipboard.",
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
              <label htmlFor="username" className="text-sm font-medium">
                Your Name
              </label>
              <Input
                id="username"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-secondary/50 border-secondary glowing-border"
              />
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
                      <Check className="h-4 w-4 text-primary" /> Copied!
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4 text-primary" /> Generate shareable link
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
              disabled={isJoining || !channelName.trim() || !userName.trim()}
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  Create Meeting
                </>
              )}
            </Button>
            
            <Button 
              className="w-full sunset-button glow"
              onClick={joinMeeting} 
              disabled={isJoining || !channelName.trim() || !userName.trim()}
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Joining...
                </>
              ) : (
                <>
                  <MonitorPlay className="mr-2 h-5 w-5" /> Join Meeting
                </>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            By joining, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MeetingJoin;

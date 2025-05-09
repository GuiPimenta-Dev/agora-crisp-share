
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgora } from "@/context/AgoraContext";
import { Loader2, Copy, Link, Check, MonitorPlay } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getChannelFromUrl } from "@/lib/tokenGenerator";

const MeetingJoin = () => {
  const [channelName, setChannelName] = useState("main");
  const [isJoining, setIsJoining] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { joinAudioCall, generateMeetingLink } = useAgora();
  const { toast } = useToast();

  // Check for channel name in URL and auto-join
  useEffect(() => {
    const urlChannel = getChannelFromUrl();
    if (urlChannel) {
      setChannelName(urlChannel);
      // Auto-join when coming from a link
      handleJoin(urlChannel);
    }
  }, []);

  const handleJoin = async (channelNameParam?: string) => {
    const channelToJoin = channelNameParam || channelName;
    
    if (!channelToJoin.trim()) return;
    
    setIsJoining(true);
    try {
      const joined = await joinAudioCall(channelToJoin);
      
      if (!joined) {
        toast({
          title: "Failed to join",
          description: "Could not join the meeting. Please check if the Agora App ID is configured correctly.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error joining meeting:", error);
      toast({
        title: "Error",
        description: "An error occurred while trying to join the meeting.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const copyLinkToClipboard = () => {
    const link = generateMeetingLink();
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
          <Button 
            className="w-full sunset-button glow"
            onClick={() => handleJoin()} 
            disabled={isJoining || !channelName.trim()}
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
          
          <p className="text-xs text-center text-muted-foreground">
            By joining, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MeetingJoin;

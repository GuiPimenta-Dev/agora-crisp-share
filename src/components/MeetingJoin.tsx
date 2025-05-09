
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgora } from "@/context/AgoraContext";
import { Loader2, Copy, Link, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getChannelFromUrl } from "@/lib/tokenGenerator";

const MeetingJoin = () => {
  const [channelName, setChannelName] = useState("main");
  const [isJoining, setIsJoining] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { joinAudioCall, generateMeetingLink } = useAgora();
  const { toast } = useToast();

  // Check for channel name in URL
  useEffect(() => {
    const urlChannel = getChannelFromUrl();
    if (urlChannel) {
      setChannelName(urlChannel);
      // Option to auto-join when coming from a link
      // handleJoin();
    }
  }, []);

  const handleJoin = async () => {
    if (!channelName.trim()) return;
    
    setIsJoining(true);
    try {
      const joined = await joinAudioCall(channelName);
      
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Join Audio Meeting</CardTitle>
          <CardDescription className="text-center">
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
                  className="w-full"
                />
              </div>
            </div>
            
            {channelName.trim() && (
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={copyLinkToClipboard}
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-4 w-4" /> Copied!
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4" /> Generate shareable link
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleJoin} 
            disabled={isJoining || !channelName.trim()}
          >
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...
              </>
            ) : (
              "Join Meeting"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MeetingJoin;

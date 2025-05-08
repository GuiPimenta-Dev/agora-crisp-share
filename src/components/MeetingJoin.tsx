
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgora } from "@/context/AgoraContext";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { generateToken } from "@/lib/tokenGenerator";

const MeetingJoin = () => {
  const [channelName, setChannelName] = useState("main");
  const [token, setToken] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const { joinAudioCall } = useAgora();
  const { toast } = useToast();

  // Generate token when channel name changes
  useEffect(() => {
    if (channelName.trim()) {
      handleGenerateToken();
    }
  }, [channelName]);

  const handleGenerateToken = () => {
    try {
      setIsGeneratingToken(true);
      const newToken = generateToken(channelName);
      setToken(newToken);
      toast({
        title: "Token Generated",
        description: "A new authentication token has been generated for this channel.",
      });
    } catch (error) {
      console.error("Error generating token:", error);
      toast({
        title: "Token Generation Failed",
        description: "Could not generate authentication token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleJoin = async () => {
    if (!channelName.trim()) return;
    
    setIsJoining(true);
    try {
      const joined = await joinAudioCall(channelName, token);
      
      if (!joined) {
        toast({
          title: "Failed to join",
          description: "Could not join the meeting. Please check if the Agora App ID is configured and the token is valid.",
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
              <Input
                id="channel"
                placeholder="Enter meeting ID"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="token" className="text-sm font-medium">
                  Authentication Token
                </label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleGenerateToken} 
                  disabled={isGeneratingToken || !channelName.trim()}
                  className="h-8 px-2"
                >
                  {isGeneratingToken ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Regenerate
                </Button>
              </div>
              <Input
                id="token"
                placeholder="Enter authentication token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full font-mono text-xs"
              />
              <p className="text-xs text-gray-500">
                This channel requires token-based authentication to join
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleJoin} 
            disabled={isJoining || !channelName.trim() || !token.trim()}
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

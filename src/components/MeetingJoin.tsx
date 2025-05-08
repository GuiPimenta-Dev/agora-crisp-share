
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgora } from "@/context/AgoraContext";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const MeetingJoin = () => {
  const [channelName, setChannelName] = useState("main");
  const [isJoining, setIsJoining] = useState(false);
  const { joinAudioCall } = useAgora();
  const { toast } = useToast();

  const handleJoin = async () => {
    if (!channelName.trim()) return;
    
    setIsJoining(true);
    try {
      const joined = await joinAudioCall(channelName);
      
      if (!joined) {
        toast({
          title: "Failed to join",
          description: "Could not join the meeting. Please check if the Agora App ID is configured.",
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

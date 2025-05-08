
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgora } from "@/context/AgoraContext";
import { Loader2 } from "lucide-react";

const MeetingJoin = () => {
  const [channelName, setChannelName] = useState("main");
  const [isJoining, setIsJoining] = useState(false);
  const { joinAudioCall } = useAgora();

  const handleJoin = async () => {
    if (!channelName.trim()) return;
    
    setIsJoining(true);
    try {
      await joinAudioCall(channelName);
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

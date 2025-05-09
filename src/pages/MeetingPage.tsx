
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAgora } from "@/context/AgoraContext";
import MeetingRoom from "@/components/MeetingRoom";
import { useToast } from "@/hooks/use-toast";
import { callJoinMeeting } from "@/api/MeetingApiRoutes";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const MeetingPage: React.FC = () => {
  const { meetingId } = useParams();
  const { joinWithUser } = useAgora();
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!meetingId) {
      setError("Invalid meeting ID");
      setIsJoining(false);
      return;
    }
    
    const userId = localStorage.getItem("userId") || `user-${Date.now()}`;
    const userName = localStorage.getItem("userName") || "Guest User";
    const userAvatar = localStorage.getItem("userAvatar") || "https://ui-avatars.com/api/?name=Guest+User";
    
    // Quick mock for testing - you would get this from your auth system
    const mockUser = {
      id: userId,
      name: userName,
      avatar: userAvatar
    };
    
    // Join the meeting
    const joinMeeting = async () => {
      try {
        const result = await callJoinMeeting(meetingId, mockUser);
        
        if (result.success && result.user) {
          await joinWithUser(meetingId, result.user);
        } else {
          setError(result.error || "Failed to join meeting");
        }
      } catch (err) {
        console.error("Error joining meeting:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsJoining(false);
      }
    };
    
    joinMeeting();
  }, [meetingId, joinWithUser, toast]);
  
  if (isJoining) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h2 className="mt-4 text-lg font-medium">Joining meeting...</h2>
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

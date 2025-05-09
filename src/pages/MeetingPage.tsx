
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
  
  useEffect(() => {
    if (!meetingId) {
      setError("Invalid meeting ID");
      setIsJoining(false);
      return;
    }
    
    // Check if the client is initialized
    if (!agoraState.client) {
      // If we've already tried a few times and still no client, show error
      if (joinRetries > 3) {
        setError("Failed to initialize audio client. Please try refreshing the page.");
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
    
    // Only proceed when client is ready
    if (agoraState.client && !agoraState.joinState) {
      joinMeeting();
    } else if (agoraState.joinState) {
      // Already joined
      setIsJoining(false);
    }
    
    async function joinMeeting() {
      try {
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
        
        const result = await callJoinMeeting(meetingId, user);
        
        if (result.success && result.user) {
          // Set audioEnabled to true for direct link joins to avoid disabled track issue
          const joinSuccess = await joinWithUser(meetingId, result.user);
          
          if (!joinSuccess) {
            console.error("Failed to join with user");
            throw new Error("Failed to join meeting room");
          }
        } else {
          setError(result.error || "Failed to join meeting");
          toast({
            title: "Error",
            description: result.error || "Failed to join meeting",
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error("Error joining meeting:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsJoining(false);
      }
    }
  }, [meetingId, agoraState.client, joinWithUser, toast, searchParams, joinRetries, agoraState.joinState]);
  
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

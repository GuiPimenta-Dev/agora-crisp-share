
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const JoinMeeting: React.FC = () => {
  const [meetingId, setMeetingId] = useState("");
  const [name, setName] = useState(localStorage.getItem("userName") || "");
  const [userId, setUserId] = useState(localStorage.getItem("userId") || `user-${Math.floor(Math.random() * 10000)}`);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleJoinMeeting = () => {
    if (!meetingId) {
      toast({
        title: "Missing information",
        description: "Please enter a meeting ID",
        variant: "destructive",
      });
      return;
    }

    if (!name) {
      toast({
        title: "Missing information",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    // Save user info to localStorage
    localStorage.setItem("userName", name);
    localStorage.setItem("userId", userId);
    
    // Generate an avatar based on name
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    
    // Navigate to the meeting with query parameters
    navigate(`/meeting/${meetingId}?id=${userId}&name=${encodeURIComponent(name)}&profile_pic=${encodeURIComponent(avatar)}`);
  };

  return (
    <div className="container max-w-md mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Join Meeting</CardTitle>
          <CardDescription>
            Enter the meeting details to join an existing session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meetingId">Meeting ID</Label>
            <Input
              id="meetingId"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              placeholder="Enter meeting ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userId">Your User ID (optional)</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter your user ID"
            />
            <p className="text-xs text-muted-foreground">
              This ID determines your role in the meeting. Leave as is if you're joining as a listener.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleJoinMeeting}>
            Join Meeting
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default JoinMeeting;

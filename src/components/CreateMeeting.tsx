
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { callCreateMeeting } from "@/api/MeetingApiRoutes";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCopy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CreateMeeting: React.FC = () => {
  const [meetingId, setMeetingId] = useState(`meeting-${Math.floor(Math.random() * 10000)}`);
  const [coachId, setCoachId] = useState(localStorage.getItem("coachId") || "");
  const [studentId, setStudentId] = useState(localStorage.getItem("studentId") || "");
  const [isCreating, setIsCreating] = useState(false);
  const [coachLink, setCoachLink] = useState("");
  const [studentLink, setStudentLink] = useState("");
  const [showLinks, setShowLinks] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Link copied!",
        description: `${type} link copied to clipboard`,
      });
    });
  };

  const handleCreateMeeting = async () => {
    try {
      setIsCreating(true);
      
      // Store IDs for convenience
      localStorage.setItem("coachId", coachId);
      localStorage.setItem("studentId", studentId);
      
      const result = await callCreateMeeting({
        id: meetingId,
        coach_id: coachId,
        student_id: studentId
      });
      
      if (result.success) {
        toast({
          title: "Meeting created",
          description: `Meeting ID: ${meetingId}`,
        });
        
        // Generate shareable links
        const baseUrl = window.location.origin;
        
        // Coach link
        const coach = `${baseUrl}/meeting/${meetingId}?id=${coachId}&name=Coach&profile_pic=https://ui-avatars.com/api/?name=Coach&background=random`;
        setCoachLink(coach);
        
        // Student link
        const student = `${baseUrl}/meeting/${meetingId}?id=${studentId}&name=Student&profile_pic=https://ui-avatars.com/api/?name=Student&background=random`;
        setStudentLink(student);
        
        setShowLinks(true);
      } else {
        toast({
          title: "Error creating meeting",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast({
        title: "Error",
        description: "Failed to create meeting",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinAsModerator = () => {
    navigate(`/meeting/${meetingId}?id=${coachId}&name=Coach&profile_pic=https://ui-avatars.com/api/?name=Coach&background=random`);
  };

  return (
    <TooltipProvider>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Create a Meeting</CardTitle>
          <CardDescription>
            Set up a new coaching session by providing the required information.
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
            <Label htmlFor="coachId">Coach ID</Label>
            <Input
              id="coachId"
              value={coachId}
              onChange={(e) => setCoachId(e.target.value)}
              placeholder="Enter coach ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentId">Student ID</Label>
            <Input
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter student ID"
            />
          </div>

          {showLinks && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label>Coach Link:</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(coachLink, "Coach")}
                      >
                        <ClipboardCopy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy coach link to clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-xs bg-secondary/50 p-2 rounded overflow-hidden text-ellipsis">
                  {coachLink}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label>Student Link:</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(studentLink, "Student")}
                      >
                        <ClipboardCopy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy student link to clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-xs bg-secondary/50 p-2 rounded overflow-hidden text-ellipsis">
                  {studentLink}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            className="w-full" 
            onClick={handleCreateMeeting}
            disabled={!meetingId || !coachId || !studentId || isCreating}
          >
            {isCreating ? "Creating..." : "Create Meeting"}
          </Button>
          
          {showLinks && (
            <Button
              className="w-full"
              onClick={handleJoinAsModerator}
            >
              Join as Coach
            </Button>
          )}
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
};

export default CreateMeeting;

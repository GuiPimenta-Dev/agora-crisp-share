
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { callCreateMeeting } from "@/api/MeetingApiRoutes";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const CreateMeeting: React.FC = () => {
  const [meetingId, setMeetingId] = useState(`meeting-${Math.floor(Math.random() * 10000)}`);
  const [coachId, setCoachId] = useState(localStorage.getItem("coachId") || "");
  const [studentId, setStudentId] = useState(localStorage.getItem("studentId") || "");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
        const coachLink = `${baseUrl}/meeting/${meetingId}?id=${coachId}&name=Coach&profile_pic=https://ui-avatars.com/api/?name=Coach&background=random`;
        
        // Student link
        const studentLink = `${baseUrl}/meeting/${meetingId}?id=${studentId}&name=Student&profile_pic=https://ui-avatars.com/api/?name=Student&background=random`;
        
        // Display links to user
        toast({
          title: "Shareable Links",
          description: (
            <div className="mt-2 space-y-2">
              <div>
                <div className="font-semibold">Coach Link:</div>
                <div className="text-xs break-all bg-secondary p-2 rounded">{coachLink}</div>
              </div>
              <div>
                <div className="font-semibold">Student Link:</div>
                <div className="text-xs break-all bg-secondary p-2 rounded">{studentLink}</div>
              </div>
            </div>
          ),
          duration: 10000,
        });
        
        // Join as creator
        navigate(`/meeting/${meetingId}`);
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

  return (
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
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleCreateMeeting}
          disabled={!meetingId || !coachId || !studentId || isCreating}
        >
          {isCreating ? "Creating..." : "Create Meeting"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CreateMeeting;

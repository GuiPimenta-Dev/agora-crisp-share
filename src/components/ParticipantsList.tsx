
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Users, MonitorSmartphone, Crown, Gamepad2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAgora } from "@/context/AgoraContext";
import { MeetingUser } from "@/types/meeting";
import { sortParticipantsByRoleAndTime } from "@/utils/participantSorting";

interface ParticipantsListProps {
  className?: string;
  meetingId?: string; // Added meetingId prop to match usage in MeetingRoom.tsx
}

const roleConfig = {
  coach: {
    icon: Crown,
    label: "Coach",
    color: "text-yellow-500",
  },
  student: {
    icon: Gamepad2,
    label: "Student",
    color: "text-blue-500",
  },
};

const canUseAudio = (participant: MeetingUser) => {
  return participant?.role === "coach" || participant?.role === "student";
};

const ParticipantsList: React.FC<ParticipantsListProps> = ({ className = "" }) => {
  const { participants, currentUser } = useAgora();

  const getAvatarInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getPresenceIndicatorColor = (participant: MeetingUser) => {
    return participant.audioEnabled ? "bg-green-500" : "bg-red-500";
  };

  // Sort participants by role: coach first, then student, then listeners
  // Updated to use the correct function name
  const sortedParticipants = [...Object.values(participants || {})].sort(sortParticipantsByRoleAndTime);
  
  return (
    <div className={`rounded-lg bg-card p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Users className="mr-2 h-5 w-5" /> Participants
          <span className="ml-2 text-xs text-muted-foreground">({sortedParticipants.length})</span>
        </h2>
      </div>
      
      {/* Empty state when no participants */}
      {sortedParticipants.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <User className="mx-auto h-12 w-12 mb-2 opacity-20" />
          <p>No participants yet</p>
          <p className="text-sm">Share the meeting link to invite others</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-1">
            {sortedParticipants.map((participant) => {
              const isCurrentUser = currentUser && participant.id === currentUser.id;
              
              // IMPORTANT: Use the audioMuted property directly instead of checking audioEnabled
              const isAudioMuted = participant.audioMuted === undefined ? true : participant.audioMuted;
              
              return (
                <div 
                  key={participant.id}
                  className={`flex items-center justify-between p-2 rounded-md ${
                    isCurrentUser ? "bg-secondary/50" : "hover:bg-muted/50"
                  }`}
                >
                  {/* Participant avatar and name */}
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={participant.avatar} alt={participant.name} />
                      <AvatarFallback>{getAvatarInitials(participant.name)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex items-center">
                      <span className="font-medium">{participant.name}</span>
                      {/* Role indicator - Fixed to use React.createElement */}
                      {participant.role && roleConfig[participant.role] && (
                        React.createElement(roleConfig[participant.role].icon, {
                          className: `ml-1.5 h-4 w-4 ${roleConfig[participant.role].color}`,
                          "aria-label": roleConfig[participant.role].label
                        })
                      )}
                      {/* Current user indicator */}
                      {isCurrentUser && (
                        <span className="ml-1.5 text-xs text-muted-foreground">(You)</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Screen sharing indicator */}
                    {participant.screenSharing && (
                      <MonitorSmartphone className="h-4 w-4 text-blue-500" />
                    )}
                    
                    {/* Audio status indicator */}
                    {canUseAudio(participant) ? (
                      isAudioMuted ? (
                        <MicOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Mic className="h-4 w-4 text-green-500" />
                      )
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ParticipantsList;

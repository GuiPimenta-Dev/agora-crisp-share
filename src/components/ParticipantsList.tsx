
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, MonitorSmartphone, Crown, Gamepad2, User } from "lucide-react";
import { useAgora } from "@/context/AgoraContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useParticipantsList } from "@/hooks/useParticipantsList";
import { MeetingUser, Role } from "@/types/meeting";

interface ParticipantsListProps {
  meetingId?: string;
  className?: string;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({
  meetingId,
  className = ""
}) => {
  const { agoraState, currentUser } = useAgora();
  const { sortedParticipants, isLoading, error } = useParticipantsList(meetingId);
  
  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return "U";
    
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to get role icon
  const getRoleIcon = (role: Role) => {
    switch (role) {
      case "coach":
        return <Crown className="h-3.5 w-3.5 text-yellow-500" />;
      case "student":
        return <Gamepad2 className="h-3.5 w-3.5 text-blue-500" />;
      default:
        return <User className="h-3.5 w-3.5 text-neutral-500" />;
    }
  };
  
  // Function to get role badge color
  const getRoleBadgeClass = (role: Role) => {
    switch (role) {
      case "coach":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "student":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-neutral-500/10 text-neutral-600 border-neutral-500/20";
    }
  };

  // Loading skeletons
  if (isLoading) {
    return (
      <Card className={`p-4 shadow-sm ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Participants</h3>
        </div>
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className={`p-4 shadow-sm ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Participants</h3>
        </div>
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className={`bg-card rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">Participants ({sortedParticipants.length})</h3>
      </div>
      
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-1">
          {sortedParticipants.map((participant) => {
            const isCurrentUser = currentUser && participant.id === currentUser.id;
            
            return (
              <div 
                key={participant.id} 
                className={`flex items-center gap-3 p-2 rounded-md ${
                  participant.screenSharing ? "bg-secondary/40" : ""
                } ${
                  isCurrentUser ? "ring-1 ring-primary/20" : ""
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={participant.avatar} alt={participant.summoner || participant.name} />
                  <AvatarFallback className={`text-xs ${
                    isCurrentUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}>
                    {getInitials(participant.summoner || participant.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    {/* Use summoner name instead of name */}
                    <span className="font-medium truncate">{participant.summoner || participant.name}</span>
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground">(you)</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Badge 
                      variant="outline" 
                      className={`text-xs py-0 h-5 px-1.5 ${getRoleBadgeClass(participant.role)}`}
                    >
                      <span className="flex items-center gap-1">
                        {getRoleIcon(participant.role)}
                        <span>{participant.role}</span>
                      </span>
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {participant.screenSharing && (
                    <MonitorSmartphone className="h-4 w-4 text-blue-500" />
                  )}
                  {/* Mic icon removed */}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}

export default ParticipantsList;

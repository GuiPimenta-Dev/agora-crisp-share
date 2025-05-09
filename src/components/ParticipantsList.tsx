
import React from "react";
import { IAgoraRTCRemoteUser, UID } from "agora-rtc-sdk-ng";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Users } from "lucide-react";
import { useAgora } from "@/context/AgoraContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ParticipantsListProps {
  remoteUsers: IAgoraRTCRemoteUser[];
  localUserId?: string;
  screenShareUserId?: UID;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({
  remoteUsers,
  localUserId = "You",
  screenShareUserId,
}) => {
  const { isMuted, currentUser, participants } = useAgora();
  
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
  
  // Função para verificar se o usuário está com som ativo
  const isUserTalking = (userId: string) => {
    const remoteUser = remoteUsers.find(ru => ru.uid.toString() === userId);
    return remoteUser && remoteUser.hasAudio;
  };
  
  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">Participants ({Object.keys(participants).length})</h3>
      </div>
      
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-1">
          {/* Current User */}
          {currentUser && (
            <div className={`flex items-center gap-3 p-2 rounded-md ${String(screenShareUserId) === currentUser.id ? "bg-secondary/40" : ""}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <span className="font-medium">{currentUser.name}</span>
                  <span className="text-xs text-muted-foreground ml-1">({currentUser.role})</span>
                </div>
                {isMuted ? (
                  <MicOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Mic className="h-4 w-4 text-primary" />
                )}
              </div>
            </div>
          )}
          
          {/* Remote Participants */}
          {Object.entries(participants)
            .filter(([id]) => currentUser && id !== currentUser.id)
            .map(([id, user]) => {
              const remoteUser = remoteUsers.find(ru => ru.uid.toString() === id);
              return (
                <div 
                  key={id} 
                  className={`flex items-center gap-3 p-2 rounded-md ${screenShareUserId === id ? "bg-secondary/40" : ""}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <span>{user.name || `Usuário ${id.substring(0, 8)}`}</span>
                      <span className="text-xs text-muted-foreground ml-1">({user.role})</span>
                    </div>
                    {remoteUser && remoteUser.hasAudio ? (
                      <Mic className="h-4 w-4 text-primary" />
                    ) : (
                      <MicOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ParticipantsList;

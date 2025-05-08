
import React from "react";
import { IAgoraRTCRemoteUser, UID } from "agora-rtc-sdk-ng";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, User, Users } from "lucide-react";
import { useAgora } from "@/context/AgoraContext";

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
  const { isMuted } = useAgora();
  
  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">Participants ({remoteUsers.length + 1})</h3>
      </div>
      
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-1">
          {/* Local User */}
          <div className={`participant ${String(screenShareUserId) === localUserId ? "participant-active" : ""}`}>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 flex justify-between items-center">
              <span className="font-medium">{localUserId} (You)</span>
              {isMuted ? (
                <MicOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Mic className="h-4 w-4 text-primary" />
              )}
            </div>
          </div>
          
          {/* Remote Users */}
          {remoteUsers.map((user) => (
            <div 
              key={user.uid.toString()} 
              className={`participant ${screenShareUserId === user.uid ? "participant-active" : ""}`}
            >
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 flex justify-between items-center">
                <span>User {user.uid.toString()}</span>
                {user.hasAudio ? (
                  <Mic className="h-4 w-4 text-primary" />
                ) : (
                  <MicOff className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ParticipantsList;

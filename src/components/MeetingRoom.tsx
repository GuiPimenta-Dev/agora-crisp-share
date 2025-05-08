
import React from "react";
import { useAgora } from "@/context/AgoraContext";
import ParticipantsList from "@/components/ParticipantsList";
import ScreenShareView from "@/components/ScreenShareView";
import MeetingControls from "@/components/MeetingControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MeetingRoom: React.FC = () => {
  const { 
    agoraState: { remoteUsers, screenShareUserId }, 
    isScreenSharing,
    remoteScreenShareUser
  } = useAgora();

  return (
    <div className="meeting-container bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 h-full">
        {/* Main content - Screen share */}
        <div className="lg:col-span-3 h-full flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-lg">Meeting Room</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <ScreenShareView 
                localSharing={isScreenSharing} 
                remoteScreenUser={remoteScreenShareUser} 
              />
            </CardContent>
          </Card>
          
          {/* Controls */}
          <MeetingControls className="mt-4" />
        </div>
        
        {/* Sidebar - Participants */}
        <div className="lg:col-span-1 h-full">
          <ParticipantsList 
            remoteUsers={remoteUsers} 
            screenShareUserId={screenShareUserId} 
          />
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;


import React from "react";
import { useAgora } from "@/context/AgoraContext";
import ParticipantsList from "@/components/ParticipantsList";
import ScreenShareView from "@/components/ScreenShareView";
import MeetingControls from "@/components/MeetingControls";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio, Download, Copy, Link } from "lucide-react";

const MeetingRoom: React.FC = () => {
  const { 
    agoraState: { remoteUsers, screenShareUserId, isRecording, channelName }, 
    isScreenSharing,
    remoteScreenShareUser,
    generateMeetingLink,
    downloadRecording
  } = useAgora();

  const [linkCopied, setLinkCopied] = React.useState(false);

  const copyLinkToClipboard = () => {
    try {
      const link = generateMeetingLink();
      navigator.clipboard.writeText(link).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      });
    } catch (error) {
      console.error("Error copying link:", error);
    }
  };

  return (
    <div className="meeting-container bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 h-full">
        {/* Main content - Screen share */}
        <div className="lg:col-span-3 h-full flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Meeting Room</CardTitle>
                <CardDescription>{channelName}</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {isRecording && (
                  <Badge variant="destructive" className="flex items-center gap-1 px-3 py-1">
                    <Radio className="h-3.5 w-3.5 animate-pulse" />
                    <span>Recording</span>
                  </Badge>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center gap-1.5"
                  onClick={copyLinkToClipboard}
                >
                  {linkCopied ? (
                    <>Copy</>
                  ) : (
                    <>
                      <Link className="h-3.5 w-3.5" /> 
                      Share Link
                    </>
                  )}
                </Button>
                {isRecording && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1.5"
                    onClick={downloadRecording}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Recording
                  </Button>
                )}
              </div>
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

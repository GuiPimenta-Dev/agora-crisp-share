
import React from "react";
import { useAgora } from "@/context/AgoraContext";
import ParticipantsList from "@/components/ParticipantsList";
import ScreenShareView from "@/components/ScreenShareView";
import MeetingControls from "@/components/MeetingControls";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio, Download, ClipboardCopy, Link, Flame, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <TooltipProvider>
      <div className="meeting-container">
        <div className="absolute inset-0 z-[-1] opacity-20">
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-black to-transparent" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 h-full">
          {/* Main content - Screen share */}
          <div className="lg:col-span-3 h-full flex flex-col">
            <Card className="flex-1 flex flex-col overflow-hidden glass-card video-container">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-black/60">
                <div>
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg sunset-text">SUNSET</CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    Room: {channelName}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {isRecording && (
                    <Badge variant="destructive" className="flex items-center gap-1 px-3 py-1 bg-primary text-black">
                      <Radio className="h-3.5 w-3.5 animate-pulse" />
                      <span>Recording</span>
                    </Badge>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center gap-1.5 border-primary/30 bg-black/40 hover:bg-black/60"
                        onClick={copyLinkToClipboard}
                      >
                        {linkCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-primary" /> Copied!
                          </>
                        ) : (
                          <>
                            <ClipboardCopy className="h-3.5 w-3.5 text-primary" /> 
                            Share Link
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy meeting link to clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                  {isRecording && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1.5 border-primary/30 bg-black/40 hover:bg-black/60"
                          onClick={downloadRecording}
                        >
                          <Download className="h-3.5 w-3.5 text-primary" />
                          Download
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Download recording</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none h-16 z-10" />
                <ScreenShareView 
                  localSharing={isScreenSharing} 
                  remoteScreenUser={remoteScreenShareUser} 
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none h-16" />
              </CardContent>
            </Card>
            
            {/* Controls */}
            <MeetingControls className="mt-4" />
          </div>
          
          {/* Sidebar - Participants */}
          <div className="lg:col-span-1 h-full">
            <ParticipantsList 
              remoteUsers={remoteUsers} 
              screenShareUserId={screenShareUserId ? screenShareUserId.toString() : undefined} 
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default MeetingRoom;

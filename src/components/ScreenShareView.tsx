
import React, { useEffect, useRef } from "react";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { Monitor, Share2 } from "lucide-react";
import { useAgora } from "@/context/AgoraContext";
import { Button } from "@/components/ui/button";

interface ScreenShareViewProps {
  localSharing: boolean;
  remoteScreenUser?: IAgoraRTCRemoteUser;
}

const ScreenShareView: React.FC<ScreenShareViewProps> = ({
  localSharing,
  remoteScreenUser,
}) => {
  const { startScreenShare, stopScreenShare } = useAgora();
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  
  // Handle remote screen share
  useEffect(() => {
    if (remoteScreenUser && remoteScreenUser.videoTrack && remoteVideoRef.current) {
      remoteScreenUser.videoTrack.play(remoteVideoRef.current);
      return () => {
        remoteScreenUser.videoTrack?.stop();
      };
    }
  }, [remoteScreenUser]);
  
  const isScreenBeingShared = localSharing || remoteScreenUser;
  
  return (
    <div className="screen-share-container">
      {isScreenBeingShared ? (
        <div ref={remoteVideoRef} className="w-full h-full" />
      ) : (
        <div className="screen-share-placeholder bg-gradient-to-br from-blue-900/90 to-blue-800/90">
          <div className="flex flex-col items-center gap-4">
            <Monitor className="h-16 w-16 text-blue-300 opacity-70" />
            <div>
              <h3 className="text-xl font-medium mb-2">No screen is being shared</h3>
              <p className="text-blue-200 max-w-md">
                Click the button below to share your screen with high resolution
              </p>
              
              <Button
                className="mt-6"
                onClick={localSharing ? stopScreenShare : startScreenShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Your Screen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenShareView;

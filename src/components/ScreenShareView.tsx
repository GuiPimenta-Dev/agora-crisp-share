
import React from "react";
import { useScreenShare } from "@/hooks/useScreenShare";
import { useFullscreen } from "@/hooks/useFullscreen";
import RemoteScreenDisplay from "@/components/RemoteScreenDisplay";
import LocalScreenDisplay from "@/components/LocalScreenDisplay";
import ScreenSharePlaceholder from "@/components/ScreenSharePlaceholder";
import ScreenShareControls from "@/components/ScreenShareControls";

interface ScreenShareViewProps {
  localSharing: boolean;
  remoteScreenUser?: any; // IAgoraRTCRemoteUser
}

const ScreenShareView: React.FC<ScreenShareViewProps> = ({
  localSharing,
  remoteScreenUser,
}) => {
  // Use our custom hooks
  const { 
    isScreenBeingShared, 
    isOtherUserSharing, 
    isLoading, 
    resolution, 
    setResolution, 
    handleScreenShare, 
    stopScreenShare 
  } = useScreenShare();
  
  const {
    isFullscreen,
    containerRef,
    setContainerRef,
    toggleFullscreen
  } = useFullscreen();
  
  return (
    <div ref={setContainerRef} className="screen-share-container h-full w-full relative rounded-md overflow-hidden">
      {isScreenBeingShared ? (
        <div className="relative w-full h-full">
          {remoteScreenUser ? (
            <RemoteScreenDisplay 
              remoteScreenUser={remoteScreenUser} 
              setResolution={setResolution} 
            />
          ) : localSharing ? (
            <LocalScreenDisplay setResolution={setResolution} />
          ) : null}
          
          <ScreenShareControls 
            resolution={resolution}
            isFullscreen={isFullscreen} 
            toggleFullscreen={toggleFullscreen} 
          />
        </div>
      ) : (
        <ScreenSharePlaceholder 
          isLoading={isLoading}
          isOtherUserSharing={isOtherUserSharing}
          localSharing={localSharing}
          handleScreenShare={handleScreenShare}
          stopScreenShare={stopScreenShare}
        />
      )}
    </div>
  );
};

export default ScreenShareView;


import React, { useEffect, useRef } from "react";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

interface RemoteScreenDisplayProps {
  remoteScreenUser: IAgoraRTCRemoteUser;
  setResolution: (resolution: string) => void;
}

const RemoteScreenDisplay: React.FC<RemoteScreenDisplayProps> = ({
  remoteScreenUser,
  setResolution
}) => {
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (remoteScreenUser && remoteScreenUser.videoTrack && remoteVideoRef.current) {
      // Play the video track in the container
      const remoteVideoElement = document.getElementById("remote-video-player");
      if (remoteVideoElement) {
        remoteScreenUser.videoTrack.play("remote-video-player");
        
        // Move the video player to our container if needed
        setTimeout(() => {
          const playerElement = document.querySelector('.agora_video_player');
          if (playerElement && remoteVideoElement && playerElement.parentElement !== remoteVideoElement) {
            remoteVideoElement.appendChild(playerElement);
          }
        }, 100);
      }
      
      // Try to determine resolution
      const onStats = (stats: any) => {
        if (stats.width && stats.height) {
          const width = stats.width;
          if (width >= 3840) setResolution("4K Ultra HD");
          else if (width >= 2560) setResolution("2K Quad HD");
          else if (width >= 1920) setResolution("Full HD");
          else setResolution("HD");
        }
      };
      
      const statsInterval = setInterval(() => {
        if (remoteScreenUser.videoTrack) {
          // Fix: getStats() returns stats object directly, not a Promise
          const stats = remoteScreenUser.videoTrack.getStats();
          onStats(stats);
        }
      }, 5000);
      
      return () => {
        if (remoteScreenUser.videoTrack) {
          remoteScreenUser.videoTrack.stop();
        }
        clearInterval(statsInterval);
      };
    }
  }, [remoteScreenUser, setResolution]);
  
  return (
    <div ref={remoteVideoRef} className="w-full h-full bg-black">
      <div id="remote-video-player" className="w-full h-full"></div>
    </div>
  );
};

export default RemoteScreenDisplay;

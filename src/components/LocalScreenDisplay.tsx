
import React, { useEffect, useRef } from "react";
import { useAgora } from "@/context/AgoraContext";

interface LocalScreenDisplayProps {
  setResolution: (resolution: string) => void;
}

const LocalScreenDisplay: React.FC<LocalScreenDisplayProps> = ({
  setResolution
}) => {
  const { agoraState } = useAgora();
  const localVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (agoraState.screenVideoTrack && localVideoRef.current) {
      // Play the video track in the container
      const localVideoElement = document.getElementById("local-video-player");
      if (localVideoElement) {
        agoraState.screenVideoTrack.play("local-video-player");
        
        // Move the video player to our container if needed
        setTimeout(() => {
          const playerElement = document.querySelector('.agora_video_player');
          if (playerElement && localVideoElement && playerElement.parentElement !== localVideoElement) {
            localVideoElement.appendChild(playerElement);
          }
        }, 100);
      }
      
      // Try to determine local resolution
      const onStats = (stats: any) => {
        if (stats.captureWidth && stats.captureHeight) {
          const width = stats.captureWidth;
          if (width >= 3840) setResolution("4K Ultra HD");
          else if (width >= 2560) setResolution("2K Quad HD");
          else if (width >= 1920) setResolution("Full HD");
          else setResolution("HD");
        }
      };
      
      const statsInterval = setInterval(() => {
        if (agoraState.screenVideoTrack) {
          // Fix: getStats() returns stats object directly, not a Promise
          const stats = agoraState.screenVideoTrack.getStats();
          onStats(stats);
        }
      }, 5000);
      
      return () => {
        // Cleanup when unmounting only
        if (agoraState.screenVideoTrack) {
          agoraState.screenVideoTrack.stop();
        }
        clearInterval(statsInterval);
      };
    }
  }, [agoraState.screenVideoTrack, setResolution]);
  
  return (
    <div ref={localVideoRef} className="w-full h-full bg-black">
      <div id="local-video-player" className="w-full h-full"></div>
    </div>
  );
};

export default LocalScreenDisplay;

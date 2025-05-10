
import { useState, useEffect } from 'react';

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  
  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef) return;

    if (!isFullscreen) {
      if (containerRef.requestFullscreen) {
        containerRef.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(err => console.error("Falha ao entrar em fullscreen:", err));
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(err => console.error("Falha ao sair do fullscreen:", err));
      }
    }
  };

  return {
    isFullscreen,
    containerRef,
    setContainerRef,
    toggleFullscreen
  };
}

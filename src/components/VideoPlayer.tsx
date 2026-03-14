import { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  videoId: number;
  isRotated: boolean;
  onVideoEnd: () => void;
}

const VIDEO_SOURCES: Record<number, string | null> = {
  0: '/videos/video-0.mp4',
  1: '/videos/video-1.mp4',
  2: '/videos/video-2.mp4',
  3: '/videos/video-3.mp4',
  4: '/videos/video-4.mp4',
  5: null,
};

export function VideoPlayer({ videoId, isRotated, onVideoEnd }: VideoPlayerProps) {
  const videoSrc = VIDEO_SOURCES[videoId];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);

  // Simulated playback for placeholder videos
  useEffect(() => {
    if (videoSrc || !isPlaying || hasEnded) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setHasEnded(true);
          setIsPlaying(false);
          onVideoEnd();
          return 100;
        }
        return prev + 2;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [videoSrc, isPlaying, hasEnded, onVideoEnd]);

  const handlePlay = () => {
    if (hasEnded) return;
    setIsPlaying(true);
    if (videoSrc && videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (v && v.duration) {
      setProgress((v.currentTime / v.duration) * 100);
    }
  };

  const handleVideoEnded = () => {
    setHasEnded(true);
    setIsPlaying(false);
    onVideoEnd();
  };

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-experiment-video-bg aspect-video transition-transform duration-300",
        isRotated && "video-rotate-15"
      )}
    >
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          playsInline
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-primary-foreground/80">
            <p className="text-lg font-medium mb-2">Video {videoId + 1}</p>
            <p className="text-sm opacity-60">Placeholder for interview clip</p>
            {isRotated && (
              <p className="text-xs mt-2 opacity-40">(Displayed at 15° angle)</p>
            )}
          </div>
        </div>
      )}

      {/* Play button overlay */}
      {!isPlaying && !hasEnded && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-foreground/20 hover:bg-foreground/30 transition-colors"
        >
          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
            <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Playing indicator */}
      {isPlaying && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-foreground/50 rounded-full px-3 py-1">
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span className="text-xs text-primary-foreground font-medium">Playing</span>
        </div>
      )}

      {/* Completed indicator */}
      {hasEnded && (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/40">
          <div className="bg-card rounded-lg px-6 py-3 shadow-xl">
            <p className="text-foreground font-medium">Video Complete</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/20">
        <div
          className="h-full bg-primary transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useExperimentStore } from '@/store/experimentStore';
import { Volume2, Play, Square, ArrowRight } from 'lucide-react';

export function SpeakerTest() {
  const { setCurrentStep } = useExperimentStore();
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      setHasPlayed(true);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="experiment-card animate-fade-in text-center">
      <Volume2 className="w-16 h-16 mx-auto mb-6 text-primary" />

      <h1 className="text-2xl font-semibold text-foreground mb-2">
        Speaker Check
      </h1>
      <p className="text-muted-foreground mb-8">
        Please turn your speakers up before continuing. Use the button below to play a test tone and ensure you can hear it clearly.
      </p>

      <audio ref={audioRef} src="/audio/test-tone.mp3" onEnded={handleEnded} />

      <div className="flex justify-center gap-3 mb-8">
        {!isPlaying ? (
          <Button onClick={handlePlay} variant="outline" size="lg">
            <Play className="w-4 h-4 mr-2" />
            Play Test Tone
          </Button>
        ) : (
          <Button onClick={handleStop} variant="outline" size="lg">
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
        )}
      </div>

      {hasPlayed && (
        <div className="animate-fade-in">
          <p className="text-sm text-muted-foreground mb-4">
            Could you hear the tone? If so, you're ready to continue.
          </p>
          <Button onClick={() => setCurrentStep(2)} className="w-full">
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

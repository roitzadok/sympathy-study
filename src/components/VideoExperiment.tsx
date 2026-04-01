import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/VideoPlayer';
import { SympathyRating } from '@/components/SympathyRating';
import { ProgressBar } from '@/components/ProgressBar';
import { useExperimentStore } from '@/store/experimentStore';
import { shouldRotateVideo } from '@/lib/experimentUtils';
import { azureApi } from '@/hooks/useAzureApi';
import { toast } from 'sonner';
import { Loader2, ArrowRight, CheckCircle } from 'lucide-react';

export function VideoExperiment() {
  const { participant, currentStep, setCurrentStep, addResponse } = useExperimentStore();
  const [videoEnded, setVideoEnded] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVideoEnd = useCallback(() => {
    setVideoEnded(true);
  }, []);

  if (!participant) return null;

  const videoStep = currentStep - 1; // steps 2-7 map to video steps 1-6
  const videoIndex = participant.video_order[videoStep - 1];
  const isRotated = shouldRotateVideo(participant.email, videoIndex);
  const isLastVideo = videoStep === 6;

  const handleSubmit = async () => {
    if (rating === null) return;

    setIsSubmitting(true);

    try {
      const { error } = await azureApi.createVideoResponse({
        participant_id: participant.id,
        video_index: videoIndex,
        was_rotated: isRotated,
        sympathy_rating: rating,
        presentation_order: videoStep,
      });

      if (error) throw new Error(error);

      addResponse({
        videoIndex,
        wasRotated: isRotated,
        sympathyRating: rating,
        presentationOrder: videoStep,
      });

        if (isLastVideo) {
          setCurrentStep(8); // Completed state
        toast.success('Thank you for completing the experiment!');
      } else {
        setCurrentStep(currentStep + 1);
        setVideoEnded(false);
        setRating(null);
      }
    } catch (error) {
      console.error('Error saving response:', error);
      toast.error('Failed to save response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="experiment-card animate-fade-in">
      <ProgressBar current={videoStep} total={6} />

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Video {videoStep} of 6
        </h2>
        <p className="text-muted-foreground text-sm">
          Please watch the entire video, then rate how connected you felt towards the person shown.
        </p>
      </div>

      <div className={`mb-8 ${isRotated ? 'py-8 px-4' : ''}`}>
        <VideoPlayer
          key={`video-${videoStep}`}
          videoId={videoIndex}
          isRotated={isRotated}
          onVideoEnd={handleVideoEnd}
        />
      </div>

      {videoEnded && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">
              How sympathetic did you feel towards the person in this video?
            </h3>
            <SympathyRating
              value={rating}
              onChange={setRating}
              disabled={isSubmitting}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={rating === null || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isLastVideo ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Experiment
              </>
            ) : (
              <>
                Next Video
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {!videoEnded && (
        <p className="text-center text-muted-foreground text-sm">
          Click play and watch the full video to continue
        </p>
      )}

      <p className="text-center text-muted-foreground/40 text-[10px] mt-6">id:{videoIndex}</p>
    </div>
  );
}

import { RegistrationForm } from '@/components/RegistrationForm';
import { SpeakerTest } from '@/components/SpeakerTest';
import { VideoExperiment } from '@/components/VideoExperiment';
import { CompletionScreen } from '@/components/CompletionScreen';
import { useExperimentStore } from '@/store/experimentStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { Monitor } from 'lucide-react';

const Index = () => {
  const { currentStep } = useExperimentStore();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <main className="experiment-container">
        <div className="experiment-card animate-fade-in text-center">
          <Monitor className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-semibold text-foreground mb-4">
            Computer Required
          </h1>
          <p className="text-muted-foreground">
            This experiment requires a computer to participate. Please access this page from a desktop or laptop computer.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="experiment-container">
      {currentStep === 0 && (
        <div className="experiment-card animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Behavioral Study
            </h1>
            <p className="text-muted-foreground">
              Welcome to our research experiment. Please provide your information to begin.
            </p>
          </div>

          <RegistrationForm />

          <p className="text-xs text-muted-foreground text-center mt-6">
            Your data will be handled in accordance with our research protocols and kept strictly confidential.
          </p>
        </div>
      )}

      {currentStep === 1 && <SpeakerTest />}

      {currentStep >= 2 && currentStep <= 7 && <VideoExperiment />}

      {currentStep === 8 && <CompletionScreen />}
    </main>
  );
};

export default Index;

import { RegistrationForm } from '@/components/RegistrationForm';
import { VideoExperiment } from '@/components/VideoExperiment';
import { CompletionScreen } from '@/components/CompletionScreen';
import { useExperimentStore } from '@/store/experimentStore';

const Index = () => {
  const { currentStep } = useExperimentStore();

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

      {currentStep >= 1 && currentStep <= 4 && <VideoExperiment />}

      {currentStep === 5 && <CompletionScreen />}
    </main>
  );
};

export default Index;

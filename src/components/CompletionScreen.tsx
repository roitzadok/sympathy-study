import { CheckCircle } from 'lucide-react';

export function CompletionScreen() {
  return (
    <div className="experiment-card animate-scale-in text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-primary" />
      </div>

      <h1 className="text-2xl font-semibold text-foreground mb-4">
        Thank You for Participating
      </h1>

      <p className="text-muted-foreground mb-6">
        Your responses have been recorded successfully. This experiment is now complete.
      </p>

      <div className="bg-muted rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          If you have any questions about this study, please contact the research team.
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SympathyRatingProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function SympathyRating({ value, onChange, disabled }: SympathyRatingProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Not sympathetic</span>
        <span>Very sympathetic</span>
      </div>
      <div className="flex gap-2 justify-center">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => {
          const isSelected = value === rating;
          const isHovered = hoveredValue === rating;
          const isInRange = hoveredValue !== null && rating <= hoveredValue;

          return (
            <button
              key={rating}
              type="button"
              disabled={disabled}
              onClick={() => onChange(rating)}
              onMouseEnter={() => setHoveredValue(rating)}
              onMouseLeave={() => setHoveredValue(null)}
              className={cn(
                "w-10 h-10 rounded-lg font-medium text-sm transition-all duration-200",
                "border-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isSelected
                  ? "bg-experiment-rating-active text-primary-foreground border-experiment-rating-active scale-110"
                  : isHovered || isInRange
                  ? "bg-accent border-accent-foreground/30 text-accent-foreground"
                  : "bg-experiment-rating-inactive border-transparent text-muted-foreground hover:bg-accent",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {rating}
            </button>
          );
        })}
      </div>
    </div>
  );
}

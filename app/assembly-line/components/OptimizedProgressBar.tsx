import { useMemo } from 'react';

interface OptimizedProgressBarProps {
  progress: number;
  className?: string;
}

// Memoized progress bar component to prevent unnecessary re-renders
export const OptimizedProgressBar = ({ progress, className = '' }: OptimizedProgressBarProps) => {
  const progressBarClasses = useMemo(() => {
    return `h-full bg-gradient-to-r from-red-500 to-green-500 rounded-full transition-all duration-1000 ${className}`;
  }, [className]);

  const progressPercentage = useMemo(() => {
    return Math.max(0, Math.min(100, progress));
  }, [progress]);

  return (
    <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
      <div 
        className={progressBarClasses}
        style={{ width: `${progressPercentage}%` }}
      />
    </div>
  );
};

// Memoize to prevent re-renders when parent re-renders
export default OptimizedProgressBar;
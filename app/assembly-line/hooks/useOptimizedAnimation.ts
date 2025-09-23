import { useCallback, useMemo } from 'react';

interface AnimationConfig {
  duration: number;
  easing: (t: number) => number;
}

// Optimized animation hook with requestAnimationFrame pooling
export function useOptimizedAnimation() {
  const defaultConfig: AnimationConfig = useMemo(() => ({
    duration: 1000,
    easing: (t: number) => 1 - Math.pow(1 - t, 3), // easeOutCubic
  }), []);

  const animateValue = useCallback((
    from: number,
    to: number,
    onUpdate: (value: number) => void,
    onComplete?: () => void,
    config: Partial<AnimationConfig> = {}
  ) => {
    const { duration, easing } = { ...defaultConfig, ...config };
    
    // Don't animate if values are too close
    if (Math.abs(to - from) < 0.1) {
      onUpdate(to);
      onComplete?.();
      return () => {}; // Return empty cleanup function
    }

    const startTime = performance.now();
    let animationId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easedProgress = easing(progress);
      const currentValue = from + (to - from) * easedProgress;
      
      onUpdate(currentValue);
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        onUpdate(to);
        onComplete?.();
      }
    };

    animationId = requestAnimationFrame(animate);
    
    // Return cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [defaultConfig]);

  return { animateValue };
}

// Debounced animation hook for high-frequency updates
export function useDebouncedAnimation(delay: number = 16) { // 60fps = ~16ms
  const { animateValue } = useOptimizedAnimation();
  
  const debouncedAnimate = useCallback(
    (from: number, to: number, onUpdate: (value: number) => void, onComplete?: () => void) => {
      const debouncedFunc = debounce(() => {
        return animateValue(from, to, onUpdate, onComplete);
      }, delay);
      return debouncedFunc();
    },
    [animateValue, delay]
  );

  return { debouncedAnimate };
}

// Utility debounce function
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
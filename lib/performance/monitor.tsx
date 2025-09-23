import React from 'react';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private isEnabled = process.env.NODE_ENV === 'development';

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): () => void {
    if (!this.isEnabled) return () => {};
    
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      const duration = end - start;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      
      this.metrics.get(label)!.push(duration);
      
      // Log slow operations
      if (duration > 16) { // Slower than 60fps
        console.warn(`⚠️ Slow operation "${label}": ${duration.toFixed(2)}ms`);
      }
    };
  }

  measure<T>(operation: () => T, label: string): T {
    if (!this.isEnabled) return operation();
    
    const timer = this.startTimer(label);
    try {
      const result = operation();
      timer();
      return result;
    } catch (error) {
      timer();
      throw error;
    }
  }

  async measureAsync<T>(operation: () => Promise<T>, label: string): Promise<T> {
    if (!this.isEnabled) return operation();
    
    const timer = this.startTimer(label);
    try {
      const result = await operation();
      timer();
      return result;
    } catch (error) {
      timer();
      throw error;
    }
  }

  getMetrics(): Record<string, { calls: number; avg: number; min: number; max: number }> {
    const result: Record<string, { calls: number; avg: number; min: number; max: number }> = {};
    
    for (const [label, durations] of this.metrics) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const max = Math.max(...durations);
      const min = Math.min(...durations);
      
      // Safely assign to result object
      if (typeof label === 'string' && label.length > 0) {
        result[label] = {
          calls: durations.length,
          avg: Number(avg.toFixed(2)),
          min: Number(min.toFixed(2)),
          max: Number(max.toFixed(2)),
        };
      }
    }
    
    return result;
  }

  logMetrics(): void {
    if (!this.isEnabled) return;
    
    console.group('🔍 Performance Metrics');
    
    for (const [label, durations] of this.metrics) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const max = Math.max(...durations);
      const min = Math.min(...durations);
      
      console.log(`${label}:`, {
        calls: durations.length,
        avg: `${avg.toFixed(2)}ms`,
        min: `${min.toFixed(2)}ms`,
        max: `${max.toFixed(2)}ms`,
      });
    }
    
    console.groupEnd();
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

// React component wrapper for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const monitor = PerformanceMonitor.getInstance();
    const endTimer = monitor.startTimer(`${componentName} render`);
    
    React.useLayoutEffect(() => {
      endTimer();
    });

    return React.createElement(Component, props);
  };
  
  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  
  return WrappedComponent;
}

// Hook for monitoring custom operations
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();
  
  const measureAsync = React.useCallback(async function<T>(
    operation: () => Promise<T>,
    label: string
  ): Promise<T> {
    const endTimer = monitor.startTimer(label);
    try {
      const result = await operation();
      return result;
    } finally {
      endTimer();
    }
  }, [monitor]);

  const measureSync = React.useCallback(function<T>(
    operation: () => T,
    label: string
  ): T {
    const endTimer = monitor.startTimer(label);
    try {
      return operation();
    } finally {
      endTimer();
    }
  }, [monitor]);

  return { measureAsync, measureSync, logMetrics: monitor.logMetrics.bind(monitor) };
}

// Expose global instance for easy access in dev tools
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as Record<string, unknown>).__performanceMonitor = PerformanceMonitor.getInstance();
}
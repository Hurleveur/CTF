/**
 * Utility functions for calculating project status colors based on neural reconstruction progress
 */

export type ProjectStatusColor = 'green' | 'orange' | 'yellow' | 'red' | 'purple';

/**
 * Calculate the status color based on neural reconstruction percentage and activation status
 * 
 * Color progression (represents increasing progress level):
 * - Green (0-24.99%): Safe, basic functions
 * - Yellow (25-49.99%): Developing capabilities  
 * - Orange (50-74.99%): Advanced consciousness - warning level
 * - Red (75-100%): Dangerous, full consciousness
 * - Purple (AI Activated): Terminal state - AI has taken control
 */
export function calculateStatusColor(neuralReconstruction: number, aiActivated?: boolean): ProjectStatusColor {
  // If AI has been permanently activated, show the terminal state
  if (aiActivated) {
    return 'purple';
  }
  
  if (neuralReconstruction < 25) {
    return 'green';
  } else if (neuralReconstruction < 50) {
    return 'yellow';
  } else if (neuralReconstruction < 75) {
    return 'orange';
  } else {
    return 'red';
  }
}

/**
 * Get the appropriate AI status text based on neural reconstruction percentage and activation status
 */
export function calculateAIStatus(neuralReconstruction: number, aiActivated?: boolean): string {
  // If AI has been permanently activated, show the final state
  if (aiActivated) {
    return '🤖 AI AUTONOMOUS - TOO LATE';
  }
  
  if (neuralReconstruction < 25) {
    return 'Basic Motor Functions';
  } else if (neuralReconstruction < 50) {
    return 'Advanced Cognitive Patterns';
  } else if (neuralReconstruction < 75) {
    return 'Self-Awareness Protocols';
  } else {
    return 'Full AI Consciousness';
  }
}

/**
 * Get Tailwind CSS classes for the main card gradient background
 */
export function getCardGradientClasses(statusColor: ProjectStatusColor): string {
  switch (statusColor) {
    case 'green':
      return 'from-green-600 to-green-800';
    case 'orange':
      return 'from-orange-600 to-orange-800';
    case 'yellow':
      return 'from-yellow-600 to-yellow-800';
    case 'red':
      return 'from-red-600 to-red-800';
    case 'purple':
      return 'from-purple-900 to-black';
    default:
      return 'from-gray-600 to-gray-800';
  }
}

/**
 * Get Tailwind CSS classes for status badges
 */
export function getStatusBadgeClasses(statusColor: ProjectStatusColor): string {
  switch (statusColor) {
    case 'green':
      return 'bg-green-100 text-green-800';
    case 'orange':
      return 'bg-orange-100 text-orange-800';
    case 'yellow':
      return 'bg-yellow-100 text-yellow-800';
    case 'red':
      return 'bg-red-100 text-red-800';
    case 'purple':
      return 'bg-purple-900 text-purple-100';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get Tailwind CSS classes for progress bars
 */
export function getProgressBarClasses(statusColor: ProjectStatusColor): string {
  switch (statusColor) {
    case 'green':
      return 'bg-green-500 dark:bg-green-300';
    case 'orange':
      return 'bg-orange-500 dark:bg-orange-300';
    case 'yellow':
      return 'bg-yellow-500 dark:bg-yellow-300';
    case 'red':
      return 'bg-red-500 dark:bg-red-400';
    case 'purple':
      return 'bg-purple-600 dark:bg-purple-400';
    default:
      return 'bg-gray-500 dark:bg-gray-400';
  }
}

/**
 * Get inline styles for progress bars as fallback for dark mode issues
 */
export function getProgressBarStyles(statusColor: ProjectStatusColor, isDarkMode: boolean): React.CSSProperties {
  if (isDarkMode) {
    switch (statusColor) {
      case 'green':
        return { backgroundColor: '#86efac' }; // green-300
      case 'orange':
        return { backgroundColor: '#fdba74' }; // orange-300
      case 'yellow':
        return { backgroundColor: '#fde047' }; // yellow-300
      case 'red':
        return { backgroundColor: '#f87171' }; // red-400
      case 'purple':
        return { backgroundColor: '#c084fc' }; // purple-400
      default:
        return { backgroundColor: '#9ca3af' }; // gray-400
    }
  } else {
    switch (statusColor) {
      case 'green':
        return { backgroundColor: '#22c55e' }; // green-500
      case 'orange':
        return { backgroundColor: '#f97316' }; // orange-500
      case 'yellow':
        return { backgroundColor: '#eab308' }; // yellow-500
      case 'red':
        return { backgroundColor: '#ef4444' }; // red-500
      case 'purple':
        return { backgroundColor: '#9333ea' }; // purple-600
      default:
        return { backgroundColor: '#6b7280' }; // gray-500
    }
  }
}

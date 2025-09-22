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
      return 'bg-green-600';
    case 'orange':
      return 'bg-orange-600';
    case 'yellow':
      return 'bg-yellow-600';
    case 'red':
      return 'bg-red-600';
    case 'purple':
      return 'bg-purple-900';
    default:
      return 'bg-gray-600';
  }
}

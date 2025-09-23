'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { calculateStatusColor, getProgressBarClasses } from '@/lib/project-colors';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  hints?: string[];
}


interface AdvancedChallengesPanelProps {
  challenges: Challenge[];
  completedChallengeIds?: Set<string>;
  isLoadingSubmissions?: boolean;
  teamSubmissions?: Record<string, {
    challengeId: string;
    completedBy: Array<{
      userId: string;
      userName: string;
      submittedAt: string;
      pointsAwarded: number;
    }>;
    challenge: {
      id: string;
      title: string;
      category: string;
      difficulty: string;
      points: number;
    } | null;
  }>;
  teamMembers?: Array<{
    id: string;
    name: string;
    email: string;
    isLead: boolean;
    joinedAt: string;
    isCurrentUser: boolean;
    totalPoints?: number;
  }>;
}

const categoryIcons: { [key: string]: string } = {
  web: '🌐',
  crypto: '🔐',
  reverse: '⚙️',
  forensics: '🔍',
  pwn: '💣',
  misc: '🤖',
  default: '🎯'
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
    case 'medium':
      return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700';
    case 'hard':
      return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600';
  }
};

const getCategoryColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'web':
      return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700';
    case 'crypto':
      return 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700';
    case 'reverse':
      return 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700';
    case 'forensics':
      return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700';
    case 'pwn':
      return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600';
  }
};


export default function AdvancedChallengesPanel({ 
  challenges, 
  completedChallengeIds = new Set(),
  isLoadingSubmissions = false,
  teamSubmissions = {},
  teamMembers = []
}: AdvancedChallengesPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isFirstTimeReveal, setIsFirstTimeReveal] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());

  // Helper function to calculate team-wide completion count
  const getTeamCompletionCount = () => {
    const teamCompletedChallenges = new Set();
    
    // Add personal completions
    completedChallengeIds.forEach(id => teamCompletedChallenges.add(id));
    
    // Add team member completions
    Object.keys(teamSubmissions).forEach(challengeId => {
      if (Object.prototype.hasOwnProperty.call(teamSubmissions, challengeId)) {
        const submission = teamSubmissions[challengeId];
        if (submission && submission.completedBy.length > 0) {
          teamCompletedChallenges.add(challengeId);
        }
      }
    });
    
    return teamCompletedChallenges.size;
  };

  // Check if this is the first time seeing advanced challenges
  useEffect(() => {
    const hasSeenAdvancedChallenges = localStorage.getItem('hasSeenAdvancedChallenges');
    
    if (challenges && challenges.length > 0) {
      if (!hasSeenAdvancedChallenges) {
        // First time seeing advanced challenges - show the dramatic reveal
        setIsFirstTimeReveal(true);
        // Mark as seen in localStorage
        localStorage.setItem('hasSeenAdvancedChallenges', 'true');
        localStorage.setItem('advancedChallengesFirstSeen', new Date().toISOString());
      } else {
        // User has seen this before - no dramatic effects
        setIsFirstTimeReveal(false);
      }
    }
  }, [challenges]);

  // Initialize and resume AudioContext after user gesture
  const initializeAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      return audioContext;
    } catch (error) {
      console.warn('Could not initialize audio context:', error);
      return null;
    }
  };

  // Play alarm sound using Web Audio API (only after user gesture)
  const playAlarmSound = useCallback(async () => {
    try {
      let audioContext = audioContextRef.current;
      
      // Initialize audio context if not already done
      if (!audioContext || audioContext.state === 'suspended') {
        audioContext = await initializeAudio();
        if (!audioContext) return;
      }
      
      // Create a series of beeps for alarm effect
      const playBeep = (frequency: number, duration: number, delay: number) => {
        setTimeout(() => {
          if (!audioContext || audioContext.state !== 'running') return;
          
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = 'square'; // More robotic/alarm-like sound
          
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration);
        }, delay);
      };
      
      // Create alarm pattern: high-low-high beeps
      playBeep(800, 0.2, 0);     // High beep
      playBeep(400, 0.2, 300);   // Low beep
      playBeep(800, 0.2, 600);   // High beep
      playBeep(400, 0.3, 900);   // Low beep (longer)
      
    } catch (error) {
      console.warn('Could not play alarm sound:', error);
    }
  }, []);

  // Listen for terminal challenges unlock event
  useEffect(() => {
    const handleTerminalUnlock = (event: CustomEvent) => {
      console.log('🔓 Terminal challenges unlocked! Triggering reveal animation...', event.detail);
      playAlarmSound();
      
      // Scroll to panel
      if (panelRef.current) {
        panelRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    };

    const handleAIUnlock = (event: CustomEvent) => {
      console.log('🤖 AI challenges unlocked! Triggering reveal animation...', event.detail);
      playAlarmSound();
      
      // Scroll to panel
      if (panelRef.current) {
        panelRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    };

    window.addEventListener('terminalChallengesUnlocked', handleTerminalUnlock as EventListener);
    window.addEventListener('aiChallengesUnlocked', handleAIUnlock as EventListener);

    return () => {
      window.removeEventListener('terminalChallengesUnlocked', handleTerminalUnlock as EventListener);
      window.removeEventListener('aiChallengesUnlocked', handleAIUnlock as EventListener);
    };
  }, [playAlarmSound]);

  // Handle card click to reveal description
  const handleCardClick = (challengeId: string) => {
    setRevealedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(challengeId)) {
        newSet.delete(challengeId); // Toggle off if already revealed
      } else {
        newSet.add(challengeId); // Reveal
      }
      return newSet;
    });
  };

  // Utility function to reset first-time experience (for testing/debugging)
  const resetFirstTimeExperience = () => {
    localStorage.removeItem('hasSeenAdvancedChallenges');
    localStorage.removeItem('advancedChallengesFirstSeen');
    console.log('🔄 First-time experience reset - next visit will trigger dramatic reveal');
  };

  // Add to window for debugging (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as unknown as { resetAdvancedChallengesExperience: () => void }).resetAdvancedChallengesExperience = resetFirstTimeExperience;
      console.log('🛠️ Debug: Use window.resetAdvancedChallengesExperience() to reset first-time experience');
    }
  }, []);

  // Scroll to panel and trigger effects when it becomes visible (only first time)
  useEffect(() => {
    if (challenges && challenges.length > 0 && isFirstTimeReveal) {
      // Slight delay to ensure DOM is ready
      setTimeout(async () => {
        console.log('🚨 First time seeing advanced challenges - triggering dramatic reveal!');
        
        // Auto-play alarm sound when challenges first appear
        // This works because the code completion reaching 100% requires user interaction (form submission)
        // which satisfies the browser's user gesture requirement for audio
        await playAlarmSound();
        
        // Scroll to panel
        if (panelRef.current) {
          panelRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
        
      }, 100);
    }
  }, [challenges, isFirstTimeReveal, playAlarmSound]);

  // No longer fetching submissions here - using data passed from parent component

  // Cleanup AudioContext on component unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(error => {
          console.warn('Error closing AudioContext:', error);
        });
      }
    };
  }, []);

  if (!challenges || challenges.length === 0) {
    return null;
  }

  // Sort challenges by points (lowest to highest) for a logical progression
  const sortedChallenges = [...challenges].sort((a, b) => a.points - b.points);

  return (
    <>
      {/* Enhanced Panel with Attention-Grabbing Effects */}
      <div 
        ref={panelRef}
        className={`mt-8 p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border-2 transition-all duration-1000 ${
          isFirstTimeReveal 
            ? 'border-blue-500 shadow-2xl shadow-blue-500/50 animate-pulse' 
            : 'border-blue-200 dark:border-gray-600'
        }`}
        style={{
          animation: isFirstTimeReveal 
            ? 'glow 2s ease-in-out infinite alternate, shake 0.5s ease-in-out 3' 
            : undefined
        }}
      >
      {/* Simplified Header */}
      <div className="bg-blue-900 text-white text-center py-3 rounded-md shadow-md mb-6">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-lg">⚠️</span>
          <h3 className="text-base font-semibold tracking-wide">
            CHALLENGES DETECTED
          </h3>
          <span className="text-lg">⚠️</span>
        </div>
        
        {/* Team Status */}
        {teamMembers.length > 0 && (
          <div className="mt-2 text-center">
            <div className="inline-flex items-center space-x-2 bg-white/15 rounded-full px-3 py-1">
              <span className="text-xs font-medium">👥 Team:</span>
              <span className="text-xs font-semibold">
                {teamMembers.map(member => member.name).join(', ')}
              </span>
              <span className="text-xs opacity-70">
                ({teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''})
              </span>
            </div>
          </div>
        )}
        
        {/* Progress Summary */}
        <div className="flex items-center justify-center space-x-4 mt-2">
          <p className="text-sm opacity-90">
            Neural reconstruction has unlocked elite-level missions
          </p>
          {!isLoadingSubmissions && (
            <div className="bg-white/20 rounded-full px-3 py-1">
              <span className="text-xs font-bold">
                {getTeamCompletionCount()}/{sortedChallenges.length} COMPLETED
              </span>
            </div>
          )}
        </div>
        
        {/* Completion Progress Bar */}
        {!isLoadingSubmissions && sortedChallenges.length > 0 && (
          <div className="mt-2 mx-auto w-48 bg-white/20 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressBarClasses(calculateStatusColor((getTeamCompletionCount() / sortedChallenges.length) * 100))}`}
              style={{width: `${(getTeamCompletionCount() / sortedChallenges.length) * 100}%`}}
              role="progressbar"
              aria-valuenow={getTeamCompletionCount()}
              aria-valuemax={sortedChallenges.length}
              aria-valuemin={0}
            ></div>
          </div>
        )}
        
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedChallenges.map((challenge, index) => {
          const isCompleted = completedChallengeIds.has(challenge.id);
          const isCompletedByTeam = teamSubmissions[challenge.id] && teamSubmissions[challenge.id].completedBy.length > 0;
          const isRevealed = revealedCards.has(challenge.id) || isCompleted || isCompletedByTeam; // Auto-reveal if completed by anyone
          
          // Determine card styling based on completion status
          let cardStyle = '';
          let hoverEffect = '';
          
          if (isCompleted) {
            // Completed by current user - green
            cardStyle = 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-gray-800';
            hoverEffect = 'hover:border-green-500 dark:hover:border-green-500';
          } else if (isCompletedByTeam) {
            // Completed by team member - blue
            cardStyle = 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-gray-800';
            hoverEffect = 'hover:border-blue-500 dark:hover:border-blue-500';
          } else {
            // Not completed - red
            cardStyle = 'border-red-300 dark:border-red-600 bg-white dark:bg-gray-800';
            hoverEffect = 'hover:border-orange-400 dark:hover:border-orange-500';
          }
          
          return (
            <div
              key={challenge.id}
              className={`border-2 rounded-lg p-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 group relative cursor-pointer ${cardStyle} ${hoverEffect}`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => handleCardClick(challenge.id)}
              aria-expanded={isRevealed}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(challenge.id);
                }
              }}
            >
              {/* Completion Status Badge */}
              {isCompleted && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              {/* Team Completion Badge */}
              {!isCompleted && isCompletedByTeam && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg z-10" title="Completed by team member">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              {/* Header Row: Icon, Title, Points */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {/* Smaller Challenge Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm transition-all duration-500 flex-shrink-0 ${
                    isCompleted 
                      ? 'bg-gradient-to-br from-green-500 to-green-600 group-hover:animate-bounce' 
                      : isCompletedByTeam
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 group-hover:animate-pulse'
                      : 'bg-gradient-to-br from-red-500 to-orange-500 group-hover:animate-spin'
                  }`}>
                    {isCompleted ? '✓' : isCompletedByTeam ? '👥' : (categoryIcons[challenge.category] || categoryIcons.default)}
                  </div>
                  
                  {/* Title */}
                  <h4 className={`text-sm font-bold line-clamp-1 flex-1 ${
                    isCompleted ? 'text-green-800 dark:text-green-200' : isCompletedByTeam ? 'text-blue-800 dark:text-blue-200' : 'text-gray-900 dark:text-white'
                  }`}>
                    {challenge.title}
                  </h4>
                </div>
                
                {/* Points */}
                <span className={`text-sm font-bold ml-2 flex-shrink-0 ${
                  isCompleted ? 'text-green-600 dark:text-green-400' : isCompletedByTeam ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {challenge.points}pts
                </span>
              </div>
            
            {/* Description - More Space */}
            <p className={`text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-3 leading-relaxed transition-all duration-300 select-none ${
              isRevealed ? '' : 'obscured-text'
            }`}>
              {isRevealed ? challenge.description : '████████ ████ ██████ ███████ █████ ███ ████████ ████ ██████ ███████'}
            </p>
            
            {/* Click to reveal indicator */}
            {!isRevealed && (
              <div className="text-center mb-2">
                <span className="text-xs text-red-500 dark:text-red-400 font-medium animate-pulse">
                  🔒 Click to decrypt mission details
                </span>
              </div>
            )}

            {/* Team Completion Info */}
            {teamSubmissions[challenge.id] && teamSubmissions[challenge.id].completedBy.length > 0 && (
              <div className="mb-3 p-2 bg-blue-50 dark:bg-gray-700/50 rounded border border-blue-200 dark:border-blue-700">
                <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                  👥 Team Completions ({teamSubmissions[challenge.id].completedBy.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {teamSubmissions[challenge.id].completedBy.map((completion, idx) => (
                    <span 
                      key={`${completion.userId}-${idx}`}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-700"
                      title={`Completed on ${new Date(completion.submittedAt).toLocaleDateString()} - ${completion.pointsAwarded} points`}
                    >
                      {completion.userName}
                      {completion.pointsAwarded > 0 && (
                        <span className="ml-1 text-blue-600 dark:text-blue-400 font-medium">
                          +{completion.pointsAwarded}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Compact Badges Row */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getCategoryColor(challenge.category)}`}>
                  {challenge.category.toUpperCase()}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getDifficultyColor(challenge.difficulty)}`}>
                  {challenge.difficulty.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Hover Effect - Glow */}
            <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none ${
              isCompleted
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : isCompletedByTeam
                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                : 'bg-gradient-to-r from-red-500 to-orange-500'
            }`}></div>
          </div>
        )})}
      </div>

        {/* Footer Message */}
        <div className="mt-6 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-700 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
            <strong>⚠️ WARNING:</strong> These advanced protocols require enhanced AI consciousness levels. 
            Proceed with caution as failure may result in neural pathway corruption.
          </p>
        </div>
      </div>
      
      {/* Custom CSS Animations */}
      <style jsx>{`
        @keyframes glow {
          from {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
          }
          to {
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.8);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        
        .obscured-text {
          filter: blur(4px);
          text-shadow: 0 0 8px rgba(128, 128, 128, 0.5);
          pointer-events: none;
          background: linear-gradient(45deg, #6b7280, #9ca3af, #6b7280);
          background-size: 200% 200%;
          animation: shimmer 2s ease-in-out infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        @keyframes shimmer {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </>
  );
}

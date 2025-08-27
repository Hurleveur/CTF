'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  hints?: string[];
}

interface UserSubmission {
  challenge_id: string;
  points_awarded: number;
  submitted_at: string;
  challenges: {
    title: string;
    category: string;
    difficulty: string;
  };
}

interface AdvancedChallengesPanelProps {
  challenges: Challenge[];
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
      return 'bg-green-100 text-green-800 border-green-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'hard':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getCategoryColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'web':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'crypto':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'reverse':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'forensics':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'pwn':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Function to get the actual challenge URL based on title/content
const getChallengeUrl = (challenge: Challenge): string => {
  const title = challenge.title.toLowerCase();
  
  // Map specific challenges to their actual locations
  if (title.includes('admin terminal') || title.includes('terminal')) {
    return '/admin-terminal?access=?';
  }
  
  if (title.includes('alexandre') || title.includes('account') || title.includes('password')) {
    return '/login?challenge=alexandre';
  }
  
  // Default fallback
  return `/challenges/${challenge.id}`;
};

export default function AdvancedChallengesPanel({ challenges }: AdvancedChallengesPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isFirstTimeReveal, setIsFirstTimeReveal] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

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
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Resume AudioContext if it's in suspended state
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      setAudioEnabled(true);
      return audioContext;
    } catch (error) {
      console.warn('Could not initialize audio context:', error);
      return null;
    }
  };

  // Play alarm sound using Web Audio API (only after user gesture)
  const playAlarmSound = async () => {
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
  };

  // Handle user click to enable audio and play sound
  const handleEnableAudio = async () => {
    await initializeAudio();
    await playAlarmSound();
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
      (window as any).resetAdvancedChallengesExperience = resetFirstTimeExperience;
      console.log('🛠️ Debug: Use window.resetAdvancedChallengesExperience() to reset first-time experience');
    }
  }, []);

  // Scroll to panel and trigger effects when it becomes visible (only first time)
  useEffect(() => {
    if (challenges && challenges.length > 0 && isFirstTimeReveal) {
      // Slight delay to ensure DOM is ready
      setTimeout(() => {
        // Trigger flash effect
        setFlashEffect(true);
        
        console.log('🚨 First time seeing advanced challenges - triggering dramatic reveal!');
        
        // Note: Audio requires user gesture, so we don't auto-play here
        // playAlarmSound() will be called when user interacts with the panel
        
        // Scroll to panel
        if (panelRef.current) {
          panelRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
        
        // Remove flash effect after animation
        setTimeout(() => {
          setFlashEffect(false);
          // Don't set isFirstTimeReveal to false here, let localStorage handle it
        }, 1000);
        
      }, 100);
    }
  }, [challenges, isFirstTimeReveal]);

  // Fetch user submissions to determine completed challenges
  useEffect(() => {
    const fetchUserSubmissions = async () => {
      if (!challenges || challenges.length === 0) return;
      
      setIsLoadingSubmissions(true);
      
      try {
        console.log('🔍 Fetching user profile to check completed challenges...');
        
        const response = await fetch('/api/profile');
        
        if (response.ok) {
          const data = await response.json();
          
          // Extract challenge IDs from recent submissions (completed ones)
          const completedIds = new Set<string>();
          
          if (data.recent_submissions && Array.isArray(data.recent_submissions)) {
            data.recent_submissions.forEach((submission: any) => {
              if (submission.challenges) {
                // For recent submissions, we need to find the challenge ID by matching title
                const matchingChallenge = challenges.find(c => 
                  c.title.toLowerCase() === submission.challenges.title.toLowerCase()
                );
                if (matchingChallenge) {
                  completedIds.add(matchingChallenge.id);
                }
              }
            });
          }
          
          console.log(`✅ Found ${completedIds.size} completed challenges:`, Array.from(completedIds));
          setCompletedChallenges(completedIds);
          
        } else if (response.status === 401) {
          console.log('ℹ️ User not authenticated for submissions check');
        } else {
          console.log('⚠️ Failed to fetch user profile:', response.status);
        }
      } catch (error) {
        console.error('❌ Error fetching user submissions:', error);
      } finally {
        setIsLoadingSubmissions(false);
      }
    };
    
    fetchUserSubmissions();
  }, [challenges]);

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

  return (
    <>
      {/* Enhanced Panel with Attention-Grabbing Effects */}
      <div 
        ref={panelRef}
        className={`mt-8 p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border-2 transition-all duration-1000 ${
          isFirstTimeReveal 
            ? 'border-red-500 shadow-2xl shadow-red-500/50 animate-pulse' 
            : 'border-red-200'
        }`}
        style={{
          animation: isFirstTimeReveal 
            ? 'glow 2s ease-in-out infinite alternate, shake 0.5s ease-in-out 3' 
            : undefined
        }}
      >
      {/* Simplified Header */}
      <div className="bg-red-600 text-white text-center py-3 rounded-md shadow-lg mb-6">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-xl">🚨</span>
          <h3 className="text-lg font-bold tracking-wider">
            CHALLENGES DETECTED
          </h3>
          <span className="text-xl">🚨</span>
        </div>
        
        {/* Progress Summary */}
        <div className="flex items-center justify-center space-x-4 mt-2">
          <p className="text-sm opacity-90">
            Neural reconstruction has unlocked elite-level missions
          </p>
          {!isLoadingSubmissions && (
            <div className="bg-white/20 rounded-full px-3 py-1">
              <span className="text-xs font-bold">
                {completedChallenges.size}/{challenges.length} COMPLETED
              </span>
            </div>
          )}
        </div>
        
        {/* Completion Progress Bar */}
        {!isLoadingSubmissions && challenges.length > 0 && (
          <div className="mt-2 mx-auto w-48 bg-white/20 rounded-full h-2">
            <div 
              className="bg-green-400 h-2 rounded-full transition-all duration-500"
              style={{width: `${(completedChallenges.size / challenges.length) * 100}%`}}
            ></div>
          </div>
        )}
        
        {/* Audio Enable Button */}
        {!audioEnabled && (
          <button
            onClick={handleEnableAudio}
            className="mt-2 px-3 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-yellow-900 rounded-full font-medium transition-colors duration-200 shadow-sm"
          >
            🔊 Enable Alert Sounds
          </button>
        )}
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.map((challenge, index) => {
          const isCompleted = completedChallenges.has(challenge.id);
          return (
            <div
              key={challenge.id}
              className={`bg-white border-2 rounded-lg p-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 group relative ${
                isCompleted 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-red-300 hover:border-orange-400'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Completion Status Badge */}
              {isCompleted && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
                      : 'bg-gradient-to-br from-red-500 to-orange-500 group-hover:animate-spin'
                  }`}>
                    {isCompleted ? '✓' : (categoryIcons[challenge.category] || categoryIcons.default)}
                  </div>
                  
                  {/* Title */}
                  <h4 className={`text-sm font-bold line-clamp-1 flex-1 ${
                    isCompleted ? 'text-green-800' : 'text-gray-900'
                  }`}>
                    {challenge.title}
                  </h4>
                </div>
                
                {/* Points */}
                <span className={`text-sm font-bold ml-2 flex-shrink-0 ${
                  isCompleted ? 'text-green-600' : 'text-red-600'
                }`}>
                  {challenge.points}pts
                </span>
              </div>
            
            {/* Description - More Space */}
            <p className="text-xs text-gray-600 mb-3 line-clamp-3 leading-relaxed">
              {challenge.description}
            </p>

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
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-red-500 to-orange-500 pointer-events-none"></div>
          </div>
        )})}
      </div>

        {/* Footer Message */}
        <div className="mt-6 p-3 bg-red-100 border border-red-400 rounded-lg">
          <p className="text-xs text-red-800 text-center">
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
      `}</style>
    </>
  );
}

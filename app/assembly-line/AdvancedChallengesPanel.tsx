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

export default function AdvancedChallengesPanel({ challenges }: AdvancedChallengesPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isNewlyVisible, setIsNewlyVisible] = useState(true);
  const [flashEffect, setFlashEffect] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play alarm sound using Web Audio API
  const playAlarmSound = () => {
    try {
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Create a series of beeps for alarm effect
      const playBeep = (frequency: number, duration: number, delay: number) => {
        setTimeout(() => {
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

  // Scroll to panel and trigger effects when it becomes visible
  useEffect(() => {
    if (challenges && challenges.length > 0 && isNewlyVisible) {
      // Slight delay to ensure DOM is ready
      setTimeout(() => {
        // Trigger flash effect
        setFlashEffect(true);
        
        // Play alarm sound
        playAlarmSound();
        
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
          setIsNewlyVisible(false);
        }, 1000);
        
      }, 100);
    }
  }, [challenges, isNewlyVisible]);

  if (!challenges || challenges.length === 0) {
    return null;
  }

  return (
    <>
      {/* Enhanced Panel with Attention-Grabbing Effects */}
      <div 
        ref={panelRef}
        className={`mt-8 p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border-2 transition-all duration-1000 ${
          isNewlyVisible 
            ? 'border-red-500 shadow-2xl shadow-red-500/50 animate-pulse' 
            : 'border-red-200'
        }`}
        style={{
          animation: isNewlyVisible 
            ? 'glow 2s ease-in-out infinite alternate, shake 0.5s ease-in-out 3' 
            : undefined
        }}
      >
      {/* Simplified Header */}
      <div className="bg-red-600 text-white text-center py-3 rounded-md shadow-lg mb-6">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-xl">🚨</span>
          <h3 className="text-lg font-bold tracking-wider">
            ADVANCED CHALLENGE PROTOCOLS DETECTED
          </h3>
          <span className="text-xl">🚨</span>
        </div>
        <p className="text-sm opacity-90 mt-1">
          Neural reconstruction has unlocked elite-level missions
        </p>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.map((challenge, index) => (
          <div
            key={challenge.id}
            className="bg-white border-2 border-red-300 hover:border-orange-400 rounded-lg p-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 group"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start space-x-3">
              {/* Challenge Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xl group-hover:animate-spin transition-all duration-500">
                  {categoryIcons[challenge.category] || categoryIcons.default}
                </div>
              </div>

              {/* Challenge Details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 truncate mb-2">
                  {challenge.title}
                </h4>
                
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {challenge.description}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(challenge.category)}`}>
                    {challenge.category.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty.toUpperCase()}
                  </span>
                </div>

                {/* Points and Action */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-red-600">
                    {challenge.points} pts
                  </span>
                  
                  <Link
                    href={`/challenges/${challenge.id}`}
                    className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200 transform hover:scale-110 hover:shadow-lg"
                  >
                    ENGAGE
                  </Link>
                </div>
              </div>
            </div>

            {/* Hover Effect - Glow */}
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-red-500 to-orange-500 pointer-events-none"></div>
          </div>
        ))}
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

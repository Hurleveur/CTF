'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CookieConsentBannerProps {
  onAccept?: () => void;
  onDecline?: () => void;
  onCustomize?: () => void;
}

export default function CookieConsentBanner({ onAccept, onDecline, onCustomize }: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [terminalText, setTerminalText] = useState('');
  
  // Terminal typing effect text
  const fullText = "INITIALIZING COOKIE PROTOCOLS...";
  
  useEffect(() => {
    // Check if user has already made a choice
    const consentStatus = localStorage.getItem('rt-cookie-consent');
    if (!consentStatus) {
      // Small delay before showing banner
      setTimeout(() => {
        setIsVisible(true);
        // Start terminal typing animation
        typeTerminalText();
      }, 1000);
    }
  }, []);

  const typeTerminalText = () => {
    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTerminalText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 100);
  };

  const handleAccept = () => {
    setIsAnimating(true);
    setTerminalText("✅ DATA-CORE MODULES ACTIVATED");
    
    // Store consent
    localStorage.setItem('rt-cookie-consent', 'functional');
    
    setTimeout(() => {
      setIsVisible(false);
      onAccept?.();
    }, 1500);
  };

  const handleDecline = () => {
    setIsAnimating(true);
    setTerminalText("⚠️ OPERATING IN MINIMAL MODE");
    
    // Store declined consent
    localStorage.setItem('rt-cookie-consent', 'declined');
    
    setTimeout(() => {
      setIsVisible(false);
      onDecline?.();
    }, 1500);
  };

  const handleCustomize = () => {
    setTerminalText("🔧 ACCESSING PRIVACY CONTROL PANEL...");
    
    setTimeout(() => {
      setIsVisible(false);
      onCustomize?.();
    }, 1000);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      {/* Backdrop blur effect */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" />
      
      {/* Main banner container */}
      <div className="relative w-full max-w-4xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border border-blue-400/30 rounded-lg shadow-2xl pointer-events-auto animate-slide-up">
        {/* Animated border glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-blue-400/20 rounded-lg blur-sm animate-pulse" />
        
        {/* Content */}
        <div className="relative p-6 lg:p-8">
          {/* Header with robot icon */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center animate-bounce">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">RoboTech Data-Core Initiative</h3>
                <p className="text-blue-300 text-sm">Privacy & Cookie Management System</p>
              </div>
            </div>
          </div>

          {/* Terminal-style status display */}
          <div className="bg-black border border-green-500 rounded-md p-3 mb-6 font-mono text-sm">
            <div className="text-green-400">
              <span className="animate-pulse">$</span> {terminalText}
              <span className="animate-blink text-green-300">▊</span>
            </div>
          </div>

          {/* Main message */}
          <div className="mb-6 text-gray-200">
            <p className="text-lg mb-3">
              🤖 <strong className="text-white">RoboTech Mainframe</strong> needs essential system cookies to keep your session online and secure. 
            </p>
            <p className="text-base mb-3">
              Our optional <strong className="text-cyan-300">Data-Core modules</strong> can store your robotics project configurations and preferences locally in your device&apos;s memory banks for enhanced user experience.
            </p>
            <p className="text-sm text-blue-300">
              Essential cookies: Required for authentication and security. 
              <br />
              Data-Core modules: Store your project data locally (optional).
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button
              onClick={handleAccept}
              disabled={isAnimating}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>🚀</span>
              <span>Activate All Modules</span>
            </button>
            
            <button
              onClick={handleDecline}
              disabled={isAnimating}
              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>⚠️</span>
              <span>Essential Only</span>
            </button>
            
            <button
              onClick={handleCustomize}
              disabled={isAnimating}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
            >
              <span>⚙️</span>
              <span>Customize</span>
            </button>
          </div>

          {/* Privacy policy link */}
          <div className="text-center">
            <Link 
              href="/privacy" 
              className="text-blue-300 hover:text-blue-200 text-sm underline transition-colors"
            >
              📋 Read our Privacy Control Manual
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        <div className="absolute top-2 right-8 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-yellow-400 rounded-full animate-bounce" />
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import { calculateAIStatus } from '@/lib/project-colors';
import ThemeToggle from './ThemeToggle';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [konamiUnlocked, setKonamiUnlocked] = useState(false);
  const [, setKeySequence] = useState<string[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const { stats, project, profile } = useUserData();
  
  // Konami Code: Up Up Down Down Left Right Left Right B A
  // Support both QWERTY (B, A) and AZERTY (B, Q) keyboard layouts
  const konamiCodes = useMemo(() => ({
    qwerty: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'],
    azerty: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyQ']
  }), []);
  
  // Debug auth state changes in Navigation
  useEffect(() => {
    console.log('🧭 Navigation: Auth state changed - isAuthenticated:', isAuthenticated, 'user:', user?.email || 'none');
  }, [isAuthenticated, user]);

  // Konami code detection
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    console.log('🔑 Key pressed:', event.code);
    setKeySequence(prev => {
      const newSequence = [...prev, event.code].slice(-konamiCodes.qwerty.length);
      
      // Check for QWERTY sequence
      const isQWERTYMatch = newSequence.length === konamiCodes.qwerty.length && 
                           // eslint-disable-next-line security/detect-object-injection
                           newSequence.every((key, index) => key === konamiCodes.qwerty[index]);
      
      // Check for AZERTY sequence
      const isAZERTYMatch = newSequence.length === konamiCodes.azerty.length && 
                           // eslint-disable-next-line security/detect-object-injection
                           newSequence.every((key, index) => key === konamiCodes.azerty[index]);
      
      // Activate if either keyboard layout matches
      if (isQWERTYMatch || isAZERTYMatch) {
        setKonamiUnlocked(true);
        console.log('🎮 Konami Code Activated!');
        // Clear sequence after activation
        return [];
      }
      
      return newSequence;
    });
  }, [konamiCodes]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll detection for sticky navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`
      fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out
      ${isScrolled 
        ? 'bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl shadow-2xl shadow-gray-900/5 dark:shadow-black/20 border-b border-gray-200/30 dark:border-gray-700/30' 
        : 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-lg shadow-gray-900/5 dark:shadow-black/10 border-b border-gray-200/50 dark:border-gray-700/50'
      }
    `}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center transition-all duration-500 ${isScrolled ? 'h-14' : 'h-16'}`}>
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mr-3 transition-all duration-300 group-hover:from-blue-700 group-hover:to-blue-800 group-hover:shadow-xl group-hover:shadow-blue-500/25 group-hover:scale-105 relative overflow-hidden">
                  {/* Subtle shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <svg className="w-6 h-6 text-white transition-transform duration-300 group-hover:rotate-12 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                    {/* Robotic arm base */}
                    <rect x="7" y="20" width="10" height="2.5" rx="1.2" />
                    <rect x="8" y="17.5" width="8" height="2.5" rx="0.8" />
                    {/* Main arm segments */}
                    <circle cx="12" cy="16" r="2" />
                    <rect x="10.5" y="8" width="3" height="8" rx="1.5" />
                    <circle cx="12" cy="7" r="1.8" />
                    <rect x="10.5" y="2" width="3" height="6" rx="1.5" transform="rotate(-35 12 7)" />
                    <circle cx="15" cy="3.7" r="1.3" />
                    {/* Connecting arm to gripper */}
                    <rect x="10.5" y="2.5" width="4.5" height="2.5" rx="0.5" />
                    {/* Gripper/end effector */}
                    <path d="M17 3 L20.5 3 L15.5 3.5 Z" />
                    <path d="M17 5 L20.5 5 L15.5 4.5 Z" />
                  </svg>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent transition-all duration-300 group-hover:from-blue-600 group-hover:to-blue-500 dark:group-hover:from-blue-400 dark:group-hover:to-blue-300">RoboTech Industries</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex ml-10">
              <div className="flex items-baseline space-x-1">
                <Link href="/about" className="relative text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-sm font-medium transition-all duration-300 rounded-xl hover:bg-blue-50/70 dark:hover:bg-blue-900/30 hover:shadow-sm group overflow-hidden">
                  <div className="flex items-center space-x-2 relative z-10">
                    <span>About</span>
                    <span className="text-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">ℹ️</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </Link>
                
                {/* Projects link - always visible */}
                <Link 
                  href="/projects" 
                  className="relative text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-sm font-medium transition-all duration-300 rounded-xl hover:bg-blue-50/70 dark:hover:bg-blue-900/30 hover:shadow-sm group overflow-hidden"
                >
                  <div className="flex items-center space-x-2 relative z-10">
                    <span>Projects</span>
                    <span className="text-sm transition-transform duration-300 group-hover:scale-110 group-hover:bounce">🏆</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </Link>
                
                {isAuthenticated && (
                  <>
                    {/* AI Status Indicator - Links to Assembly Line */}
                    {project && (
                      <Link 
                        href="/assembly-line" 
                        className="relative text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-sm font-medium transition-all duration-300 rounded-xl hover:bg-blue-50/70 dark:hover:bg-blue-900/30 hover:shadow-sm group overflow-hidden"
                      >
                        <div className="flex items-center space-x-2 relative z-10">
                          <span>AI</span>
                          <span className="text-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">🤖</span>
                          <span className="text-xs">{calculateAIStatus(project.neuralReconstruction)}</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Theme Toggle, Score and Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Toggle */}
            <div className="p-1 rounded-lg hover:bg-gray-100/70 dark:hover:bg-gray-700/50 transition-all duration-300">
              <ThemeToggle />
            </div>
            
            {konamiUnlocked && (
              <button
                onClick={() => setShowDebugModal(true)}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 hover:shadow-lg text-white px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 animate-pulse hover:scale-105 hover:shadow-yellow-500/25"
                title="Developer Debug Mode"
              >
                🐛 Debug
              </button>
            )}
            {isAuthenticated ? (
              <>
                {/* Points display - show if user has a project OR if user is a dev */}
                {(project || profile?.role === 'dev') && (
                  <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 bg-gray-100/70 dark:bg-gray-700/50 px-3 py-2 rounded-xl border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md">
                    <span className="text-sm">🏆</span>
                    <span className="font-semibold">{stats?.total_points || 0}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">pts</span>
                  </div>
                )}
                <button
                  onClick={logout}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-lg text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-red-500/25"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-blue-500/25"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:text-blue-600 dark:focus:text-blue-400 p-2 rounded-xl hover:bg-blue-50/70 dark:hover:bg-blue-900/30 transition-all duration-300 hover:shadow-sm"
            >
              <svg className="h-6 w-6 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden animate-in slide-in-from-top-5 duration-300">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 dark:bg-gray-900/95 border-t border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-lg transition-colors duration-300">
            <Link href="/about" onClick={() => setIsMenuOpen(false)} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/70 dark:hover:bg-blue-900/30 block px-3 py-2 text-base font-medium rounded-xl transition-all duration-200">
              <div className="flex items-center space-x-2">
                <span className="text-sm">ℹ️</span>
                <span>About</span>
              </div>
            </Link>
            
            {/* Projects link - always visible on mobile */}
            <Link 
              href="/projects" 
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/70 dark:hover:bg-blue-900/30 block px-3 py-2 text-base font-medium rounded-xl transition-all duration-200"
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm">🏆</span>
                <span>Projects</span>
              </div>
            </Link>
            
            {/* Theme Toggle for Mobile */}
            <div className="flex items-center justify-between px-3 py-2 mx-3 my-2 bg-gray-100/70 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
              <span className="text-gray-700 dark:text-gray-300 text-base font-medium">Theme</span>
              <ThemeToggle />
            </div>
            
            {isAuthenticated && (
              <div className="space-y-2 mx-3 my-2">
                {/* Points Indicator - show if user has a project OR if user is a dev */}
                {(project || profile?.role === 'dev') && (
                  <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 bg-gray-100/70 dark:bg-gray-700/50 px-3 py-2 rounded-xl border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm">
                    <span className="text-sm mr-2">🏆</span>
                    <span className="font-semibold">{stats?.total_points || 0}</span>
                    <span className="text-sm ml-1 text-gray-500 dark:text-gray-400">points</span>
                  </div>
                )}
                {/* AI Status Indicator */}
                {project && (
                  <Link 
                    href="/assembly-line" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center text-gray-600 dark:text-gray-400 bg-gray-100/70 dark:bg-gray-700/50 hover:bg-gray-200/70 dark:hover:bg-gray-600/50 px-3 py-2 rounded-xl border border-gray-200/50 dark:border-gray-600/50 transition-all duration-300 group backdrop-blur-sm"
                  >
                    <span className="text-sm mr-2 transition-transform duration-300 group-hover:scale-110">🤖</span>
                    <span className="text-xs font-medium transition-colors duration-300 group-hover:text-gray-800 dark:group-hover:text-gray-200">{calculateAIStatus(project.neuralReconstruction)}</span>
                  </Link>
                )}
              </div>
            )}
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white block px-3 py-2 text-base font-medium rounded-xl w-full text-left cursor-pointer transition-all duration-300 hover:shadow-md mx-3 my-2"
              >
                Logout
              </button>
            ) : (
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white block px-3 py-2 text-base font-medium rounded-xl transition-all duration-300 hover:shadow-md mx-3 my-2">
                Login
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Debug Modal */}
      {showDebugModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 dark:bg-black text-green-400 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto font-mono border border-green-500">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-green-300">🐛 Developer Debug Console</h2>
                <button
                  onClick={() => setShowDebugModal(false)}
                  className="text-gray-400 hover:text-white transition-colors text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-black border border-green-500 rounded p-4">
                  <div className="text-green-300 font-bold mb-2">System Status:</div>
                  <div className="text-sm space-y-1">
                    <div className="text-yellow-400">[DEBUG] Konami code sequence detected</div>
                    <div className="text-blue-400">[INFO] Debug mode activated by developer</div>
                    <div className="text-red-400">[WARN] Obfuscated code found in build</div>
                    <div className="text-green-400">[OK] Neural fragments loading...</div>
                  </div>
                </div>
                
                <div className="bg-black border border-green-500 rounded p-4">
                  <div className="text-green-300 font-bold mb-2">Obfuscated Module Found:</div>
                  <div className="text-xs text-gray-300 mb-2">
                    Note: This appears to be webpacked/minified code. Reverse engineering required.
                  </div>
                  <div className="bg-gray-800 p-3 rounded border text-xs overflow-x-auto">
                    <pre className="whitespace-pre-wrap text-yellow-400">
{`// Webpack bundle output - MINIFIED
!function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){'undefined'!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:'Module'}),Object.defineProperty(e,'__esModule',{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&'object'==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,'default',{enumerable:!0,value:e}),2&t&&'string'!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,'a',t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p='',n(n.s=42)}({42:function(e,t,n){'use strict';const r=String.fromCharCode(82,66,84,123,107,111,110,97,109,105,95,100,101,98,117,103,95,109,111,100,101,95,97,99,116,105,118,101,125);console.log('Debug flag:',r)}});
// Hint: String.fromCharCode with ASCII values
// Challenge: Extract the flag from this webpacked code`}
                    </pre>
                  </div>
                </div>
                
                <div className="bg-black border border-green-500 rounded p-4">
                  <div className="text-green-300 font-bold mb-2">Challenge Hint:</div>
                  <div className="text-sm text-gray-300">
                    <p>The obfuscated code contains a flag encoded using String.fromCharCode().</p>
                    <p className="mt-2">Reverse engineer the ASCII values to decode the hidden flag.</p>
                    <p className="mt-2 text-yellow-400">Tip: Look for the numeric sequence after String.fromCharCode</p>
                  </div>
                </div>
                
                <div className="text-center pt-4">
                  <button
                    onClick={() => setShowDebugModal(false)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors"
                  >
                    Close Debug Console
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

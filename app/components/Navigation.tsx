'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [konamiUnlocked, setKonamiUnlocked] = useState(false);
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const { isAuthenticated, logout, user } = useAuth();
  
  // Konami Code: Up Up Down Down Left Right Left Right B A
  // Support both QWERTY (B, A) and AZERTY (B, Q) keyboard layouts
  const konamiCodeQWERTY = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
  const konamiCodeAZERTY = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyQ'];
  
  // Debug auth state changes in Navigation
  useEffect(() => {
    console.log('🧭 Navigation: Auth state changed - isAuthenticated:', isAuthenticated, 'user:', user?.email || 'none');
  }, [isAuthenticated, user]);

  // Konami code detection
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    console.log('🔑 Key pressed:', event.code);
    setKeySequence(prev => {
      const newSequence = [...prev, event.code].slice(-konamiCodeQWERTY.length);
      
      // Check for QWERTY sequence
      const isQWERTYMatch = newSequence.length === konamiCodeQWERTY.length && 
                           newSequence.every((key, index) => key === konamiCodeQWERTY[index]);
      
      // Check for AZERTY sequence
      const isAZERTYMatch = newSequence.length === konamiCodeAZERTY.length && 
                           newSequence.every((key, index) => key === konamiCodeAZERTY[index]);
      
      // Activate if either keyboard layout matches
      if (isQWERTYMatch || isAZERTYMatch) {
        setKonamiUnlocked(true);
        console.log('🎮 Konami Code Activated!');
        // Clear sequence after activation
        return [];
      }
      
      return newSequence;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">RoboTech Industries</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                About
              </Link>
              <Link href="/solutions" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                Projects
              </Link>
            </div>
          </div>

          {/* CTA Button & Debug Button */}
          <div className="hidden md:flex items-center space-x-3">
            {konamiUnlocked && (
              <button
                onClick={() => setShowDebugModal(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-md text-xs font-medium transition-colors animate-pulse"
                title="Developer Debug Mode"
              >
                🐛 Debug
              </button>
            )}
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <Link href="/" className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium">
              Home
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium">
              About
            </Link>
            <Link href="/solutions" className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium">
              Solutions
            </Link>
            <Link href="/solutions" className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium">
              Team Directory
            </Link>
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="bg-red-600 text-white block px-3 py-2 text-base font-medium rounded-md w-full text-left"
              >
                Logout
              </button>
            ) : (
              <Link href="/login" className="bg-blue-600 text-white block px-3 py-2 text-base font-medium rounded-md">
                Login
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Debug Modal */}
      {showDebugModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 text-green-400 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto font-mono">
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

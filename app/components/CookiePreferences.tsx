'use client';

import { useState, useEffect } from 'react';
import { getConsentStatus, clearFunctionalData } from '@/lib/consentedStorage';

interface CookiePreferencesProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CookiePreferences({ isOpen: propIsOpen, onClose }: CookiePreferencesProps = {}) {
  const [isOpen, setIsOpen] = useState(propIsOpen ?? false);
  const [consent, setConsent] = useState(getConsentStatus());

  useEffect(() => {
    setConsent(getConsentStatus());
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(propIsOpen ?? false);
  }, [propIsOpen]);

  const handleToggleFunctional = (enabled: boolean) => {
    if (enabled) {
      // Enable functional storage
      localStorage.setItem('rt-cookie-consent', 'functional');
      setConsent({ ...consent, functional: true });
    } else {
      // Disable functional storage and clear existing data
      localStorage.setItem('rt-cookie-consent', 'declined');
      clearFunctionalData();
      setConsent({ ...consent, functional: false });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors z-40 flex items-center space-x-2"
        title="Cookie Preferences"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="hidden sm:inline">Cookie Settings</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClose();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Close cookie preferences"
      />
      
      <div className="relative bg-white border border-gray-200 rounded-lg shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Cookie Preferences</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Essential Cookies */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-gray-900">Essential Cookies</h4>
                <p className="text-sm text-gray-600">Required for authentication and security</p>
              </div>
              <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Always On
              </div>
            </div>
            <p className="text-xs text-gray-500">
              These cookies are necessary for the website to function and cannot be switched off.
            </p>
          </div>

          {/* Functional Cookies */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-gray-900">Functional Storage</h4>
                <p className="text-sm text-gray-600">Saves your project data and preferences</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle functional storage">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={consent.functional}
                  onChange={(e) => handleToggleFunctional(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Allows storing your robotics project configurations and user preferences locally.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Save Preferences
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

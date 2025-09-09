'use client';

import { useEffect } from 'react';
import { initializeConsentStorage } from '@/lib/consentedStorage';

/**
 * Client component to initialize the consent storage system
 * This ensures that any previously declined consent properly clears functional data
 */
export default function ConsentInitializer() {
  useEffect(() => {
    // Initialize consent storage on app load
    initializeConsentStorage();
  }, []);

  // This component doesn't render anything visible
  return null;
}

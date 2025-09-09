'use client';

export interface ConsentStatus {
  functional: boolean;
  analytics: boolean;
  advertising: boolean;
  timestamp: number;
}

/**
 * Get the current consent status from storage
 */
export function getConsentStatus(): ConsentStatus {
  if (typeof window === 'undefined') {
    return {
      functional: false,
      analytics: false,
      advertising: false,
      timestamp: 0
    };
  }

  try {
    const stored = localStorage.getItem('rt-cookie-consent');
    if (stored === 'functional') {
      return {
        functional: true,
        analytics: false,
        advertising: false,
        timestamp: Date.now()
      };
    } else if (stored === 'declined') {
      return {
        functional: false,
        analytics: false,
        advertising: false,
        timestamp: Date.now()
      };
    }
  } catch (error) {
    console.warn('Failed to read consent status:', error);
  }

  // No consent given yet
  return {
    functional: false,
    analytics: false,
    advertising: false,
    timestamp: 0
  };
}

/**
 * Check if consent has been given (either accepted or declined)
 */
export function hasConsentDecision(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const stored = localStorage.getItem('rt-cookie-consent');
    return stored === 'functional' || stored === 'declined';
  } catch (error) {
    console.warn('Failed to check consent decision:', error);
    return false;
  }
}

/**
 * Check if functional storage is allowed
 */
export function isFunctionalStorageAllowed(): boolean {
  return getConsentStatus().functional;
}

/**
 * Consent-aware localStorage wrapper
 */
export const consentedStorage = {
  /**
   * Get item from localStorage (always allowed)
   */
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get item '${key}' from localStorage:`, error);
      return null;
    }
  },

  /**
   * Set item in localStorage (only if functional consent given)
   */
  setItem(key: string, value: string): boolean {
    if (typeof window === 'undefined') return false;
    
    // Allow consent-related storage regardless of consent status
    if (key === 'rt-cookie-consent') {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.warn(`Failed to set consent item '${key}':`, error);
        return false;
      }
    }

    // For all other storage, check functional consent
    if (!isFunctionalStorageAllowed()) {
      console.log(`Storage blocked for '${key}': functional consent not given`);
      return false;
    }

    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Failed to set item '${key}' in localStorage:`, error);
      return false;
    }
  },

  /**
   * Remove item from localStorage (always allowed for cleanup)
   */
  removeItem(key: string): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove item '${key}' from localStorage:`, error);
      return false;
    }
  },

  /**
   * Clear all functional storage (respects consent)
   */
  clear(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      // Get all keys before clearing
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key !== 'rt-cookie-consent') {
          keys.push(key);
        }
      }

      // Remove each key (except consent)
      keys.forEach(key => {
        localStorage.removeItem(key);
      });

      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  }
};

/**
 * Clear all functional data (call when user withdraws consent)
 */
export function clearFunctionalData(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];
    
    // Collect all keys except consent and essential ones
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && 
          key !== 'rt-cookie-consent' && 
          !key.startsWith('sb-')) { // Don't remove Supabase essential auth cookies
        keysToRemove.push(key);
      }
    }

    // Remove the collected keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('🧹 Functional data cleared:', keysToRemove);
  } catch (error) {
    console.warn('Failed to clear functional data:', error);
  }
}

/**
 * Initialize consent-aware storage system
 */
export function initializeConsentStorage(): void {
  if (typeof window === 'undefined') return;

  // Check if user previously declined and clean up any functional data
  const consent = getConsentStatus();
  if (hasConsentDecision() && !consent.functional) {
    clearFunctionalData();
  }
}

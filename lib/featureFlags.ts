/**
 * Feature flags for RoboTech Industries CTF Platform
 * 
 * These flags control various features that can be toggled on/off
 * without code changes in production.
 */

export interface FeatureFlags {
  // Cookie consent banner and related functionality
  cookieConsentEnabled: boolean;
  
  // Future feature flags can be added here
  // debugMode: boolean;
  // experimentalFeatures: boolean;
}

/**
 * Default feature flag configuration
 * 
 * COOKIE CONSENT: Currently DISABLED because we only use essential auth cookies
 * and store all user data (projects) in the database rather than localStorage.
 * 
 * To re-enable cookie consent (if you add localStorage usage in the future):
 * 1. Set cookieConsentEnabled: true
 * 2. Uncomment CookieManager import and component in app/layout.tsx
 * 3. Test that consent banner appears on first visit
 * 4. Verify that localStorage writes are blocked without consent
 */
const defaultFlags: FeatureFlags = {
  cookieConsentEnabled: false, // DISABLED - only essential cookies used
};

/**
 * Environment-specific overrides
 * You can override flags based on environment variables
 */
function getEnvironmentOverrides(): Partial<FeatureFlags> {
  const overrides: Partial<FeatureFlags> = {};
  
  // Example: Enable cookie consent in development if explicitly requested
  if (process.env.NEXT_PUBLIC_ENABLE_COOKIE_CONSENT === 'true') {
    overrides.cookieConsentEnabled = true;
  }
  
  return overrides;
}

/**
 * Get the current feature flag configuration
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    ...defaultFlags,
    ...getEnvironmentOverrides(),
  };
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  switch (flag) {
    case 'cookieConsentEnabled':
      return flags.cookieConsentEnabled;
    default:
      return false;
  }
}

/**
 * Cookie consent specific helper
 */
export function isCookieConsentEnabled(): boolean {
  return isFeatureEnabled('cookieConsentEnabled');
}

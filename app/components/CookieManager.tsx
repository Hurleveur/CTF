'use client';

import { useState } from 'react';
import CookieConsentBanner from './CookieConsentBanner';
import CookiePreferences from './CookiePreferences';

export default function CookieManager() {
  const [showPreferences, setShowPreferences] = useState(false);

  const handleBannerCustomize = () => {
    setShowPreferences(true);
  };

  return (
    <>
      <CookieConsentBanner 
        onCustomize={handleBannerCustomize}
      />
      {showPreferences && (
        <CookiePreferences 
          isOpen={showPreferences} 
          onClose={() => setShowPreferences(false)} 
        />
      )}
    </>
  );
}

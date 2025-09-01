'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Completely clears all Supabase authentication storage
 * Handles both localStorage and cookies safely
 */
export async function clearAuthStorage(): Promise<void> {
  try {
    const supabase = createClient();
    
    // First try to sign out through Supabase (this should clear storage automatically)
    await supabase.auth.signOut();
    
    // Manually clear localStorage items (backup in case signOut fails)
    if (typeof window !== 'undefined') {
      // Clear all localStorage items that start with 'supabase'
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear specific Supabase auth keys if they exist
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.expires_at');
      localStorage.removeItem('supabase.auth.refresh_token');
    }
    
    // Manually clear cookies (backup in case signOut fails)
    if (typeof document !== 'undefined') {
      // Get all cookies and clear the ones related to Supabase
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name.startsWith('sb-')) {
          // Clear the cookie by setting it to expire in the past
          document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
          document.cookie = `${name}=; Max-Age=0; path=/; domain=.${window.location.hostname}`;
          document.cookie = `${name}=; Max-Age=0; path=/`;
        }
      });
    }
    
    console.log('🧹 Auth storage cleared successfully');
  } catch (error) {
    console.error('🧹 Error clearing auth storage:', error);
    // Don't throw - we want this to be as robust as possible
  }
}

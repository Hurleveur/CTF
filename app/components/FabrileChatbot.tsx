'use client';

import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export default function FabrileChatbot() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Get environment variables for Fabrile configuration
    const agentId = process.env.NEXT_PUBLIC_FABRILE_AGENT_ID || 'agent_CSjKyJ8iqrLNF3z5zCma1';
    const webToken = process.env.NEXT_PUBLIC_FABRILE_WEB_TOKEN || 'web_CSjKyJdUcraySEjqa4Grv';
    
    console.log('🤖 Fabrile Config:', {
      agentId,
      webToken: webToken ? `${webToken.substring(0, 10)}...` : 'not found',
      isAuthenticated,
      isLoading,
      origin: typeof window !== 'undefined' ? window.location.origin : 'server-side',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent.substring(0, 50) + '...' : 'server-side'
    });

    // Only load the Fabrile chatbot script if user is authenticated
    if (isAuthenticated && !isLoading) {
      // Check if script is already loaded to avoid duplicates
      const existingScript = document.querySelector('script[src*="fabrile.app"]');
      if (existingScript) {
        console.log('🤖 Fabrile chatbot script already loaded');
        return;
      }

      console.log('🤖 Loading Fabrile chatbot for authenticated user');
      
      // Build the script URL
      const scriptUrl = `https://embed.fabrile.app/scripts/widget.js?agentId=${agentId}&tok=${webToken}`;
      console.log('🤖 Script URL:', scriptUrl);
      
      // Create and load the Fabrile chatbot script
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      
      script.onload = () => {
        console.log('🤖 ✅ Fabrile chatbot script loaded successfully');
        
        // Add global error handler to catch embed errors
        if (typeof window !== 'undefined') {
          const originalConsoleError = console.error;
          console.error = function(...args) {
            // Check if it's a Fabrile-related error
            const errorString = args.join(' ').toLowerCase();
            if (errorString.includes('fabrile') || errorString.includes('embed') || errorString.includes('chat')) {
              console.warn('🤖 ⚠️ Fabrile-related error detected:', ...args);
            }
            originalConsoleError.apply(console, args);
          };
        }
      };
      
      script.onerror = (error) => {
        console.error('🤖 ❌ Failed to load Fabrile chatbot script:', error);
        console.error('🤖 ❌ Script URL was:', scriptUrl);
      };
      
      document.body.appendChild(script);

      // Cleanup function to remove script when component unmounts or user logs out
      return () => {
        console.log('🤖 🧹 Cleaning up Fabrile chatbot...');
        
        const scriptToRemove = document.querySelector('script[src*="fabrile.app"]');
        if (scriptToRemove) {
          document.body.removeChild(scriptToRemove);
          console.log('🤖 🧹 Fabrile chatbot script removed');
        }
        
        // Also remove any chatbot widget elements that might have been created
        const chatbotWidget = document.querySelector('[data-fabrile-widget], .fabrile-widget, #fabrile-widget');
        if (chatbotWidget) {
          chatbotWidget.remove();
          console.log('🤖 🧹 Fabrile chatbot widget removed');
        }
        
        // Reset console.error if we modified it
        if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).originalConsoleError) {
          console.error = (window as unknown as Record<string, unknown>).originalConsoleError as typeof console.error;
        }
      };
    } else {
      console.log('🤖 ⏸️ Skipping Fabrile load:', { isAuthenticated, isLoading });
    }
  }, [isAuthenticated, isLoading]);

  // This component doesn't render any visible content
  // The chatbot appears as an overlay/widget managed by the Fabrile script
  return null;
}

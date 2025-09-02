'use client';

import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export default function FabrileChatbot() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Only load the Fabrile chatbot script if user is authenticated
    if (isAuthenticated && !isLoading) {
      // Check if script is already loaded to avoid duplicates
      const existingScript = document.querySelector('script[src*="fabrile.app"]');
      if (existingScript) {
        console.log('Fabrile chatbot script already loaded');
        return;
      }

      console.log('Loading Fabrile chatbot for authenticated user');
      
      // Create and load the Fabrile chatbot script
      const script = document.createElement('script');
      script.src = 'https://embed.fabrile.app/scripts/widget.js?agentId=agent_CSjKyJ8iqrLNF3z5zCma1&tok=web_CSjKyJdUcraySEjqa4Grv';
      script.async = true;
      script.onload = () => {
        console.log('Fabrile chatbot loaded successfully');
      };
      script.onerror = () => {
        console.error('Failed to load Fabrile chatbot');
      };
      
      document.body.appendChild(script);

      // Cleanup function to remove script when component unmounts or user logs out
      return () => {
        const scriptToRemove = document.querySelector('script[src*="fabrile.app"]');
        if (scriptToRemove) {
          document.body.removeChild(scriptToRemove);
          console.log('Fabrile chatbot script removed');
        }
        
        // Also remove any chatbot widget elements that might have been created
        const chatbotWidget = document.querySelector('[data-fabrile-widget], .fabrile-widget, #fabrile-widget');
        if (chatbotWidget) {
          chatbotWidget.remove();
          console.log('Fabrile chatbot widget removed');
        }
      };
    }
  }, [isAuthenticated, isLoading]);

  // This component doesn't render any visible content
  // The chatbot appears as an overlay/widget managed by the Fabrile script
  return null;
}

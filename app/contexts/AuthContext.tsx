'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Check if user is logged in on mount and listen for auth changes
  useEffect(() => {
    const getInitialUser = async () => {
      try {
        console.log('🔄 Checking initial user on mount...');
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.log('🔄 No valid user session found:', error.message);
        } else if (user) {
          console.log('🔄 Initial user found for:', user.email);
          setUser(formatUser(user));
        } else {
          console.log('🔄 No initial user found');
        }
      } catch (error) {
        console.error('🔄 Error getting user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, !!session?.user);
        
        // Handle token refresh
        if (event === 'TOKEN_REFRESHED') {
          console.log('✅ Token refreshed successfully');
        }
        
        if (session?.user) {
          console.log('🔄 Setting user from auth listener:', session.user.email);
          setUser(formatUser(session.user));
        } else {
          console.log('🔄 Clearing user from auth listener');
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const formatUser = (supabaseUser: SupabaseUser): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.full_name,
    role: supabaseUser.role,
    last_sign_in_at: supabaseUser.last_sign_in_at,
    email_confirmed_at: supabaseUser.email_confirmed_at,
  });

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 Starting login process for:', email);
      setIsLoading(true);
      
      // Use API route but with immediate session check for performance
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('🔐 API response status:', response.status);
      const data = await response.json();
      console.log('🔐 API response data:', data);

      if (!response.ok) {
        console.error('🔐 Login API failed:', response.status, data);
        setIsLoading(false);
        return {
          success: false,
          error: data.error || 'Login failed'
        };
      }

      // Immediately check user after successful API call for faster UI update
      try {
        console.log('🔐 Checking user after successful API call...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('🔐 User retrieval error:', userError);
        } else if (user) {
          console.log('🔐 User found, updating user state immediately');
          setUser(formatUser(user));
        } else {
          console.log('🔐 No user found, waiting for auth listener...');
        }
      } catch (userError) {
        console.error('🔐 User check error:', userError);
        // Don't fail login if user check fails, auth listener will handle it
      }
      
      setIsLoading(false);
      console.log('🔐 Login process completed successfully');
      return { success: true };

    } catch (error) {
      console.error('🔐 Login error:', error);
      setIsLoading(false);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  };

  const signup = async (email: string, password: string, fullName?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('📝 Starting signup process for:', email);
      setIsLoading(true);
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName }),
      });

      console.log('📝 Signup API response status:', response.status);
      const data = await response.json();
      console.log('📝 Signup API response data:', data);

      if (!response.ok) {
        setIsLoading(false);
        return {
          success: false,
          error: data.error || 'Signup failed'
        };
      }

      // Check if user was automatically logged in (when email confirmation is disabled)
      try {
        console.log('📝 Checking for user after signup...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('📝 User retrieval error after signup:', userError);
        } else if (user) {
          console.log('📝 User was automatically logged in after signup!', user.email);
          setUser(formatUser(user));
        } else {
          console.log('📝 No user found after signup, email confirmation may be required');
        }
      } catch (userError) {
        console.error('📝 User check error after signup:', userError);
        // Don't fail signup if user check fails, auth listener will handle it
      }
      
      setIsLoading(false);
      console.log('📝 Signup process completed successfully');
      return { success: true };

    } catch (error) {
      console.error('📝 Signup error:', error);
      setIsLoading(false);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔄 Starting password reset request for:', email);
      
      // Use API route for server-side logging and validation
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('🔄 Password reset API response status:', response.status);
      const data = await response.json();
      console.log('🔄 Password reset API response data:', data);

      if (!response.ok) {
        console.error('🔄 Password reset API failed:', response.status, data);
        return {
          success: false,
          error: data.error || 'Password reset request failed'
        };
      }

      console.log('🔄 Password reset request completed successfully');
      return { success: true };
    } catch (error) {
      console.error('🔄 Password reset error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 Starting password update...');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('🔐 Password update error:', error.message);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('🔐 Password updated successfully');
      return { success: true };
    } catch (error) {
      console.error('🔐 Password update error:', error);
      return {
        success: false,
        error: 'Failed to update password. Please try again.'
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Starting logout process...');
      setIsLoading(true);
      
      // First clear the client-side session
      console.log('🚪 Clearing client-side session...');
      const { error: clientError } = await supabase.auth.signOut();
      
      if (clientError) {
        console.error('🚪 Client-side logout error:', clientError);
      } else {
        console.log('🚪 Client-side session cleared successfully');
      }
      
      // Also call the server-side logout API for completeness
      try {
        console.log('🚪 Calling server-side logout API...');
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
        });
        
        if (response.ok) {
          console.log('🚪 Server-side logout successful');
        } else {
          console.error('🚪 Server-side logout failed:', response.status);
        }
      } catch (apiError) {
        console.error('🚪 Server-side logout API error:', apiError);
        // Don't fail the logout if server call fails - client logout is more important
      }
      
      // Immediately clear user state for instant UI update
      console.log('🚪 Clearing user state immediately');
      setUser(null);
      
      // Verify user session is actually cleared
      setTimeout(async () => {
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (user && !error) {
            console.error('🚪 WARNING: User still authenticated after logout!', user.email);
          } else {
            console.log('🚪 ✅ Verified: User session successfully cleared');
          }
        } catch (error) {
          console.error('🚪 User verification error:', error);
        }
      }, 100);
      
      setIsLoading(false);
      console.log('🚪 Logout process completed');
    } catch (error) {
      console.error('🚪 Logout error:', error);
      // Even if there's an error, clear the user state
      setUser(null);
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      logout, 
      requestPasswordReset,
      updatePassword,
      isAuthenticated, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

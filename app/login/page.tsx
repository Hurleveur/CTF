'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function LoginContent() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile } = useUserData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      // Check if user is admin and redirect accordingly
      const isAdmin = profile?.role === 'admin' || profile?.role === 'dev';
      const redirectUrl = isAdmin ? '/projects' : '/assembly-line';
      router.push(redirectUrl);
    }
  }, [isAuthenticated, profile?.role, router]);

  useEffect(() => {
    const reason = searchParams?.get?.('reason');
    const message = searchParams?.get?.('message');
    
    if (reason === 'session-expired' || reason === 'token-expired') {
      setSessionExpiredMessage('Your session has expired. Please log in again.');
    }
    
    if (message === 'password-updated') {
      setSuccessMessage('Password updated successfully! Please log in with your new password.');
    }
    
    // Clear the URL parameters after showing the message
    if (reason || message) {
      const url = new URL(window.location.href);
      url.searchParams.delete('reason');
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      // Router push will happen via useEffect when isAuthenticated changes
      // Don't need to manually navigate here since user state is updated immediately
    } else {
      setError(result.error || 'Login failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              {/* Robotic arm base */}
              <rect x="7" y="20" width="10" height="2.5" rx="1.2" />
              <rect x="8" y="17.5" width="8" height="2.5" rx="0.8" />
              {/* Main arm segments */}
              <circle cx="12" cy="16" r="2" />
              <rect x="10.5" y="8" width="3" height="8" rx="1.5" />
              <circle cx="12" cy="7" r="1.8" />
              <rect x="10.5" y="2" width="3" height="6" rx="1.5" transform="rotate(-35 12 7)" />
              <circle cx="15" cy="3.7" r="1.3" />
              {/* Connecting arm to gripper */}
              <rect x="10.5" y="2.5" width="4.5" height="2.5" rx="0.5" />
              {/* Gripper/end effector */}
              <path d="M17 3 L20.5 3 L15.5 3.5 Z" />
              <path d="M17 5 L20.5 5 L15.5 4.5 Z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Log into to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access the RoboTech Industries Assembly Line
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {sessionExpiredMessage && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-yellow-700">{sessionExpiredMessage}</p>
              </div>
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(isSubmitting || authLoading) ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Log In'
              )}
            </button>
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              <Link href="/forgot-password" className="text-blue-600 hover:text-blue-800 font-medium">
                Forgot your password?
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

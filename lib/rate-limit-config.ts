/**
 * Rate Limiting Configuration
 * 
 * This file defines rate limiting policies for different endpoints
 * to provide appropriate protection while maintaining usability.
 */

import { NextRequest } from 'next/server';

export interface RateLimitPolicy {
  windowMs: number;
  maxAttempts: number;
  skipSuccessfulRequests?: boolean;
  description: string;
}

export const RATE_LIMIT_POLICIES = {
  // Authentication endpoints - most restrictive
  AUTH_LOGIN: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxAttempts: 15,
    description: 'Login attempts'
  },
  
  AUTH_SIGNUP: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxAttempts: 3,
    description: 'Signup attempts'
  },
  
  AUTH_PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    description: 'Password reset requests'
  },
  
  // CTF-specific endpoints
  CHALLENGE_SUBMIT: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxAttempts: 10,
    description: 'Flag submissions'
  },
  
  CHALLENGE_VIEW: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxAttempts: 30,
    description: 'Challenge view requests'
  },
  
  // API endpoints - moderate limits
  API_GENERAL: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxAttempts: 60,
    description: 'General API requests'
  },
  
  // Profile/user data - less restrictive
  PROFILE_UPDATE: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxAttempts: 10,
    description: 'Profile updates'
  },
  
  // Admin endpoints - very restrictive
  ADMIN_ACTIONS: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxAttempts: 5,
    description: 'Admin actions'
  }
} as const;

/**
 * Get the appropriate rate limit policy for a given request
 */
export function getRateLimitPolicy(request: NextRequest): RateLimitPolicy {
  const pathname = new URL(request.url).pathname;
  
  // Authentication routes
  if (pathname === '/api/auth/login') {
    return RATE_LIMIT_POLICIES.AUTH_LOGIN;
  }
  
  if (pathname === '/api/auth/signup') {
    return RATE_LIMIT_POLICIES.AUTH_SIGNUP;
  }
  
  if (pathname.includes('/api/auth/password-reset')) {
    return RATE_LIMIT_POLICIES.AUTH_PASSWORD_RESET;
  }
  
  // CTF routes
  if (pathname === '/api/challenges/submit') {
    return RATE_LIMIT_POLICIES.CHALLENGE_SUBMIT;
  }
  
  if (pathname === '/api/challenges') {
    return RATE_LIMIT_POLICIES.CHALLENGE_VIEW;
  }
  
  // Profile routes
  if (pathname.includes('/api/profile')) {
    return RATE_LIMIT_POLICIES.PROFILE_UPDATE;
  }
  
  // Admin routes
  if (pathname.includes('/api/admin/')) {
    return RATE_LIMIT_POLICIES.ADMIN_ACTIONS;
  }
  
  // Default policy for other API routes
  return RATE_LIMIT_POLICIES.API_GENERAL;
}

/**
 * Create a user-friendly error message based on the policy
 */
export function getRateLimitErrorMessage(policy: RateLimitPolicy, retryAfter: number): string {
  const minutes = Math.ceil(retryAfter / 60);
  
  switch (policy.description) {
    case 'Login attempts':
      return `Too many login attempts. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`;
    
    case 'Signup attempts':
      return `Too many registration attempts. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`;
    
    case 'Flag submissions':
      return `You're submitting flags too quickly. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} to continue.`;
    
    case 'Admin actions':
      return `Admin action rate limit exceeded. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`;
    
    default:
      return `Rate limit exceeded. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before making more requests.`;
  }
}

/**
 * Extract client identifier for rate limiting
 * Uses multiple methods to identify unique clients
 */
export function getClientIdentifier(request: NextRequest): string {
  // Get IP address from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  let ip = 'unknown';
  if (forwarded) {
    ip = forwarded.split(',')[0].trim();
  } else if (realIp) {
    ip = realIp;
  } else if (cfConnectingIp) {
    ip = cfConnectingIp;
  }
  
  // For authenticated requests, also consider user agent for better tracking
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const userAgentHash = Buffer.from(userAgent).toString('base64').slice(0, 8);
  
  // Combine IP and a short user agent hash for better uniqueness
  return `${ip}:${userAgentHash}`;
}

/**
 * Security monitoring - detect suspicious patterns
 */
export function detectSuspiciousActivity(attempts: Array<{
  timestamp: number;
  userAgent?: string;
  path: string;
}>): {
  isSuspicious: boolean;
  reason?: string;
} {
  if (attempts.length < 3) {
    return { isSuspicious: false };
  }
  
  // Check for rapid-fire requests (more than 10 in 30 seconds)
  const thirtySecondsAgo = Date.now() - 30 * 1000;
  const recentAttempts = attempts.filter(a => a.timestamp > thirtySecondsAgo);
  
  if (recentAttempts.length > 10) {
    return {
      isSuspicious: true,
      reason: 'Rapid-fire requests detected'
    };
  }
  
  // Check for multiple different user agents (potential bot/script)
  const userAgents = new Set(attempts.map(a => a.userAgent).filter(Boolean));
  if (userAgents.size > 5) {
    return {
      isSuspicious: true,
      reason: 'Multiple user agents detected'
    };
  }
  
  // Check for attempts across multiple sensitive endpoints
  const sensitivePaths = attempts.filter(a => 
    a.path.includes('/auth/') || 
    a.path.includes('/admin/') ||
    a.path.includes('/challenges/submit')
  );
  
  if (sensitivePaths.length > 15) {
    return {
      isSuspicious: true,
      reason: 'Multiple sensitive endpoint attempts'
    };
  }
  
  return { isSuspicious: false };
}

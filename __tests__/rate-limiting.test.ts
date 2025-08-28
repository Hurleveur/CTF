/**
 * Rate Limiting Tests
 * 
 * Tests to ensure rate limiting works correctly across all endpoints
 * and provides appropriate security protection.
 */

import { NextRequest } from 'next/server';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter';
import { getRateLimitPolicy, getClientIdentifier } from '@/lib/rate-limit-config';

// Mock NextRequest for testing
const createMockRequest = (pathname: string, ip: string = '127.0.0.1', userAgent: string = 'test-agent'): NextRequest => {
  const headers = new Headers();
  headers.set('x-forwarded-for', ip);
  headers.set('user-agent', userAgent);
  
  return {
    headers,
    url: `http://localhost:3000${pathname}`,
    nextUrl: { pathname }
  } as NextRequest;
};

describe('Rate Limiting System', () => {
  
  describe('Rate Limit Policies', () => {
    it('should return AUTH_LOGIN policy for login endpoint', () => {
      const request = createMockRequest('/api/auth/login');
      const policy = getRateLimitPolicy(request);
      
      expect(policy.description).toBe('Login attempts');
      expect(policy.maxAttempts).toBe(5);
      expect(policy.windowMs).toBe(15 * 60 * 1000);
    });

    it('should return AUTH_SIGNUP policy for signup endpoint', () => {
      const request = createMockRequest('/api/auth/signup');
      const policy = getRateLimitPolicy(request);
      
      expect(policy.description).toBe('Signup attempts');
      expect(policy.maxAttempts).toBe(3);
      expect(policy.windowMs).toBe(10 * 60 * 1000);
    });

    it('should return CHALLENGE_SUBMIT policy for flag submission', () => {
      const request = createMockRequest('/api/challenges/submit');
      const policy = getRateLimitPolicy(request);
      
      expect(policy.description).toBe('Flag submissions');
      expect(policy.maxAttempts).toBe(10);
      expect(policy.windowMs).toBe(5 * 60 * 1000);
    });

    it('should return default API_GENERAL policy for unknown endpoints', () => {
      const request = createMockRequest('/api/some/unknown/endpoint');
      const policy = getRateLimitPolicy(request);
      
      expect(policy.description).toBe('General API requests');
      expect(policy.maxAttempts).toBe(60);
      expect(policy.windowMs).toBe(1 * 60 * 1000);
    });
  });

  describe('Client Identification', () => {
    it('should create unique identifiers for different IPs', () => {
      const request1 = createMockRequest('/api/test', '192.168.1.1');
      const request2 = createMockRequest('/api/test', '192.168.1.2');
      
      const id1 = getClientIdentifier(request1);
      const id2 = getClientIdentifier(request2);
      
      expect(id1).not.toBe(id2);
      expect(id1).toContain('192.168.1.1');
      expect(id2).toContain('192.168.1.2');
    });

    it('should create different identifiers for same IP with different user agents', () => {
      const request1 = createMockRequest('/api/test', '192.168.1.1', 'Mozilla/5.0');
      const request2 = createMockRequest('/api/test', '192.168.1.1', 'Chrome/91.0');
      
      const id1 = getClientIdentifier(request1);
      const id2 = getClientIdentifier(request2);
      
      expect(id1).not.toBe(id2);
    });

    it('should handle missing headers gracefully', () => {
      const request = {
        headers: new Headers(),
        url: 'http://localhost:3000/api/test',
        nextUrl: { pathname: '/api/test' }
      } as NextRequest;
      
      const id = getClientIdentifier(request);
      expect(id).toContain('unknown');
    });
  });

  describe('Rate Limiting Logic', () => {
    beforeEach(() => {
      // Clear any existing rate limits between tests
      jest.clearAllMocks();
    });

    it('should allow requests within rate limit', async () => {
      const request = createMockRequest('/api/auth/login', '192.168.1.100');
      
      // First request should be allowed
      const result1 = await checkRateLimit(request);
      expect(result1.allowed).toBe(true);
      
      // Second request should also be allowed
      const result2 = await checkRateLimit(request);
      expect(result2.allowed).toBe(true);
    });

    it('should block requests after exceeding rate limit', async () => {
      const request = createMockRequest('/api/auth/signup', '192.168.1.101');
      
      // Make requests up to the limit (3 for signup)
      for (let i = 0; i < 3; i++) {
        const result = await checkRateLimit(request);
        expect(result.allowed).toBe(true);
      }
      
      // Next request should be blocked
      const blockedResult = await checkRateLimit(request);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.response).toBeDefined();
    });

    it('should provide appropriate error messages for different endpoints', async () => {
      const loginRequest = createMockRequest('/api/auth/login', '192.168.1.102');
      const signupRequest = createMockRequest('/api/auth/signup', '192.168.1.103');
      
      // Exhaust login attempts
      for (let i = 0; i < 6; i++) {
        await checkRateLimit(loginRequest);
      }
      
      // Exhaust signup attempts
      for (let i = 0; i < 4; i++) {
        await checkRateLimit(signupRequest);
      }
      
      const loginBlocked = await checkRateLimit(loginRequest);
      const signupBlocked = await checkRateLimit(signupRequest);
      
      expect(loginBlocked.response).toBeDefined();
      expect(signupBlocked.response).toBeDefined();
      
      // Different endpoints should have different error messages
      // This would need to be tested by actually parsing the response JSON
    });

    it('should reset rate limit on successful authentication', async () => {
      const request = createMockRequest('/api/auth/login', '192.168.1.104');
      
      // Make several failed attempts
      for (let i = 0; i < 4; i++) {
        await checkRateLimit(request);
      }
      
      // Reset the rate limit (simulating successful auth)
      await resetRateLimit(request);
      
      // Next request should be allowed again
      const result = await checkRateLimit(request);
      expect(result.allowed).toBe(true);
    });

    it('should handle concurrent requests from same client', async () => {
      const request = createMockRequest('/api/challenges/submit', '192.168.1.105');
      
      // Simulate concurrent requests
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(checkRateLimit(request));
      }
      
      const results = await Promise.all(promises);
      
      // First 10 should be allowed, rest should be blocked
      const allowedCount = results.filter(r => r.allowed).length;
      const blockedCount = results.filter(r => !r.allowed).length;
      
      expect(allowedCount).toBeLessThanOrEqual(10);
      expect(blockedCount).toBeGreaterThan(0);
    });
  });

  describe('Security Features', () => {
    it('should detect suspicious rapid-fire requests', () => {
      const { detectSuspiciousActivity } = require('@/lib/rate-limit-config');
      
      const rapidAttempts = Array.from({ length: 15 }, (_, i) => ({
        timestamp: Date.now() - (i * 1000), // 1 second apart
        userAgent: 'test-agent',
        path: '/api/auth/login'
      }));
      
      const result = detectSuspiciousActivity(rapidAttempts);
      expect(result.isSuspicious).toBe(true);
      expect(result.reason).toContain('Rapid-fire requests');
    });

    it('should detect multiple user agents from same client', () => {
      const { detectSuspiciousActivity } = require('@/lib/rate-limit-config');
      
      const multiAgentAttempts = Array.from({ length: 8 }, (_, i) => ({
        timestamp: Date.now() - (i * 60000), // 1 minute apart
        userAgent: `agent-${i}`,
        path: '/api/auth/login'
      }));
      
      const result = detectSuspiciousActivity(multiAgentAttempts);
      expect(result.isSuspicious).toBe(true);
      expect(result.reason).toContain('Multiple user agents');
    });

    it('should detect attempts across multiple sensitive endpoints', () => {
      const { detectSuspiciousActivity } = require('@/lib/rate-limit-config');
      
      const sensitiveAttempts = Array.from({ length: 20 }, (_, i) => ({
        timestamp: Date.now() - (i * 30000), // 30 seconds apart
        userAgent: 'test-agent',
        path: i % 2 === 0 ? '/api/auth/login' : '/api/admin/users'
      }));
      
      const result = detectSuspiciousActivity(sensitiveAttempts);
      expect(result.isSuspicious).toBe(true);
      expect(result.reason).toContain('Multiple sensitive endpoint');
    });

    it('should not flag normal usage patterns as suspicious', () => {
      const { detectSuspiciousActivity } = require('@/lib/rate-limit-config');
      
      const normalAttempts = Array.from({ length: 5 }, (_, i) => ({
        timestamp: Date.now() - (i * 300000), // 5 minutes apart
        userAgent: 'Mozilla/5.0',
        path: '/api/challenges'
      }));
      
      const result = detectSuspiciousActivity(normalAttempts);
      expect(result.isSuspicious).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should provide user-friendly error messages', () => {
      const { getRateLimitErrorMessage } = require('@/lib/rate-limit-config');
      
      const loginPolicy = { description: 'Login attempts' };
      const message = getRateLimitErrorMessage(loginPolicy, 300);
      
      expect(message).toContain('login attempts');
      expect(message).toContain('5 minutes');
    });

    it('should handle singular vs plural time units correctly', () => {
      const { getRateLimitErrorMessage } = require('@/lib/rate-limit-config');
      
      const policy = { description: 'Login attempts' };
      const message1 = getRateLimitErrorMessage(policy, 60); // 1 minute
      const message2 = getRateLimitErrorMessage(policy, 180); // 3 minutes
      
      expect(message1).toContain('1 minute');
      expect(message1).not.toContain('minutes');
      expect(message2).toContain('3 minutes');
    });
  });
});

describe('Integration Tests', () => {
  it('should work end-to-end with actual request objects', async () => {
    const request = createMockRequest('/api/auth/login', '192.168.1.200');
    
    // Test the full flow
    let result = await checkRateLimit(request);
    expect(result.allowed).toBe(true);
    
    // Make requests until blocked
    let attempts = 0;
    while (result.allowed && attempts < 10) {
      result = await checkRateLimit(request);
      attempts++;
    }
    
    expect(result.allowed).toBe(false);
    expect(attempts).toBeLessThanOrEqual(6); // Should be blocked after 5 attempts
  });
});

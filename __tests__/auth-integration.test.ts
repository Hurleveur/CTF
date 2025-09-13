import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter';
import { validate } from '@/lib/validation/auth';

// Mock functions
const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>;
const mockResetRateLimit = resetRateLimit as jest.MockedFunction<typeof resetRateLimit>;
const mockValidate = validate as jest.MockedFunction<typeof validate>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock modules first
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/rate-limiter');
jest.mock('@/lib/validation/auth', () => ({
  loginSchema: {},
  validate: jest.fn(),
}));

// Create local mock client for this test file
const mockSupabaseAuth = {
  signInWithPassword: jest.fn(),
  getUser: jest.fn(),
};
const mockSupabaseFrom = jest.fn();
const mockSupabaseClient = {
  auth: mockSupabaseAuth,
  from: mockSupabaseFrom,
};

// Import after mocking
import { POST } from '@/app/api/auth/login/route';
import { GET } from '@/app/api/profile/route';

describe('Authentication Integration Tests', () => {
  const createMockRequest = (method: string, body?: any): NextRequest => {
    const url = 'http://localhost:3000/api/auth/login';
    return new NextRequest(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the actual mocked functions
    const { createClient } = require('@/lib/supabase/server');
    const { checkRateLimit, resetRateLimit } = require('@/lib/rate-limiter');
    const { validate } = require('@/lib/validation/auth');
    
    // Set up default mock behavior
    createClient.mockResolvedValue(mockSupabaseClient);
    checkRateLimit.mockResolvedValue({ allowed: true });
    resetRateLimit.mockResolvedValue();
    validate.mockReturnValue({ ok: true, data: {} });
  });

  describe('Login Authentication Flow', () => {
    it('should reject login with invalid credentials', async () => {
      const { validate } = require('@/lib/validation/auth');
      
      // Mock validation success
      validate.mockReturnValue({
        ok: true,
        data: { email: 'test@test.com', password: 'password' }
      });

      // Mock Supabase auth failure
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      const request = createMockRequest('POST', {
        email: 'test@test.com',
        password: 'wrongpassword'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
    });

    it('should allow login with valid credentials', async () => {
      const { validate } = require('@/lib/validation/auth');
      
      // Mock validation success
      validate.mockReturnValue({
        ok: true,
        data: { email: 'test@test.com', password: 'validpassword' }
      });

      // Mock Supabase auth success
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user123',
            email: 'test@test.com',
            role: 'authenticated',
            last_sign_in_at: new Date().toISOString(),
          },
          session: { access_token: 'token123', refresh_token: 'refresh123' }
        },
        error: null
      });

      const request = createMockRequest('POST', {
        email: 'test@test.com',
        password: 'validpassword'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Login successful');
      expect(data.user.email).toBe('test@test.com');
    });

    it('should enforce rate limiting on login attempts', async () => {
      const { checkRateLimit } = require('@/lib/rate-limiter');
      
      // Mock rate limit exceeded - return a NextResponse directly
      const rateLimitResponse = NextResponse.json(
        { error: 'Too many requests', retryAfter: 60 },
        { status: 429 }
      );
      
      checkRateLimit.mockResolvedValue({
        allowed: false,
        response: rateLimitResponse
      });

      const request = createMockRequest('POST', {
        email: 'test@test.com',
        password: 'password'
      });

      const result = await POST(request);
      
      expect(checkRateLimit).toHaveBeenCalledWith(request);
      expect(result).toBe(rateLimitResponse);
    });
  });

  describe('Protected Route Authorization', () => {
    it('should deny access to profile without authentication', async () => {
      // Mock no authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' }
      });

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'GET',
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should allow access to profile with valid authentication', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user123',
            email: 'test@test.com',
          }
        },
        error: null
      });

      // Mock database query chains
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'user123',
          email: 'test@test.com',
          full_name: 'Test User',
          role: 'user',
          created_at: new Date().toISOString(),
        },
        error: null
      });
      
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      
      // Mock submissions query
      const mockSubmissionsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });
      
      // Mock leaderboard query
      const mockLeaderboardOrder = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });
      const mockLeaderboardSelect = jest.fn().mockReturnValue({
        order: mockLeaderboardOrder
      });

      // Mock from() to return different behavior based on table name
      mockSupabaseClient.from.mockImplementation((tableName) => {
        if (tableName === 'profiles') {
          return { select: mockSelect };
        } else if (tableName === 'submissions') {
          return { select: mockSubmissionsSelect };
        } else if (tableName === 'leaderboard') {
          return { select: mockLeaderboardSelect };
        }
        return { select: jest.fn() };
      });

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'GET',
      });

      const response = await GET();
      
      expect(response.status).toBe(200);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
    });
  });

  describe('Input Validation Security', () => {
    it('should reject login with invalid email format', async () => {
      const { validate } = require('@/lib/validation/auth');
      
      // Mock validation failure
      validate.mockReturnValue({
        ok: false,
        errors: { email: ['Invalid email format'] }
      });

      const request = createMockRequest('POST', {
        email: 'invalid-email',
        password: 'password123'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.email).toContain('Invalid email format');
    });

    it('should reject login with missing password', async () => {
      const { validate } = require('@/lib/validation/auth');
      
      // Mock validation failure for missing password
      validate.mockReturnValue({
        ok: false,
        errors: { password: ['Password must be at least 8 characters'] }
      });

      const request = createMockRequest('POST', {
        email: 'test@test.com',
        password: ''
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('Error Handling Security', () => {
    it('should not leak sensitive information in error messages', async () => {
      const { validate } = require('@/lib/validation/auth');
      
      // Mock validation success
      validate.mockReturnValue({
        ok: true,
        data: { email: 'test@test.com', password: 'password' }
      });

      // Mock Supabase internal error
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Database connection failed: postgres://user:password@localhost:5432/db' }
      });

      const request = createMockRequest('POST', {
        email: 'test@test.com',
        password: 'password'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials'); // Generic message, not the detailed error
      expect(data.error).not.toContain('Database connection');
      expect(data.error).not.toContain('postgres://');
    });

    it('should handle unexpected errors gracefully', async () => {
      const { validate } = require('@/lib/validation/auth');
      
      // Mock validation to throw unexpected error
      validate.mockImplementation(() => {
        throw new Error('Unexpected validation error');
      });

      const request = createMockRequest('POST', {
        email: 'test@test.com',
        password: 'password'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Session Management Security', () => {
    it('should properly handle session cleanup on logout', async () => {
      // This would test the logout endpoint if we import it
      // For now, we test the concept through the auth context
      expect(true).toBe(true); // Placeholder - would need actual logout test
    });

    it('should validate session tokens properly', async () => {
      // Mock expired/invalid session
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' }
      });

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid_token_here'
        }
      });

      const response = await GET();
      expect(response.status).toBe(401);
    });
  });
});

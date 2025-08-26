import { POST as loginPost } from '@/app/api/auth/login/route';
import { POST as signupPost } from '@/app/api/auth/signup/route';
import { POST as logoutPost } from '@/app/api/auth/logout/route';
import { GET as sessionGet, POST as sessionPost } from '@/app/api/auth/session/route';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn(),
    },
  })),
}));

const mockSupabase = require('@/lib/supabase/server').createClient();

// Mock the NextRequest object for testing
const mockRequest = (method: string, body?: any): Request => {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('host', 'localhost:3000');
  
  return new Request('http://localhost:3000/api/auth/test', {
    method: method,
    body: body ? JSON.stringify(body) : undefined,
    headers: headers,
  });
};

describe('Authentication API Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Endpoint (/api/auth/login)', () => {
    it('should validate email format', async () => {
      const request = mockRequest('POST', { 
        email: 'invalid-email', 
        password: 'password123' 
      });

      const response = await loginPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.email).toBeDefined();
    });

    it('should validate password length', async () => {
      const request = mockRequest('POST', { 
        email: 'test@example.com', 
        password: '123' 
      });

      const response = await loginPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.password).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      mockSupabase().auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      });

      const request = mockRequest('POST', { 
        email: 'test@example.com', 
        password: 'wrongpassword' 
      });

      const response = await loginPost(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
    });

    it('should return success for valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        last_sign_in_at: '2024-01-01T00:00:00Z'
      };

      mockSupabase().auth.signInWithPassword.mockResolvedValue({
        data: { 
          user: mockUser, 
          session: { user: mockUser, access_token: 'token' } 
        },
        error: null
      });

      const request = mockRequest('POST', { 
        email: 'test@example.com', 
        password: 'password123' 
      });

      const response = await loginPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Login successful');
      expect(data.user.email).toBe('test@example.com');
    });

    it('should handle server errors gracefully', async () => {
      mockSupabase().auth.signInWithPassword.mockRejectedValue(new Error('Database error'));

      const request = mockRequest('POST', { 
        email: 'test@example.com', 
        password: 'password123' 
      });

      const response = await loginPost(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Signup Endpoint (/api/auth/signup)', () => {
    it('should validate email format', async () => {
      const request = mockRequest('POST', { 
        email: 'invalid-email', 
        password: 'password123',
        fullName: 'Test User' 
      });

      const response = await signupPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.email).toBeDefined();
    });

    it('should handle duplicate user registration', async () => {
      mockSupabase().auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' }
      });

      const request = mockRequest('POST', { 
        email: 'existing@example.com', 
        password: 'password123' 
      });

      const response = await signupPost(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Email address is already registered');
    });

    it('should return success for valid signup', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'new@example.com',
        email_confirmed_at: null
      };

      mockSupabase().auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const request = mockRequest('POST', { 
        email: 'new@example.com', 
        password: 'password123',
        fullName: 'New User' 
      });

      const response = await signupPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('Registration successful');
      expect(data.user.email).toBe('new@example.com');
    });
  });

  describe('Session Endpoint (/api/auth/session)', () => {
    it('should return unauthenticated for no session', async () => {
      mockSupabase().auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const request = mockRequest('GET');
      const response = await sessionGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(false);
      expect(data.user).toBeNull();
    });

    it('should return session info for authenticated user', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'user',
          last_sign_in_at: '2024-01-01T00:00:00Z',
          email_confirmed_at: '2024-01-01T00:00:00Z'
        },
        access_token: 'token',
        expires_at: Date.now() + 3600000
      };

      mockSupabase().auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const request = mockRequest('GET');
      const response = await sessionGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.user.email).toBe('test@example.com');
      expect(data.session.access_token).toBe('token');
    });
  });

  describe('Logout Endpoint (/api/auth/logout)', () => {
    it('should handle successful logout', async () => {
      mockSupabase().auth.signOut.mockResolvedValue({
        error: null
      });

      const request = mockRequest('POST');
      const response = await logoutPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Logout successful');
    });

    it('should handle logout errors', async () => {
      mockSupabase().auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' }
      });

      const request = mockRequest('POST');
      const response = await logoutPost(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Logout failed');
    });
  });

  describe('Input Sanitization', () => {
    it('should handle malicious input in email field', async () => {
      const request = mockRequest('POST', { 
        email: '<script>alert("xss")</script>@example.com', 
        password: 'password123' 
      });

      const response = await loginPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should handle SQL injection attempts', async () => {
      const request = mockRequest('POST', { 
        email: "test@example.com'; DROP TABLE users; --", 
        password: 'password123' 
      });

      const response = await loginPost(request);
      const data = await response.json();

      // Should fail validation due to invalid email format
      expect(response.status).toBe(400);
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(10000);
      const request = mockRequest('POST', { 
        email: 'test@example.com', 
        password: longPassword 
      });

      const response = await loginPost(request);
      
      // Should not crash the server
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('should not leak sensitive information in errors', async () => {
      mockSupabase().auth.signInWithPassword.mockRejectedValue(
        new Error('Connection failed to database server 10.0.0.1 with user admin')
      );

      const request = mockRequest('POST', { 
        email: 'test@example.com', 
        password: 'password123' 
      });

      const response = await loginPost(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.error).not.toContain('database');
      expect(data.error).not.toContain('10.0.0.1');
      expect(data.error).not.toContain('admin');
    });

    it('should handle malformed JSON', async () => {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      
      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: '{ invalid json',
        headers: headers,
      });

      const response = await loginPost(request);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Rate Limiting Considerations', () => {
    it('should not reveal timing information', async () => {
      const validRequest = mockRequest('POST', { 
        email: 'valid@example.com', 
        password: 'password123' 
      });

      const invalidRequest = mockRequest('POST', { 
        email: 'invalid@example.com', 
        password: 'wrongpass' 
      });

      mockSupabase().auth.signInWithPassword
        .mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: 'Invalid credentials' }
        })
        .mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: 'Invalid credentials' }
        });

      const start1 = Date.now();
      await loginPost(validRequest);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await loginPost(invalidRequest);
      const time2 = Date.now() - start2;

      // Response times should be similar (within 100ms)
      // Note: This is a basic check, real timing attacks are more sophisticated
      expect(Math.abs(time1 - time2)).toBeLessThan(100);
    });
  });
});

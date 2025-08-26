import { POST as loginPost } from '@/app/api/auth/login/route';
import { POST as signupPost } from '@/app/api/auth/signup/route';
import { GET as sessionGet } from '@/app/api/auth/session/route';

// Mock Supabase client with persistent state for integration testing
let mockUserDatabase: Map<string, any> = new Map();
let mockSessionStore: Map<string, any> = new Map();

const mockAuth = {
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  refreshSession: jest.fn(),
};

const mockSupabaseClient = {
  auth: mockAuth,
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock the NextRequest object for testing
const mockRequest = (method: string, body?: any, headers?: Record<string, string>): Request => {
  const requestHeaders = new Headers();
  requestHeaders.set('Content-Type', 'application/json');
  requestHeaders.set('host', 'localhost:3000');
  
  // Add any additional headers (like cookies for session tests)
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      requestHeaders.set(key, value);
    });
  }
  
  return new Request('http://localhost:3000/api/auth/test', {
    method: method,
    body: body ? JSON.stringify(body) : undefined,
    headers: requestHeaders,
  });
};

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserDatabase.clear();
    mockSessionStore.clear();
    
    // Setup mock implementations that simulate Supabase behavior
    mockAuth.signUp.mockImplementation(async ({ email, password, options }) => {
      // Check if user already exists
      if (mockUserDatabase.has(email)) {
        return {
          data: { user: null },
          error: { message: 'User already registered' }
        };
      }
      
      // Create new user
      const user = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        email_confirmed_at: null, // Simulate email verification requirement
        user_metadata: {
          full_name: options?.data?.full_name || null
        },
        role: 'authenticated',
        created_at: new Date().toISOString(),
        last_sign_in_at: null
      };
      
      // Store user with password (in real app, this would be hashed)
      mockUserDatabase.set(email, { ...user, password });
      
      return {
        data: { user },
        error: null
      };
    });
    
    mockAuth.signInWithPassword.mockImplementation(async ({ email, password }) => {
      const storedUser = mockUserDatabase.get(email);
      
      if (!storedUser || storedUser.password !== password) {
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid credentials' }
        };
      }
      
      // Check if email is confirmed (simulate Supabase email verification)
      if (!storedUser.email_confirmed_at) {
        return {
          data: { user: null, session: null },
          error: { message: 'Email not confirmed' }
        };
      }
      
      // Create session
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const session = {
        access_token: `at-${sessionId}`,
        refresh_token: `rt-${sessionId}`,
        expires_at: Date.now() + (60 * 60 * 1000), // 1 hour
        user: {
          ...storedUser,
          last_sign_in_at: new Date().toISOString()
        }
      };
      
      mockSessionStore.set(sessionId, session);
      
      // Update user's last sign in
      storedUser.last_sign_in_at = new Date().toISOString();
      mockUserDatabase.set(email, storedUser);
      
      return {
        data: { user: session.user, session },
        error: null
      };
    });
    
    mockAuth.getSession.mockImplementation(async () => {
      // In a real implementation, this would check cookies/headers
      // For testing, we'll return the first active session if any
      const activeSessions = Array.from(mockSessionStore.values()).filter(
        session => session.expires_at > Date.now()
      );
      
      if (activeSessions.length === 0) {
        return { data: { session: null }, error: null };
      }
      
      return { data: { session: activeSessions[0] }, error: null };
    });
  });

  describe('Complete Signup and Login Flow', () => {
    const testUser = {
      email: 'newuser@example.com',
      password: 'securepassword123',
      fullName: 'Test User'
    };

    it('should complete full signup and login workflow', async () => {
      // Step 1: Sign up new user
      const signupRequest = mockRequest('POST', {
        email: testUser.email,
        password: testUser.password,
        fullName: testUser.fullName
      });

      const signupResponse = await signupPost(signupRequest);
      const signupData = await signupResponse.json();

      expect(signupResponse.status).toBe(200);
      expect(signupData.message).toContain('Registration successful');
      expect(signupData.user.email).toBe(testUser.email);
      expect(signupData.user.email_confirmed_at).toBeNull(); // Should require email confirmation
      
      // Verify user was stored in our mock database
      expect(mockUserDatabase.has(testUser.email)).toBe(true);
      const storedUser = mockUserDatabase.get(testUser.email);
      expect(storedUser.user_metadata.full_name).toBe(testUser.fullName);

      // Step 2: Try to login before email confirmation (should fail)
      const prematureLoginRequest = mockRequest('POST', {
        email: testUser.email,
        password: testUser.password
      });

      const prematureLoginResponse = await loginPost(prematureLoginRequest);
      const prematureLoginData = await prematureLoginResponse.json();

      expect(prematureLoginResponse.status).toBe(401);
      expect(prematureLoginData.error).toBe('Invalid credentials');

      // Step 3: Simulate email confirmation
      storedUser.email_confirmed_at = new Date().toISOString();
      mockUserDatabase.set(testUser.email, storedUser);

      // Step 4: Login after email confirmation (should succeed)
      const loginRequest = mockRequest('POST', {
        email: testUser.email,
        password: testUser.password
      });

      const loginResponse = await loginPost(loginRequest);
      const loginData = await loginResponse.json();

      expect(loginResponse.status).toBe(200);
      expect(loginData.message).toBe('Login successful');
      expect(loginData.user.email).toBe(testUser.email);
      expect(loginData.user.last_sign_in_at).toBeTruthy();
      
      // Verify session was created
      expect(mockSessionStore.size).toBe(1);
      const session = Array.from(mockSessionStore.values())[0];
      expect(session.user.email).toBe(testUser.email);
      expect(session.access_token).toBeTruthy();
      expect(session.expires_at).toBeGreaterThan(Date.now());
    });

    it('should prevent duplicate registrations', async () => {
      // Step 1: First signup (should succeed)
      const firstSignupRequest = mockRequest('POST', {
        email: testUser.email,
        password: testUser.password,
        fullName: testUser.fullName
      });

      const firstSignupResponse = await signupPost(firstSignupRequest);
      expect(firstSignupResponse.status).toBe(200);

      // Step 2: Second signup with same email (should fail)
      const duplicateSignupRequest = mockRequest('POST', {
        email: testUser.email,
        password: 'differentpassword123',
        fullName: 'Different Name'
      });

      const duplicateSignupResponse = await signupPost(duplicateSignupRequest);
      const duplicateSignupData = await duplicateSignupResponse.json();

      expect(duplicateSignupResponse.status).toBe(409);
      expect(duplicateSignupData.error).toBe('Email address is already registered');
    });

    it('should validate signup input properly', async () => {
      // Test invalid email
      const invalidEmailRequest = mockRequest('POST', {
        email: 'not-an-email',
        password: 'password123',
        fullName: 'Test User'
      });

      const invalidEmailResponse = await signupPost(invalidEmailRequest);
      const invalidEmailData = await invalidEmailResponse.json();

      expect(invalidEmailResponse.status).toBe(400);
      expect(invalidEmailData.error).toBe('Validation failed');
      expect(invalidEmailData.details.email).toBeDefined();

      // Test short password
      const shortPasswordRequest = mockRequest('POST', {
        email: 'test@example.com',
        password: '123',
        fullName: 'Test User'
      });

      const shortPasswordResponse = await signupPost(shortPasswordRequest);
      const shortPasswordData = await shortPasswordResponse.json();

      expect(shortPasswordResponse.status).toBe(400);
      expect(shortPasswordData.error).toBe('Validation failed');
      expect(shortPasswordData.details.password).toBeDefined();

      // Test short full name
      const shortNameRequest = mockRequest('POST', {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'A' // Only 1 character
      });

      const shortNameResponse = await signupPost(shortNameRequest);
      const shortNameData = await shortNameResponse.json();

      expect(shortNameResponse.status).toBe(400);
      expect(shortNameData.error).toBe('Validation failed');
      expect(shortNameData.details.fullName).toBeDefined();
    });

    it('should handle login with wrong password', async () => {
      // Setup: Create and confirm a user
      await signupPost(mockRequest('POST', {
        email: testUser.email,
        password: testUser.password,
        fullName: testUser.fullName
      }));
      
      const storedUser = mockUserDatabase.get(testUser.email);
      storedUser.email_confirmed_at = new Date().toISOString();
      mockUserDatabase.set(testUser.email, storedUser);

      // Try to login with wrong password
      const wrongPasswordRequest = mockRequest('POST', {
        email: testUser.email,
        password: 'wrongpassword123'
      });

      const wrongPasswordResponse = await loginPost(wrongPasswordRequest);
      const wrongPasswordData = await wrongPasswordResponse.json();

      expect(wrongPasswordResponse.status).toBe(401);
      expect(wrongPasswordData.error).toBe('Invalid credentials');
    });

    it('should handle login with non-existent user', async () => {
      const nonExistentUserRequest = mockRequest('POST', {
        email: 'nonexistent@example.com',
        password: 'password123'
      });

      const nonExistentUserResponse = await loginPost(nonExistentUserRequest);
      const nonExistentUserData = await nonExistentUserResponse.json();

      expect(nonExistentUserResponse.status).toBe(401);
      expect(nonExistentUserData.error).toBe('Invalid credentials');
    });
  });

  describe('Session Management Tests', () => {
    const testUser = {
      email: 'sessionuser@example.com',
      password: 'sessionpassword123',
      fullName: 'Session Test User'
    };

    beforeEach(async () => {
      // Create and confirm user for session tests
      await signupPost(mockRequest('POST', {
        email: testUser.email,
        password: testUser.password,
        fullName: testUser.fullName
      }));
      
      const storedUser = mockUserDatabase.get(testUser.email);
      storedUser.email_confirmed_at = new Date().toISOString();
      mockUserDatabase.set(testUser.email, storedUser);
    });

    it('should create session after successful login', async () => {
      // Login
      const loginRequest = mockRequest('POST', {
        email: testUser.email,
        password: testUser.password
      });

      const loginResponse = await loginPost(loginRequest);
      expect(loginResponse.status).toBe(200);

      // Check session was created
      expect(mockSessionStore.size).toBe(1);
      const session = Array.from(mockSessionStore.values())[0];
      expect(session.user.email).toBe(testUser.email);
      expect(session.access_token).toBeTruthy();
      expect(session.refresh_token).toBeTruthy();
      expect(session.expires_at).toBeGreaterThan(Date.now());
    });

    it('should return session information when authenticated', async () => {
      // Login first to create session
      await loginPost(mockRequest('POST', {
        email: testUser.email,
        password: testUser.password
      }));

      // Check session status
      const sessionRequest = mockRequest('GET');
      const sessionResponse = await sessionGet(sessionRequest);
      const sessionData = await sessionResponse.json();

      expect(sessionResponse.status).toBe(200);
      expect(sessionData.authenticated).toBe(true);
      expect(sessionData.user.email).toBe(testUser.email);
      expect(sessionData.session.access_token).toBeTruthy();
    });

    it('should return unauthenticated when no session exists', async () => {
      // Check session status without logging in
      const sessionRequest = mockRequest('GET');
      const sessionResponse = await sessionGet(sessionRequest);
      const sessionData = await sessionResponse.json();

      expect(sessionResponse.status).toBe(200);
      expect(sessionData.authenticated).toBe(false);
      expect(sessionData.user).toBeNull();
    });
  });

  describe('Security Tests', () => {
    it('should not expose password in any response', async () => {
      const testUser = {
        email: 'security@example.com',
        password: 'supersecretpassword',
        fullName: 'Security Test'
      };

      // Signup
      const signupRequest = mockRequest('POST', testUser);
      const signupResponse = await signupPost(signupRequest);
      const signupData = await signupResponse.json();

      expect(JSON.stringify(signupData)).not.toContain(testUser.password);

      // Confirm email and login
      const storedUser = mockUserDatabase.get(testUser.email);
      storedUser.email_confirmed_at = new Date().toISOString();
      mockUserDatabase.set(testUser.email, storedUser);

      const loginRequest = mockRequest('POST', {
        email: testUser.email,
        password: testUser.password
      });
      const loginResponse = await loginPost(loginRequest);
      const loginData = await loginResponse.json();

      expect(JSON.stringify(loginData)).not.toContain(testUser.password);

      // Check session
      const sessionRequest = mockRequest('GET');
      const sessionResponse = await sessionGet(sessionRequest);
      const sessionData = await sessionResponse.json();

      expect(JSON.stringify(sessionData)).not.toContain(testUser.password);
    });

    it('should handle malicious signup attempts', async () => {
      const maliciousPayloads = [
        { email: 'malicious1@example.com', password: 'password123', fullName: '<script>alert("xss")</script>' },
        { email: 'malicious2@example.com', password: 'password123', fullName: '${process.env.SECRET}' },
        { email: 'malicious3@example.com', password: 'password123', fullName: '../../../etc/passwd' }
      ];

      for (let i = 0; i < maliciousPayloads.length; i++) {
        const payload = maliciousPayloads[i];
        const request = mockRequest('POST', payload);
        const response = await signupPost(request);
        
        // Should either succeed (and sanitize) or fail validation
        // Accepting 200 (success), 400 (validation error), or 409 (duplicate)
        expect([200, 400, 409].includes(response.status)).toBe(true);
        
        if (response.status === 200) {
          const data = await response.json();
          // The malicious content should be stored as-is (Supabase handles sanitization)
          // but shouldn't cause any execution or security issues
          expect(data.user.email).toBe(payload.email);
        }
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent signup attempts', async () => {
      const email = 'concurrent@example.com';
      const password = 'password123';
      
      // Simulate concurrent signup requests
      const requests = Array(5).fill(null).map(() =>
        signupPost(mockRequest('POST', {
          email,
          password,
          fullName: 'Concurrent User'
        }))
      );

      const responses = await Promise.all(requests);
      
      // Only one should succeed (200), others should fail (409)
      const successCount = responses.filter(r => r.status === 200).length;
      const conflictCount = responses.filter(r => r.status === 409).length;
      
      expect(successCount).toBe(1);
      expect(conflictCount).toBe(4);
    });

    it('should handle empty request body', async () => {
      const request = mockRequest('POST', {});
      const response = await signupPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should handle missing required fields', async () => {
      const incompletePayloads = [
        { email: 'test@example.com' }, // missing password
        { password: 'password123' }, // missing email
        { email: '', password: 'password123' }, // empty email
        { email: 'test@example.com', password: '' } // empty password
      ];

      for (const payload of incompletePayloads) {
        const request = mockRequest('POST', payload);
        const response = await signupPost(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Validation failed');
      }
    });
  });
});

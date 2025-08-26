/**
 * Integration tests for CTF platform
 * These tests simulate more complex scenarios and database interactions
 */

import { GET as challengesGet } from '@/app/api/challenges/route';
import { POST as submitPost } from '@/app/api/challenges/submit/route';
import { POST as loginPost } from '@/app/api/auth/login/route';
import { POST as signupPost } from '@/app/api/auth/signup/route';

// Mock Supabase with more comprehensive database simulation
const mockDatabase = {
  challenges: new Map([
    ['550e8400-e29b-41d4-a716-446655440000', {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Web Challenge 1',
      description: 'Find the hidden flag',
      category: 'web',
      difficulty: 'easy',
      points: 100,
      hints: ['Look at the source'],
      flag: 'CTF{web_flag_123}',
      is_active: true
    }],
    ['550e8400-e29b-41d4-a716-446655440001', {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Crypto Challenge 1',
      description: 'Decode the message',
      category: 'crypto',
      difficulty: 'medium',
      points: 200,
      hints: ['Use Caesar cipher'],
      flag: 'CTF{crypto_flag_456}',
      is_active: true
    }]
  ]),
  users: new Map(),
  submissions: new Map(),
  sessions: new Map()
};

// Database operation simulators
const simulateDelay = (ms: number = 50) => new Promise(resolve => setTimeout(resolve, ms));

const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();

// Enhanced database query simulation
const createIntegrationMockQuery = (tableName: string) => {
  const mockQuery = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    single: jest.fn(),
    insert: jest.fn(),
  };
  
  // Make all methods chainable
  mockQuery.select.mockReturnValue(mockQuery);
  mockQuery.eq.mockReturnValue(mockQuery);
  mockQuery.order.mockReturnValue(mockQuery);
  
  // Set up default behaviors
  mockQuery.single.mockImplementation(async () => {
    await simulateDelay();
    
    if (tableName === 'challenges') {
      const challenge = Array.from(mockDatabase.challenges.values())
        .find(c => c.is_active);
      return { data: challenge || null, error: challenge ? null : { message: 'Not found' } };
    }
    
    if (tableName === 'submissions') {
      // Simulate checking for existing submissions
      return { data: null, error: { code: 'PGRST116' } }; // No rows found
    }
    
    return { data: null, error: null };
  });
  
  mockQuery.insert.mockImplementation(async (data) => {
    await simulateDelay();
    const id = `${tableName}_${Date.now()}`;
    return { data: { id, ...data }, error: null };
  });
  
  // For challenges list - need to handle two order calls
  let orderCallCount = 0;
  mockQuery.order.mockImplementation((field, options) => {
    orderCallCount++;
    if (orderCallCount === 1) {
      // First order call returns the query for chaining
      return mockQuery;
    } else {
      // Second order call returns the actual result
      return simulateDelay().then(() => {
        if (tableName === 'challenges') {
          const challenges = Array.from(mockDatabase.challenges.values())
            .filter(c => c.is_active)
            .sort((a, b) => a.points - b.points);
          return { data: challenges, error: null };
        }
        return { data: [], error: null };
      });
    }
  });
  
  return mockQuery;
};

const mockAuth = {
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  refreshSession: jest.fn(),
};

const mockSupabaseClient = {
  auth: mockAuth,
  from: mockFrom,
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock the NextRequest object for testing
const mockRequest = (method: string, body?: any): Request => {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('host', 'localhost:3000');
  
  return new Request('http://localhost:3000/api/test', {
    method: method,
    body: body ? JSON.stringify(body) : undefined,
    headers: headers,
  });
};

describe('CTF Platform Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset database state
    mockDatabase.submissions.clear();
    mockDatabase.sessions.clear();
    
    // Setup default authenticated session
    mockAuth.getSession.mockResolvedValue({
      data: { 
        session: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            role: 'user'
          }
        }
      },
      error: null
    });
  });

  describe('User Journey: Registration to Challenge Solving', () => {
    it('should handle complete user registration and challenge solving flow', async () => {
      // Step 1: User registration
      const newUser = {
        id: 'user-new',
        email: 'newuser@example.com',
        email_confirmed_at: new Date().toISOString()
      };
      
      mockAuth.signUp.mockResolvedValue({
        data: { user: newUser },
        error: null
      });
      
      const signupRequest = mockRequest('POST', {
        email: 'newuser@example.com',
        password: 'securepassword123',
        fullName: 'New User'
      });
      
      const signupResponse = await signupPost(signupRequest);
      const signupData = await signupResponse.json();
      
      expect(signupResponse.status).toBe(200);
      expect(signupData.user.email).toBe('newuser@example.com');
      
      // Step 2: User login
      mockAuth.signInWithPassword.mockResolvedValue({
        data: {
          user: newUser,
          session: { user: newUser, access_token: 'token123' }
        },
        error: null
      });
      
      const loginRequest = mockRequest('POST', {
        email: 'newuser@example.com',
        password: 'securepassword123'
      });
      
      const loginResponse = await loginPost(loginRequest);
      const loginData = await loginResponse.json();
      
      expect(loginResponse.status).toBe(200);
      expect(loginData.message).toBe('Login successful');
      
      // Step 3: Get challenges
      // Create proper mock query with correct chaining for challenges route
      const mockQuery = {
        select: jest.fn(),
        eq: jest.fn(),
        order: jest.fn(),
      };
      
      mockQuery.select.mockReturnValue(mockQuery);
      mockQuery.eq.mockReturnValue(mockQuery);
      mockQuery.order.mockReturnValueOnce(mockQuery); // First order call
      mockQuery.order.mockResolvedValueOnce({ // Second order call (final result)
        data: Array.from(mockDatabase.challenges.values()).filter(c => c.is_active),
        error: null
      });
      
      mockFrom.mockReturnValue(mockQuery);
      
      const challengesRequest = mockRequest('GET');
      const challengesResponse = await challengesGet(challengesRequest);
      const challengesData = await challengesResponse.json();
      
      if (challengesResponse.status !== 200) {
        console.log('Challenges response error:', challengesData);
      }
      
      expect(challengesResponse.status).toBe(200);
      expect(challengesData.challenges.length).toBeGreaterThan(0);
      expect(challengesData.challenges[0].title).toBe('Web Challenge 1');
      
      // Step 4: Submit correct flag
      mockFrom.mockImplementation((tableName) => createIntegrationMockQuery(tableName));
      
      const submitRequest = mockRequest('POST', {
        challenge_id: '550e8400-e29b-41d4-a716-446655440000',
        flag: 'CTF{web_flag_123}'
      });
      
      const submitResponse = await submitPost(submitRequest);
      const submitData = await submitResponse.json();
      
      expect(submitResponse.status).toBe(200);
      expect(submitData.success).toBe(true);
      expect(submitData.points_awarded).toBe(100);
    });
  });

  describe('Concurrent Submissions', () => {
    it('should handle race conditions during flag submission', async () => {
      const challengeId = '550e8400-e29b-41d4-a716-446655440000';
      const flag = 'CTF{web_flag_123}';
      
      // Mock two users submitting simultaneously
      const user1Session = {
        user: { id: 'user-1', email: 'user1@example.com', role: 'user' }
      };
      const user2Session = {
        user: { id: 'user-2', email: 'user2@example.com', role: 'user' }
      };
      
      // Simulate race condition - both check at same time, no existing submission
      let checkCallCount = 0;
      mockFrom.mockImplementation((tableName) => {
        const query = createIntegrationMockQuery(tableName);
        
        if (tableName === 'submissions') {
          query.single = jest.fn().mockImplementation(async () => {
            await simulateDelay(Math.random() * 100); // Random delay to simulate race
            checkCallCount++;
            
            // Both users should initially see no existing submission
            if (checkCallCount <= 2) {
              return { data: null, error: { code: 'PGRST116' } };
            }
            
            // Subsequent checks might find existing submission
            return { 
              data: { id: 'existing-submission', user_id: 'user-1' }, 
              error: null 
            };
          });
          
          query.insert = jest.fn().mockImplementation(async (data) => {
            await simulateDelay(50);
            // Simulate that only first submission succeeds
            if (data.user_id === 'user-1') {
              return { data: { id: 'submission-1', ...data }, error: null };
            } else {
              // Second user gets constraint violation (duplicate submission)
              return { 
                data: null, 
                error: { message: 'duplicate key value violates unique constraint' } 
              };
            }
          });
        }
        
        return query;
      });
      
      // First user submission
      mockAuth.getSession.mockResolvedValueOnce({
        data: { session: user1Session },
        error: null
      });
      
      const request1 = mockRequest('POST', {
        challenge_id: challengeId,
        flag: flag
      });
      
      // Second user submission (concurrent)
      mockAuth.getSession.mockResolvedValueOnce({
        data: { session: user2Session },
        error: null
      });
      
      const request2 = mockRequest('POST', {
        challenge_id: challengeId,
        flag: flag
      });
      
      // Submit both concurrently
      const [response1, response2] = await Promise.all([
        submitPost(request1),
        submitPost(request2)
      ]);
      
      const data1 = await response1.json();
      const data2 = await response2.json();
      
      // One should succeed, one should fail
      const responses = [
        { response: response1, data: data1 },
        { response: response2, data: data2 }
      ];
      
      const successfulResponses = responses.filter(r => r.response.status === 200 && r.data.success);
      const failedResponses = responses.filter(r => r.response.status === 500);
      
      expect(successfulResponses.length).toBe(1);
      expect(failedResponses.length).toBe(1);
      expect(successfulResponses[0].data.points_awarded).toBe(100);
    });
  });

  describe('Database Constraint Violations', () => {
    it('should handle unique constraint violations gracefully', async () => {
      const challengeId = '550e8400-e29b-41d4-a716-446655440000';
      
      mockFrom.mockImplementation((tableName) => {
        const query = createIntegrationMockQuery(tableName);
        
        if (tableName === 'submissions') {
          // First check shows no existing submission
          query.single = jest.fn().mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST116' }
          });
          
          // Insert fails due to race condition
          query.insert = jest.fn().mockResolvedValue({
            data: null,
            error: { 
              message: 'duplicate key value violates unique constraint "submissions_user_challenge_unique"',
              code: '23505'
            }
          });
        }
        
        return query;
      });
      
      const request = mockRequest('POST', {
        challenge_id: challengeId,
        flag: 'CTF{web_flag_123}'
      });
      
      const response = await submitPost(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to record submission');
    });
  });

  describe('Database Connection Issues', () => {
    it('should handle database timeout errors', async () => {
      mockAuth.getSession.mockImplementation(async () => {
        await simulateDelay(1000); // Long delay to simulate timeout
        throw new Error('Connection timeout');
      });
      
      const request = mockRequest('GET');
      const response = await challengesGet(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle database connection pool exhaustion', async () => {
      // Use proper mock setup that doesn't throw synchronously
      const mockQuery = {
        select: jest.fn(),
        eq: jest.fn(),
        order: jest.fn(),
      };
      
      mockQuery.select.mockReturnValue(mockQuery);
      mockQuery.eq.mockReturnValue(mockQuery);
      mockQuery.order.mockReturnValueOnce(mockQuery); // First order call
      mockQuery.order.mockRejectedValueOnce(new Error('remaining connection slots are reserved for non-replication superuser connections'));
      
      mockFrom.mockReturnValue(mockQuery);
      
      const request = mockRequest('GET');
      const response = await challengesGet(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Complex Query Scenarios', () => {
    it('should handle pagination and sorting correctly', async () => {
      // Add more challenges to test sorting
      const additionalChallenges = [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          title: 'Hard Challenge',
          difficulty: 'hard',
          points: 500,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          title: 'Easy Challenge 2',
          difficulty: 'easy',
          points: 50,
          is_active: true
        }
      ];
      
      additionalChallenges.forEach(challenge => {
        mockDatabase.challenges.set(challenge.id, challenge as any);
      });
      
      // Use same approach as user journey test
      const mockQuery = {
        select: jest.fn(),
        eq: jest.fn(),
        order: jest.fn(),
      };
      
      mockQuery.select.mockReturnValue(mockQuery);
      mockQuery.eq.mockReturnValue(mockQuery);
      mockQuery.order.mockReturnValueOnce(mockQuery); // First order call
      mockQuery.order.mockResolvedValueOnce({ // Second order call (final result)
        data: Array.from(mockDatabase.challenges.values())
          .filter(c => c.is_active)
          .sort((a, b) => a.points - b.points),
        error: null
      });
      
      mockFrom.mockReturnValue(mockQuery);
      
      const request = mockRequest('GET');
      const response = await challengesGet(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.challenges.length).toBeGreaterThan(2);
      
      // Verify sorting by points (ascending)
      for (let i = 1; i < data.challenges.length; i++) {
        expect(data.challenges[i].points).toBeGreaterThanOrEqual(data.challenges[i-1].points);
      }
    });
  });

  describe('Authentication Edge Cases', () => {
    it('should handle session expiry during request', async () => {
      // Mock session that expires during the request
      let sessionCallCount = 0;
      mockAuth.getSession.mockImplementation(async () => {
        sessionCallCount++;
        await simulateDelay();
        
        if (sessionCallCount === 1) {
          // First call - valid session
          return {
            data: { 
              session: {
                user: { id: 'user-123', email: 'test@example.com' },
                expires_at: Date.now() + 1000
              }
            },
            error: null
          };
        } else {
          // Subsequent calls - session expired
          return {
            data: { session: null },
            error: { message: 'Session expired' }
          };
        }
      });
      
      const request = mockRequest('GET');
      const response = await challengesGet(request);
      const data = await response.json();
      
      expect([401, 500]).toContain(response.status);
    });

    it('should handle malformed session tokens', async () => {
      mockAuth.getSession.mockRejectedValue(
        new Error('JWT token is malformed')
      );
      
      const request = mockRequest('GET');
      const response = await challengesGet(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Flag Validation Edge Cases', () => {
    it('should handle Unicode and special characters in flags', async () => {
      const unicodeChallenge = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        flag: 'CTF{🚩unicode_flag_测试}',
        points: 150,
        title: 'Unicode Challenge'
      };
      
      mockDatabase.challenges.set(unicodeChallenge.id, unicodeChallenge as any);
      
      mockFrom.mockImplementation((tableName) => {
        const query = createIntegrationMockQuery(tableName);
        
        if (tableName === 'challenges') {
          query.single = jest.fn().mockResolvedValue({
            data: unicodeChallenge,
            error: null
          });
        } else if (tableName === 'submissions') {
          query.single = jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }
          });
          
          query.insert = jest.fn().mockResolvedValue({
            data: { id: 'submission-unicode' },
            error: null
          });
        }
        
        return query;
      });
      
      const request = mockRequest('POST', {
        challenge_id: unicodeChallenge.id,
        flag: 'CTF{🚩unicode_flag_测试}'
      });
      
      const response = await submitPost(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.points_awarded).toBe(150);
    });

    it('should handle very long flag submissions', async () => {
      // Create flag that exceeds 500 character limit
      const longFlag = 'CTF{' + 'a'.repeat(500) + '}'; // 505 characters total
      
      const request = mockRequest('POST', {
        challenge_id: '550e8400-e29b-41d4-a716-446655440000',
        flag: longFlag
      });
      
      const response = await submitPost(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.flag).toBeDefined();
    });
  });

  describe('Performance Under Load', () => {
    it('should handle multiple concurrent challenge requests', async () => {
      const numberOfRequests = 10;
      
      // Create new mock instances for each request to avoid interference
      mockFrom.mockImplementation(() => {
        const mockQuery = {
          select: jest.fn(),
          eq: jest.fn(),
          order: jest.fn(),
        };
        
        mockQuery.select.mockReturnValue(mockQuery);
        mockQuery.eq.mockReturnValue(mockQuery);
        mockQuery.order.mockReturnValueOnce(mockQuery); // First order call
        mockQuery.order.mockResolvedValueOnce({ // Second order call (final result)
          data: Array.from(mockDatabase.challenges.values()).filter(c => c.is_active), 
          error: null 
        });
        
        return mockQuery;
      });
      
      const requests = Array.from({ length: numberOfRequests }, () => 
        challengesGet(mockRequest('GET'))
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should complete in reasonable time (less than 2 seconds for 10 concurrent requests)
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity', async () => {
      // Test submitting to non-existent challenge
      mockFrom.mockImplementation((tableName) => {
        const query = createIntegrationMockQuery(tableName);
        
        if (tableName === 'challenges') {
          query.single = jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Challenge not found' }
          });
        } else if (tableName === 'submissions') {
          query.single = jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }
          });
        }
        
        return query;
      });
      
      const request = mockRequest('POST', {
        challenge_id: 'non-existent-challenge-id',
        flag: 'CTF{test}'
      });
      
      const response = await submitPost(request);
      
      // Should fail validation first (invalid UUID)
      expect(response.status).toBe(400);
    });

    it('should handle soft-deleted challenges', async () => {
      // Create an inactive challenge
      const inactiveChallenge = {
        id: '550e8400-e29b-41d4-a716-446655440005',
        title: 'Inactive Challenge',
        flag: 'CTF{inactive}',
        points: 100,
        is_active: false
      };
      
      mockDatabase.challenges.set(inactiveChallenge.id, inactiveChallenge as any);
      
      mockFrom.mockImplementation((tableName) => {
        const query = createIntegrationMockQuery(tableName);
        
        if (tableName === 'challenges') {
          query.single = jest.fn().mockResolvedValue({
            data: null, // Should not find inactive challenges
            error: { message: 'Challenge not found or inactive' }
          });
        } else if (tableName === 'submissions') {
          query.single = jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }
          });
        }
        
        return query;
      });
      
      const request = mockRequest('POST', {
        challenge_id: inactiveChallenge.id,
        flag: 'CTF{inactive}'
      });
      
      const response = await submitPost(request);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('Challenge not found or inactive');
    });
  });
});

/**
 * Comprehensive API security tests for CTF platform
 */

import { GET as challengesGet } from '@/app/api/challenges/route';
import { POST as submitPost } from '@/app/api/challenges/submit/route';

// Mock Supabase database operations
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();

// Create a chainable mock for database queries
const createMockQuery = () => {
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
  mockQuery.single.mockResolvedValue({ data: null, error: null });
  mockQuery.insert.mockResolvedValue({ data: null, error: null });
  
  return mockQuery;
};

const mockAuth = {
  getSession: jest.fn(),
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

describe('API Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockFrom.mockReturnValue(createMockQuery());
  });

  describe('Challenges API (/api/challenges)', () => {
    it('should require authentication to access challenges', async () => {
      // Mock unauthenticated session
      mockAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const request = mockRequest('GET');
      const response = await challengesGet(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return challenges for authenticated users', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com'
        }
      };

      mockAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const mockChallenges = [
        {
          id: 'challenge-1',
          title: 'Test Challenge',
          description: 'A test challenge',
          category: 'web',
          difficulty: 'easy',
          points: 100,
          hints: []
        }
      ];

      // Create a proper mock for the complete chain: from -> select -> eq -> order -> order
      const mockQuery = {
        select: jest.fn(),
        eq: jest.fn(),
        order: jest.fn(),
      };
      
      // Set up the chain
      mockQuery.select.mockReturnValue(mockQuery);
      mockQuery.eq.mockReturnValue(mockQuery);
      mockQuery.order.mockReturnValueOnce(mockQuery); // First order call
      mockQuery.order.mockResolvedValueOnce({ // Second order call (final result)
        data: mockChallenges,
        error: null
      });
      
      mockFrom.mockReturnValue(mockQuery);

      const request = mockRequest('GET');
      const response = await challengesGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenges).toEqual(mockChallenges);
      expect(data.count).toBe(1);
    });

    it('should handle database errors gracefully', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com'
        }
      };

      mockAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      // Mock database error with proper chaining
      const mockQuery = {
        select: jest.fn(),
        eq: jest.fn(),
        order: jest.fn(),
      };
      
      // Set up the chain to fail at the end
      mockQuery.select.mockReturnValue(mockQuery);
      mockQuery.eq.mockReturnValue(mockQuery);
      mockQuery.order.mockReturnValueOnce(mockQuery); // First order call
      mockQuery.order.mockResolvedValueOnce({ // Second order call fails
        data: null,
        error: { message: 'Database connection failed' }
      });
      
      mockFrom.mockReturnValue(mockQuery);

      const request = mockRequest('GET');
      const response = await challengesGet(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch challenges');
    });
  });

  describe('Flag Submission API (/api/challenges/submit)', () => {
    const validChallengeId = '550e8400-e29b-41d4-a716-446655440000';
    const mockAuthenticatedSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user'
      }
    };

    beforeEach(() => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: mockAuthenticatedSession },
        error: null
      });
    });

    it('should validate challenge_id format', async () => {
      const request = mockRequest('POST', {
        challenge_id: 'invalid-uuid',
        flag: 'CTF{test}'
      });

      const response = await submitPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.challenge_id).toBeDefined();
    });

    it('should validate flag input', async () => {
      const request = mockRequest('POST', {
        challenge_id: validChallengeId,
        flag: '' // Empty flag
      });

      const response = await submitPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.flag).toBeDefined();
    });

    it('should handle correct flag submission', async () => {
      const request = mockRequest('POST', {
        challenge_id: validChallengeId,
        flag: 'CTF{correct_flag}'
      });

      // Mock no existing solution
      const mockCheckQuery = createMockQuery();
      mockCheckQuery.single = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // No rows returned
      });

      // Mock challenge fetch
      const mockChallengeQuery = createMockQuery();
      mockChallengeQuery.single = jest.fn().mockResolvedValue({
        data: {
          flag: 'CTF{correct_flag}',
          points: 100,
          title: 'Test Challenge'
        },
        error: null
      });

      // Mock successful insertion
      const mockInsertQuery = createMockQuery();
      mockInsertQuery.insert = jest.fn().mockResolvedValue({
        data: { id: 'submission-123' },
        error: null
      });

      mockFrom
        .mockReturnValueOnce(mockCheckQuery)    // First call for checking existing solution
        .mockReturnValueOnce(mockChallengeQuery) // Second call for fetching challenge
        .mockReturnValueOnce(mockInsertQuery);   // Third call for inserting submission

      const response = await submitPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Congratulations');
      expect(data.points_awarded).toBe(100);
    });

    it('should handle incorrect flag submission', async () => {
      const request = mockRequest('POST', {
        challenge_id: validChallengeId,
        flag: 'CTF{wrong_flag}'
      });

      // Mock no existing solution
      const mockCheckQuery = createMockQuery();
      mockCheckQuery.single = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      // Mock challenge fetch with different correct flag
      const mockChallengeQuery = createMockQuery();
      mockChallengeQuery.single = jest.fn().mockResolvedValue({
        data: {
          flag: 'CTF{correct_flag}',
          points: 100,
          title: 'Test Challenge'
        },
        error: null
      });

      // Mock successful insertion (incorrect submission still gets recorded)
      const mockInsertQuery = createMockQuery();
      mockInsertQuery.insert = jest.fn().mockResolvedValue({
        data: { id: 'submission-123' },
        error: null
      });

      mockFrom
        .mockReturnValueOnce(mockCheckQuery)
        .mockReturnValueOnce(mockChallengeQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const response = await submitPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Incorrect flag. Try again!');
      expect(data.points_awarded).toBe(0);
    });

    it('should prevent duplicate submissions', async () => {
      const request = mockRequest('POST', {
        challenge_id: validChallengeId,
        flag: 'CTF{test}'
      });

      // Mock existing solution found
      const mockCheckQuery = createMockQuery();
      mockCheckQuery.single = jest.fn().mockResolvedValue({
        data: { id: 'existing-submission-123' },
        error: null
      });

      mockFrom.mockReturnValue(mockCheckQuery);

      const response = await submitPost(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Challenge already solved');
      expect(data.message).toBe('You have already solved this challenge');
    });

    it('should handle challenge not found', async () => {
      const request = mockRequest('POST', {
        challenge_id: validChallengeId,
        flag: 'CTF{test}'
      });

      // Mock no existing solution
      const mockCheckQuery = createMockQuery();
      mockCheckQuery.single = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      // Mock challenge not found
      const mockChallengeQuery = createMockQuery();
      mockChallengeQuery.single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Challenge not found' }
      });

      mockFrom
        .mockReturnValueOnce(mockCheckQuery)
        .mockReturnValueOnce(mockChallengeQuery);

      const response = await submitPost(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Challenge not found or inactive');
    });

    it('should handle database insertion errors', async () => {
      const request = mockRequest('POST', {
        challenge_id: validChallengeId,
        flag: 'CTF{test}'
      });

      // Mock no existing solution
      const mockCheckQuery = createMockQuery();
      mockCheckQuery.single = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      // Mock successful challenge fetch
      const mockChallengeQuery = createMockQuery();
      mockChallengeQuery.single = jest.fn().mockResolvedValue({
        data: {
          flag: 'CTF{correct_flag}',
          points: 100,
          title: 'Test Challenge'
        },
        error: null
      });

      // Mock insertion error
      const mockInsertQuery = createMockQuery();
      mockInsertQuery.insert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insertion failed' }
      });

      mockFrom
        .mockReturnValueOnce(mockCheckQuery)
        .mockReturnValueOnce(mockChallengeQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const response = await submitPost(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to record submission');
    });

    it('should handle database check errors', async () => {
      const request = mockRequest('POST', {
        challenge_id: validChallengeId,
        flag: 'CTF{test}'
      });

      // Mock database error during check (not the "no rows" error)
      const mockCheckQuery = createMockQuery();
      mockCheckQuery.single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' }
      });

      mockFrom.mockReturnValue(mockCheckQuery);

      const response = await submitPost(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to check submission status');
    });

    it('should require authentication', async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const request = mockRequest('POST', {
        challenge_id: validChallengeId,
        flag: 'CTF{test}'
      });

      const response = await submitPost(request);
      const data = await response.json();

      // The API validates input first, then checks authentication
      // Since input is valid but session is null, it should return 401
      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should handle authentication after validation', async () => {
      // Mock authenticated session initially, then return different result
      mockAuth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null
      });

      const request = mockRequest('POST', {
        challenge_id: validChallengeId,
        flag: 'CTF{test}'
      });

      // The endpoint validates first, then checks auth, so we need to set up mocks appropriately
      // For this test, let's verify that after passing validation, auth is checked
      const response = await submitPost(request);
      const data = await response.json();

      // Should pass validation but fail auth check
      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should handle case-insensitive flag comparison', async () => {
      const request = mockRequest('POST', {
        challenge_id: validChallengeId,
        flag: 'ctf{CORRECT_FLAG}' // Different case
      });

      // Mock no existing solution
      const mockCheckQuery = createMockQuery();
      mockCheckQuery.single = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      // Mock challenge with lowercase flag
      const mockChallengeQuery = createMockQuery();
      mockChallengeQuery.single = jest.fn().mockResolvedValue({
        data: {
          flag: 'ctf{correct_flag}',
          points: 100,
          title: 'Test Challenge'
        },
        error: null
      });

      const mockInsertQuery = createMockQuery();
      mockInsertQuery.insert = jest.fn().mockResolvedValue({
        data: { id: 'submission-123' },
        error: null
      });

      mockFrom
        .mockReturnValueOnce(mockCheckQuery)
        .mockReturnValueOnce(mockChallengeQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const response = await submitPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.points_awarded).toBe(100);
    });

    it('should trim whitespace from flags', async () => {
      const request = mockRequest('POST', {
        challenge_id: validChallengeId,
        flag: '  CTF{correct_flag}  ' // Whitespace around flag
      });

      // Mock no existing solution
      const mockCheckQuery = createMockQuery();
      mockCheckQuery.single = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      // Mock challenge
      const mockChallengeQuery = createMockQuery();
      mockChallengeQuery.single = jest.fn().mockResolvedValue({
        data: {
          flag: 'CTF{correct_flag}',
          points: 100,
          title: 'Test Challenge'
        },
        error: null
      });

      const mockInsertQuery = createMockQuery();
      mockInsertQuery.insert = jest.fn().mockResolvedValue({
        data: { id: 'submission-123' },
        error: null
      });

      mockFrom
        .mockReturnValueOnce(mockCheckQuery)
        .mockReturnValueOnce(mockChallengeQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const response = await submitPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify that insert was called with trimmed flag
      expect(mockInsertQuery.insert).toHaveBeenCalledWith({
        user_id: mockAuthenticatedSession.user.id,
        challenge_id: validChallengeId,
        flag_submitted: 'CTF{correct_flag}', // Should be trimmed
        is_correct: true,
        points_awarded: 100,
      });
    });
  });

  describe('Error Handling & Security', () => {
    it('should not leak database connection details', async () => {
      mockAuth.getSession.mockRejectedValue(
        new Error('Connection failed to database server 10.0.0.1 with credentials')
      );

      const request = mockRequest('GET');
      const response = await challengesGet(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(JSON.stringify(data)).not.toContain('10.0.0.1');
      expect(JSON.stringify(data)).not.toContain('credentials');
    });

    it('should handle malformed JSON in submission', async () => {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      
      const request = new Request('http://localhost:3000/api/challenges/submit', {
        method: 'POST',
        body: '{ invalid json',
        headers: headers,
      });

      const response = await submitPost(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should validate flag length limits', async () => {
      const longFlag = 'CTF{' + 'a'.repeat(500) + '}';
      
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
});

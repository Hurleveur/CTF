import { GET as challengesGet } from '@/app/api/challenges/route';
import { POST as submitPost } from '@/app/api/challenges/submit/route';
import { GET as profileGet } from '@/app/api/profile/route';
import { GET as leaderboardGet } from '@/app/api/leaderboard/route';

// Mock Supabase
const mockAuth = {
  getSession: jest.fn(),
};

const mockFrom = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn(),
  insert: jest.fn(),
  range: jest.fn(),
};

const mockSupabaseClient = {
  auth: mockAuth,
  from: jest.fn(() => mockFrom),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock the NextRequest object for testing
const mockRequest = (method: string, body?: any, params?: any): Request => {
  const url = new URL('http://localhost:3000/api/test');
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value as string);
    });
  }

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('host', 'localhost:3000');
  
  return new Request(url.toString(), {
    method: method,
    body: body ? JSON.stringify(body) : undefined,
    headers: headers,
  });
};

const mockAuthenticatedSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user'
  }
};

describe('API Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      // Mock authenticated session
      mockSupabase().auth.getSession.mockResolvedValue({
        data: { session: mockAuthenticatedSession },
        error: null
      });

      const mockChallenges = [
        {
          id: 'challenge-1',
          title: 'Test Challenge',
          description: 'Test description',
          category: 'web',
          difficulty: 'easy',
          points: 100,
          hints: ['hint1']
        }
      ];

      mockSupabase().from().single.mockResolvedValue({
        data: mockChallenges,
        error: null
      });

      const request = mockRequest('GET');
      const response = await challengesGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenges).toBeDefined();
      expect(data.count).toBe(mockChallenges.length);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase().auth.getSession.mockResolvedValue({
        data: { session: mockAuthenticatedSession },
        error: null
      });

      mockSupabase().from().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const request = mockRequest('GET');
      const response = await challengesGet(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch challenges');
    });
  });

  describe('Flag Submission API (/api/challenges/submit)', () => {
    it('should require authentication', async () => {
      mockSupabase().auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const request = mockRequest('POST', {
        challenge_id: 'challenge-1',
        flag: 'CTF{test}'
      });

      const response = await submitPost(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should validate challenge_id format', async () => {
      mockSupabase().auth.getSession.mockResolvedValue({
        data: { session: mockAuthenticatedSession },
        error: null
      });

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

    it('should validate flag format', async () => {
      mockSupabase().auth.getSession.mockResolvedValue({
        data: { session: mockAuthenticatedSession },
        error: null
      });

      const request = mockRequest('POST', {
        challenge_id: '123e4567-e89b-12d3-a456-426614174000',
        flag: ''
      });

      const response = await submitPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.flag).toBeDefined();
    });

    it('should prevent duplicate submissions for solved challenges', async () => {
      mockSupabase().auth.getSession.mockResolvedValue({
        data: { session: mockAuthenticatedSession },
        error: null
      });

      // Mock existing solution
      mockSupabase().from().single
        .mockResolvedValueOnce({
          data: { id: 'existing-submission' },
          error: null
        });

      const request = mockRequest('POST', {
        challenge_id: '123e4567-e89b-12d3-a456-426614174000',
        flag: 'CTF{test}'
      });

      const response = await submitPost(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Challenge already solved');
    });

    it('should handle correct flag submissions', async () => {
      mockSupabase().auth.getSession.mockResolvedValue({
        data: { session: mockAuthenticatedSession },
        error: null
      });

      // Mock no existing solution
      mockSupabase().from().single
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' } // No rows returned
        })
        .mockResolvedValueOnce({
          data: {
            flag: 'CTF{correct_flag}',
            points: 100,
            title: 'Test Challenge'
          },
          error: null
        });

      mockSupabase().from().insert.mockResolvedValue({
        error: null
      });

      const request = mockRequest('POST', {
        challenge_id: '123e4567-e89b-12d3-a456-426614174000',
        flag: 'CTF{correct_flag}'
      });

      const response = await submitPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.points_awarded).toBe(100);
      expect(data.message).toContain('Congratulations');
    });

    it('should handle incorrect flag submissions', async () => {
      mockSupabase().auth.getSession.mockResolvedValue({
        data: { session: mockAuthenticatedSession },
        error: null
      });

      mockSupabase().from().single
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }
        })
        .mockResolvedValueOnce({
          data: {
            flag: 'CTF{correct_flag}',
            points: 100,
            title: 'Test Challenge'
          },
          error: null
        });

      mockSupabase().from().insert.mockResolvedValue({
        error: null
      });

      const request = mockRequest('POST', {
        challenge_id: '123e4567-e89b-12d3-a456-426614174000',
        flag: 'CTF{wrong_flag}'
      });

      const response = await submitPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.points_awarded).toBe(0);
      expect(data.message).toBe('Incorrect flag. Try again!');
    });

    it('should sanitize flag input', async () => {
      mockSupabase().auth.getSession.mockResolvedValue({
        data: { session: mockAuthenticatedSession },
        error: null
      });

      const request = mockRequest('POST', {
        challenge_id: '123e4567-e89b-12d3-a456-426614174000',
        flag: 'a'.repeat(1000) // Very long flag
      });

      const response = await submitPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.flag).toBeDefined();
    });
  });

  describe('Profile API (/api/profile)', () => {
    it('should require authentication', async () => {
      mockSupabase().auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const request = mockRequest('GET');
      const response = await profileGet(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return profile data for authenticated users', async () => {
      mockSupabase().auth.getSession.mockResolvedValue({
        data: { session: mockAuthenticatedSession },
        error: null
      });

      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z'
      };

      const mockSubmissions = [
        {
          points_awarded: 100,
          submitted_at: '2024-01-01T00:00:00Z',
          challenges: {
            title: 'Test Challenge',
            category: 'web',
            difficulty: 'easy'
          }
        }
      ];

      const mockLeaderboard = [
        { id: 'other-user', total_points: 200 },
        { id: 'user-123', total_points: 100 }
      ];

      mockSupabase().from().single
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null
        })
        .mockResolvedValueOnce({
          data: mockSubmissions,
          error: null
        })
        .mockResolvedValueOnce({
          data: mockLeaderboard,
          error: null
        });

      const request = mockRequest('GET');
      const response = await profileGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile.email).toBe('test@example.com');
      expect(data.stats.total_points).toBe(100);
      expect(data.stats.challenges_solved).toBe(1);
      expect(data.stats.rank).toBe(2);
    });
  });

  describe('Leaderboard API (/api/leaderboard)', () => {
    it('should work without authentication', async () => {
      mockSupabase().auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const mockLeaderboard = [
        {
          id: 'user-1',
          full_name: 'User One',
          email: 'user1@example.com',
          total_points: 200,
          challenges_solved: 2,
          last_submission: '2024-01-01T00:00:00Z'
        }
      ];

      mockSupabase().from().range.mockResolvedValue({
        data: mockLeaderboard,
        error: null
      });

      mockSupabase().from().select.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          count: 10,
          error: null
        })
      });

      const request = mockRequest('GET');
      const response = await leaderboardGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard).toBeDefined();
      expect(data.leaderboard[0].email).toBeNull(); // Email hidden for unauthenticated
    });

    it('should respect pagination limits', async () => {
      mockSupabase().auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      mockSupabase().from().range.mockResolvedValue({
        data: [],
        error: null
      });

      mockSupabase().from().select.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          count: 100,
          error: null
        })
      });

      const request = mockRequest('GET', null, { limit: '100' });
      const response = await leaderboardGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.limit).toBe(50); // Should be capped at 50
    });
  });

  describe('Security Headers', () => {
    it('should not leak sensitive data in responses', async () => {
      mockSupabase().auth.getSession.mockRejectedValue(
        new Error('Database password: secret123')
      );

      const request = mockRequest('GET');
      const response = await challengesGet(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(JSON.stringify(data)).not.toContain('secret123');
      expect(JSON.stringify(data)).not.toContain('password');
    });

    it('should handle malicious payloads in query parameters', async () => {
      const request = mockRequest('GET', null, { 
        page: '<script>alert("xss")</script>',
        limit: 'SELECT * FROM users'
      });

      // Should not crash the server
      const response = await leaderboardGet(request);
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Race Conditions', () => {
    it('should handle concurrent flag submissions', async () => {
      mockSupabase().auth.getSession.mockResolvedValue({
        data: { session: mockAuthenticatedSession },
        error: null
      });

      // Simulate race condition where both requests see no existing solution
      mockSupabase().from().single
        .mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
        .mockResolvedValue({
          data: {
            flag: 'CTF{test}',
            points: 100,
            title: 'Test Challenge'
          },
          error: null
        });

      mockSupabase().from().insert
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ 
          error: { message: 'duplicate key value violates unique constraint' }
        });

      const request1 = mockRequest('POST', {
        challenge_id: '123e4567-e89b-12d3-a456-426614174000',
        flag: 'CTF{test}'
      });

      const request2 = mockRequest('POST', {
        challenge_id: '123e4567-e89b-12d3-a456-426614174000',
        flag: 'CTF{test}'
      });

      // Both requests should be handled gracefully
      const [response1, response2] = await Promise.all([
        submitPost(request1),
        submitPost(request2)
      ]);

      expect(response1.status).toBeGreaterThanOrEqual(200);
      expect(response1.status).toBeLessThanOrEqual(500);
      expect(response2.status).toBeGreaterThanOrEqual(200);
      expect(response2.status).toBeLessThanOrEqual(500);
    });
  });
});

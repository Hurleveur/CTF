import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/admin/challenge-reset/route';

// Mock methods that we'll reference in tests  
const mockSingle = jest.fn();
const mockUpsert = jest.fn();

// Mock query chain object that gets returned by from()
const mockQueryChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(), 
  single: mockSingle,
  upsert: mockUpsert,
};


// Create a mock client object
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => mockQueryChain),
};

// Mock the Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}));


describe('/api/admin/challenge-reset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Re-setup the createClient mock after clearAllMocks
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValue(mockSupabaseClient);
    
    // Re-setup the query chain mocks after clearAllMocks
    (mockQueryChain.select as jest.MockedFunction<any>).mockReturnThis();
    (mockQueryChain.eq as jest.MockedFunction<any>).mockReturnThis();
    (mockSupabaseClient.from as jest.MockedFunction<any>).mockReturnValue(mockQueryChain);
  });


  describe('GET', () => {
    it('should return 403 for non-admin users', async () => {
      (mockSupabaseClient.auth.getUser as jest.MockedFunction<any>).mockResolvedValue({
        data: { user: { id: 'user-123', email: 'regular@example.com' } },
        error: null,
      });

      // Mock profile lookup returning non-dev user
      mockSingle.mockResolvedValue({
        data: { role: 'user', email: 'regular@example.com' },
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Developer access required - only devs can reset challenges');
    });

    it('should return 401 for unauthenticated users', async () => {
      (mockSupabaseClient.auth.getUser as jest.MockedFunction<any>).mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return cutoff date from database for dev users', async () => {
      const testCutoffDate = '2025-01-15T10:30:00Z';
      
      (mockSupabaseClient.auth.getUser as jest.MockedFunction<any>).mockResolvedValue({
        data: { user: { id: 'dev-123', email: 'dev@example.com' } },
        error: null,
      });

      // Mock profile lookup first (for dev role), then settings lookup
      mockSingle
        .mockResolvedValueOnce({
          data: { role: 'dev', email: 'dev@example.com' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { challenge_cutoff_date: testCutoffDate },
          error: null,
        });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cutoff_date).toBe(testCutoffDate);
      expect(data.message).toBe('Challenge cutoff date retrieved successfully');
    });

    it('should return fallback cutoff date when database fails', async () => {
      (mockSupabaseClient.auth.getUser as jest.MockedFunction<any>).mockResolvedValue({
        data: { user: { id: 'dev-123', email: 'dev@example.com' } },
        error: null,
      });

      // Mock profile lookup first (dev role), then failed settings lookup
      mockSingle
        .mockResolvedValueOnce({
          data: { role: 'dev', email: 'dev@example.com' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'No data found' },
        });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cutoff_date).toBe('2025-01-01T00:00:00Z'); // Default fallback
    });

    it('should handle internal server errors', async () => {
      (mockSupabaseClient.auth.getUser as jest.MockedFunction<any>).mockRejectedValue(new Error('Database connection failed'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST', () => {
    const mockRequest = (body: any) => ({
      json: () => Promise.resolve(body),
    }) as NextRequest;

    it('should return 403 for non-dev users', async () => {
      (mockSupabaseClient.auth.getUser as jest.MockedFunction<any>).mockResolvedValue({
        data: { user: { id: 'user-123', email: 'regular@example.com' } },
        error: null,
      });

      // Mock profile lookup returning non-dev user
      mockSingle.mockResolvedValue({
        data: { role: 'user', email: 'regular@example.com' },
        error: null,
      });

      const request = mockRequest({ reset_to_now: true });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Developer access required - only devs can reset challenges');
    });

    it('should reset cutoff date to current time when reset_to_now is true', async () => {
      const mockUserId = 'dev-user-123';
      
      (mockSupabaseClient.auth.getUser as jest.MockedFunction<any>).mockResolvedValue({
        data: { user: { email: 'dev@example.com', id: mockUserId } },
        error: null,
      });

      // Mock profile lookup for dev role
      mockSingle.mockResolvedValue({
        data: { role: 'dev', email: 'dev@example.com' },
        error: null,
      });

      // Set up the upsert to return success directly (no chaining)
      mockUpsert.mockResolvedValue({
        error: null,
      });

      const request = mockRequest({ reset_to_now: true });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('reset');
      expect(data.message).toContain('reset to current time');
      
      // Verify that the cutoff date is recent (within the last few seconds)
      const cutoffDate = new Date(data.cutoff_date);
      const now = new Date();
      const diffInSeconds = (now.getTime() - cutoffDate.getTime()) / 1000;
      expect(diffInSeconds).toBeLessThan(5);
    });

    it('should set custom cutoff date when provided', async () => {
      const customDate = '2025-02-01T12:00:00Z';
      const mockUserId = 'dev-user-123';
      
      (mockSupabaseClient.auth.getUser as jest.MockedFunction<any>).mockResolvedValue({
        data: { user: { email: 'dev@example.com', id: mockUserId } },
        error: null,
      });

      // Mock profile lookup for dev role
      mockSingle.mockResolvedValue({
        data: { role: 'dev', email: 'dev@example.com' },
        error: null,
      });

      // Set up the upsert to return success directly (no chaining)
      mockUpsert.mockResolvedValue({
        error: null,
      });

      const request = mockRequest({ cutoff_date: customDate });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cutoff_date).toBe(customDate);
      expect(data.action).toBe('update');
    });

    it('should return 400 when no cutoff date or reset flag provided', async () => {
      (mockSupabaseClient.auth.getUser as jest.MockedFunction<any>).mockResolvedValue({
        data: { user: { email: 'dev@example.com', id: 'dev-123' } },
        error: null,
      });

      // Mock profile lookup for dev role
      mockSingle.mockResolvedValue({
        data: { role: 'dev', email: 'dev@example.com' },
        error: null,
      });

      const request = mockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cutoff date or reset_to_now flag required');
    });

    it('should continue when database upsert fails', async () => {
      const mockUserId = 'dev-user-123';
      
      (mockSupabaseClient.auth.getUser as jest.MockedFunction<any>).mockResolvedValue({
        data: { user: { email: 'dev@example.com', id: mockUserId } },
        error: null,
      });

      // Mock profile lookup for dev role
      mockSingle.mockResolvedValue({
        data: { role: 'dev', email: 'dev@example.com' },
        error: null,
      });

      // Set up the upsert to return failure directly (no chaining)
      mockUpsert.mockResolvedValue({
        error: { message: 'Database write failed' },
      });

      const request = mockRequest({ reset_to_now: true });
      const response = await POST(request);
      const data = await response.json();

      // Should still return success even if database write fails (fallback mechanism)
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle internal server errors', async () => {
      (mockSupabaseClient.auth.getUser as jest.MockedFunction<any>).mockRejectedValue(new Error('Network error'));

      const request = mockRequest({ reset_to_now: true });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});

import { NextRequest } from 'next/server';
import { GET } from '../../app/api/statistics/route';
import { createServiceRoleClient } from '../../lib/supabase/server';

// Mock the Supabase service role client
jest.mock('../../lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(),
}));

const mockSupabase = {
  from: jest.fn(),
};

const mockQuery = {
  select: jest.fn(),
  eq: jest.fn(),
};

describe('/api/statistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase);
    
    // Setup default mock chain
    mockSupabase.from.mockReturnValue(mockQuery);
    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.eq.mockReturnValue(mockQuery);
  });

  it('should return statistics with correct data structure', async () => {
    // Mock the database responses
    mockSupabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 15, error: null })
        })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ count: 8, error: null })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ count: 12, error: null })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ 
          data: [
            { neural_reconstruction: '25.5' },
            { neural_reconstruction: '45.0' },
            { neural_reconstruction: '12.3' }
          ], 
          error: null 
        })
      });

    const request = new NextRequest('http://localhost:3000/api/statistics');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('fragmentsFound', 15);
    expect(data.data).toHaveProperty('teams', 8);
    expect(data.data).toHaveProperty('projects', 12);
    expect(data.data).toHaveProperty('neuralProgress');
    expect(data.data).toHaveProperty('avgSolveTime', '3-5 hours');
  });

  it('should handle database errors gracefully', async () => {
    // Mock database error
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ count: null, error: new Error('Database error') })
      })
    });

    const request = new NextRequest('http://localhost:3000/api/statistics');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.fragmentsFound).toBe(0); // Should fallback to 0
  });

  it('should return 500 on server error', async () => {
    // Mock createServiceRoleClient to throw error
    (createServiceRoleClient as jest.Mock).mockImplementation(() => {
      throw new Error('Supabase connection failed');
    });

    const request = new NextRequest('http://localhost:3000/api/statistics');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch statistics');
  });

  it('should calculate neural progress correctly', async () => {
    mockSupabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 10, error: null })
        })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ count: 5, error: null })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ count: 3, error: null })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ 
          data: [
            { neural_reconstruction: '10.5' },
            { neural_reconstruction: '20.2' },
            { neural_reconstruction: '15.3' }
          ], 
          error: null 
        })
      });

    const request = new NextRequest('http://localhost:3000/api/statistics');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.neuralProgress).toBe(46); // 10.5 + 20.2 + 15.3 = 46
  });
});

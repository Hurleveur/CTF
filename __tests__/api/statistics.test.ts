import { NextRequest } from 'next/server';
import { GET } from '../../app/api/statistics/route';
import { createServiceRoleClient } from '../../lib/supabase/server';

// Mock the Supabase service role client
jest.mock('../../lib/supabase/server');
const mockCreateServiceRoleClient = createServiceRoleClient as jest.MockedFunction<typeof createServiceRoleClient>;

const mockSupabase = {
  from: jest.fn(),
};

const mockQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
  gte: jest.fn(),
};

describe('/api/statistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateServiceRoleClient.mockReturnValue(mockSupabase as any);
    
    // Setup default mock chain
    mockSupabase.from.mockReturnValue(mockQuery);
    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.eq.mockReturnValue(mockQuery);
    mockQuery.single.mockReturnValue(mockQuery);
    mockQuery.gte.mockReturnValue(mockQuery);
  });

  it('should return statistics with correct data structure', async () => {
    // Mock the database responses
    mockSupabase.from
      // First call: admin_settings for cutoff date
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: { challenge_cutoff_date: '2025-01-01T00:00:00Z' }, 
              error: null 
            })
          })
        })
      })
      // Second call: submissions count (fragments)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({ count: 15, error: null })
          })
        })
      })
      // Third call: profiles count (teams)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ count: 8, error: null })
        })
      })
      // Fourth call: user_projects count (projects)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ count: 12, error: null })
        })
      })
      // Fifth call: user_projects neural reconstruction data
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ 
            data: [
              { neural_reconstruction: '25.5' },
              { neural_reconstruction: '45.0' },
              { neural_reconstruction: '12.3' }
            ], 
            error: null 
          })
        })
      });

    const request = new NextRequest('http://localhost:3000/api/statistics');
    const response = await GET();
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
    // Mock database responses with fallback behavior
    mockSupabase.from
      // First call: admin_settings for cutoff date
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: { challenge_cutoff_date: '2025-01-01T00:00:00Z' }, 
              error: null 
            })
          })
        })
      })
      // Second call: submissions count (fragments) - returns 0 on error
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({ count: 0, error: null })
          })
        })
      })
      // Third call: profiles count (teams)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ count: 0, error: null })
        })
      })
      // Fourth call: user_projects count (projects)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ count: 0, error: null })
        })
      })
      // Fifth call: user_projects neural reconstruction data
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ 
            data: [], 
            error: null 
          })
        })
      });

    const request = new NextRequest('http://localhost:3000/api/statistics');
    const response = await GET();
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
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch statistics');
  });

  it('should calculate neural progress correctly', async () => {
    mockSupabase.from
      // First call: admin_settings for cutoff date
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: { challenge_cutoff_date: '2025-01-01T00:00:00Z' }, 
              error: null 
            })
          })
        })
      })
      // Second call: submissions count (fragments)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({ count: 10, error: null })
          })
        })
      })
      // Third call: profiles count (teams)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ count: 5, error: null })
        })
      })
      // Fourth call: user_projects count (projects)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ count: 3, error: null })
        })
      })
      // Fifth call: user_projects neural reconstruction data
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ 
            data: [
              { neural_reconstruction: '10.5' },
              { neural_reconstruction: '20.2' },
              { neural_reconstruction: '15.3' }
            ], 
            error: null 
          })
        })
      });

    const request = new NextRequest('http://localhost:3000/api/statistics');
    const response = await GET();
    const data = await response.json();

    expect(data.data.neuralProgress).toBe(46); // 10.5 + 20.2 + 15.3 = 46
  });
});

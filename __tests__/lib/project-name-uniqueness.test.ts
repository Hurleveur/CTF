/**
 * Tests for project name uniqueness in automatic project creation
 */

import { createDefaultProject } from '@/lib/projects/createDefaultProject';

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}));

describe('Project Name Uniqueness', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { createClient } = require('@/lib/supabase/server');
    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn()
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    };
    createClient.mockResolvedValue(mockSupabase);
  });

  it('should create a project with original name when no duplicates exist', async () => {
    // Mock no existing project found
    const mockChain = {
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // No rows found
      })
    };
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue(mockChain)
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { 
              id: 1, 
              name: 'PRECISION-X Surgical',
              description: 'Test description',
              logo: '🤖',
              ai_status: 'Basic Motor Functions',
              status_color: 'red',
              neural_reconstruction: 0.0,
              last_backup: '2023-01-01',
              lead_developer: 'Test User',
              team_members: ['Test User'],
              user_id: 'test-user-id'
            },
            error: null
          })
        })
      })
    });

    const result = await createDefaultProject('test-user-id', 'Test User');

    expect(result.success).toBe(true);
    expect(result.project?.name).toBe('PRECISION-X Surgical'); // Should keep original name
  });

  it('should append a number when project name already exists', async () => {
    let callCount = 0;
    const mockChain = {
      single: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call - original name exists
          return Promise.resolve({
            data: { id: 999 }, // Existing project found
            error: null
          });
        } else {
          // Second call - name with suffix doesn't exist
          return Promise.resolve({
            data: null,
            error: { code: 'PGRST116' } // No rows found
          });
        }
      })
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue(mockChain)
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { 
              id: 1, 
              name: 'PRECISION-X Surgical 2', // Should have suffix
              description: 'Test description',
              logo: '🤖',
              ai_status: 'Basic Motor Functions',
              status_color: 'red',
              neural_reconstruction: 0.0,
              last_backup: '2023-01-01',
              lead_developer: 'Test User',
              team_members: ['Test User'],
              user_id: 'test-user-id'
            },
            error: null
          })
        })
      })
    });

    const result = await createDefaultProject('test-user-id', 'Test User');

    expect(result.success).toBe(true);
    expect(result.project?.name).toBe('PRECISION-X Surgical 2'); // Should have suffix
  });

  it('should handle database errors gracefully', async () => {
    const mockChain = {
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'SOME_OTHER_ERROR', message: 'Database connection failed' }
      })
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue(mockChain)
      })
    });

    const result = await createDefaultProject('test-user-id', 'Test User');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database connection failed');
  });
});
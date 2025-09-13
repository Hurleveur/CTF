/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST as signupRoute } from '../../app/api/auth/signup/route';
import { createDefaultProject } from '../../lib/projects/createDefaultProject';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase
jest.mock('@/lib/supabase/server');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock rate limiter
jest.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: jest.fn(() => Promise.resolve({ allowed: true })),
}));

// Mock validation
jest.mock('@/lib/validation/auth', () => ({
  validate: jest.fn(),
  signupSchema: {},
}));

// Mock default project creation
jest.mock('../../lib/projects/createDefaultProject', () => ({
  createDefaultProject: jest.fn(),
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  email_confirmed_at: new Date().toISOString(),
};

// Create a local mock client for this test file
const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

describe('Signup with Default Project Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create default project when checkbox is checked', async () => {
    const { validate } = require('@/lib/validation/auth');
    
    // Set up the mock chain
    mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

    // Mock validation success
    validate.mockReturnValue({
      ok: true,
      data: {
        email: 'test@example.com',
        password: 'Password123!',
        username: 'TestUser',
        createDefaultProject: true, // Checkbox checked
      },
    });

    // Mock successful signup
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock successful project creation
    (createDefaultProject as jest.Mock).mockResolvedValue({
      success: true,
      project: {
        id: 'project-123',
        name: 'PRECISION-X Surgical',
        description: 'Ultra-precise medical robotic arm',
        logo: '⚡',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        username: 'TestUser',
        createDefaultProject: true,
      }),
    });

    const response = await signupRoute(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.projectCreated).toBe(true);
    expect(createDefaultProject).toHaveBeenCalledWith('user-123', 'TestUser');
  });

  it('should skip project creation when checkbox is unchecked', async () => {
    const { validate } = require('@/lib/validation/auth');
    
    // Set up the mock chain
    mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

    // Mock validation success with createDefaultProject: false
    validate.mockReturnValue({
      ok: true,
      data: {
        email: 'test@example.com',
        password: 'Password123!',
        username: 'TestUser',
        createDefaultProject: false, // Checkbox unchecked
      },
    });

    // Mock successful signup
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        username: 'TestUser',
        createDefaultProject: false,
      }),
    });

    const response = await signupRoute(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.projectCreated).toBe(false);
    expect(createDefaultProject).not.toHaveBeenCalled();
  });

  it('should default to creating project when field not specified', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const { validate } = require('@/lib/validation/auth');
    // Use mockSupabaseClient instead

    // Mock validation success without createDefaultProject field
    validate.mockReturnValue({
      ok: true,
      data: {
        email: 'test@example.com',
        password: 'Password123!',
        username: 'TestUser',
        // createDefaultProject field not specified - should default to true
      },
    });

    // Mock successful signup
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock successful project creation
    (createDefaultProject as jest.Mock).mockResolvedValue({
      success: true,
      project: { id: 'project-123', name: 'Test Project' },
    });

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        username: 'TestUser',
      }),
    });

    const response = await signupRoute(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.projectCreated).toBe(true);
    expect(createDefaultProject).toHaveBeenCalledWith('user-123', 'TestUser');
  });

  it('should not fail signup if project creation fails', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const { validate } = require('@/lib/validation/auth');
    // Use mockSupabaseClient instead

    // Mock validation success
    validate.mockReturnValue({
      ok: true,
      data: {
        email: 'test@example.com',
        password: 'Password123!',
        username: 'TestUser',
        createDefaultProject: true,
      },
    });

    // Mock successful signup
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock failed project creation
    (createDefaultProject as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Database connection failed',
    });

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        username: 'TestUser',
        createDefaultProject: true,
      }),
    });

    const response = await signupRoute(request);
    const data = await response.json();

    // Signup should still succeed even if project creation fails
    expect(response.status).toBe(200);
    expect(data.projectCreated).toBe(false);
    expect(data.user.id).toBe('user-123');
  });

  describe('createDefaultProject function', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create project successfully', async () => {
      const { createClient } = require('@/lib/supabase/server');
      // Use mockSupabaseClient instead

      // Mock successful project insertion
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'project-123',
                name: 'PRECISION-X Surgical',
                description: 'Ultra-precise medical robotic arm',
                logo: '⚡',
                ai_status: 'Basic Motor Functions',
                status_color: 'red',
                neural_reconstruction: 0.0,
                last_backup: '2025-01-13',
                lead_developer: 'TestUser',
                team_members: ['TestUser'],
                user_id: 'user-123',
              },
              error: null,
            }),
          })),
        })),
      });

      // Reset the mock to use the real implementation
      jest.unmock('../../lib/projects/createDefaultProject');
      const { createDefaultProject } = await import('../../lib/projects/createDefaultProject');

      const result = await createDefaultProject('user-123', 'TestUser');

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project?.name).toBe('PRECISION-X Surgical');
      expect(result.project?.leadDeveloper).toBe('TestUser');
    });

    it('should handle database errors gracefully', async () => {
      const { createClient } = require('@/lib/supabase/server');
      // Use mockSupabaseClient instead

      // Mock database error
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          })),
        })),
      });

      // Reset the mock to use the real implementation
      jest.unmock('../../lib/projects/createDefaultProject');
      const { createDefaultProject } = await import('../../lib/projects/createDefaultProject');

      const result = await createDefaultProject('user-123', 'TestUser');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });
  });
});

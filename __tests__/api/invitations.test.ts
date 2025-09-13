/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST as sendInvitation } from '../../app/api/projects/invitations/send/route';
import { POST as acceptInvitation } from '../../app/api/projects/invitations/accept/route';
import { POST as leaveProject } from '../../app/api/projects/leave/route';
import { GET as getInvitations } from '../../app/api/projects/invitations/route';
import { createClient } from '@/lib/supabase/server';

// Mock user authentication
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

const mockProjectLead = {
  id: 'lead-456',
  email: 'lead@example.com',
};

const mockProject = {
  id: 'project-789',
  name: 'Test Project',
  team_members: ['Lead User'],
};

const mockProfile = {
  id: 'user-123',
  full_name: 'Test User',
};

describe('Project Invitations API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/projects/invitations/send', () => {
    it('should send invitation successfully when user is project lead', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      // Mock user authentication as project lead
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockProjectLead },
        error: null,
      });

      // Mock leadership check
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { is_lead: true },
              error: null,
            }),
          })),
        })),
      });

      // Mock member count check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [{ user_id: 'lead-456' }], // Only 1 member
            error: null,
          }),
        })),
      });

      // Mock target user lookup
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          })),
        })),
      });

      // Mock existing membership check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [], // User not in any project
            error: null,
          }),
        })),
      });

      // Mock existing invitation check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [], // No existing invitations
              error: null,
            }),
          })),
        })),
      });

      // Mock invitation creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'invitation-123',
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/projects/invitations/send', {
        method: 'POST',
        body: JSON.stringify({
          username: 'Test User',
          projectId: 'project-789',
        }),
      });

      const response = await sendInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Invitation sent to Test User');
    });

    it('should reject invitation when user is not project lead', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock non-leadership
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'No rows found' },
            }),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/projects/invitations/send', {
        method: 'POST',
        body: JSON.stringify({
          username: 'Test User',
          projectId: 'project-789',
        }),
      });

      const response = await sendInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Only project leaders can send invitations');
    });

    it('should reject invitation when project is full', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockProjectLead },
        error: null,
      });

      // Mock leadership check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { is_lead: true },
              error: null,
            }),
          })),
        })),
      });

      // Mock full team
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [
              { user_id: 'user1' },
              { user_id: 'user2' },
              { user_id: 'user3' },
            ],
            error: null,
          }),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/projects/invitations/send', {
        method: 'POST',
        body: JSON.stringify({
          username: 'Test User',
          projectId: 'project-789',
        }),
      });

      const response = await sendInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Project is full');
    });

    it('should validate input parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/projects/invitations/send', {
        method: 'POST',
        body: JSON.stringify({
          username: '', // Invalid empty username
          projectId: 'not-a-uuid', // Invalid project ID
        }),
      });

      const response = await sendInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('POST /api/projects/invitations/accept', () => {
    it('should accept invitation successfully', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock successful acceptance via Postgres function
      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: true,
          project: mockProject,
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/projects/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({
          invitationId: 'invitation-123',
        }),
      });

      const response = await acceptInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Successfully joined the project');
    });

    it('should handle invitation not found', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: false,
          error: 'Invitation not found or already accepted',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/projects/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({
          invitationId: 'invalid-invitation',
        }),
      });

      const response = await acceptInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('should handle user already in a project', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: false,
          error: 'You are already a member of another project',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/projects/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({
          invitationId: 'invitation-123',
        }),
      });

      const response = await acceptInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already a member');
    });
  });

  describe('POST /api/projects/leave', () => {
    it('should allow non-lead member to leave project', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: true,
          message: 'Successfully left the project',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/projects/leave', {
        method: 'POST',
      });

      const response = await leaveProject(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Successfully left');
    });

    it('should prevent project leader from leaving with other members', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockProjectLead },
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: false,
          error: 'Project leaders cannot leave while other members remain. Transfer leadership first.',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/projects/leave', {
        method: 'POST',
      });

      const response = await leaveProject(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('cannot leave');
    });

    it('should handle user not in any project', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: false,
          error: 'You are not a member of any project',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/projects/leave', {
        method: 'POST',
      });

      const response = await leaveProject(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not a member');
    });
  });

  describe('GET /api/projects/invitations', () => {
    it('should fetch user invitations successfully', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockReceivedInvitations = [
        {
          id: 'invitation-1',
          project_id: 'project-789',
          invited_username: 'Test User',
          created_at: new Date().toISOString(),
          user_projects: {
            name: 'Test Project',
            description: 'A test project',
            logo: '🤖',
            lead_developer: 'Lead User',
          },
        },
      ];

      const mockSentInvitations = [];

      // Mock received invitations query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({
                data: mockReceivedInvitations,
                error: null,
              }),
            })),
          })),
        })),
      });

      // Mock sent invitations query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({
              data: mockSentInvitations,
              error: null,
            }),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/projects/invitations', {
        method: 'GET',
      });

      const response = await getInvitations(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.invitations.received).toHaveLength(1);
      expect(data.invitations.sent).toHaveLength(0);
      expect(data.invitations.received[0].projectName).toBe('Test Project');
    });

    it('should require authentication', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user' },
      });

      const request = new NextRequest('http://localhost:3000/api/projects/invitations', {
        method: 'GET',
      });

      const response = await getInvitations(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });
  });
});
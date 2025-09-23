import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { 
  dispatchNotification, 
  dispatchAIActivationNotification,
  dispatchChallengeCompletionNotification,
  dispatchUserPromotionNotification,
  dispatchSystemAlert 
} from '../lib/notifications/dispatch';
import { createClient } from '../lib/supabase/server';

// Mock the createClient import
jest.mock('../lib/supabase/server');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Notification Dispatch System', () => {
  let mockInsert: jest.Mock;
  let mockFrom: jest.Mock;
  let mockSupabaseClient: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the mock chain with proper typing
    mockInsert = jest.fn();
    (mockInsert as any).mockResolvedValue({ error: null });
    
    mockFrom = jest.fn();
    mockFrom.mockReturnValue({ insert: mockInsert });
    
    mockSupabaseClient = { from: mockFrom };
    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  describe('dispatchNotification', () => {
    it('should insert notification into database', async () => {
      const notificationData = {
        type: 'AI_ACTIVATION' as const,
        message: 'Test notification',
        data: { userId: '123' },
        createdBy: 'user-456'
      };

      await dispatchNotification(notificationData);

      expect(mockFrom).toHaveBeenCalledWith('notifications');
      expect(mockInsert).toHaveBeenCalledWith({
        type: 'AI_ACTIVATION',
        message: 'Test notification',
        data: { userId: '123' },
        created_by: 'user-456'
      });
    });

    it('should handle missing data gracefully', async () => {
      const notificationData = {
        type: 'SYSTEM_ALERT' as const,
        message: 'Alert without data',
        createdBy: 'system'
      };

      await dispatchNotification(notificationData);

      expect(mockInsert).toHaveBeenCalledWith({
        type: 'SYSTEM_ALERT',
        message: 'Alert without data',
        data: {},
        created_by: 'system'
      });
    });

    it('should not throw on database error', async () => {
      (mockInsert as any).mockResolvedValue({ error: { message: 'Database error' } });

      const notificationData = {
        type: 'AI_ACTIVATION' as const,
        message: 'Test notification',
        createdBy: 'user-456'
      };

      // Should not throw
      await expect(dispatchNotification(notificationData)).resolves.not.toThrow();
    });
  });

  describe('dispatchAIActivationNotification', () => {
    it('should create properly formatted AI activation notification', async () => {
      await dispatchAIActivationNotification(
        'alex@robot.tech',
        'Alexandre De Groodt',
        'user-123'
      );

      expect(mockInsert).toHaveBeenCalledWith({
        type: 'AI_ACTIVATION',
        message: '🤖 AI System activated by Alexandre De Groodt',
        data: {
          userId: 'user-123',
          userEmail: 'alex@robot.tech',
          userName: 'Alexandre De Groodt',
          timestamp: expect.any(String)
        },
        created_by: 'user-123'
      });
    });

    it('should fallback to email when name is null', async () => {
      await dispatchAIActivationNotification(
        'test@example.com',
        null,
        'user-456'
      );

      expect(mockInsert).toHaveBeenCalledWith({
        type: 'AI_ACTIVATION',
        message: '🤖 AI System activated by test@example.com',
        data: {
          userId: 'user-456',
          userEmail: 'test@example.com',
          userName: null,
          timestamp: expect.any(String)
        },
        created_by: 'user-456'
      });
    });
  });

  describe('dispatchChallengeCompletionNotification', () => {
    it('should create properly formatted challenge completion notification', async () => {
      await dispatchChallengeCompletionNotification(
        'player@robot.tech',
        'CTF Player',
        'user-456',
        'Buffer Overflow Challenge',
        'challenge-123',
        100
      );

      expect(mockInsert).toHaveBeenCalledWith({
        type: 'CHALLENGE_COMPLETED',
        message: '🎯 CTF Player completed "Buffer Overflow Challenge" (+100 points)',
        data: {
          userId: 'user-456',
          userEmail: 'player@robot.tech',
          userName: 'CTF Player',
          challengeId: 'challenge-123',
          challengeTitle: 'Buffer Overflow Challenge',
          pointsAwarded: 100,
          timestamp: expect.any(String)
        },
        created_by: 'user-456'
      });
    });

    it('should fallback to email when name is null', async () => {
      await dispatchChallengeCompletionNotification(
        'anonymous@robot.tech',
        null,
        'user-789',
        'Crypto Challenge',
        'challenge-456',
        200
      );

      expect(mockInsert).toHaveBeenCalledWith({
        type: 'CHALLENGE_COMPLETED',
        message: '🎯 anonymous@robot.tech completed "Crypto Challenge" (+200 points)',
        data: {
          userId: 'user-789',
          userEmail: 'anonymous@robot.tech',
          userName: null,
          challengeId: 'challenge-456',
          challengeTitle: 'Crypto Challenge',
          pointsAwarded: 200,
          timestamp: expect.any(String)
        },
        created_by: 'user-789'
      });
    });
  });

  describe('dispatchUserPromotionNotification', () => {
    it('should create properly formatted user promotion notification', async () => {
      await dispatchUserPromotionNotification(
        'dev@robot.tech',
        'Dev User',
        'user-789',
        'admin'
      );

      expect(mockInsert).toHaveBeenCalledWith({
        type: 'USER_PROMOTED',
        message: '👑 Dev User has been promoted to admin',
        data: {
          userId: 'user-789',
          userEmail: 'dev@robot.tech',
          userName: 'Dev User',
          newRole: 'admin',
          timestamp: expect.any(String)
        },
        created_by: 'user-789'
      });
    });
  });

  describe('dispatchSystemAlert', () => {
    it('should create properly formatted system alert', async () => {
      await dispatchSystemAlert(
        'System maintenance starting',
        { duration: '2 hours' },
        'admin-user'
      );

      expect(mockInsert).toHaveBeenCalledWith({
        type: 'SYSTEM_ALERT',
        message: '⚠️ System maintenance starting',
        data: {
          duration: '2 hours',
          timestamp: expect.any(String)
        },
        created_by: 'admin-user'
      });
    });

    it('should default to system as creator when triggeredBy is not provided', async () => {
      await dispatchSystemAlert('Automated backup complete');

      expect(mockInsert).toHaveBeenCalledWith({
        type: 'SYSTEM_ALERT',
        message: '⚠️ Automated backup complete',
        data: {
          timestamp: expect.any(String)
        },
        created_by: 'system'
      });
    });
  });
});
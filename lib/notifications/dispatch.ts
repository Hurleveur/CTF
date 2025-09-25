import { createClient } from '@/lib/supabase/server';

export type NotificationType = 'AI_ACTIVATION' | 'CHALLENGE_COMPLETED' | 'SYSTEM_ALERT' | 'USER_PROMOTED';

export interface NotificationData {
  type: NotificationType;
  message: string;
  data?: Record<string, unknown>;
  createdBy: string;
}

/**
 * Dispatch a real-time notification to all connected dev users
 * 
 * This function inserts a notification into the database, which automatically
 * triggers Supabase Realtime to broadcast the change to all subscribed clients.
 * Only dev users will receive these notifications due to RLS policies.
 * 
 * @param params - Notification parameters
 * @returns Promise that resolves when notification is sent
 */
export async function dispatchNotification(params: NotificationData): Promise<void> {
  try {
    // Use service role client to bypass RLS restrictions
    const { createServiceRoleClient } = await import('@/lib/supabase/server');
    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from('notifications')
      .insert({
        type: params.type,
        message: params.message,
        data: params.data || {},
        created_by: params.createdBy,
      });

    if (error) {
      console.error('[Notifications] Failed to dispatch notification:', error);
      console.error('[Notifications] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`Failed to dispatch notification: ${error.message}`);
    }

    console.log(`[Notifications] ✅ Dispatched ${params.type} notification to dev users:`, params.message);
  } catch (error) {
    console.error('[Notifications] Error dispatching notification:', error);
    console.error('[Notifications] Full error object:', error);
    // Re-throw the error so we can see what's actually failing
    throw error;
  }
}

/**
 * Dispatch an AI activation notification
 */
export async function dispatchAIActivationNotification(
  userEmail: string,
  userName: string | null,
  userId: string
): Promise<void> {
  const displayName = userName || userEmail;
  
  await dispatchNotification({
    type: 'AI_ACTIVATION',
    message: `🤖 AI System activated by ${displayName}`,
    data: {
      userId,
      userEmail,
      userName,
      timestamp: new Date().toISOString(),
    },
    createdBy: userId,
  });
}

/**
 * Dispatch a challenge completion notification
 */
export async function dispatchChallengeCompletionNotification(
  userEmail: string,
  userName: string | null,
  userId: string,
  challengeTitle: string,
  challengeId: string,
  pointsAwarded: number
): Promise<void> {
  const displayName = userName || userEmail;
  
  await dispatchNotification({
    type: 'CHALLENGE_COMPLETED',
    message: `🎯 ${displayName} completed "${challengeTitle}" (+${pointsAwarded} points)`,
    data: {
      userId,
      userEmail,
      userName,
      challengeId,
      challengeTitle,
      pointsAwarded,
      timestamp: new Date().toISOString(),
    },
    createdBy: userId,
  });
}

/**
 * Dispatch a user promotion notification (when someone becomes admin)
 */
export async function dispatchUserPromotionNotification(
  userEmail: string,
  userName: string | null,
  userId: string,
  newRole: string
): Promise<void> {
  const displayName = userName || userEmail;
  
  await dispatchNotification({
    type: 'USER_PROMOTED',
    message: `👑 ${displayName} has been promoted to ${newRole}`,
    data: {
      userId,
      userEmail,
      userName,
      newRole,
      timestamp: new Date().toISOString(),
    },
    createdBy: userId,
  });
}

/**
 * Dispatch a system alert notification
 */
export async function dispatchSystemAlert(
  message: string,
  data?: Record<string, unknown>,
  triggeredBy?: string
): Promise<void> {
  await dispatchNotification({
    type: 'SYSTEM_ALERT',
    message: `⚠️ ${message}`,
    data: {
      ...data,
      timestamp: new Date().toISOString(),
    },
    createdBy: triggeredBy || 'system',
  });
}
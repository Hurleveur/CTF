'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClientSync } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
import { useUserData } from './UserDataContext';
import toast from 'react-hot-toast';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface Notification {
  id: string;
  type: 'AI_ACTIVATION' | 'CHALLENGE_COMPLETED' | 'SYSTEM_ALERT' | 'USER_PROMOTED';
  message: string;
  data: Record<string, unknown>;
  created_by: string;
  created_at: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  isConnected: boolean;
  lastNotification: Notification | null;
  dismissNotification: (notificationId: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { profile } = useUserData();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<Notification | null>(null);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Only dev users get notifications
    console.log('[Notifications] 🔍 Checking user authentication and role...');
    console.log('[Notifications] - isAuthenticated:', isAuthenticated);
    console.log('[Notifications] - profile:', profile);
    console.log('[Notifications] - profile.role:', profile?.role);
    
    if (!isAuthenticated || !profile || profile.role !== 'dev') {
      console.log('[Notifications] ❌ User not authenticated or not dev role, skipping notifications');
      console.log('[Notifications] - Required: role === "dev", Got:', profile?.role);
      setIsConnected(false);
      return;
    }

    console.log('[Notifications] 🔔 Setting up real-time notifications for dev user:', profile.email);
    
    const supabase = createClientSync();
    let channel: RealtimeChannel | null = null;

    // Load existing notifications from the database
    const loadExistingNotifications = async () => {
      try {
        console.log('[Notifications] 📥 Loading existing notifications...');
        const { data: existingNotifications, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('[Notifications] ❌ Failed to load existing notifications:', error);
        } else if (existingNotifications && existingNotifications.length > 0) {
          console.log('[Notifications] ✅ Loaded existing notifications:', existingNotifications.length);
          console.log('[Notifications] 📋 All notifications:', existingNotifications);
          setNotifications(existingNotifications);
          setLastNotification(existingNotifications[0]);
          
          // Show toast for the most recent notification (if it's recent)
          const mostRecent = existingNotifications[0];
          console.log('[Notifications] 🔍 Most recent notification:', mostRecent);
          
          // Make the time window much larger - 24 hours instead of 5 minutes
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const notificationTime = new Date(mostRecent.created_at);
          
          console.log('[Notifications] ⏰ Notification created at:', notificationTime.toLocaleString());
          console.log('[Notifications] ⏰ 24 hours ago:', twentyFourHoursAgo.toLocaleString());
          console.log('[Notifications] ⏰ Is notification recent?', notificationTime > twentyFourHoursAgo);
          
          if (notificationTime > twentyFourHoursAgo && !dismissedNotifications.has(mostRecent.id)) {
            console.log('[Notifications] 🔔 SHOWING PERSISTENT TOAST FOR RECENT NOTIFICATION!');
            console.log('[Notifications] 🔔 NOTIFICATION MESSAGE:', mostRecent.message);
            
            const toastResult = toast(mostRecent.message, {
              duration: Infinity, // Make it persistent - won't auto-dismiss
              style: {
                background: '#1f2937',
                color: '#ffffff',
                border: '1px solid #374151',
                padding: '16px',
                borderRadius: '8px',
              },
              icon: getNotificationIcon(mostRecent.type),
            });
            
            console.log('[Notifications] 🔔 PERSISTENT TOAST CREATED:', toastResult);
            
            // Store the toast ID with the notification ID for future dismissal
            if (typeof toastResult === 'string') {
              // Store mapping of notification ID to toast ID for manual dismissal
              console.log('[Notifications] 📝 Stored toast ID for notification:', mostRecent.id);
            }
          } else if (dismissedNotifications.has(mostRecent.id)) {
            console.log('[Notifications] � Notification already dismissed, not showing toast');
          } else {
            console.log('[Notifications] ⏰ Notification too old, not showing toast');
            console.log('[Notifications] ⏰ Notification time:', notificationTime);
            console.log('[Notifications] ⏰ 24 hours ago:', twentyFourHoursAgo);
          }
          

        } else {
          console.log('[Notifications] 📭 No existing notifications found');
        }
      } catch (error) {
        console.error('[Notifications] 💥 Error loading existing notifications:', error);
      }
    };

    // Load existing notifications on first load
    loadExistingNotifications();

    const setupRealtimeSubscription = async () => {
      try {
        // Create channel for dev notifications
        channel = supabase
          .channel('dev_notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications'
            },
            (payload: RealtimePostgresChangesPayload<Notification>) => {
              console.log('[Notifications] 📨 Received notification payload:', payload);
              console.log('[Notifications] 📨 Payload.new:', payload.new);
              
              if (payload.new) {
                const notification = payload.new as Notification;
                console.log('[Notifications] 🔔 Processing notification:', notification);
                
                // Add to notifications list
                setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
                setLastNotification(notification);
                
                // Show persistent toast notification (only if not already dismissed)
                if (!dismissedNotifications.has(notification.id)) {
                  const toastOptions = {
                    duration: Infinity, // Persistent toast
                    style: {
                      background: '#1f2937',
                      color: '#ffffff',
                      border: '1px solid #374151',
                      padding: '16px',
                      borderRadius: '8px',
                    },
                    icon: getNotificationIcon(notification.type),
                  };

                  toast(notification.message, toastOptions);
                  console.log('[Notifications] 🔔 Persistent real-time toast created');
                } else {
                  console.log('[Notifications] 🚫 Real-time notification already dismissed');
                }
                
                console.log('[Notifications] ✅ Toast displayed for:', notification.type);
              }
            }
          )
;

        // Subscribe to the channel
        const subscription = channel.subscribe((status) => {
          console.log('[Notifications] Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            console.log('[Notifications] 🎉 Successfully connected to real-time notifications!');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setIsConnected(false);
            console.warn('[Notifications] ⚠️ Real-time notifications unavailable (status:', status, '). App will continue to work normally.');
            // Don't throw an error - this is non-critical functionality
          } else if (status === 'CLOSED') {
            setIsConnected(false);
            console.log('[Notifications] 🔌 Subscription closed (likely due to logout)');
          }
        });

        // Test connection with a system message after a delay
        setTimeout(() => {
          if (channel && subscription) {
            console.log('[Notifications] 🔄 Real-time notifications active for dev user');
          }
        }, 2000);

      } catch (error) {
        console.warn('[Notifications] ⚠️ Real-time notifications unavailable:', error.message || error);
        setIsConnected(false);
        // Don't throw - this is non-critical functionality
      }
    };

    // Wrap in try-catch to prevent any uncaught errors
    try {
      setupRealtimeSubscription();
    } catch (error) {
      console.warn('[Notifications] ⚠️ Failed to initialize notifications system. App will continue to work normally.');
      setIsConnected(false);
    }

    // Cleanup function
    return () => {
      if (channel) {
        console.log('[Notifications] 🔌 Cleaning up notifications subscription');
        supabase.removeChannel(channel);
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, profile]);

  // Function to dismiss a notification
  const dismissNotification = (notificationId: string) => {
    console.log('[Notifications] 🗑️ Dismissing notification:', notificationId);
    setDismissedNotifications(prev => new Set([...prev, notificationId]));
    
    // Dismiss all toasts (react-hot-toast will handle this)
    toast.dismiss();
  };

  const contextValue: NotificationsContextType = {
    notifications,
    isConnected,
    lastNotification,
    dismissNotification,
  };

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

// Helper function to get appropriate icons for different notification types
function getNotificationIcon(type: Notification['type']): string {
  switch (type) {
    case 'AI_ACTIVATION':
      return '🤖';
    case 'USER_PROMOTED':
      return '👑';
    case 'CHALLENGE_COMPLETED':
      return '🎯';
    case 'SYSTEM_ALERT':
      return '⚠️';
    default:
      return '📢';
  }
}
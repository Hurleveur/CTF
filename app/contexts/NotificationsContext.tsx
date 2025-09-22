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
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { profile } = useUserData();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<Notification | null>(null);

  useEffect(() => {
    // Only dev users get notifications
    if (!isAuthenticated || !profile || profile.role !== 'dev') {
      console.log('[Notifications] User not authenticated or not dev role, skipping notifications');
      setIsConnected(false);
      return;
    }

    console.log('[Notifications] 🔔 Setting up real-time notifications for dev user:', profile.email);
    
    const supabase = createClientSync();
    let channel: RealtimeChannel | null = null;

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
              console.log('[Notifications] 📨 Received notification:', payload);
              
              if (payload.new) {
                const notification = payload.new as Notification;
                
                // Add to notifications list
                setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
                setLastNotification(notification);
                
                // Show toast notification with appropriate styling
                const toastOptions = {
                  duration: 6000,
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
            console.error('[Notifications] Subscription failed with status:', status);
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
        console.error('[Notifications] Failed to setup realtime subscription:', error);
        setIsConnected(false);
      }
    };

    setupRealtimeSubscription();

    // Cleanup function
    return () => {
      if (channel) {
        console.log('[Notifications] 🔌 Cleaning up notifications subscription');
        supabase.removeChannel(channel);
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, profile]);

  const contextValue: NotificationsContextType = {
    notifications,
    isConnected,
    lastNotification,
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
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { createClientSync } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
import { useUserData } from './UserDataContext';
import toast from 'react-hot-toast';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Custom notification toast component with close button
function NotificationToast({ 
  notification, 
  onDismiss, 
  onDelete, 
  visible 
}: { 
  notification: Notification;
  onDismiss: () => void;
  onDelete: () => void;
  visible: boolean;
}) {
  return (
    <div
      className={`${
        visible ? 'transform transition ease-in-out duration-300 translate-y-0 opacity-100' : 'transform transition ease-in-out duration-300 translate-y-2 opacity-0'
      } max-w-md w-full bg-gray-900 text-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-white">
              {notification.message}
            </p>
            <p className="mt-1 text-xs text-gray-300">
              {new Date(notification.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-700">
        <button
          onClick={onDismiss}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-red-400 hover:text-red-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
          title="Delete notification permanently"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

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
  deleteNotification: (notificationId: string) => Promise<void>;
}

// Helper function to play notification sound
function playNotificationSound() {
  try {
    const audio = new Audio('/notification-sound.wav');
    audio.volume = 0.5;
    audio.play().catch(err => {
      // Try MP3 as fallback
      const audioMp3 = new Audio('/notification-sound.mp3');
      audioMp3.volume = 0.5;
      audioMp3.play().catch(err2 => {
        console.log('[Notifications] Could not play sound:', err2);
      });
    });
  } catch (err) {
    console.log('[Notifications] Audio not supported:', err);
  }
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { profile } = useUserData();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<Notification | null>(null);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const [activeToasts, setActiveToasts] = useState<Set<string>>(new Set());
  const [deletionSuccessShown, setDeletionSuccessShown] = useState(false);

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
          
          // Show up to 5 most recent notifications, prioritizing non-challenge completions
          const recentNotifications = existingNotifications
            .filter(n => {
              const notifTime = new Date(n.created_at);
              return notifTime > twentyFourHoursAgo && !dismissedNotifications.has(n.id);
            })
            .sort((a, b) => {
              // Priority order: AI_ACTIVATION > USER_PROMOTED > SYSTEM_ALERT > CHALLENGE_COMPLETED
              const priorityMap = {
                'AI_ACTIVATION': 4,
                'USER_PROMOTED': 3,
                'SYSTEM_ALERT': 2,
                'CHALLENGE_COMPLETED': 1
              };
              const priorityDiff = (priorityMap[b.type] || 0) - (priorityMap[a.type] || 0);
              if (priorityDiff !== 0) return priorityDiff;
              // If same priority, sort by date (newest first)
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            })
            .slice(0, 5);

          console.log(`[Notifications] 🔔 Showing ${recentNotifications.length} recent notifications`);
          
          recentNotifications.forEach((notification, index) => {
            setTimeout(() => {
              if (!activeToasts.has(notification.id) && activeToasts.size < 5) {
                showNotificationToast(notification);
                console.log(`[Notifications] 📢 Toast created for: ${notification.type} - ${notification.message}`)
              }
            }, index * 100); // Stagger the notifications slightly
          });
          

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
                
                // Always show important notifications (non-challenge), or show if under limit
                const isImportantNotification = notification.type !== 'CHALLENGE_COMPLETED';
                const shouldShowToast = !dismissedNotifications.has(notification.id) && 
                  (isImportantNotification || activeToasts.size < 5);
                
                if (shouldShowToast) {
                  // If we're at capacity and this is important, dismiss oldest challenge completion
                  if (isImportantNotification && activeToasts.size >= 5) {
                    const challengeToasts = Array.from(activeToasts).filter(id => {
                      const notif = notifications.find(n => n.id === id);
                      return notif && notif.type === 'CHALLENGE_COMPLETED';
                    });
                    if (challengeToasts.length > 0) {
                      toast.dismiss(challengeToasts[0]);
                      setActiveToasts(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(challengeToasts[0]);
                        return newSet;
                      });
                    }
                  }
                  
                  showNotificationToast(notification);
                  console.log(`[Notifications] 🔔 Real-time toast created: ${notification.type}`)
                } else {
                  console.log('[Notifications] 🚫 Real-time notification skipped (dismissed or toast limit)');
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

  // Function to dismiss a notification locally
  const dismissNotification = useCallback((notificationId: string) => {
    console.log('[Notifications] 🗑️ Dismissing notification locally:', notificationId);
    setDismissedNotifications(prev => new Set([...prev, notificationId]));
    setActiveToasts(prev => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });
    toast.dismiss();
  }, []);

  // Function to show a notification toast
  const showNotificationToast = useCallback((notification: Notification) => {
    const toastId = toast.custom((t) => (
      <NotificationToast
        notification={notification}
        onDismiss={() => {
          dismissNotification(notification.id);
          toast.dismiss(toastId);
        }}
        onDelete={() => {
          deleteNotification(notification.id);
          toast.dismiss(toastId);
        }}
        visible={t.visible}
      />
    ), {
      duration: notification.type === 'CHALLENGE_COMPLETED' ? 5000 : Infinity,
      position: 'top-right',
    });
    
    setActiveToasts(prev => new Set([...prev, notification.id]));
    
    // Play sound for AI activation
    if (notification.type === 'AI_ACTIVATION') {
      playNotificationSound();
    }
  }, [dismissNotification]);

  // Check for available notifications to show when space becomes available
  useEffect(() => {
    if (activeToasts.size < 5) {
      // Find notifications that aren't dismissed and aren't currently shown
      const availableNotifications = notifications
        .filter(n => !dismissedNotifications.has(n.id) && !activeToasts.has(n.id))
        .sort((a, b) => {
          // Priority order: AI_ACTIVATION > USER_PROMOTED > SYSTEM_ALERT > CHALLENGE_COMPLETED
          const priorityMap = {
            'AI_ACTIVATION': 4,
            'USER_PROMOTED': 3,
            'SYSTEM_ALERT': 2,
            'CHALLENGE_COMPLETED': 1
          };
          const priorityDiff = (priorityMap[b.type] || 0) - (priorityMap[a.type] || 0);
          if (priorityDiff !== 0) return priorityDiff;
          // If same priority, sort by date (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

      if (availableNotifications.length > 0) {
        const notification = availableNotifications[0];
        console.log(`[Notifications] 📤 Showing next notification: ${notification.type} - ${notification.message}`);
        showNotificationToast(notification);
      }
    }
  }, [activeToasts.size, notifications, dismissedNotifications, showNotificationToast]);

  // Function to permanently delete a notification from database
  const deleteNotification = async (notificationId: string) => {
    console.log('[Notifications] 🗑️ Deleting notification from database:', notificationId);
    
    try {
      // Call the API endpoint to delete the notification
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete notification');
      }

      console.log('[Notifications] ✅ Notification deleted successfully:', notificationId);
      
      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setActiveToasts(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
      
      // Show success message only if not already shown recently
      if (!deletionSuccessShown) {
        setDeletionSuccessShown(true);
        toast.success('Notification deleted', {
          duration: 2000,
          style: {
            background: '#10b981',
            color: '#ffffff',
          },
        });
        
        // Reset the flag after 3 seconds
        setTimeout(() => {
          setDeletionSuccessShown(false);
        }, 3000);
      }
      
      // The useEffect hook will automatically show the next available notification
      
    } catch (error) {
      console.error('[Notifications] ❌ Failed to delete notification:', error);
      toast.error('Failed to delete notification', {
        duration: 3000,
        style: {
          background: '#ef4444',
          color: '#ffffff',
        },
      });
    }
  };

  const contextValue: NotificationsContextType = {
    notifications,
    isConnected,
    lastNotification,
    dismissNotification,
    deleteNotification,
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
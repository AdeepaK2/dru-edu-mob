import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import notificationService, {
  Notification,
  NotificationSettings,
  NotificationType,
} from '../services/notificationService';
import { useAuth } from './AuthContext';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings | null;
  isLoading: boolean;
  expoPushToken: string | null;
  // Actions
  refreshNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (type?: NotificationType) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { authToken, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Update auth token in service
  useEffect(() => {
    notificationService.setAuthToken(authToken);
  }, [authToken]);

  // Register for push notifications
  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotifications();
    }
  }, [isAuthenticated]);

  // Load notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshNotifications();
      refreshUnreadCount();
      loadSettings();
    } else {
      // Clear state on logout
      setNotifications([]);
      setUnreadCount(0);
      setSettings(null);
    }
  }, [isAuthenticated]);

  // Handle app state changes - refresh on foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => subscription.remove();
  }, [isAuthenticated]);

  // Listen for incoming notifications
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && isAuthenticated) {
      refreshUnreadCount();
    }
  };

  const handleNotificationReceived = (
    notification: Notifications.Notification
  ) => {
    console.log('Notification received:', notification);
    // Refresh notifications and unread count
    refreshNotifications();
    refreshUnreadCount();
  };

  const handleNotificationResponse = (
    response: Notifications.NotificationResponse
  ) => {
    console.log('Notification response:', response);
    const data = response.notification.request.content.data;
    
    // Handle notification tap - navigate to relevant screen
    if (data?.notificationId) {
      markAsRead(data.notificationId as string);
    }
    
    // You can add navigation logic here based on notification type
    // For example: router.push('/notifications') or navigate to specific screen
  };

  const registerForPushNotifications = async () => {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return;
      }

      // Check existing permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      setExpoPushToken(token.data);

      // Register token with backend
      await notificationService.registerDeviceToken(
        token.data,
        Platform.OS,
        Device.modelName || undefined
      );

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await setupAndroidNotificationChannels();
      }

      console.log('Push notification token registered:', token.data);
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
    }
  };

  const setupAndroidNotificationChannels = async () => {
    // Create notification channels for different types
    const channels = [
      {
        id: 'default',
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      },
      {
        id: 'class',
        name: 'Class Notifications',
        importance: Notifications.AndroidImportance.HIGH,
      },
      {
        id: 'test',
        name: 'Test Notifications',
        importance: Notifications.AndroidImportance.HIGH,
      },
      {
        id: 'attendance',
        name: 'Attendance Notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
      },
      {
        id: 'message',
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
      },
      {
        id: 'announcement',
        name: 'Announcements',
        importance: Notifications.AndroidImportance.HIGH,
      },
      {
        id: 'reminder',
        name: 'Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      },
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: channel.importance,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      });
    }
  };

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const response = await notificationService.getNotifications(50);
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        setHasMore(response.data.hasMore);
      }
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadMoreNotifications = useCallback(async () => {
    if (!isAuthenticated || !hasMore || isLoading) return;

    const lastNotification = notifications[notifications.length - 1];
    if (!lastNotification) return;

    setIsLoading(true);
    try {
      const response = await notificationService.getNotifications(
        50,
        lastNotification.id
      );
      if (response.success && response.data) {
        setNotifications((prev) => [...prev, ...response.data!.notifications]);
        setHasMore(response.data.hasMore);
      }
    } catch (error) {
      console.error('Failed to load more notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, hasMore, isLoading, notifications]);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationService.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
        // Update badge count
        await Notifications.setBadgeCountAsync(response.data.count);
      }
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const response = await notificationService.markAsRead(notificationId);
        if (response.success) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId
                ? { ...n, read: true, readAt: new Date() }
                : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
          await Notifications.setBadgeCountAsync(Math.max(0, unreadCount - 1));
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    },
    [unreadCount]
  );

  const markAllAsRead = useCallback(
    async (type?: NotificationType) => {
      try {
        const response = await notificationService.markAllAsRead(type);
        if (response.success) {
          setNotifications((prev) =>
            prev.map((n) =>
              !type || n.type === type
                ? { ...n, read: true, readAt: new Date() }
                : n
            )
          );
          await refreshUnreadCount();
        }
      } catch (error) {
        console.error('Failed to mark all as read:', error);
      }
    },
    [refreshUnreadCount]
  );

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await notificationService.deleteNotification(
        notificationId
      );
      if (response.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        await refreshUnreadCount();
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [refreshUnreadCount]);

  const loadSettings = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationService.getNotificationSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }, [isAuthenticated]);

  const updateSettings = useCallback(
    async (newSettings: Partial<NotificationSettings>) => {
      try {
        const response = await notificationService.updateNotificationSettings(
          newSettings
        );
        if (response.success && response.data) {
          setSettings(response.data);
        }
      } catch (error) {
        console.error('Failed to update notification settings:', error);
      }
    },
    []
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        settings,
        isLoading,
        expoPushToken,
        refreshNotifications,
        loadMoreNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        updateSettings,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
}

import { getApiUrl } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  DEVICE_TOKEN: '@dru_device_token',
  NOTIFICATION_SETTINGS: '@dru_notification_settings',
};

export enum NotificationType {
  GENERAL = 'general',
  CLASS = 'class',
  TEST = 'test',
  ATTENDANCE = 'attendance',
  MESSAGE = 'message',
  ANNOUNCEMENT = 'announcement',
  REMINDER = 'reminder',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  priority: NotificationPriority;
  data?: Record<string, string>;
  imageUrl?: string;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationSettings {
  userId: string;
  enabled: boolean;
  classNotifications: boolean;
  testNotifications: boolean;
  attendanceNotifications: boolean;
  messageNotifications: boolean;
  announcementNotifications: boolean;
  reminderNotifications: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  updatedAt: Date;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class NotificationService {
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  // ===== DEVICE TOKEN MANAGEMENT =====

  async registerDeviceToken(
    token: string,
    platform?: string,
    deviceModel?: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await fetch(getApiUrl('/notifications/device-token'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ token, platform, deviceModel }),
      });

      const data = await response.json();
      
      if (data.success) {
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, token);
      }

      return data;
    } catch (error) {
      console.error('Failed to register device token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async unregisterDeviceToken(): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN);
      if (!token) {
        return { success: true, message: 'No token to unregister' };
      }

      const response = await fetch(getApiUrl('/notifications/device-token'), {
        method: 'DELETE',
        headers: this.getHeaders(),
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.removeItem(STORAGE_KEYS.DEVICE_TOKEN);
      }

      return data;
    } catch (error) {
      console.error('Failed to unregister device token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getStoredDeviceToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN);
  }

  // ===== NOTIFICATION SETTINGS =====

  async getNotificationSettings(): Promise<ApiResponse<NotificationSettings>> {
    try {
      const response = await fetch(getApiUrl('/notifications/settings'), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (data.success && data.data) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.NOTIFICATION_SETTINGS,
          JSON.stringify(data.data)
        );
      }

      return data;
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      
      // Try to return cached settings
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      if (cached) {
        return { success: true, data: JSON.parse(cached) };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateNotificationSettings(
    settings: Partial<NotificationSettings>
  ): Promise<ApiResponse<NotificationSettings>> {
    try {
      const response = await fetch(getApiUrl('/notifications/settings'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success && data.data) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.NOTIFICATION_SETTINGS,
          JSON.stringify(data.data)
        );
      }

      return data;
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ===== NOTIFICATION HISTORY =====

  async getNotifications(
    limit: number = 50,
    startAfter?: string
  ): Promise<ApiResponse<{ notifications: Notification[]; hasMore: boolean }>> {
    try {
      let url = getApiUrl(`/notifications?limit=${limit}`);
      if (startAfter) {
        url += `&startAfter=${startAfter}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();
      
      // Parse dates
      if (data.success && data.data?.notifications) {
        data.data.notifications = data.data.notifications.map((n: Notification) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          readAt: n.readAt ? new Date(n.readAt) : undefined,
        }));
      }

      return data;
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await fetch(getApiUrl('/notifications/unread-count'), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return response.json();
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async markAsRead(notificationId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await fetch(
        getApiUrl(`/notifications/read/${notificationId}`),
        {
          method: 'POST',
          headers: this.getHeaders(),
        }
      );

      return response.json();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async markAllAsRead(type?: NotificationType): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await fetch(getApiUrl('/notifications/read-all'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ type }),
      });

      return response.json();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await fetch(
        getApiUrl(`/notifications/${notificationId}`),
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        }
      );

      return response.json();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ===== TOPIC SUBSCRIPTIONS =====

  async subscribeToTopic(topic: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const token = await this.getStoredDeviceToken();
      if (!token) {
        return { success: false, error: 'No device token registered' };
      }

      const response = await fetch(
        getApiUrl(`/notifications/topics/${topic}/subscribe`),
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ token }),
        }
      );

      return response.json();
    } catch (error) {
      console.error('Failed to subscribe to topic:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async unsubscribeFromTopic(topic: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const token = await this.getStoredDeviceToken();
      if (!token) {
        return { success: false, error: 'No device token registered' };
      }

      const response = await fetch(
        getApiUrl(`/notifications/topics/${topic}/unsubscribe`),
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ token }),
        }
      );

      return response.json();
    } catch (error) {
      console.error('Failed to unsubscribe from topic:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;

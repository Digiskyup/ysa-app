import { LogLevel, OneSignal } from 'react-native-onesignal';
import { Platform } from 'react-native';
import { store } from '../redux/store';
import { setFCMToken, setPermissionGranted, addNotification } from '../redux/slices/notificationSlice';
import { AppNotification, ApiResponse } from '../types';
import apiClient from './api/client';

// Replace with your OneSignal App ID
const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || 'YOUR_ONESIGNAL_APP_ID_HERE';

class NotificationService {
  private static instance: NotificationService;

  private constructor() {
    this.initOneSignal();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private initOneSignal() {
    // OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    OneSignal.initialize(ONESIGNAL_APP_ID);

    // Request permission on init (or can be done later)
    OneSignal.Notifications.requestPermission(true);
  }

  /**
   * Request notification permissions and get OneSignal Player ID
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Request permission
      const hasPermission = await OneSignal.Notifications.requestPermission(true);
      store.dispatch(setPermissionGranted(hasPermission));

      if (!hasPermission) {
        console.log('Push notification permission denied');
        return null;
      }

      // Get OneSignal User ID (Player ID) / Subscription ID
      // In OneSignal v5, 'pushSubscription' holds the ID
      const pushSubscription = OneSignal.User.pushSubscription;
      const playerId = await pushSubscription.getIdAsync();

      if (playerId) {
        console.log('OneSignal Player ID:', playerId);
        store.dispatch(setFCMToken(playerId)); // Reusing setFCMToken action for Player ID
        return playerId;
      }
      
      // Listen for changes if ID is not available immediately
      return new Promise((resolve) => {
        const listener = (event: any) => {
           if (event.current.id) {
             console.log('OneSignal Player ID obtained:', event.current.id);
             store.dispatch(setFCMToken(event.current.id));
             resolve(event.current.id);
             pushSubscription.removeEventListener('change', listener);
           }
        };
        pushSubscription.addEventListener('change', listener);
        
        // Timeout fallback
        setTimeout(() => {
           console.log('Timeout waiting for OneSignal Player ID');
           resolve(null);
        }, 5000);
      });

    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Set up notification listeners
   */
  setupNotificationListeners(
    onNotificationReceived?: (notification: any) => void,
    onNotificationPressed?: (response: any) => void
  ): void {
    
    // Foreground Notification Listener
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
      console.log('OneSignal notification received in foreground:', event);
      
      const notification = event.getNotification();
      
      // Convert to AppNotification type
      const appNotification: AppNotification = {
          _id: notification.notificationId,
          title: notification.title || 'Notification',
          body: notification.body || '',
          type: this.getNotificationType(notification.additionalData),
          data: notification.additionalData as Record<string, unknown>,
          read: false,
          createdAt: new Date().toISOString(),
      };

      store.dispatch(addNotification(appNotification));
      onNotificationReceived?.(notification);

      // Display the notification
      event.getNotification().display();
    });

    // Notification Click Listener
    OneSignal.Notifications.addEventListener('click', (event: any) => {
      console.log('OneSignal notification clicked:', event);
      onNotificationPressed?.(event);
      
      const data = event.notification.additionalData as Record<string, any>;
      // Handle navigation or other logic here based on 'data'
    });
  }

  /**
   * Remove notification listeners
   */
  removeNotificationListeners(): void {
    // OneSignal v5 listeners are added globally, we might not need to remove them 
    // or we can remove specific callbacks if we stored references.
    // For now, we'll leave it empty or implement removal if strict cleanup is needed.
    // OneSignal.Notifications.removeEventListener('foregroundWillDisplay', ...);
  }

  /**
   * Determine notification type from data
   */
  private getNotificationType(
    data?: Record<string, unknown> | undefined
  ): AppNotification['type'] {
    const type = (data as any)?.type;
    if (type === 'payment' || type === 'approval' || type === 'reminder') {
      return type;
    }
    return 'system';
  }

  /**
   * Fetch notifications from backend
   */
  async getNotifications(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: AppNotification[]; total: number }> {
     try {
       const response = await apiClient.get<ApiResponse<AppNotification[]>>('/notifications', { params });
       return {
         data: response.data.data || [],
         total: response.data.meta?.total || 0,
       };
     } catch (error) {
       console.error('Error fetching notifications:', error);
       return { data: [], total: 0 };
     }
  }
}

export default NotificationService.getInstance();

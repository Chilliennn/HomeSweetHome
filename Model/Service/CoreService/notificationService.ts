import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../../Service/APIService/supabase';

/**
 * Configure how notifications are displayed when app is in foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const pushNotificationService = {
  /**
   * Register for push notifications and get Expo Push Token
   * Store token in user's profile for later use
   */
  async registerForPushNotifications(userId: string): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return null;
    }

    try {
      // 1. Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token - permission denied');
        return null;
      }

      // 2. Get Expo Push Token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('✅ Push Token:', token);

      // 3. Save token to user's profile
      await supabase
        .from('users')
        .update({ 
          profile_data: { 
            push_token: token,
            push_enabled: true,
          } 
        })
        .eq('id', userId);

      // 4. Setup Android notification channel
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#9DE2D0',
        });
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  },

  /**
   * Setup notification listeners
   */
  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
  ) {
    // When app is in foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
      onNotificationReceived?.(notification);
    });

    // When user taps notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      onNotificationTapped?.(response);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  },

  /**
   * Send push notification to a specific user
   * Called from Supabase Edge Function (not from client!)
   */
  async sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
    data?: any
  ) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
      badge: 1,
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  },
};
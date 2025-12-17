import { useEffect, useCallback, useRef } from "react";
import Constants from "expo-constants";
import { notificationService } from "@home-sweet-home/model/Service/CoreService";

let _NotificationsModule: any = null;
let _DeviceModule: any = null;

function getNotifications() {
  if (_NotificationsModule) return _NotificationsModule;
  try {
    _NotificationsModule = require('expo-notifications');
    return _NotificationsModule;
  } catch {
    console.warn('[useNotificationSetup] expo-notifications unavailable (use dev-client)');
    return null;
  }
}

function getDevice() {
  if (_DeviceModule) return _DeviceModule;
  try {
    _DeviceModule = require('expo-device');
    return _DeviceModule;
  } catch {
    console.warn('[useNotificationSetup] expo-device unavailable');
    return null;
  }
}

/**
 * Configure how notifications are displayed when app is in foreground
 * This is platform-specific configuration that belongs in View layer
 */
function setupNotificationHandler() {
  const Notifications = getNotifications();
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
}

export interface UseNotificationSetupReturn {
  registerForPushNotifications: (userId: string) => Promise<string | null>;
  setupNotificationListeners: (
    onNotificationReceived?: (notification: any) => void,
    onNotificationTapped?: (response: any) => void
  ) => () => void;
}

/**
 * useNotificationSetup - Hook for platform-specific push notification setup
 *
 * MVVM Architecture:
 * - View layer: Platform-specific code (Expo APIs)
 * - Calls ViewModel/Service for business logic and data persistence
 * - Handles permission requests, token generation, and event listeners
 *
 * Usage:
 * ```tsx
 * const { registerForPushNotifications, setupNotificationListeners } = useNotificationSetup();
 *
 * useEffect(() => {
 *   if (userId) {
 *     registerForPushNotifications(userId);
 *   }
 * }, [userId]);
 *
 * useEffect(() => {
 *   const cleanup = setupNotificationListeners(
 *     (notification) => console.log('Received:', notification),
 *     (response) => console.log('Tapped:', response)
 *   );
 *   return cleanup;
 * }, []);
 * ```
 */
export function useNotificationSetup(): UseNotificationSetupReturn {
  const listenersRef = useRef<(() => void) | null>(null);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      if (listenersRef.current) {
        listenersRef.current();
        listenersRef.current = null;
      }
    };
  }, []);

  /**
   * Register for push notifications and get Expo Push Token
   * Platform-specific implementation using Expo APIs
   */
  const registerForPushNotifications = useCallback(async (userId: string): Promise<string | null> => {
    const Device = getDevice();
    const Notifications = getNotifications();

    if (!Device || !Notifications) {
      console.warn('[useNotificationSetup] Native modules unavailable (dev-client required)');
      return null;
    }
    if (!Device.isDevice) {
      console.warn('[useNotificationSetup] Push notifications only work on physical devices');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[useNotificationSetup] Permission denied');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('[useNotificationSetup] ✅ Push Token:', token);

      await notificationService.savePushToken(userId, token);

      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#9DE2D0',
      });

      return token;
    } catch (error) {
      console.error('[useNotificationSetup] Registration error:', error);
      return null;
    }
  }, []);

  /**
   * Setup notification event listeners
   * Platform-specific implementation using Expo APIs
   */
  const setupNotificationListeners = useCallback((
    onNotificationReceived?: (notification: any) => void,
    onNotificationTapped?: (response: any) => void
  ): (() => void) => {
    const Notifications = getNotifications();
    if (!Notifications) {
      console.warn('[useNotificationSetup] Notifications unavailable; listeners not set up');
      return () => {};
    }

    if (listenersRef.current) {
      listenersRef.current();
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification: any) => {
      console.log('[useNotificationSetup] 📬 Notification received:', notification);
      onNotificationReceived?.(notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log('[useNotificationSetup] 👆 Notification tapped:', response);
      onNotificationTapped?.(response);
    });

    const cleanup = () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };

    listenersRef.current = cleanup;
    return cleanup;
  }, []);

  return {
    registerForPushNotifications,
    setupNotificationListeners,
  };
}

export default useNotificationSetup;

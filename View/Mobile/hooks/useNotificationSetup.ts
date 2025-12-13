import { useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { notificationService } from '@home-sweet-home/model/Service/CoreService';

/**
 * Configure how notifications are displayed when app is in foreground
 * This is platform-specific configuration that belongs in View layer
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

export interface UseNotificationSetupReturn {
    registerForPushNotifications: (userId: string) => Promise<string | null>;
    setupNotificationListeners: (
        onNotificationReceived?: (notification: Notifications.Notification) => void,
        onNotificationTapped?: (response: Notifications.NotificationResponse) => void
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
        if (!Device.isDevice) {
            console.warn('[useNotificationSetup] Push notifications only work on physical devices');
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
                console.warn('[useNotificationSetup] Permission denied');
                return null;
            }

            // 2. Get Expo Push Token
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;
            const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log('[useNotificationSetup] ✅ Push Token:', token);

            // 3. Save token via Service (follows MVVM chain: View → Service → Repository)
            await notificationService.savePushToken(userId, token);

            // 4. Setup Android notification channel (platform-specific, only affects Android)
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
        onNotificationReceived?: (notification: Notifications.Notification) => void,
        onNotificationTapped?: (response: Notifications.NotificationResponse) => void
    ): (() => void) => {
        // Clean up existing listeners first
        if (listenersRef.current) {
            listenersRef.current();
        }

        // When app is in foreground
        const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
            console.log('[useNotificationSetup] 📬 Notification received:', notification);
            onNotificationReceived?.(notification);
        });

        // When user taps notification
        const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('[useNotificationSetup] 👆 Notification tapped:', response);
            onNotificationTapped?.(response);
        });

        // Return cleanup function
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

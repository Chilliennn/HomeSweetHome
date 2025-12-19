import { notificationRepository } from '../../Repository/UserRepository/notificationRepository';

/**
 * NotificationService
 * Business logic for push notification management
 * 
 * MVVM Architecture:
 * - Service layer: Business logic only
 * - Uses Repository for data access
 * - NO platform-specific code (Expo APIs moved to View layer)
 * - NO direct database calls
 */

export interface INotificationService {
  savePushToken(userId: string, token: string): Promise<void>;
  canSendNotification(userId: string): Promise<boolean>;
  sendPushNotification(userId: string, title: string, body: string, data?: any): Promise<void>;
}

class NotificationService implements INotificationService {
  /**
   * Save push token via Repository
   * Business logic: Validate userId before saving
   */
  async savePushToken(userId: string, token: string): Promise<void> {
    if (!userId || !token) {
      throw new Error('User ID and token are required');
    }

    await notificationRepository.savePushToken(userId, token);
    console.log('✅ Push token saved for user:', userId);
  }

  /**
   * Check if user can receive push notifications
   * Business logic: Verify user has enabled notifications
   */
  async canSendNotification(userId: string): Promise<boolean> {
    if (!userId) return false;

    try {
      const isEnabled = await notificationRepository.isNotificationEnabled(userId);
      return isEnabled;
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Send push notification to a specific user
   * Business logic: Check if user has notifications enabled before sending
   * 
   * NOTE: This should typically be called from Supabase Edge Function,
   * not from client code (for security reasons)
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    // Business rule: Check if user has notifications enabled
    const canSend = await this.canSendNotification(userId);
    if (!canSend) {
      console.warn('User has notifications disabled:', userId);
      return;
    }

    // Get user's push token
    const pushToken = await notificationRepository.getPushToken(userId);
    if (!pushToken) {
      console.warn('No push token found for user:', userId);
      return;
    }

    // Send notification via Expo Push API
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      badge: 1,
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Failed to send push notification: ${response.statusText}`);
      }

      console.log('✅ Push notification sent to user:', userId);
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Update user's notification preferences
   */
  async updateNotificationPreferences(userId: string, enabled: boolean): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    await notificationRepository.updateNotificationPreferences(userId, enabled);
    console.log(`✅ Notification preferences updated for user ${userId}: ${enabled}`);
  }

  // ============================================================================
  // Notification Count & Subscription Methods (for ViewModel use)
  // ============================================================================

  /**
   * Get unread notification count for a user
   * Used by ViewModels for bell icon count
   */
  async getUnreadCount(userId: string): Promise<number> {
    if (!userId) return 0;

    try {
      return await notificationRepository.getUnreadCount(userId);
    } catch (error) {
      console.error('[NotificationService] Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Subscribe to realtime notification updates
   * Used by ViewModels for realtime bell icon count
   */
  subscribeToNotifications(
    userId: string,
    onInsert: (notification: any) => void
  ): any {
    return notificationRepository.subscribeToNotifications(userId, onInsert);
  }

  /**
   * Unsubscribe from a notification channel
   */
  unsubscribe(channel: any): void {
    if (channel) {
      notificationRepository.unsubscribe(channel);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

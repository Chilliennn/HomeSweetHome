import { supabase} from '../../Service/APIService/supabase';
import type { Notification, NotificationType } from '../../types';
import { RealtimeChannel } from '@supabase/supabase-js';
/**
 * notificationRepository - Handles notification data access
 * 
 * MVVM Architecture:
 * - Repository layer: Data access only (CRUD, Supabase queries)
 * - No business logic
 * - Used by Services for notification creation/management
 */
export const notificationRepository = {
  /**
   * Create a new notification
   * Used when significant events occur (interest accepted, message received, etc.)
   */
  async createNotification(params: {
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    reference_id?: string;
    reference_table?: string;
  }): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.user_id,
        type: params.type,
        title: params.title,
        message: params.message,
        reference_id: params.reference_id || null,
        reference_table: params.reference_table || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get notifications for a user
   * @param userId - User ID
   * @param limit - Number of notifications to fetch (default: 50)
   * @param unreadOnly - Fetch only unread notifications
   */
  async getNotifications(
    userId: string,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Mark notification(s) as read
   * @param notificationIds - Array of notification IDs or single ID
   */
  async markAsRead(notificationIds: string | string[]): Promise<void> {
    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', ids);

    if (error) throw error;
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  /**
   * Subscribe to new notifications in real-time
   * UC101_4: Real-time notification updates
   */
  subscribeToNotifications(
    userId: string,
    onInsert: (notification: Notification) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onInsert(payload.new as Notification);
        }
      )
      .subscribe();

    return channel;
  },

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: RealtimeChannel): void {
    channel.unsubscribe();
  },
};

import { supabase } from '../../Service/APIService/supabase';
import type { Message, MessageType } from '../../types';
import type { RealtimeChannel } from '@supabase/supabase-js';


export const messageRepository = {
  /**
   * Get messages for a pre-match conversation (by application_id)
   * UC101_6: Retrieve chat history for pre-match period
   */
  async getMessagesByApplication(applicationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('application_id', applicationId)
      .is('relationship_id', null)
      .order('sent_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get messages for a relationship conversation (by relationship_id)
   * Used after formal match is confirmed
   */
  async getMessagesByRelationship(relationshipId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('relationship_id', relationshipId)
      .is('application_id', null)
      .order('sent_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Send a message in pre-match chat
   * UC101_6: Send text or voice message during pre-match period
   */
  async sendMessage(params: {
    senderId: string;
    receiverId: string;
    applicationId?: string;
    relationshipId?: string;
    messageType: MessageType;
    content?: string;
    mediaUrl?: string;
    callDurationMinutes?: number; // Duration in SECONDS for voice messages
  }): Promise<Message> {
    const { senderId, receiverId, applicationId, relationshipId, messageType, content, mediaUrl, callDurationMinutes } = params;

    // Validate: Must have either applicationId OR relationshipId, not both
    if ((applicationId && relationshipId) || (!applicationId && !relationshipId)) {
      throw new Error('Must provide either applicationId or relationshipId, not both');
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        application_id: applicationId || null,
        relationship_id: relationshipId || null,
        message_type: messageType,
        content: content || null,
        media_url: mediaUrl || null,
        call_duration_minutes: callDurationMinutes || null,
        is_read: false,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mark messages as read
   * Called when user opens chat or views messages
   */
  async markMessagesAsRead(userId: string, applicationId?: string, relationshipId?: string): Promise<void> {
    let query = supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (applicationId) {
      query = query.eq('application_id', applicationId);
    } else if (relationshipId) {
      query = query.eq('relationship_id', relationshipId);
    }

    const { error } = await query;
    if (error) throw error;
  },

  /**
   * Get unread message count for a user
   * Used for badge notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Get active pre-match conversations for a user
   * Returns list of application IDs with at least one message
   */
  async getActivePreMatchChats(userId: string): Promise<Array<{ application_id: string; last_message_at: string }>> {
    // Get applications where user is either sender or receiver
    const { data, error } = await supabase
      .from('messages')
      .select('application_id, sent_at')
      .not('application_id', 'is', null)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('sent_at', { ascending: false });

    if (error) throw error;

    // Group by application_id and get latest message time
    const chatMap = new Map<string, string>();
    data?.forEach(msg => {
      if (msg.application_id && !chatMap.has(msg.application_id)) {
        chatMap.set(msg.application_id, msg.sent_at);
      }
    });

    return Array.from(chatMap.entries()).map(([application_id, last_message_at]) => ({
      application_id,
      last_message_at,
    }));
  },

  /**
   * Subscribe to new messages in real-time (for a specific application)
   * UC101_6: Real-time message updates during pre-match chat
   */
  subscribeToMessages(
    context: { type: 'preMatch'; applicationId: string } | { type: 'relationship'; relationshipId: string },
    onInsert: (message: Message) => void
  ): RealtimeChannel {
    const filter = context.type === 'preMatch' ? `application_id=eq.${context.applicationId}` : `relationship_id=eq.${context.relationshipId}`;
    const channelName = `messages-${context.type}-${context.type === 'preMatch' ? context.applicationId : context.relationshipId}`;

    console.log('[messageRepository] Creating realtime subscription', {
      channelName,
      filter,
      context,
    });

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: filter,
        },
        (payload) => {
          console.log('[messageRepository] Realtime INSERT event received:', payload);
          onInsert(payload.new as Message);
        }
      )
      .subscribe((status) => {
        console.log('[messageRepository] Subscription status:', status);
      });

    console.log('[messageRepository] Channel created:', channel);
    return channel;
  },

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: RealtimeChannel): void {
    supabase.removeChannel(channel);
  },
};

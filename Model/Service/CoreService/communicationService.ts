import { messageRepository } from '../../Repository/UserRepository/messageRepository';
import { matchingRepository } from '../../Repository/UserRepository/matchingRepository';
import { userRepository } from '../../Repository/UserRepository/userRepository';
import type { Message, MessageType, User } from '../../types';
import type { Interest } from '../../Repository/UserRepository/matchingRepository';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { moderationService } from './moderationService';

// ============================================================================
// TYPES
// ============================================================================
export interface PreMatchChat {
  application: Interest;
  partnerUser: User;
  messages: Message[];
  unreadCount: number;
  lastMessageAt: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const MESSAGE_MAX_LENGTH = 1000;
const VOICE_MAX_DURATION_SECONDS = 120; // 2 minutes as per UC101

// ============================================================================
// CAPABILITY PRESETS
// ============================================================================
import type { CommunicationCapabilities, RelationshipStage } from '../../types';

const CAPABILITY_PRESETS: Record<string, CommunicationCapabilities> = {
  pre_match: {
    canSendText: true,
    canSendVoice: true,
    canSendImage: false,
    canSendVideo: false,
    canVoiceCall: false,
    canVideoCall: false,
    canScheduleMeetings: false,
    canShareDiary: false,
    canShareGallery: false,
    textMessageLimit: 1000,
    voiceMessageLimit: 120,
    dailyMessageLimit: null,
    moderationEnabled: true,
    autoBlockEnabled: true,
  },

  getting_to_know: {
    canSendText: true,
    canSendVoice: true,
    canSendImage: true,
    canSendVideo: false,
    canVoiceCall: true,
    canVideoCall: false,
    canScheduleMeetings: true,
    canShareDiary: true,
    canShareGallery: false,
    textMessageLimit: 2000,
    voiceMessageLimit: 300,
    dailyMessageLimit: null,
    moderationEnabled: true,
    autoBlockEnabled: false,
  },

  trial_period: {
    canSendText: true,
    canSendVoice: true,
    canSendImage: true,
    canSendVideo: true,
    canVoiceCall: true,
    canVideoCall: true,
    canScheduleMeetings: true,
    canShareDiary: true,
    canShareGallery: true,
    textMessageLimit: null,
    voiceMessageLimit: 600,
    dailyMessageLimit: null,
    moderationEnabled: true,
    autoBlockEnabled: false,
  },

  official_ceremony: {
    canSendText: true,
    canSendVoice: true,
    canSendImage: true,
    canSendVideo: true,
    canVoiceCall: true,
    canVideoCall: true,
    canScheduleMeetings: true,
    canShareDiary: true,
    canShareGallery: true,
    textMessageLimit: null,
    voiceMessageLimit: null,
    dailyMessageLimit: null,
    moderationEnabled: true,
    autoBlockEnabled: false,
  },

  family_life: {
    canSendText: true,
    canSendVoice: true,
    canSendImage: true,
    canSendVideo: true,
    canVoiceCall: true,
    canVideoCall: true,
    canScheduleMeetings: true,
    canShareDiary: true,
    canShareGallery: true,
    textMessageLimit: null,
    voiceMessageLimit: null,
    dailyMessageLimit: null,
    moderationEnabled: true,
    autoBlockEnabled: false,
  },
};

// ============================================================================
// SERVICE
// ============================================================================
/**
 * communicationService - Handles chat and messaging business logic
 * 
 * MVVM Architecture:
 * - Service layer: Business rules and workflows
 * - Coordinates multiple repositories
 * - No direct View/ViewModel references
 * 
 * Business Rules:
 * - UC101_6: Pre-match chat limited to text and voice messages (max 2 min)
 * - Message length: max 1000 characters
 * - Both parties must have active pre-match (status: 'pre_chat_active')
 */
export const communicationService = {
  /**
   * Get communication capabilities for current stage
   * Allows Communication module to be reusable across stages
   * 
   * @param sessionType - 'pre_match' or 'relationship'
   * @param relationshipStage - Optional stage if in relationship
   * @returns Capability configuration
   */
  getCapabilities(
    sessionType: 'pre_match' | 'relationship',
    relationshipStage?: RelationshipStage
  ): CommunicationCapabilities {
    if (sessionType === 'pre_match') {
      return CAPABILITY_PRESETS.pre_match;
    }

    if (relationshipStage && CAPABILITY_PRESETS[relationshipStage]) {
      return CAPABILITY_PRESETS[relationshipStage];
    }

    // Default to getting_to_know stage
    return CAPABILITY_PRESETS.getting_to_know;
  },

  /**
   * Get all active pre-match chats for a user
   * UC101_6: Display list of active pre-match conversations
   */
  async getActivePreMatchChats(userId: string, userType: 'youth' | 'elderly'): Promise<PreMatchChat[]> {
    try {
      // Get all applications for the user
      const applications = userType === 'youth'
        ? await matchingRepository.getYouthApplications(userId)
        : await matchingRepository.getElderlyApplications(userId);

      // Filter for active pre-match chats (status='pre_chat_active')
      const activeChats = applications.filter(app => app.status === 'pre_chat_active');

      // Get messages and partner info for each chat
      const chats = await Promise.all(
        activeChats.map(async (app) => {
          const messages = await messageRepository.getMessagesByApplication(app.id);

          // Determine partner
          const partnerId = userType === 'youth' ? app.elderly_id : app.youth_id;
          const partnerUser = await userRepository.getById(partnerId);

          if (!partnerUser) {
            throw new Error(`Partner user not found: ${partnerId}`);
          }

          // Count unread messages from partner
          const unreadCount = messages.filter(
            msg => msg.receiver_id === userId && !msg.is_read
          ).length;

          const lastMessageAt = messages.length > 0
            ? messages[messages.length - 1].sent_at
            : null;

          return {
            application: app,
            partnerUser,
            messages,
            unreadCount,
            lastMessageAt,
          };
        })
      );

      // Sort by last message time (most recent first)
      chats.sort((a, b) => {
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });

      return chats;
    } catch (error) {
      console.error('Error getting active pre-match chats:', error);
      throw error;
    }
  },

  /**
   * Get chat info for a specific application
   * UC101_6: Load chat details
   */
  async getChatInfo(applicationId: string, userId: string): Promise<PreMatchChat> {
    try {
      // Get application with user details
      const application = await matchingRepository.getApplicationById(applicationId);

      if (!application) {
        throw new Error('Chat not found');
      }

      // Verify user is part of this application
      if (application.youth_id !== userId && application.elderly_id !== userId) {
        throw new Error('You are not part of this chat');
      }

      // ✅ Verify status is pre_chat_active (can have active chat)
      if (application.status !== 'pre_chat_active') {
        throw new Error('This pre-match chat is not active yet. Wait for elderly to accept the interest.');
      }

      // Get messages
      const messages = await messageRepository.getMessagesByApplication(applicationId);

      // Determine partner
      const partnerId = application.youth_id === userId ? application.elderly_id : application.youth_id;
      const partnerUser = await userRepository.getById(partnerId);

      if (!partnerUser) {
        throw new Error('Partner user not found');
      }

      // Count unread messages
      const unreadCount = messages.filter(
        msg => msg.receiver_id === userId && !msg.is_read
      ).length;

      const lastMessageAt = messages.length > 0
        ? messages[messages.length - 1].sent_at
        : null;

      return {
        application,
        partnerUser,
        messages,
        unreadCount,
        lastMessageAt,
      };
    } catch (error) {
      console.error('Error getting chat info:', error);
      throw error;
    }
  },

  /**
   * Get messages for a specific pre-match chat
   * UC101_6: Load chat history
   */
  async getPreMatchMessages(applicationId: string): Promise<Message[]> {
    try {
      return await messageRepository.getMessagesByApplication(applicationId);
    } catch (error) {
      console.error('Error getting pre-match messages:', error);
      throw error;
    }
  },

  /**
   * Send a text message in pre-match chat
   * UC101_6 + Safety: Send text message with validation and moderation
   */
  async sendTextMessage(
    senderId: string,
    receiverId: string,
    applicationId: string,
    content: string
  ): Promise<Message> {
    console.log('[communicationService] sendTextMessage called', {
      senderId,
      receiverId,
      applicationId,
      content,
    });

    // Validate message content
    if (!content || content.trim().length === 0) {
      console.error('[communicationService] Message is empty');
      throw new Error('Message cannot be empty');
    }

    if (content.length > MESSAGE_MAX_LENGTH) {
      console.error('[communicationService] Message too long:', content.length);
      throw new Error(`Message too long (max ${MESSAGE_MAX_LENGTH} characters)`);
    }

    console.log('[communicationService] Verifying active pre-match');
    // Verify application exists and is in pre_chat_active status
    const application = await this.verifyActivePreMatch(applicationId, senderId);
    console.log('[communicationService] Pre-match verified', application);

    // Determine receiver (the other party in the application)
    const expectedReceiverId = application.youth_id === senderId
      ? application.elderly_id
      : application.youth_id;

    if (receiverId !== expectedReceiverId) {
      console.error('[communicationService] Invalid receiver', {
        provided: receiverId,
        expected: expectedReceiverId,
      });
      throw new Error('Invalid receiver for this pre-match chat');
    }

    console.log('[communicationService] Moderating message');
    // Moderate message content
    const moderationResult = await moderationService.moderateMessage(
      content,
      senderId,
      receiverId,
      applicationId
    );
    console.log('[communicationService] Moderation result:', moderationResult);

    // Handle blocked messages
    if (!moderationResult.isAllowed) {
      console.error('[communicationService] Message blocked by moderation');
      // TODO: Create safety incident for admin review
      throw new Error(moderationResult.suggestedAction || 'Message blocked by moderation');
    }

    console.log('[communicationService] Sending message to repository');
    // Send message
    const message = await messageRepository.sendMessage({
      senderId,
      receiverId,
      applicationId,
      messageType: 'text',
      content: content.trim(),
    });
    console.log('[communicationService] Message sent successfully', message);

    // If warning level, log for tracking but allow message
    if (moderationResult.severity === 'warning') {
      // TODO: Create low-severity safety incident for tracking
      console.warn('Message sent with warning:', {
        applicationId,
        senderId,
        detectedIssues: moderationResult.detectedIssues,
      });
    }

    return message;
  },

  /**
   * Send a voice message in pre-match chat
   * UC101_6: Send voice message (max 2 minutes)
   */
  async sendVoiceMessage(
    senderId: string,
    receiverId: string,
    applicationId: string,
    mediaUrl: string,
    durationSeconds: number
  ): Promise<Message> {
    // Validate duration
    if (durationSeconds > VOICE_MAX_DURATION_SECONDS) {
      throw new Error(`Voice message too long (max ${VOICE_MAX_DURATION_SECONDS / 60} minutes)`);
    }

    // Verify application exists and is active
    await this.verifyActivePreMatch(applicationId, senderId);

    // Send voice message
    return await messageRepository.sendMessage({
      senderId,
      receiverId,
      applicationId,
      messageType: 'voice',
      mediaUrl,
    });
  },

  /**
   * Mark messages as read when user opens chat
   */
  async markMessagesAsRead(userId: string, applicationId: string): Promise<void> {
    try {
      await messageRepository.markMessagesAsRead(userId, applicationId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  /**
   * Get unread message count for a user (across all chats)
   */
  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      return await messageRepository.getUnreadCount(userId);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  },

  /**
   * Subscribe to real-time messages for a chat
   * UC101_6: Real-time message updates
   */
  subscribeToMessages(context: { type: 'preMatch'; applicationId: string } | { type: 'relationship'; relationshipId: string }, callback: (message: Message) => void): RealtimeChannel {
    return messageRepository.subscribeToMessages(context, callback);
  },

  /**
   * Unsubscribe from message updates
   */
  unsubscribe(channel: RealtimeChannel): void {
    messageRepository.unsubscribe(channel);
  },

  /**
   * Helper: Verify that application exists and is in active pre-match status
   */
  async verifyActivePreMatch(applicationId: string, userId: string): Promise<Interest> {
    // Use Repository instead of direct Supabase (MVVM compliance)
    const application = await matchingRepository.getApplicationById(applicationId);

    if (!application) {
      throw new Error('Pre-match chat not found');
    }

    // Verify user is part of this application
    if (application.youth_id !== userId && application.elderly_id !== userId) {
      throw new Error('You are not part of this pre-match chat');
    }

    // Verify status is pre_chat_active
    if (application.status !== 'pre_chat_active') {
      throw new Error(`Cannot send messages - pre-match status is ${application.status}`);
    }

    return application;
  },

  /**
   * Create initial welcome message when elderly accepts interest
   * UC101_9: System creates pre-match communication session
   * 
   * Called by matchingRepository.updateInterestStatus when accepting
   */
  async createWelcomeMessage(applicationId: string, youthId: string, elderlyId: string): Promise<void> {
    try {
      // Create system message from elderly to youth
      await messageRepository.sendMessage({
        senderId: elderlyId,
        receiverId: youthId,
        applicationId,
        messageType: 'text',
        content: "Hello! I've accepted your interest. Let's get to know each other! 😊",
      });
    } catch (error) {
      console.error('Error creating welcome message:', error);
      // Don't throw - welcome message is nice-to-have, not critical
    }
  },
};

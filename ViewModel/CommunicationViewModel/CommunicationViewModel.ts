import { makeAutoObservable, runInAction } from 'mobx';
import { communicationService, type PreMatchChat } from '../../Model/Service/CoreService/communicationService';
import type { Message } from '../../Model/types';
import type { RealtimeChannel } from '@home-sweet-home/model';

// Type for channel subscription (works even if @supabase/supabase-js types aren't available)
type ChannelType = RealtimeChannel | any;

/**
 * CommunicationViewModel - Manages chat and messaging state
 * 
 * MVVM Architecture:
 * - Manages UI state for chat conversations
 * - Coordinates with communicationService for business logic
 * - Handles real-time message subscriptions
 * - No direct Repository calls
 * 
 * Features:
 * - UC101_6: Pre-match chat with text and voice messages
 * - Real-time message updates
 * - Unread message counts
 * - Active chat list
 */
export class CommunicationViewModel {
  // =============================================================
  // Observable State
  // =============================================================

  /** List of active pre-match chats */
  activePreMatchChats: PreMatchChat[] = [];

  /** Messages for currently open chat */
  currentChatMessages: Message[] = [];

  /** Currently open chat application ID */
  currentApplicationId: string | null = null;

  /** Currently open chat relationship ID */
  currentRelationshipId: string | null = null;

  /** Current chat context type */
  currentChatContext: 'preMatch' | 'relationship' | null = null;

  /** Currently open chat info */
  currentChat: PreMatchChat | null = null;

  /** Total unread message count across all chats */
  unreadCount = 0;

  /** Loading state */
  isLoading = false;

  /** Error message */
  errorMessage: string | null = null;

  /**get current user and user type*/
  currentUser: string | null = null;
  currentUserType: 'youth' | 'elderly' | null = null;

  /** Real-time subscription channel */
  private messageSubscription: ChannelType | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  // =============================================================
  // Chat List Actions
  // =============================================================

  /**
   * Load all active pre-match chats for a user
   * UC101_6: Display list of active conversations
   */
  async loadActiveChats(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const chats = await communicationService.getActivePreMatchChats(this.currentUser!, this.currentUserType!);

      runInAction(() => {
        this.activePreMatchChats = chats;
        this.unreadCount = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.errorMessage = error instanceof Error ? error.message : 'Failed to load chats';
        this.isLoading = false;
      });
    }
  }

  /**
   * Refresh chat list (for pull-to-refresh)
   */
  async refreshChats(): Promise<void> {
    await this.loadActiveChats();
  }

  // =============================================================
  // Individual Chat Actions
  // =============================================================

  /**
   * Open a specific chat and load messages
   * UC101_6: Enter chat screen
   */
  async openChat(applicationId: string): Promise<void> {
    // Unsubscribe from previous chat if any
    if (this.messageSubscription) {
      communicationService.unsubscribe(this.messageSubscription);
      this.messageSubscription = null;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.currentApplicationId = applicationId;
    this.currentChat = null;

    try {
      // Load chat info from activePreMatchChats or fetch fresh
      const existingChat = this.activePreMatchChats.find(c => c.application.id === applicationId);

      if (existingChat) {
        runInAction(() => {
          this.currentChat = existingChat;
        });
      } else {
        // Fetch chat info if not in activePreMatchChats
        const chatInfo = await communicationService.getChatInfo(applicationId, this.currentUser!);
        runInAction(() => {
          this.currentChat = chatInfo;
        });
      }

      // Load messages
      const messages = await communicationService.getPreMatchMessages(applicationId);

      runInAction(() => {
        this.currentChatMessages = messages;
        this.isLoading = false;
      });

      // Mark messages as read
      await communicationService.markMessagesAsRead(this.currentUser!, applicationId);

      // Set context
      runInAction(() => {
        this.currentChatContext = 'preMatch';
      });

      // Subscribe to real-time updates
      this.subscribeToChat({ type: 'preMatch', applicationId });

    } catch (error) {
      runInAction(() => {
        this.errorMessage = error instanceof Error ? error.message : 'Failed to load chat';
        this.isLoading = false;
      });
    }
  }

  /**
   * Send a text message
   * UC101_6: Send text message in pre-match chat
   */
  async sendTextMessage(
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<boolean> {
    try {
      console.log('[CommunicationViewModel] sendTextMessage called', {
        senderId,
        receiverId,
        content,
        currentChatContext: this.currentChatContext,
        currentApplicationId: this.currentApplicationId,
      });

      // Determine context
      if (!this.currentChatContext) {
        console.error('[CommunicationViewModel] No active chat context');
        throw new Error('No active chat');
      }

      let message: Message;

      if (this.currentChatContext === 'preMatch' && this.currentApplicationId) {
        console.log('[CommunicationViewModel] Sending pre-match message');
        message = await communicationService.sendTextMessage(
          senderId,
          receiverId,
          this.currentApplicationId,
          content
        );
        console.log('[CommunicationViewModel] Message sent successfully', message);
      } else if (this.currentChatContext === 'relationship' && this.currentRelationshipId) {
        // TODO: Implement relationship text message when relationship chat is added
        console.error('[CommunicationViewModel] Relationship chat not implemented');
        throw new Error('Relationship chat not yet implemented');
      } else {
        console.error('[CommunicationViewModel] Invalid chat context', {
          context: this.currentChatContext,
          appId: this.currentApplicationId,
          relId: this.currentRelationshipId,
        });
        throw new Error('Invalid chat context');
      }

      // Message will be added via real-time subscription
      // But add it immediately for optimistic UI update
      runInAction(() => {
        // Check if message already exists (from subscription)
        const exists = this.currentChatMessages.some(m => m.id === message.id);
        if (!exists) {
          this.currentChatMessages.push(message);
        }
      });

      return true;
    } catch (error) {
      console.error('[CommunicationViewModel] Error sending message:', error);
      runInAction(() => {
        this.errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      });
      return false;
    }
  }

  /**
   * Send a voice message
   * UC101_6: Send voice message (max 2 min)
   */
  async sendVoiceMessage(
    senderId: string,
    receiverId: string,
    mediaUrl: string,
    durationSeconds: number
  ): Promise<boolean> {
    try {
      // Determine context
      if (!this.currentChatContext) {
        throw new Error('No active chat');
      }

      let message: Message;

      if (this.currentChatContext === 'preMatch' && this.currentApplicationId) {
        message = await communicationService.sendVoiceMessage(
          senderId,
          receiverId,
          this.currentApplicationId,
          mediaUrl,
          durationSeconds
        );
      } else if (this.currentChatContext === 'relationship' && this.currentRelationshipId) {
        // TODO: Implement relationship voice message when relationship chat is added
        throw new Error('Relationship chat not yet implemented');
      } else {
        throw new Error('Invalid chat context');
      }

      // Message will be added via real-time subscription
      runInAction(() => {
        const exists = this.currentChatMessages.some(m => m.id === message.id);
        if (!exists) {
          this.currentChatMessages.push(message);
        }
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.errorMessage = error instanceof Error ? error.message : 'Failed to send voice message';
      });
      return false;
    }
  }

  /**
   * Close current chat and clean up subscriptions
   */
  closeChat(): void {
    if (this.messageSubscription) {
      communicationService.unsubscribe(this.messageSubscription);
      this.messageSubscription = null;
    }

    runInAction(() => {
      this.currentApplicationId = null;
      this.currentRelationshipId = null;
      this.currentChatContext = null;
      this.currentChat = null;
      this.currentChatMessages = [];
    });
  }

  // =============================================================
  // Real-time Subscriptions
  // =============================================================

  /**
   * Subscribe to real-time message updates for current chat
   */
  private subscribeToChat(
    context: { type: 'preMatch'; applicationId: string } | { type: 'relationship'; relationshipId: string }
  ): void {
    console.log('[CommunicationViewModel] Subscribing to chat', context);
    this.messageSubscription = communicationService.subscribeToMessages(
      context,
      (newMessage) => {
        console.log('[CommunicationViewModel] Received realtime message:', newMessage);
        runInAction(() => {
          // Add new message if it doesn't exist
          const exists = this.currentChatMessages.some(m => m.id === newMessage.id);
          if (!exists) {
            console.log('[CommunicationViewModel] Adding message to UI');
            this.currentChatMessages.push(newMessage);
          } else {
            console.log('[CommunicationViewModel] Message already exists');
          }
        });
      }
    );
    console.log('[CommunicationViewModel] Subscription created');
  }

  // =============================================================
  // Helpers
  // =============================================================

  setCurrentUser(userId: string, userType: 'youth' | 'elderly' | null): void {
    this.currentUser = userId;
    this.currentUserType = userType;
  }
  /**
   * Get chat by application ID
   */
  getChatByApplicationId(applicationId: string): PreMatchChat | undefined {
    return this.activePreMatchChats.find(chat => chat.application.id === applicationId);
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorMessage = null;
  }

  /**
   * Clean up when ViewModel is disposed
   */
  dispose(): void {
    if (this.messageSubscription) {
      communicationService.unsubscribe(this.messageSubscription);
      this.messageSubscription = null;
    }
  }
}

// Singleton instance
export const communicationViewModel = new CommunicationViewModel();

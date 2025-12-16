import { makeAutoObservable, runInAction } from 'mobx';
import { communicationService, type PreMatchChat } from '../../Model/Service/CoreService/communicationService';
import { relationshipRepository, type Relationship } from '../../Model/Repository/UserRepository/relationshipRepository';
import { messageRepository } from '../../Model/Repository/UserRepository/messageRepository';
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

  /** Current relationship (if in relationship stage) */
  currentRelationship: Relationship | null = null;

  /** Total unread message count across all chats */
  unreadCount = 0;

  /** Loading state */
  isLoading = false;

  /** Error message */
  errorMessage: string | null = null;

  /**get current user and user type*/
  currentUser: string | null = null;
  currentUserType: 'youth' | 'elderly' | null = null;

  /** Track if chats have been loaded at least once (prevent infinite loading) */
  hasLoadedOnce = false;

  /** Whether user has active relationship (for routing to bonding screen) */
  hasActiveRelationship = false;

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
        this.hasLoadedOnce = true; // ✅ Mark as loaded
      });
    } catch (error) {
      runInAction(() => {
        this.errorMessage = error instanceof Error ? error.message : 'Failed to load chats';
        this.isLoading = false;
        this.hasLoadedOnce = true; // ✅ Even on error, prevent infinite loading
      });
    }
  }

  /**
   * Refresh chat list (for pull-to-refresh)
   */
  async refreshChats(): Promise<void> {
    await this.loadActiveChats();
  }

  /**
   * Check if user has active relationship
   * Called by ChatListHub to determine routing
   */
  async checkActiveRelationship(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const relationship = await relationshipRepository.getActiveRelationshipByUserId(
        this.currentUser
      );

      runInAction(() => {
        this.hasActiveRelationship = relationship !== null;
        this.currentRelationship = relationship;
      });
    } catch (error) {
      console.error('[CommunicationViewModel] Error checking relationship:', error);
      runInAction(() => {
        this.hasActiveRelationship = false;
        this.currentRelationship = null;
      });
    }
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
   * Open relationship chat
   * For users who have both_accepted and established relationship
   */
  async openRelationshipChat(relationshipId: string): Promise<void> {
    // Unsubscribe from previous chat if any
    if (this.messageSubscription) {
      communicationService.unsubscribe(this.messageSubscription);
      this.messageSubscription = null;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.currentRelationshipId = relationshipId;
    this.currentApplicationId = null;
    this.currentChat = null;

    try {
      // Load relationship details
      const relationship = await relationshipRepository.getRelationshipById(relationshipId);

      // Load messages
      const messages = await messageRepository.getMessagesByRelationship(relationshipId);

      runInAction(() => {
        this.currentRelationship = relationship;
        this.currentChatMessages = messages;
        this.currentChatContext = 'relationship';
        this.isLoading = false;
      });

      // Mark messages as read
      await messageRepository.markMessagesAsRead(this.currentUser!, undefined, relationshipId);

      // Subscribe to real-time updates
      this.subscribeToChat({ type: 'relationship', relationshipId });

    } catch (error) {
      runInAction(() => {
        this.errorMessage = error instanceof Error ? error.message : 'Failed to load relationship chat';
        this.isLoading = false;
      });
    }
  }

  /**
   * Send a text message
   * UC101_6: Send text message in pre-match or relationship chat
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

      let context: { applicationId: string } | { relationshipId: string };

      if (this.currentChatContext === 'preMatch' && this.currentApplicationId) {
        context = { applicationId: this.currentApplicationId };
      } else if (this.currentChatContext === 'relationship' && this.currentRelationshipId) {
        context = { relationshipId: this.currentRelationshipId };
      } else {
        console.error('[CommunicationViewModel] Invalid chat context', {
          context: this.currentChatContext,
          appId: this.currentApplicationId,
          relId: this.currentRelationshipId,
        });
        throw new Error('Invalid chat context');
      }

      // ✅ Always use Service layer (MVVM compliance)
      const message = await communicationService.sendTextMessage(
        senderId,
        receiverId,
        context,
        content
      );

      // Message will be added via real-time subscription
      // But add it immediately for optimistic UI update
      runInAction(() => {
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
   * 
   * Simplified API: VM derives sender, receiver, and context internally
   * ChatScreen only needs to provide the recorded audio URL and duration
   */
  async sendVoiceMessage(
    mediaUrl: string,
    durationSeconds: number
  ): Promise<boolean> {
    try {
      // Validate we have a user
      if (!this.currentUser) {
        throw new Error('No current user');
      }

      // Determine context
      if (!this.currentChatContext) {
        throw new Error('No active chat');
      }

      let context: { applicationId: string } | { relationshipId: string };
      let receiverId: string;

      if (this.currentChatContext === 'preMatch' && this.currentApplicationId) {
        context = { applicationId: this.currentApplicationId };
        // Get receiver from current chat info
        receiverId = this.currentChat?.partnerUser?.id || '';
      } else if (this.currentChatContext === 'relationship' && this.currentRelationshipId) {
        context = { relationshipId: this.currentRelationshipId };
        // Get receiver from relationship (the other person)
        const rel = this.currentRelationship;
        receiverId = rel?.youth_id === this.currentUser ? rel?.elderly_id : rel?.youth_id || '';
      } else {
        throw new Error('Invalid chat context');
      }

      if (!receiverId) {
        throw new Error('Could not determine receiver');
      }

      // ✅ Always use Service layer (MVVM compliance)
      const message = await communicationService.sendVoiceMessage(
        this.currentUser,
        receiverId,
        context,
        mediaUrl,
        durationSeconds
      );

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

  // =============================================================
  // Pre-Match Decision Actions (UC104)
  // =============================================================

  /**
   * Get pre-match status for an application
   * UC104: Check days passed, can apply (>=7), is expired (>=14)
   */
  getPreMatchStatus(applicationId: string): { daysPassed: number; canApply: boolean; isExpired: boolean } | null {
    const chat = this.getChatByApplicationId(applicationId);
    if (!chat) return null;

    return communicationService.calcPreMatchStatus(chat.application.applied_at);
  }

  /**
   * Get first expired pre-match chat (for force redirect to decision)
   * UC104_7: After 14 days, force user to decide
   */
  getFirstExpiredChat(): typeof this.activePreMatchChats[0] | null {
    for (const chat of this.activePreMatchChats) {
      const status = communicationService.calcPreMatchStatus(chat.application.applied_at);
      if (status.isExpired) {
        return chat;
      }
    }
    return null;
  }

  /**
   * End pre-match communication
   * UC104_7: Mark pre-match as ended when user decides to end
   */
  async endPreMatch(applicationId: string): Promise<boolean> {
    if (!this.currentUser) {
      this.errorMessage = 'User not logged in';
      return false;
    }

    this.isLoading = true;
    try {
      await communicationService.endPreMatch(applicationId, this.currentUser);

      // Remove from active chats
      runInAction(() => {
        this.activePreMatchChats = this.activePreMatchChats.filter(
          chat => chat.application.id !== applicationId
        );
        this.isLoading = false;
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.errorMessage = error instanceof Error ? error.message : 'Failed to end pre-match';
        this.isLoading = false;
      });
      return false;
    }
  }

  /**
   * Submit formal application decision
   * UC101_12-15: Submit formal application or decline after 7 days
   */
  async submitDecision(applicationId: string, decision: 'apply' | 'decline'): Promise<boolean> {
    if (!this.currentUser || !this.currentUserType) {
      this.errorMessage = 'User not logged in';
      return false;
    }

    this.isLoading = true;
    try {
      await communicationService.submitDecision(
        applicationId,
        this.currentUser,
        this.currentUserType,
        decision
      );

      // Refresh chat list
      await this.loadActiveChats();

      runInAction(() => {
        this.isLoading = false;
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.errorMessage = error instanceof Error ? error.message : 'Failed to submit decision';
        this.isLoading = false;
      });
      return false;
    }
  }
}

// Singleton instance
export const communicationViewModel = new CommunicationViewModel();

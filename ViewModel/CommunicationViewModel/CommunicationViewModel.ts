import { makeAutoObservable, runInAction } from 'mobx';
import { communicationService, type PreMatchChat } from '../../Model/Service/CoreService/communicationService';
import { familyService } from '../../Model/Service/CoreService/familyService';
import { notificationService } from '../../Model/Service/CoreService/notificationService';
import { relationshipService } from '../../Model/Service/CoreService/relationshipService';
import { voiceUploadService, type ChatContext } from '../../Model/Service/CoreService/voiceUploadHelper';
import { voiceTranscriptionService, type TranscriptionResult } from '../../Model/Service/CoreService/voiceTranscriptionService';
import type { Message, Relationship } from '../../Model/types';
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

  /** ✅ Partner user info for relationship context (loaded when checking relationship) */
  relationshipPartnerUser: import('../../Model/types').User | null = null;

  /** Total unread message count across all chats */
  unreadCount = 0;

  /** ✅ Unread notification count for bell icon (realtime updated) */
  unreadNotificationCount = 0;

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

  /** Pending incoming call info (set when call invite received, cleared when handled) */
  pendingIncomingCall: {
    callerName: string;
    callType: 'voice' | 'video';
    roomUrl: string;
  } | null = null;

  /** Real-time subscription channel */
  private messageSubscription: ChannelType | null = null;

  /** ✅ Notification subscription */
  private notificationSubscription: ChannelType | null = null;

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

      // ✅ Setup notification subscription for realtime count updates
      this.setupNotificationSubscription();

      // ✅ Load initial notification count
      await this.loadUnreadNotificationCount();
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

  // =============================================================
  // ✅ Notification Count Methods
  // =============================================================

  /**
   * Setup notification realtime subscription
   */
  private setupNotificationSubscription(): void {
    if (this.notificationSubscription || !this.currentUser) {
      return;
    }

    console.log('[CommVM] Setting up notification subscription for:', this.currentUser);
    this.notificationSubscription = notificationService.subscribeToNotifications(
      this.currentUser,
      (notification) => {
        console.log('[CommVM] New notification received:', notification.type);
        runInAction(() => {
          this.unreadNotificationCount += 1;
        });
      }
    );
  }

  /**
   * Load unread notification count from database
   */
  async loadUnreadNotificationCount(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const count = await notificationService.getUnreadCount(this.currentUser);
      runInAction(() => {
        this.unreadNotificationCount = count;
      });
    } catch (error) {
      console.error('[CommVM] Failed to load notification count', error);
    }
  }

  /**
   * Reset notification count (call when user visits notification screen)
   */
  resetNotificationCount(): void {
    this.unreadNotificationCount = 0;
  }

  /**
   * Cleanup notification subscription
   */
  cleanupNotificationSubscription(): void {
    if (this.notificationSubscription) {
      notificationService.unsubscribe(this.notificationSubscription);
      this.notificationSubscription = null;
    }
  }

  /**
   * Check if user has active relationship
   * Called by ChatListHub to determine routing
   */
  async checkActiveRelationship(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const relationship = await relationshipService.getActiveRelationship(
        this.currentUser
      );

      // ✅ Load partner user info if relationship exists
      let partnerUser = null;
      if (relationship && this.currentUser) {
        partnerUser = await relationshipService.getPartnerUser(this.currentUser, relationship);
      }

      runInAction(() => {
        this.hasActiveRelationship = relationship !== null;
        this.currentRelationship = relationship;
        this.relationshipPartnerUser = partnerUser;
      });
    } catch (error) {
      console.error('[CommunicationViewModel] Error checking relationship:', error);
      runInAction(() => {
        this.hasActiveRelationship = false;
        this.currentRelationship = null;
        this.relationshipPartnerUser = null;
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
      const relationship = await relationshipService.getRelationshipById(relationshipId);

      // Load messages
      const messages = await communicationService.getRelationshipMessages(relationshipId);

      // ✅ Load partner user info for display in ChatScreen
      let partnerUser = null;
      if (relationship && this.currentUser) {
        partnerUser = await relationshipService.getPartnerUser(this.currentUser, relationship);
      }

      runInAction(() => {
        this.currentRelationship = relationship;
        this.currentChatMessages = messages;
        this.currentChatContext = 'relationship';
        this.relationshipPartnerUser = partnerUser;
        this.isLoading = false;
      });

      // Mark messages as read
      await communicationService.markRelationshipMessagesAsRead(this.currentUser!, relationshipId);

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
   * Send an image message
   * @param mediaUrl - Public URL of the uploaded image
   */
  async sendImageMessage(mediaUrl: string): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new Error('No current user');
      }

      if (!this.currentChatContext) {
        throw new Error('No active chat');
      }

      let context: { applicationId: string } | { relationshipId: string };
      let receiverId: string;

      if (this.currentChatContext === 'preMatch' && this.currentApplicationId) {
        context = { applicationId: this.currentApplicationId };
        receiverId = this.currentChat?.partnerUser?.id || '';
      } else if (this.currentChatContext === 'relationship' && this.currentRelationshipId) {
        context = { relationshipId: this.currentRelationshipId };
        const rel = this.currentRelationship;
        receiverId = rel?.youth_id === this.currentUser ? rel?.elderly_id : rel?.youth_id || '';
      } else {
        throw new Error('Invalid chat context');
      }

      if (!receiverId) {
        throw new Error('Could not determine receiver');
      }

      // Send image message via Service
      const message = await communicationService.sendMediaMessage(
        this.currentUser,
        receiverId,
        context,
        'image',
        mediaUrl
      );

      // Optimistic UI update
      runInAction(() => {
        const exists = this.currentChatMessages.some(m => m.id === message.id);
        if (!exists) {
          this.currentChatMessages.push(message);
        }
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.errorMessage = error instanceof Error ? error.message : 'Failed to send image';
      });
      return false;
    }
  }

  /**
   * Send a video message
   * @param mediaUrl - Public URL of the uploaded video
   */
  async sendVideoMessage(mediaUrl: string): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new Error('No current user');
      }

      if (!this.currentChatContext) {
        throw new Error('No active chat');
      }

      let context: { applicationId: string } | { relationshipId: string };
      let receiverId: string;

      if (this.currentChatContext === 'preMatch' && this.currentApplicationId) {
        context = { applicationId: this.currentApplicationId };
        receiverId = this.currentChat?.partnerUser?.id || '';
      } else if (this.currentChatContext === 'relationship' && this.currentRelationshipId) {
        context = { relationshipId: this.currentRelationshipId };
        const rel = this.currentRelationship;
        receiverId = rel?.youth_id === this.currentUser ? rel?.elderly_id : rel?.youth_id || '';
      } else {
        throw new Error('Invalid chat context');
      }

      if (!receiverId) {
        throw new Error('Could not determine receiver');
      }

      // Send video message via Service
      const message = await communicationService.sendMediaMessage(
        this.currentUser,
        receiverId,
        context,
        'video',
        mediaUrl
      );

      // Optimistic UI update
      runInAction(() => {
        const exists = this.currentChatMessages.some(m => m.id === message.id);
        if (!exists) {
          this.currentChatMessages.push(message);
        }
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.errorMessage = error instanceof Error ? error.message : 'Failed to send video';
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

            // Check if this is an incoming call invite (not from self)
            if (newMessage.sender_id !== this.currentUser && newMessage.content) {
              const isCallInvite = newMessage.content.includes('📞 Incoming') &&
                newMessage.content.includes('Tap to join:');

              if (isCallInvite) {
                // Extract call info
                const urlMatch = newMessage.content.match(/Tap to join: (https?:\/\/[^\s]+)/);
                const callUrl = urlMatch ? urlMatch[1] : null;
                const callType = newMessage.content.includes('Video Call') ? 'video' : 'voice';

                if (callUrl) {
                  console.log('[CommunicationViewModel] Incoming call detected!', { callType, callUrl });
                  // Store pending incoming call info for the UI to react
                  this.pendingIncomingCall = {
                    callerName: this.relationshipPartnerUser?.full_name || this.currentChat?.partnerUser?.full_name || 'Unknown Caller',
                    callType: callType as 'voice' | 'video',
                    roomUrl: callUrl,
                  };
                }
              }
            }
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
   * Clear pending incoming call (after user handles it)
   */
  clearPendingIncomingCall(): void {
    this.pendingIncomingCall = null;
  }

  /**
   * Get current journey step based on user's application status
   * Step 1: Browse/Wait (no pre-matches)
   * Step 2: Pre-Match (has active pre-match with status pre_chat_active)
   * Step 3: Application/Review (has pending_review application)
   * Note: Step 4 not needed - both_accepted goes directly to bonding stage
   */
  get currentJourneyStep(): number {
    // Check for pending_review applications (Step 3)
    const hasPendingApplication = this.activePreMatchChats.some(
      chat => chat.application.status === 'pending_review'
    );
    if (hasPendingApplication) {
      return 3;
    }

    // Check for active pre-match (Step 2)
    const hasActivePreMatch = this.activePreMatchChats.some(
      chat => chat.application.status === 'pre_chat_active'
    );
    if (hasActivePreMatch) {
      return 2;
    }

    // Default: Browse/Wait (Step 1)
    return 1;
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

  // =============================================================
  // Call Actions (Daily.co)
  // =============================================================

  /**
   * Start a voice or video call
   * Creates a room and sends an invite
   */
  async startCall(isVideo: boolean): Promise<string | null> {
    if (!this.currentUser) {
      this.errorMessage = 'User not logged in';
      return null;
    }

    // Determine receiver and context
    let context: { applicationId: string } | { relationshipId: string };
    let receiverId: string;

    if (this.currentChatContext === 'preMatch' && this.currentApplicationId) {
      context = { applicationId: this.currentApplicationId };
      receiverId = this.currentChat?.partnerUser?.id || '';
    } else if (this.currentChatContext === 'relationship' && this.currentRelationshipId) {
      context = { relationshipId: this.currentRelationshipId };
      const rel = this.currentRelationship;
      receiverId = rel?.youth_id === this.currentUser ? rel?.elderly_id : rel?.youth_id || '';
    } else {
      this.errorMessage = 'No active chat context';
      return null;
    }

    if (!receiverId) {
      this.errorMessage = 'Could not determine receiver';
      return null;
    }

    this.isLoading = true;

    try {
      const { roomUrl } = await communicationService.initiateCall(
        this.currentUser,
        receiverId,
        context,
        isVideo
      );

      runInAction(() => {
        this.isLoading = false;
        // Optimization: Optimistically add the invite message to the list
        // (Though initiateCall does send it, we might want instant feedback)
      });

      return roomUrl;
    } catch (error) {
      runInAction(() => {
        this.errorMessage = error instanceof Error ? error.message : 'Failed to start call';
        this.isLoading = false;
      });
      return null;
    }
  }

  /**
   * Save chat media to family album (memories)
   * Only available in relationship context (not pre-match)
   * 
   * @param mediaUrl - Existing chat media URL
   * @param mediaType - 'image' or 'video'
   * @param caption - Optional caption
   */
  async saveChatMediaToMemory(
    mediaUrl: string,
    mediaType: 'image' | 'video',
    caption?: string
  ): Promise<boolean> {
    // Check if in relationship context (not pre-match)
    if (!this.currentRelationshipId) {
      runInAction(() => {
        this.errorMessage = 'Save to Memories is only available after formal adoption.';
      });
      return false;
    }

    if (!this.currentUser) {
      runInAction(() => {
        this.errorMessage = 'User not logged in.';
      });
      return false;
    }

    try {
      // Map 'image' to 'photo' for service
      const serviceMediaType = mediaType === 'image' ? 'photo' : 'video';

      await familyService.saveChatMediaToMemory(
        this.currentUser,
        this.currentRelationshipId,
        mediaUrl,
        serviceMediaType,
        caption
      );

      console.log('[CommunicationViewModel] Chat media saved to memories successfully');
      return true;
    } catch (error) {
      runInAction(() => {
        this.errorMessage = error instanceof Error ? error.message : 'Failed to save to memories';
      });
      return false;
    }
  }

  // =============================================================
  // Rejection Confirmation (Youth confirms elderly rejection)
  // =============================================================

  /**
   * Youth confirms rejection and deletes the application/chat
   * Called after youth sees rejection notification
   */
  async confirmRejectionAndDeleteChat(applicationId: string): Promise<boolean> {
    if (!this.currentUser) {
      this.errorMessage = 'User not logged in';
      return false;
    }

    this.isLoading = true;
    try {
      // Import matchingService dynamically to avoid circular dependency
      const { matchingService } = await import('../../Model/Service/CoreService/matchingService');

      await matchingService.confirmAndDeleteRejectedApplication(applicationId, this.currentUser);

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
        this.errorMessage = error instanceof Error ? error.message : 'Failed to delete chat';
        this.isLoading = false;
      });
      return false;
    }
  }

  // =============================================================
  // Voice Message Methods (for View layer hooks)
  // =============================================================

  /**
   * Upload voice message to storage
   * Called by View layer hooks after reading file to base64
   * 
   * @param base64Data - Base64-encoded audio data
   * @param context - Chat context (preMatch or relationship)
   * @param senderId - Current user ID
   * @param durationSeconds - Optional duration
   * @returns Public URL of uploaded file
   */
  async uploadVoiceMessage(
    base64Data: string,
    context: ChatContext,
    senderId: string,
    durationSeconds?: number
  ): Promise<string> {
    return voiceUploadService.uploadVoiceMessage(base64Data, context, senderId, durationSeconds);
  }

  /**
   * Delete voice message from storage
   * @param mediaUrl - Public URL of the voice message to delete
   */
  async deleteVoiceMessage(mediaUrl: string): Promise<void> {
    return voiceUploadService.deleteVoiceMessage(mediaUrl);
  }

  /**
   * Transcribe audio to text
   * Called by View layer hooks after reading file to base64
   * 
   * @param base64Audio - Base64-encoded audio data
   * @returns Transcription result with text
   */
  async transcribeAudio(base64Audio: string): Promise<TranscriptionResult> {
    return voiceTranscriptionService.transcribeDiary(base64Audio);
  }
}

// Singleton instance
export const communicationViewModel = new CommunicationViewModel();


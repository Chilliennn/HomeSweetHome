import type { ModerationResult } from '../../types';

/**
 * IModerationService - Interface for message content moderation
 * 
 * This interface allows multiple implementations:
 * - Phase 1: Keyword-based moderation (KeywordModerationService)
 * - Phase 2: AI-powered moderation (AIModerationService) - TODO
 * 
 * Extension point for teammates to implement AI moderation
 */
export interface IModerationService {
  /**
   * Analyze message content before sending
   * @param message - Message content
   * @param senderId - User sending message
   * @param receiverId - User receiving message
   * @param sessionId - Chat session ID (application_id or relationship_id)
   * @returns Moderation decision
   */
  moderateMessage(
    message: string,
    senderId: string,
    receiverId: string,
    sessionId: string
  ): Promise<ModerationResult>;

  /**
   * Analyze voice/media content
   * @param mediaUrl - URL to media file
   * @param mediaType - 'voice' | 'image' | 'video'
   * @param senderId - User sending media
   * @returns Moderation decision
   */
  moderateMedia(
    mediaUrl: string,
    mediaType: 'voice' | 'image' | 'video',
    senderId: string
  ): Promise<ModerationResult>;
}

/**
 * KeywordModerationService - Basic keyword-based content moderation
 * 
 * Phase 1 implementation using keyword matching
 * Detects financial requests, inappropriate content, etc.
 * 
 * TODO Phase 2: Replace with AI-based sentiment analysis and context understanding
 */
export class KeywordModerationService implements IModerationService {
  private readonly BLOCKED_KEYWORDS = [
    'bank account',
    'send money',
    'wire transfer',
    'western union',
    'paypal',
    'password',
    'credit card',
    'debit card',
    'pin number',
    'social security',
    'account number',
    'routing number',
    'atm card',
  ];

  private readonly WARNING_KEYWORDS = [
    'loan',
    'borrow',
    'invest',
    'urgent',
    'emergency money',
    'financial help',
    'need cash',
    'send',
    'transfer',
  ];

  /**
   * Moderate text message content
   * Checks for blocked and warning keywords
   */
  async moderateMessage(
    message: string,
    senderId: string,
    receiverId: string,
    sessionId: string
  ): Promise<ModerationResult> {
    const lowerMessage = message.toLowerCase();

    // Check blocked keywords (high severity - block message)
    for (const keyword of this.BLOCKED_KEYWORDS) {
      if (lowerMessage.includes(keyword)) {
        return {
          isAllowed: false,
          severity: 'blocked',
          reason: `Message contains prohibited content. Please do not share sensitive financial information.`,
          detectedIssues: ['financial_request', keyword],
          suggestedAction: 'block_message',
          adminNotificationRequired: true,
        };
      }
    }

    // Check warning keywords (medium severity - allow but warn)
    const detectedWarnings: string[] = [];
    for (const keyword of this.WARNING_KEYWORDS) {
      if (lowerMessage.includes(keyword)) {
        detectedWarnings.push(keyword);
      }
    }

    if (detectedWarnings.length > 0) {
      return {
        isAllowed: true,
        severity: 'warning',
        reason: `Please be careful when discussing financial matters. Never share personal financial information.`,
        detectedIssues: ['potential_financial_request', ...detectedWarnings],
        suggestedAction: 'warn_user',
        adminNotificationRequired: false,
      };
    }

    // No issues detected
    return {
      isAllowed: true,
      severity: 'safe',
      suggestedAction: 'allow',
      adminNotificationRequired: false,
    };
  }

  /**
   * Moderate media content
   * Phase 1: No media moderation implemented
   * Phase 2 TODO: Integrate with AI vision/audio analysis service
   */
  async moderateMedia(
    mediaUrl: string,
    mediaType: 'voice' | 'image' | 'video',
    senderId: string
  ): Promise<ModerationResult> {
    // Phase 1: Allow all media (no moderation)
    // Phase 2 TODO: Call AI service to analyze image/video content
    // Example: Azure Content Safety, Google Cloud Vision API, etc.
    return {
      isAllowed: true,
      severity: 'safe',
      suggestedAction: 'allow',
      adminNotificationRequired: false,
    };
  }
}

/**
 * AIModerationService - AI-powered content moderation (Phase 2)
 * 
 * Placeholder implementation for teammate integration
 * 
 * To implement:
 * 1. Install AI moderation SDK (e.g., OpenAI Moderation API, Azure Content Safety)
 * 2. Create API client
 * 3. Implement moderateMessage() to call AI API
 * 4. Implement moderateMedia() for vision/audio analysis
 * 5. Map AI response to ModerationResult format
 * 6. Switch export below to use AIModerationService
 * 
 * Example integration:
 * ```
 * import { OpenAI } from 'openai';
 * 
 * export class AIModerationService implements IModerationService {
 *   private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 *   
 *   async moderateMessage(message: string, ...): Promise<ModerationResult> {
 *     const response = await this.client.moderations.create({
 *       input: message,
 *     });
 *     
 *     const result = response.results[0];
 *     
 *     if (result.flagged) {
 *       return {
 *         isAllowed: false,
 *         severity: 'blocked',
 *         reason: 'AI detected inappropriate content',
 *         detectedIssues: Object.keys(result.categories).filter(k => result.categories[k]),
 *         suggestedAction: 'block_message',
 *         adminNotificationRequired: true,
 *       };
 *     }
 *     
 *     return { isAllowed: true, severity: 'safe', suggestedAction: 'allow', adminNotificationRequired: false };
 *   }
 * }
 * ```
 */
export class AIModerationService implements IModerationService {
  async moderateMessage(
    message: string,
    senderId: string,
    receiverId: string,
    sessionId: string
  ): Promise<ModerationResult> {
    // TODO: Implement AI moderation
    // Teammates can integrate OpenAI Moderation API, Azure Content Safety, etc.
    throw new Error('AI moderation not implemented yet. Use KeywordModerationService for Phase 1.');
  }

  async moderateMedia(
    mediaUrl: string,
    mediaType: 'voice' | 'image' | 'video',
    senderId: string
  ): Promise<ModerationResult> {
    // TODO: Implement AI media moderation
    // Teammates can integrate Azure Computer Vision, Google Cloud Vision, etc.
    throw new Error('AI media moderation not implemented yet.');
  }
}

// Create instance first
const keywordService = new KeywordModerationService();

// Export singleton instance with voice message moderation placeholder
// Phase 1: Use keyword-based moderation
export const moderationService = {
  // Forward IModerationService methods
  moderateMessage: keywordService.moderateMessage.bind(keywordService),
  moderateMedia: keywordService.moderateMedia.bind(keywordService),

  /**
   * Placeholder for voice message moderation
   * Called after a voice message is successfully created/sent
   * 
   * Teammate TODO: Implement voice message moderation
   * Options:
   * 1. Speech-to-text (STT) + keyword analysis
   * 2. Audio content analysis (tone, sentiment)
   * 3. Third-party moderation API (Azure, AWS Transcribe, etc.)
   * 
   * @param message - The voice message that was just sent
   */
  handleVoiceMessageCreated(message: any): void {
    console.log('[ModerationService] Voice message created - moderation placeholder', {
      messageId: message.id,
      senderId: message.sender_id,
      receiverId: message.receiver_id,
      mediaUrl: message.media_url,
    });
    // TODO: Implement voice message moderation
    // This is a placeholder for teammate integration
  },
};

// Phase 2 TODO: Switch to AI moderation when ready
// export const moderationService: IModerationService = new AIModerationService();

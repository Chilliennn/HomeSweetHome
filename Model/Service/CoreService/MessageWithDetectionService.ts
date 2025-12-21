// Model/Service/CoreService/MessageWithDetectionService.ts

import { messageRepository } from '../../Repository/UserRepository/messageRepository';
import { KeywordDetectionService, type DetectionResult } from './KeywordDetectionService';
import { KeywordDetectionRepository } from '../../Repository/AdminRepository/KeywordDetectionRepository';
import { KeywordRepository } from '../../Repository/AdminRepository/KeywordRepository';
import { supabase } from '../APIService/supabase';
import type { Message, MessageType } from '../../types';

/**
 * MessageWithDetectionService - Wraps message sending with keyword detection
 * 
 * This service layer sits between the ViewModel and Repository,
 * adding keyword detection to the message flow without modifying the repository
 */
export class MessageWithDetectionService {
    private detectionService: KeywordDetectionService;

    constructor() {
        const detectionRepo = new KeywordDetectionRepository(supabase);
        const keywordRepo = new KeywordRepository(supabase);
        this.detectionService = new KeywordDetectionService(detectionRepo, keywordRepo);
    }

    /**
     * Send a message and scan it for keywords
     */
    async sendMessageWithDetection(params: {
        senderId: string;
        receiverId: string;
        applicationId?: string;
        relationshipId?: string;
        messageType: MessageType;
        content?: string;
        mediaUrl?: string;
        callDurationMinutes?: number;
    }): Promise<{ message: Message; detections: DetectionResult }> {
        // Send message using existing repository
        const message = await messageRepository.sendMessage(params);

        // Scan for keywords if it's a text message
        let detections: DetectionResult = { detected: false, matches: [] };
        if (params.content && params.content.trim().length > 0) {
            try {
                detections = await this.detectionService.scanMessage(message.id, params.content);

                // Log critical detections
                if (detections.detected && detections.matches.length > 0) {
                    console.log(`[MessageWithDetectionService] Detected ${detections.matches.length} keyword(s) in message ${message.id}`);

                    // Check for critical keywords
                    const criticalMatches = detections.matches.filter(m => m.keyword.severity === 'critical');
                    if (criticalMatches.length > 0) {
                        console.warn(`[MessageWithDetectionService] CRITICAL: ${criticalMatches.length} critical keyword(s) detected!`);
                        // TODO: Trigger admin notification
                    }
                }
            } catch (error) {
                console.error('[MessageWithDetectionService] Error scanning message:', error);
                // Don't fail message sending if detection fails
            }
        }

        return { message, detections };
    }

    /**
     * Get detection statistics
     */
    async getDetectionStats() {
        return await this.detectionService.getDetectionStats();
    }

    /**
     * Get detections for today
     */
    async getDetectionsToday() {
        return await this.detectionService.getDetectionsToday();
    }
}

// Singleton instance
export const messageWithDetectionService = new MessageWithDetectionService();

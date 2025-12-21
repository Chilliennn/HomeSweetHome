// Model/Service/CoreService/KeywordDetectionService.ts

import { KeywordDetectionRepository } from '../../Repository/AdminRepository/KeywordDetectionRepository';
import { KeywordRepository, type KeywordRecord } from '../../Repository/AdminRepository/KeywordRepository';

export interface DetectionResult {
    detected: boolean;
    matches: Array<{
        keyword: KeywordRecord;
        context: string;
    }>;
}

/**
 * KeywordDetectionService - Business logic for keyword detection
 * 
 * Scans messages for dangerous keywords and logs detections
 */
export class KeywordDetectionService {
    constructor(
        private detectionRepo: KeywordDetectionRepository,
        private keywordRepo: KeywordRepository
    ) { }

    /**
     * Scan a message for keywords
     * Returns all detected keywords with context
     */
    async scanMessage(messageId: string, content: string): Promise<DetectionResult> {
        if (!content || content.trim().length === 0) {
            return { detected: false, matches: [] };
        }

        // Get all active keywords
        const keywords = await this.keywordRepo.fetchKeywords();

        const matches: Array<{ keyword: KeywordRecord; context: string }> = [];
        const contentLower = content.toLowerCase();

        // Check each keyword
        for (const keyword of keywords) {
            const keywordLower = keyword.keyword.toLowerCase();

            // Check if keyword exists in message (case-insensitive)
            if (contentLower.includes(keywordLower)) {
                // Extract context (30 chars before and after)
                const index = contentLower.indexOf(keywordLower);
                const start = Math.max(0, index - 30);
                const end = Math.min(content.length, index + keywordLower.length + 30);
                const context = content.substring(start, end);

                matches.push({
                    keyword,
                    context: start > 0 ? '...' + context : context
                });

                // Log detection to database
                try {
                    await this.detectionRepo.logDetection(
                        keyword.id,
                        messageId,
                        context
                    );
                } catch (error) {
                    console.error('[KeywordDetectionService] Error logging detection:', error);
                }
            }
        }

        return {
            detected: matches.length > 0,
            matches
        };
    }

    /**
     * Get detection statistics for dashboard
     */
    async getDetectionStats() {
        return await this.detectionRepo.getDetectionStats();
    }

    /**
     * Get detections count for today
     */
    async getDetectionsToday(): Promise<number> {
        return await this.detectionRepo.getDetectionsToday();
    }

    /**
     * Get detection history for a specific keyword
     */
    async getKeywordDetectionHistory(keywordId: string) {
        return await this.detectionRepo.getDetectionsByKeyword(keywordId);
    }

    /**
     * Get recent detections with details
     */
    async getRecentDetections(limit: number = 50) {
        return await this.detectionRepo.getRecentDetections(limit);
    }
}

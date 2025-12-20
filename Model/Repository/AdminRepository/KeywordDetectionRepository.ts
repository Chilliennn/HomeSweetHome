// Model/Repository/AdminRepository/KeywordDetectionRepository.ts

import { supabase } from '../../Service/APIService/supabase';

export interface KeywordDetection {
    id: string;
    keyword_id: string;
    message_id: string;
    detected_at: string;
    context: string | null;
}

export interface DetectionStats {
    total: number;
    today: number;
    thisWeek: number;
    byKeyword: Record<string, number>;
}

/**
 * KeywordDetectionRepository - Database access for keyword detections
 * 
 * Handles CRUD operations for keyword_detections table
 */
export class KeywordDetectionRepository {
    constructor(private db: typeof supabase) { }

    /**
     * Log a keyword detection
     */
    async logDetection(
        keywordId: string,
        messageId: string,
        context: string
    ): Promise<KeywordDetection> {
        const { data, error } = await this.db
            .from('keyword_detections')
            .insert({
                keyword_id: keywordId,
                message_id: messageId,
                context: context,
                detected_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get detections count for today
     */
    async getDetectionsToday(): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error } = await this.db
            .from('keyword_detections')
            .select('*', { count: 'exact', head: true })
            .gte('detected_at', today.toISOString());

        if (error) throw error;
        return count || 0;
    }

    /**
     * Get detections for a specific keyword
     */
    async getDetectionsByKeyword(keywordId: string): Promise<KeywordDetection[]> {
        const { data, error } = await this.db
            .from('keyword_detections')
            .select('*')
            .eq('keyword_id', keywordId)
            .order('detected_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Get detection statistics
     */
    async getDetectionStats(): Promise<DetectionStats> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Get all detections
        const { data: allDetections, error: allError } = await this.db
            .from('keyword_detections')
            .select('keyword_id, detected_at');

        if (allError) throw allError;

        // Calculate stats
        const total = allDetections?.length || 0;
        const todayCount = allDetections?.filter(d =>
            new Date(d.detected_at) >= today
        ).length || 0;
        const weekCount = allDetections?.filter(d =>
            new Date(d.detected_at) >= weekAgo
        ).length || 0;

        // Count by keyword
        const byKeyword: Record<string, number> = {};
        allDetections?.forEach(d => {
            byKeyword[d.keyword_id] = (byKeyword[d.keyword_id] || 0) + 1;
        });

        return {
            total,
            today: todayCount,
            thisWeek: weekCount,
            byKeyword
        };
    }

    /**
     * Get recent detections with keyword and message details
     */
    async getRecentDetections(limit: number = 50): Promise<any[]> {
        const { data, error } = await this.db
            .from('keyword_detections')
            .select(`
                *,
                keywords (keyword, severity, category),
                messages (content, sender_id, sent_at)
            `)
            .order('detected_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    }
}

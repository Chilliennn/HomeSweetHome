// Model/Repository/AdminRepository/SentimentAnalyticsRepository.ts

import { SupabaseClient } from '@supabase/supabase-js';

export interface Message {
    id: string;
    content: string;
    sender_id: string;
    receiver_id: string;
    sent_at: string;
    message_type: 'text' | 'voice';
}

export interface DateRange {
    start: Date;
    end: Date;
}

export class SentimentAnalyticsRepository {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    /**
     * Fetch all messages for a relationship within a date range
     */
    async fetchRelationshipMessages(
        youthId: string,
        elderlyId: string,
        dateRange: DateRange
    ): Promise<Message[]> {
        try {
            // Fetch messages in both directions separately and merge
            const [fromYouthToElderly, fromElderlyToYouth] = await Promise.all([
                this.supabase
                    .from('messages')
                    .select('*')
                    .eq('sender_id', youthId)
                    .eq('receiver_id', elderlyId)
                    .gte('sent_at', dateRange.start.toISOString())
                    .lte('sent_at', dateRange.end.toISOString())
                    .eq('message_type', 'text')
                    .order('sent_at', { ascending: false }),
                this.supabase
                    .from('messages')
                    .select('*')
                    .eq('sender_id', elderlyId)
                    .eq('receiver_id', youthId)
                    .gte('sent_at', dateRange.start.toISOString())
                    .lte('sent_at', dateRange.end.toISOString())
                    .eq('message_type', 'text')
                    .order('sent_at', { ascending: false })
            ]);

            if (fromYouthToElderly.error) {
                console.error('[SentimentAnalyticsRepository] Error fetching messages (youth->elderly):', fromYouthToElderly.error);
                return [];
            }

            if (fromElderlyToYouth.error) {
                console.error('[SentimentAnalyticsRepository] Error fetching messages (elderly->youth):', fromElderlyToYouth.error);
                return [];
            }

            // Merge and sort by date
            const allMessages = [
                ...(fromYouthToElderly.data || []),
                ...(fromElderlyToYouth.data || [])
            ].sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());

            return allMessages;
        } catch (error) {
            console.error('[SentimentAnalyticsRepository] Unexpected error fetching messages:', error);
            return [];
        }
    }

    /**
     * Count video calls for a relationship
     */
    async countVideoCalls(
        relationshipId: string,
        dateRange: DateRange
    ): Promise<number> {
        const { count, error } = await this.supabase
            .from('calendar_events')
            .select('*', { count: 'exact', head: true })
            .eq('relationship_id', relationshipId)
            .eq('event_type', 'video_call')
            .gte('event_date', dateRange.start.toISOString())
            .lte('event_date', dateRange.end.toISOString());

        if (error) {
            console.error('[SentimentAnalyticsRepository] Error counting video calls:', error);
            return 0;
        }

        return count || 0;
    }

    /**
     * Count in-person visits for a relationship
     */
    async countInPersonVisits(
        relationshipId: string,
        dateRange: DateRange
    ): Promise<number> {
        const { count, error } = await this.supabase
            .from('calendar_events')
            .select('*', { count: 'exact', head: true })
            .eq('relationship_id', relationshipId)
            .eq('event_type', 'in_person_meeting')
            .gte('event_date', dateRange.start.toISOString())
            .lte('event_date', dateRange.end.toISOString());

        if (error) {
            console.error('[SentimentAnalyticsRepository] Error counting in-person visits:', error);
            return 0;
        }

        return count || 0;
    }

    /**
     * Calculate month-over-month change in message count
     */
    async calculateMonthlyChange(
        youthId: string,
        elderlyId: string
    ): Promise<number> {
        const now = new Date();

        // Current period (last 30 days)
        const currentEnd = new Date(now);
        const currentStart = new Date(now);
        currentStart.setDate(currentStart.getDate() - 30);

        // Previous period (30-60 days ago)
        const previousEnd = new Date(currentStart);
        const previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 30);

        const [currentMessages, previousMessages] = await Promise.all([
            this.fetchRelationshipMessages(youthId, elderlyId, {
                start: currentStart,
                end: currentEnd
            }),
            this.fetchRelationshipMessages(youthId, elderlyId, {
                start: previousStart,
                end: previousEnd
            })
        ]);

        const currentCount = currentMessages.length;
        const previousCount = previousMessages.length;

        if (previousCount === 0) {
            return currentCount > 0 ? 100 : 0;
        }

        const change = ((currentCount - previousCount) / previousCount) * 100;
        return Math.round(change);
    }

    /**
     * Fetch messages with timestamps for timeline visualization
     */
    async fetchMessagesWithTimestamps(
        youthId: string,
        elderlyId: string,
        dateRange: DateRange
    ): Promise<Message[]> {
        return this.fetchRelationshipMessages(youthId, elderlyId, dateRange);
    }

    /**
     * Detect communication gaps (7+ days with no contact)
     */
    async detectCommunicationGaps(
        youthId: string,
        elderlyId: string,
        dateRange: DateRange
    ): Promise<{ startDate: string; endDate: string; days: number }[]> {
        const messages = await this.fetchRelationshipMessages(youthId, elderlyId, dateRange);

        if (messages.length === 0) return [];

        const gaps: { startDate: string; endDate: string; days: number }[] = [];
        const sortedMessages = messages.sort((a, b) =>
            new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
        );

        for (let i = 0; i < sortedMessages.length - 1; i++) {
            const current = new Date(sortedMessages[i].sent_at);
            const next = new Date(sortedMessages[i + 1].sent_at);
            const daysDiff = Math.floor((next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff >= 7) {
                gaps.push({
                    startDate: sortedMessages[i].sent_at,
                    endDate: sortedMessages[i + 1].sent_at,
                    days: daysDiff
                });
            }
        }

        return gaps;
    }

    /**
     * Get stage progression history for a relationship
     */
    async getStageProgression(relationshipId: string): Promise<{
        stage: string;
        startDate: string;
        duration: number;
    }[]> {
        // Note: This is a simplified version. In reality, you'd need a stage_history table
        // For now, return current stage only
        const { data, error } = await this.supabase
            .from('relationships')
            .select('current_stage, stage_start_date, created_at')
            .eq('id', relationshipId)
            .single();

        if (error || !data) {
            console.error('[SentimentAnalyticsRepository] Error fetching stage progression:', error);
            return [];
        }

        const startDate = new Date(data.stage_start_date);
        const now = new Date();
        const duration = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        return [{
            stage: data.current_stage,
            startDate: data.stage_start_date,
            duration
        }];
    }
}

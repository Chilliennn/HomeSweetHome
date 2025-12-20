// Model/Service/CoreService/SentimentAnalysisService.ts

import type { SentimentAnalyticsRepository, Message, DateRange } from '../../Repository/AdminRepository/SentimentAnalyticsRepository';

export interface SentimentDistribution {
    positive: number;
    neutral: number;
    negative: number;
}

export interface SentimentStats {
    messageCount: number;
    videoCallCount: number;
    inPersonVisitCount: number;
    monthlyChange: number;
    sentimentDistribution: SentimentDistribution;
}

export class SentimentAnalysisService {
    private repository: SentimentAnalyticsRepository;

    constructor(repository: SentimentAnalyticsRepository) {
        this.repository = repository;
    }

    /**
     * Analyze a single message's sentiment
     */
    analyzeMessageSentiment(content: string): 'positive' | 'neutral' | 'negative' {
        const lowerContent = content.toLowerCase();

        // Positive indicators
        const positiveWords = [
            'happy', 'love', 'great', 'wonderful', 'thank', 'good', 'nice', 'amazing',
            'excellent', 'beautiful', 'perfect', 'enjoy', 'glad', 'appreciate', 'blessed',
            'excited', 'fantastic', 'awesome', 'appreciate', 'grateful', 'care', 'miss you',
            '😊', '❤️', '👍', '🥰', '😍', '💕', '💖', '🙏', '✨'
        ];

        // Negative indicators
        const negativeWords = [
            'sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'disappointed', 'upset',
            'worry', 'worried', 'problem', 'issue', 'difficult', 'hard', 'struggling',
            'lonely', 'alone', 'scared', 'afraid', 'hurt', 'pain', 'sick', 'tired',
            '😢', '😡', '👎', '😞', '😔', '💔', '😭', '😤'
        ];

        let score = 0;

        // Count positive matches
        positiveWords.forEach(word => {
            if (lowerContent.includes(word)) {
                score += 1;
            }
        });

        // Count negative matches
        negativeWords.forEach(word => {
            if (lowerContent.includes(word)) {
                score -= 1;
            }
        });

        // Determine sentiment
        if (score > 0) return 'positive';
        if (score < 0) return 'negative';
        return 'neutral';
    }

    /**
     * Calculate sentiment distribution for all messages
     */
    async calculateSentimentDistribution(
        youthId: string,
        elderlyId: string,
        dateRange: DateRange
    ): Promise<SentimentDistribution> {
        const messages = await this.repository.fetchRelationshipMessages(
            youthId,
            elderlyId,
            dateRange
        );

        if (messages.length === 0) {
            return { positive: 0, neutral: 0, negative: 0 };
        }

        let positiveCount = 0;
        let neutralCount = 0;
        let negativeCount = 0;

        messages.forEach(message => {
            const sentiment = this.analyzeMessageSentiment(message.content || '');
            if (sentiment === 'positive') positiveCount++;
            else if (sentiment === 'neutral') neutralCount++;
            else negativeCount++;
        });

        const total = messages.length;

        return {
            positive: Math.round((positiveCount / total) * 100),
            neutral: Math.round((neutralCount / total) * 100),
            negative: Math.round((negativeCount / total) * 100)
        };
    }

    /**
     * Get message count for a relationship
     */
    async getMessageCount(
        youthId: string,
        elderlyId: string,
        dateRange: DateRange
    ): Promise<number> {
        const messages = await this.repository.fetchRelationshipMessages(
            youthId,
            elderlyId,
            dateRange
        );
        return messages.length;
    }

    /**
     * Get video call count
     */
    async getVideoCallCount(
        relationshipId: string,
        dateRange: DateRange
    ): Promise<number> {
        return this.repository.countVideoCalls(relationshipId, dateRange);
    }

    /**
     * Get in-person visit count
     */
    async getInPersonVisitCount(
        relationshipId: string,
        dateRange: DateRange
    ): Promise<number> {
        return this.repository.countInPersonVisits(relationshipId, dateRange);
    }

    /**
     * Get monthly change percentage
     */
    async getMonthlyChange(
        youthId: string,
        elderlyId: string
    ): Promise<number> {
        return this.repository.calculateMonthlyChange(youthId, elderlyId);
    }

    /**
     * Generate AI insight based on communication patterns
     */
    generateInsight(stats: SentimentStats): string {
        const { messageCount, videoCallCount, inPersonVisitCount, monthlyChange, sentimentDistribution } = stats;

        // Analyze engagement level
        let engagementLevel = 'moderate';
        const totalInteractions = messageCount + videoCallCount + inPersonVisitCount;
        if (totalInteractions < 10) engagementLevel = 'low';
        else if (totalInteractions > 30) engagementLevel = 'high';

        // Analyze sentiment trend
        let sentimentTrend = 'balanced';
        if (sentimentDistribution.positive > 50) sentimentTrend = 'positive';
        else if (sentimentDistribution.negative > 30) sentimentTrend = 'concerning';

        // Analyze change trend
        let changeTrend = 'stable';
        if (monthlyChange > 20) changeTrend = 'increasing';
        else if (monthlyChange < -20) changeTrend = 'declining';

        // Generate insight message
        let insight = `Communication patterns show ${changeTrend} frequency over the past month (${monthlyChange >= 0 ? '+' : ''}${monthlyChange}%). `;

        if (sentimentTrend === 'concerning') {
            insight += `Sentiment analysis indicates increased negative tones (${sentimentDistribution.negative}%) in recent exchanges. `;
        } else if (sentimentTrend === 'positive') {
            insight += `Sentiment analysis shows predominantly positive tones (${sentimentDistribution.positive}%) in conversations. `;
        } else {
            insight += `Sentiment analysis shows balanced emotional tones with ${sentimentDistribution.positive}% positive and ${sentimentDistribution.neutral}% neutral messages. `;
        }

        // Add actionable recommendations
        if (changeTrend === 'declining' && sentimentTrend === 'concerning') {
            insight += 'Recommended intervention: Schedule a check-in call to address potential relationship concerns.';
        } else if (engagementLevel === 'low') {
            insight += 'Consider encouraging more frequent interactions to strengthen the relationship bond.';
        } else if (sentimentTrend === 'positive' && engagementLevel === 'high') {
            insight += 'Relationship shows healthy engagement and positive communication patterns.';
        } else {
            insight += 'Continue monitoring communication patterns for any changes in frequency or tone.';
        }

        return insight;
    }

    /**
     * Get complete analytics for a relationship
     */
    async getCompleteAnalytics(
        relationshipId: string,
        youthId: string,
        elderlyId: string
    ): Promise<SentimentStats> {
        // Last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const dateRange: DateRange = { start: startDate, end: endDate };

        const [messageCount, videoCallCount, inPersonVisitCount, monthlyChange, sentimentDistribution] =
            await Promise.all([
                this.getMessageCount(youthId, elderlyId, dateRange),
                this.getVideoCallCount(relationshipId, dateRange),
                this.getInPersonVisitCount(relationshipId, dateRange),
                this.getMonthlyChange(youthId, elderlyId),
                this.calculateSentimentDistribution(youthId, elderlyId, dateRange)
            ]);

        return {
            messageCount,
            videoCallCount,
            inPersonVisitCount,
            monthlyChange,
            sentimentDistribution
        };
    }

    /**
     * Generate timeline data for chart visualization
     */
    async generateTimelineData(
        youthId: string,
        elderlyId: string,
        relationshipId: string,
        dateRange: DateRange
    ): Promise<{ date: string; messages: number; calls: number; visits: number }[]> {
        const messages = await this.repository.fetchMessagesWithTimestamps(youthId, elderlyId, dateRange);

        // Group by date
        const dateMap = new Map<string, { messages: number; calls: number; visits: number }>();

        messages.forEach(msg => {
            const date = new Date(msg.sent_at).toISOString().split('T')[0];
            if (!dateMap.has(date)) {
                dateMap.set(date, { messages: 0, calls: 0, visits: 0 });
            }
            dateMap.get(date)!.messages++;
        });

        // Convert to array and sort by date
        return Array.from(dateMap.entries())
            .map(([date, counts]) => ({ date, ...counts }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    /**
     * Generate frequency data (daily/weekly/monthly buckets)
     */
    async generateFrequencyData(
        youthId: string,
        elderlyId: string,
        dateRange: DateRange,
        bucket: 'daily' | 'weekly' | 'monthly' = 'daily'
    ): Promise<{ label: string; count: number }[]> {
        const messages = await this.repository.fetchMessagesWithTimestamps(youthId, elderlyId, dateRange);

        const bucketMap = new Map<string, number>();

        messages.forEach(msg => {
            const date = new Date(msg.sent_at);
            let key: string;

            if (bucket === 'daily') {
                key = date.toISOString().split('T')[0];
            } else if (bucket === 'weekly') {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
            } else {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }

            bucketMap.set(key, (bucketMap.get(key) || 0) + 1);
        });

        return Array.from(bucketMap.entries())
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }

    /**
     * Calculate average response time between messages
     */
    async calculateAverageResponseTime(
        youthId: string,
        elderlyId: string,
        dateRange: DateRange
    ): Promise<number> {
        const messages = await this.repository.fetchMessagesWithTimestamps(youthId, elderlyId, dateRange);

        if (messages.length < 2) return 0;

        const sortedMessages = messages.sort((a, b) =>
            new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
        );

        let totalResponseTime = 0;
        let responseCount = 0;

        for (let i = 0; i < sortedMessages.length - 1; i++) {
            const current = sortedMessages[i];
            const next = sortedMessages[i + 1];

            // Only count if sender changes (indicating a response)
            if (current.sender_id !== next.sender_id) {
                const timeDiff = new Date(next.sent_at).getTime() - new Date(current.sent_at).getTime();
                totalResponseTime += timeDiff;
                responseCount++;
            }
        }

        if (responseCount === 0) return 0;

        // Return average in hours
        return Math.round(totalResponseTime / responseCount / (1000 * 60 * 60));
    }

    /**
     * Get communication gaps (7+ days)
     */
    async getCommunicationGaps(
        youthId: string,
        elderlyId: string,
        dateRange: DateRange
    ): Promise<{ startDate: string; endDate: string; days: number }[]> {
        return this.repository.detectCommunicationGaps(youthId, elderlyId, dateRange);
    }

    /**
     * Get stage progression
     */
    async getStageProgression(relationshipId: string): Promise<{
        stage: string;
        startDate: string;
        duration: number;
    }[]> {
        return this.repository.getStageProgression(relationshipId);
    }
}

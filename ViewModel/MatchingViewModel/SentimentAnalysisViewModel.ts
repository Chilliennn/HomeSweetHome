import { makeAutoObservable } from 'mobx';

export interface TimelineDataPoint {
    date: string;
    messages: number;
}

export interface FrequencyDataPoint {
    label: string;
    count: number;
}

export interface CommunicationGap {
    days: number;
    startDate: string;
    endDate: string;
}

export interface StageProgression {
    stage: string;
    duration: number;
    startDate: string;
}

/**
 * SentimentAnalysisViewModel - Handles sentiment and communication analytics for relationships
 * This is a stub implementation for the RelationshipsScreen
 */
export class SentimentAnalysisViewModel {
    isLoading: boolean = false;
    errorMessage: string | null = null;

    // Interaction stats
    messageCount: number = 0;
    videoCallCount: number = 0;
    inPersonVisitCount: number = 0;
    monthlyChange: number = 0;

    // Sentiment
    sentimentDistribution = {
        positive: 60,
        neutral: 30,
        negative: 10
    };

    aiInsight: string = 'Communication patterns appear healthy with consistent engagement.';

    // Frequency data
    frequencyView: 'daily' | 'weekly' | 'monthly' = 'weekly';
    timelineData: TimelineDataPoint[] = [];
    frequencyData: FrequencyDataPoint[] = [];

    // Communication analysis
    averageResponseTime: number = 0;
    communicationGaps: CommunicationGap[] = [];
    stageProgression: StageProgression[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    async loadAnalytics(relationshipId: string, youthId: string, elderlyId: string): Promise<void> {
        this.isLoading = true;
        this.errorMessage = null;

        try {
            // Stub: In real implementation, fetch from supabase
            console.log(`[SentimentAnalysisVM] Loading analytics for relationship: ${relationshipId}`);

            // Mock data
            this.messageCount = 42;
            this.videoCallCount = 5;
            this.inPersonVisitCount = 2;
            this.monthlyChange = 15;

            this.timelineData = [
                { date: '2025-12-15', messages: 5 },
                { date: '2025-12-16', messages: 8 },
                { date: '2025-12-17', messages: 3 },
                { date: '2025-12-18', messages: 12 },
                { date: '2025-12-19', messages: 7 },
                { date: '2025-12-20', messages: 4 },
                { date: '2025-12-21', messages: 3 }
            ];

            this.frequencyData = [
                { label: 'Mon', count: 8 },
                { label: 'Tue', count: 12 },
                { label: 'Wed', count: 5 },
                { label: 'Thu', count: 10 },
                { label: 'Fri', count: 7 },
                { label: 'Sat', count: 3 },
                { label: 'Sun', count: 4 }
            ];

            this.stageProgression = [
                { stage: 'getting_to_know', duration: 14, startDate: '2025-12-01' }
            ];

            this.averageResponseTime = 2;

        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to load analytics';
            console.error('[SentimentAnalysisVM] Error:', error);
        } finally {
            this.isLoading = false;
        }
    }

    setFrequencyView(view: 'daily' | 'weekly' | 'monthly', relationshipId: string, youthId: string, elderlyId: string): void {
        this.frequencyView = view;
        // Could reload data based on view
    }
}

// Singleton instance
export const sentimentAnalysisViewModel = new SentimentAnalysisViewModel();

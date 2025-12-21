// ViewModel/AdminViewModel/SentimentAnalysisViewModel.ts

import { makeObservable, observable, action, runInAction } from 'mobx';
import { SentimentAnalysisService } from '@home-sweet-home/model';
import { SentimentAnalyticsRepository } from '@home-sweet-home/model';
import { supabase } from '@home-sweet-home/model';
import type { SentimentDistribution, SentimentStats } from '@home-sweet-home/model';

export class AdminSentimentAnalysisViewModel {
    // Loading and error states
    isLoading = true;
    errorMessage: string | null = null;

    // Interaction statistics
    messageCount = 0;
    videoCallCount = 0;
    inPersonVisitCount = 0;
    monthlyChange = 0;

    // Sentiment data
    sentimentDistribution: SentimentDistribution = {
        positive: 0,
        neutral: 0,
        negative: 0
    };

    // AI-generated insight
    aiInsight = '';

    // Timeline and frequency data
    timelineData: { date: string; messages: number; calls: number; visits: number }[] = [];
    frequencyData: { label: string; count: number }[] = [];
    frequencyView: 'daily' | 'weekly' | 'monthly' = 'daily';

    // Response time and gaps
    averageResponseTime = 0; // in hours
    communicationGaps: { startDate: string; endDate: string; days: number }[] = [];

    // Stage progression
    stageProgression: { stage: string; startDate: string; duration: number }[] = [];

    private service: SentimentAnalysisService;

    constructor() {
        makeObservable(this, {
            isLoading: observable,
            errorMessage: observable,
            messageCount: observable,
            videoCallCount: observable,
            inPersonVisitCount: observable,
            monthlyChange: observable,
            sentimentDistribution: observable,
            aiInsight: observable,
            timelineData: observable,
            frequencyData: observable,
            frequencyView: observable,
            averageResponseTime: observable,
            communicationGaps: observable,
            stageProgression: observable,
            loadAnalytics: action,
            setFrequencyView: action,
            reset: action
        });

        const repository = new SentimentAnalyticsRepository(supabase);
        this.service = new SentimentAnalysisService(repository);
    }

    /**
     * Load all analytics data for a relationship
     */
    async loadAnalytics(relationshipId: string, youthId: string, elderlyId: string) {
        console.log('[SentimentAnalysisViewModel] Starting loadAnalytics', { relationshipId, youthId, elderlyId });
        this.isLoading = true;
        this.errorMessage = null;

        try {
            console.log('[SentimentAnalysisViewModel] Calling getAllData...');

            // Date range: last 30 days
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            const dateRange = { start: startDate, end: endDate };

            // Fetch all data in parallel
            const [
                stats,
                timeline,
                frequency,
                avgResponseTime,
                gaps,
                progression
            ] = await Promise.all([
                this.service.getCompleteAnalytics(relationshipId, youthId, elderlyId),
                this.service.generateTimelineData(youthId, elderlyId, relationshipId, dateRange),
                this.service.generateFrequencyData(youthId, elderlyId, dateRange, this.frequencyView),
                this.service.calculateAverageResponseTime(youthId, elderlyId, dateRange),
                this.service.getCommunicationGaps(youthId, elderlyId, dateRange),
                this.service.getStageProgression(relationshipId)
            ]);

            console.log('[SentimentAnalysisViewModel] Got all data:', { stats, timeline, frequency });

            runInAction(() => {
                this.messageCount = stats.messageCount;
                this.videoCallCount = stats.videoCallCount;
                this.inPersonVisitCount = stats.inPersonVisitCount;
                this.monthlyChange = stats.monthlyChange;
                this.sentimentDistribution = stats.sentimentDistribution;
                this.aiInsight = this.service.generateInsight(stats);
                this.timelineData = timeline;
                this.frequencyData = frequency;
                this.averageResponseTime = avgResponseTime;
                this.communicationGaps = gaps;
                this.stageProgression = progression;
                this.isLoading = false;
                console.log('[SentimentAnalysisViewModel] Loading complete!');
            });
        } catch (error) {
            console.error('[SentimentAnalysisViewModel] Error loading analytics:', error);
            runInAction(() => {
                this.errorMessage = 'Failed to load sentiment analytics. Please try again.';
                this.isLoading = false;
            });
        }
    }

    /**
     * Set frequency view and reload data
     */
    async setFrequencyView(view: 'daily' | 'weekly' | 'monthly', relationshipId: string, youthId: string, elderlyId: string) {
        this.frequencyView = view;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const dateRange = { start: startDate, end: endDate };

        const frequency = await this.service.generateFrequencyData(youthId, elderlyId, dateRange, view);

        runInAction(() => {
            this.frequencyData = frequency;
        });
    }

    /**
     * Reset state when navigating away
     */
    reset() {
        this.isLoading = true;
        this.errorMessage = null;
        this.messageCount = 0;
        this.videoCallCount = 0;
        this.inPersonVisitCount = 0;
        this.monthlyChange = 0;
        this.sentimentDistribution = { positive: 0, neutral: 0, negative: 0 };
        this.aiInsight = '';
    }
}

export const adminSentimentAnalysisViewModel = new AdminSentimentAnalysisViewModel();

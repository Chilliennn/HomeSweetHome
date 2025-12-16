import { makeAutoObservable, runInAction } from 'mobx';
import { matchingService } from '../../Model/Service/CoreService/matchingService';
import { User } from '../../Model/types';
import { RealtimeChannel, supabase, Interest } from '@home-sweet-home/model';
import { ElderlyFilters } from '../../Model/Repository/UserRepository/matchingRepository';

export class YouthMatchingViewModel {
    profiles: User[] = [];
    activeMatches: Interest[] = []; // Accepted interests (Notifications for Youth)
    expressedElderlyIds: Set<string> = new Set(); // Track elderly IDs that youth has already expressed interest to
    isLoading: boolean = false;
    error: string | null = null;
    successMessage: string | null = null;
    private subscription: RealtimeChannel | null = null;
    private notificationSubscription: RealtimeChannel | null = null;

    // Filter and pagination state
    filters: ElderlyFilters = {};
    hasMoreProfiles: boolean = false;
    totalProfileCount: number = 0;
    currentOffset: number = 0;
    private currentYouthProfile: User | null = null;
    private readonly PAGE_SIZE = 10;

    constructor() {
        makeAutoObservable(this);
    }

    /**
     * Load available elderly profiles with current filters.
     * Fetches first page of results.
     */
    async loadProfiles(youthProfile?: User) {
        this.isLoading = true;
        this.error = null;
        this.currentOffset = 0;

        if (youthProfile) {
            this.currentYouthProfile = youthProfile;
        }

        try {
            const filtersWithPagination: ElderlyFilters = {
                ...this.filters,
                offset: 0,
                limit: this.PAGE_SIZE
            };

            const result = await matchingService.getAvailableElderlyProfiles(
                filtersWithPagination,
                this.currentYouthProfile || undefined
            );

            runInAction(() => {
                this.profiles = result.profiles;
                this.hasMoreProfiles = result.hasMore;
                this.totalProfileCount = result.totalCount;
                this.currentOffset = result.profiles.length;
            });
        } catch (e: any) {
            runInAction(() => {
                this.error = e.message || 'Failed to load profiles';
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    /**
     * Load more elderly profiles (pagination)
     */
    async loadMoreProfiles() {
        if (this.isLoading || !this.hasMoreProfiles) return;

        this.isLoading = true;
        try {
            const filtersWithPagination: ElderlyFilters = {
                ...this.filters,
                offset: this.currentOffset,
                limit: this.PAGE_SIZE
            };

            const result = await matchingService.getAvailableElderlyProfiles(
                filtersWithPagination,
                this.currentYouthProfile || undefined
            );

            runInAction(() => {
                this.profiles = [...this.profiles, ...result.profiles];
                this.hasMoreProfiles = result.hasMore;
                this.currentOffset += result.profiles.length;
            });
        } catch (e: any) {
            runInAction(() => {
                this.error = e.message || 'Failed to load more profiles';
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    /**
     * Set filter options and reload profiles
     */
    async setFilters(newFilters: ElderlyFilters) {
        this.filters = newFilters;
        await this.loadProfiles();
    }

    /**
     * Clear all filters and reload profiles
     */
    async clearFilters() {
        this.filters = {};
        await this.loadProfiles();
    }

    /**
     * Load active matches updates (e.g. Elderly Accepted)
     * UC101_4: Real-time notifications for youth
     */
    async loadNotifications(youthId: string) {
        console.log('🔵 [YouthVM] Loading notifications for:', youthId);

        this.isLoading = true;
        try {
            const data = await matchingService.getYouthApplications(youthId);
            runInAction(() => {
                // Show notifications for accepted or rejected interests
                this.activeMatches = data.filter(app =>
                    app.status === 'pre_chat_active' || app.status === 'rejected'
                );

                // Track all elderly IDs that youth has expressed interest to
                this.expressedElderlyIds = new Set(
                    data.map(app => app.elderly_id)
                );

                console.log('✅ [YouthVM] Loaded:', {
                    activeMatches: this.activeMatches.length,
                    expressed: this.expressedElderlyIds.size
                });
            });

            // Setup realtime for application updates
            if (!this.subscription) {
                console.log('🟢 [YouthVM] Setting up realtime for applications...');

                this.subscription = matchingService.subscribeToApplicationUpdates(
                    youthId,
                    (updated) => {
                        console.log('🎉 [YouthVM] Application updated:', updated.id);

                        // Only show if elderly responded
                        if (updated.elderly_decision !== 'pending') {
                            runInAction(() => {
                                const index = this.activeMatches.findIndex(m => m.id === updated.id);
                                if (index >= 0) {
                                    console.log('✅ [YouthVM] Updating existing match');
                                    this.activeMatches[index] = updated;
                                } else {
                                    console.log('✅ [YouthVM] Adding new notification');
                                    this.activeMatches = [updated, ...this.activeMatches];
                                }
                            });
                        }
                    }
                );
            }

            // Setup realtime for notifications (bell icon updates)
            if (!this.notificationSubscription) {
                console.log('🟢 [YouthVM] Setting up realtime for notifications...');

                this.notificationSubscription = matchingService.subscribeToNotifications(
                    youthId,
                    (notification) => {
                        console.log('🔔 [YouthVM] New notification:', notification.type);
                        // Reload to get updated data with elderly details
                        this.loadNotifications(youthId);
                    }
                );
            }
        } catch (e: any) {
            console.error('❌ [YouthVM] Failed to load notifications', e);
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    /**
     * Express interest in a specific elderly profile.
     * Requires the youthId (current user) and elderlyId.
     */
    async expressInterest(youthId: string, elderlyId: string): Promise<boolean> {
        this.isLoading = true;
        this.error = null;
        this.successMessage = null;

        try {
            await matchingService.expressInterest(youthId, elderlyId);

            runInAction(() => {
                this.successMessage = "Interest expressed successfully! Waiting for response.";
                // Add to expressed set
                this.expressedElderlyIds.add(elderlyId);
            });
            return true; // Use this to trigger UI navigation if needed
        } catch (e: any) {
            runInAction(() => {
                // Handle specific limit errors with user-friendly messages handled in Service, 
                // but we ensure it's propagated here.
                this.error = e.message || 'Failed to express interest';
            });
            return false;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }
    /**
     * Check if youth has already expressed interest to this elderly
     */
    hasExpressedInterest(elderlyId: string): boolean {
        return this.expressedElderlyIds.has(elderlyId);
    }

    /**
     * Get match details by application ID (for PreMatchStarted screen)
     * UC101_5: Display elderly name and match info
     */
    getMatchById(matchId: string): Interest | undefined {
        return this.activeMatches.find(m => m.id === matchId);
    }

    dispose() {
        console.log('🔴 [YouthVM] Disposing subscriptions');
        if (this.subscription) {
            matchingService.unsubscribe(this.subscription);
            this.subscription = null;
        }
        if (this.notificationSubscription) {
            matchingService.unsubscribe(this.notificationSubscription);
            this.notificationSubscription = null;
        }
    }
    clearMessages() {
        this.error = null;
        this.successMessage = null;
    }

    /**
     * Submit formal application after pre-match period
     * UC101_12: Youth submits formal adoption application
     */
    async submitFormalApplication(
        applicationId: string,
        formData: {
            motivationLetter: string;
            availability?: string;
            commitmentLevel?: string;
            whatCanOffer?: string;
        }
    ): Promise<boolean> {
        this.isLoading = true;
        this.error = null;

        try {
            // Get youth ID from auth
            const { supabase } = await import('@home-sweet-home/model');
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User not logged in');
            }

            await matchingService.submitFormalApplication(applicationId, user.id, formData);

            runInAction(() => {
                this.successMessage = 'Application submitted successfully!';
            });
            return true;
        } catch (e: any) {
            runInAction(() => {
                this.error = e.message || 'Failed to submit application';
            });
            return false;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }
}

export const youthMatchingViewModel = new YouthMatchingViewModel();

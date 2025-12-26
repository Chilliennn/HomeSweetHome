import { makeAutoObservable, runInAction } from 'mobx';
import { matchingService } from '../../Model/Service/CoreService/matchingService';
import { notificationService } from '../../Model/Service/CoreService/notificationService';
import { User } from '../../Model/types';
import { RealtimeChannel, supabase, Interest } from '@home-sweet-home/model';
import { ElderlyFilters } from '../../Model/Repository/UserRepository/matchingRepository';

export class YouthMatchingViewModel {
    profiles: User[] = [];
    allProfiles: User[] = []; // Store all profiles sorted by match score
    activeMatches: Interest[] = []; // Accepted interests (Notifications for Youth)
    expressedElderlyIds: Set<string> = new Set(); // Track elderly IDs that youth has already expressed interest to
    isLoading: boolean = false;
    error: string | null = null;
    successMessage: string | null = null;
    private subscription: RealtimeChannel | null = null;
    private notificationSubscription: RealtimeChannel | null = null;
    currentUserId: string | null = null;
    unreadNotificationCount: number = 0;
    currentJourneyStep: number = 1;
    hasActiveRelationship: boolean = false;
    // Filter and pagination state
    filters: ElderlyFilters = {};
    hasMoreProfiles: boolean = false;
    totalProfileCount: number = 0;
    currentDisplayCount: number = 10; // How many to show initially
    private currentYouthProfile: User | null = null;
    private readonly DISPLAY_INCREMENT = 10; // How many more to show when loading more

    constructor() {
        makeAutoObservable(this);
    }

    /**
     * Set current user context (called by Layout when auth state changes)
     * Automatically fetches and stores full user profile for match scoring
     */
    async setCurrentUser(userId: string | null): Promise<void> {
        console.log('🟦 [YouthVM] setCurrentUser called with userId:', userId);
        runInAction(() => {
            this.currentUserId = userId;
        });

        // Fetch full user profile for match scoring via Service layer
        if (userId) {
            try {
                console.log('🟦 [YouthVM] Fetching user profile via matchingService...');
                const profile = await matchingService.getUserProfile(userId);
                console.log('🟦 [YouthVM] User profile fetched:', {
                    name: profile?.full_name,
                    interests: profile?.profile_data?.interests,
                    languages: profile?.languages,
                    location: profile?.location
                });
                runInAction(() => {
                    this.currentYouthProfile = profile;
                });

                if (profile) {
                    console.log('🔄 [YouthVM] Reloading profiles with user data for accurate scoring...');
                    await this.loadProfiles();
                }
            } catch (error) {
                console.error('❌ [YouthVM] Failed to fetch user profile:', error);
            }
        } else {
            runInAction(() => {
                this.currentYouthProfile = null;
            });
        }
    }

    /**
     * Set current youth profile for match scoring
     * Should be called when profile data is available
     */
    setYouthProfile(profile: User | null): void {
        runInAction(() => {
            this.currentYouthProfile = profile;
        });
    }

    /**
     * Clear user context (on logout)
     */
    clearUser(): void {
        runInAction(() => {
            this.currentUserId = null;
            this.profiles = [];
            this.activeMatches = [];
            this.expressedElderlyIds.clear();
            this.hasActiveRelationship = false;
            this.currentJourneyStep = 1;
        });
    }

    /**
     * Check if user has active relationship (for tab enabling/disabling and journey step)
     */
    async checkActiveRelationship(userId: string): Promise<void> {
        try {
            const { relationshipService, communicationService } = await import('@home-sweet-home/model');
            const relationship = await relationshipService.getActiveRelationship(userId);

            // Get active pre-match chats to determine journey step
            const preMatchChats = await communicationService.getActivePreMatchChats(userId, 'youth');

            runInAction(() => {
                this.hasActiveRelationship = relationship !== null;

                // Update journey step based on status
                // 1 = Browse, 2 = Pre-match, 3 = Apply (pending_review or approved), 4 = Bonding
                if (relationship !== null) {
                    // In bonding stage - but this should redirect to bonding home, not show this page
                    this.currentJourneyStep = 4;
                } else if (preMatchChats.some(chat => chat.application.status === 'pending_review' || chat.application.status === 'approved')) {
                    // Has submitted formal application
                    this.currentJourneyStep = 3;
                } else if (preMatchChats.length > 0) {
                    // Has active pre-match chats
                    this.currentJourneyStep = 2;
                } else {
                    // Just browsing
                    this.currentJourneyStep = 1;
                }
            });
        } catch (error) {
            console.error('[YouthMatchingViewModel] Error checking active relationship:', error);
            runInAction(() => {
                this.hasActiveRelationship = false;
                this.currentJourneyStep = 1;
            });
        }
    }

    /**
     * Load available elderly profiles with current filters.
     * Fetches ALL profiles, sorts by match score, then paginates display.
     */
    async loadProfiles(youthProfile?: User) {
        console.log('🟦 [YouthVM] loadProfiles called', {
            providedProfile: !!youthProfile,
            storedProfile: !!this.currentYouthProfile,
            currentUserId: this.currentUserId
        });

        this.isLoading = true;
        this.error = null;
        this.currentDisplayCount = 10; // Reset display count

        // Update stored profile if provided
        if (youthProfile) {
            console.log('🟦 [YouthVM] Using provided youth profile:', youthProfile.full_name);
            this.currentYouthProfile = youthProfile;
        }

        try {
            // Fetch ALL available elderly for accurate sorting
            const filtersWithoutPagination: ElderlyFilters = {
                ...this.filters,
            };

            // Always pass youth profile for match scoring
            const profileToUse = this.currentYouthProfile || undefined;
            console.log('🟦 [YouthVM] Calling matchingService with profile:', {
                hasProfile: !!profileToUse,
                profileName: profileToUse?.full_name,
                interests: profileToUse?.profile_data?.interests
            });

            const result = await matchingService.getAvailableElderlyProfiles(
                filtersWithoutPagination,
                profileToUse
            );

            console.log('✅ [YouthVM] Loaded profiles:', result.profiles.length);

            runInAction(() => {
                // Store all profiles (already sorted by match score)
                this.allProfiles = result.profiles;
                this.totalProfileCount = result.totalCount;

                // Display first batch
                this.profiles = this.allProfiles.slice(0, this.currentDisplayCount);
                this.hasMoreProfiles = this.allProfiles.length > this.currentDisplayCount;
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
     * Load more elderly profiles (client-side pagination from sorted results)
     */
    async loadMoreProfiles() {
        if (this.isLoading || !this.hasMoreProfiles) return;

        console.log('🟦 [YouthVM] Loading more profiles from cache...');

        runInAction(() => {
            // Increase display count
            this.currentDisplayCount += this.DISPLAY_INCREMENT;

            // Update displayed profiles
            this.profiles = this.allProfiles.slice(0, this.currentDisplayCount);
            this.hasMoreProfiles = this.allProfiles.length > this.currentDisplayCount;

            console.log('✅ [YouthVM] Now displaying:', this.profiles.length, 'of', this.allProfiles.length);
        });
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

                this.notificationSubscription = notificationService.subscribeToNotifications(
                    youthId,
                    (notification) => {
                        console.log('🔔 [YouthVM] New notification:', notification.type);
                        runInAction(() => {
                            this.unreadNotificationCount += 1;
                        });
                        // Reload to get updated data with elderly details
                        this.loadNotifications(youthId);
                    }
                );
            }

            await this.loadUnreadNotificationCount(youthId);
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
            notificationService.unsubscribe(this.notificationSubscription);
            this.notificationSubscription = null;
        }
    }

    /**
     * Get application by ID with partner info (sync - from cache)
     * Used by ApplicationStatusScreen for quick access
     * Returns undefined if not in cache - use loadApplicationById first
     */
    getApplicationById(applicationId: string): { application: Interest; partnerUser: User } | undefined {
        // First check local cache (activeMatches)
        const application = this.activeMatches.find(match => match.id === applicationId);
        if (application) {
            const partnerUser = application.elderly as User | undefined;
            if (partnerUser) {
                return { application, partnerUser };
            }
        }

        // Check if we have it in loadedApplication
        if (this.loadedApplication?.application.id === applicationId) {
            return this.loadedApplication;
        }

        return undefined;
    }


    loadedApplication: { application: Interest; partnerUser: User } | null = null;
    isLoadingApplication: boolean = false;


    async loadApplicationById(applicationId: string): Promise<{ application: Interest; partnerUser: User } | null> {
        // First check cache
        const cached = this.getApplicationById(applicationId);
        if (cached) return cached;

        // Load from server
        this.isLoadingApplication = true;
        try {
            const application = await matchingService.getApplicationById(applicationId);
            if (!application) {
                runInAction(() => {
                    this.isLoadingApplication = false;
                    this.loadedApplication = null;
                });
                return null;
            }

            // Get partner user from application.elderly
            const partnerUser = application.elderly as User | undefined;
            if (!partnerUser) {
                runInAction(() => {
                    this.isLoadingApplication = false;
                    this.loadedApplication = null;
                });
                return null;
            }

            const result = { application, partnerUser };
            runInAction(() => {
                this.loadedApplication = result;
                this.isLoadingApplication = false;
            });
            return result;
        } catch (error) {
            console.error('[YouthVM] Failed to load application:', error);
            runInAction(() => {
                this.isLoadingApplication = false;
                this.loadedApplication = null;
            });
            return null;
        }
    }

    clearMessages() {
        this.error = null;
        this.successMessage = null;
    }

    /**
     * Load unread notification count from database
     */
    async loadUnreadNotificationCount(userId: string) {
        try {
            const count = await notificationService.getUnreadCount(userId);
            runInAction(() => {
                this.unreadNotificationCount = count;
            });
        } catch (e) {
            console.error('[YouthVM] Failed to load notification count', e);
        }
    }

    /**
     * Subscribe to real-time general notifications
     * Returns subscription that can be cleaned up
     */
    subscribeToGeneralNotifications(onNotification: (notification: any) => void): any {
        if (!this.currentUserId) return null;
        return notificationService.subscribeToNotifications(
            this.currentUserId,
            onNotification
        );
    }

    /**
     * Unsubscribe from real-time notifications
     */
    unsubscribeFromNotifications(subscription: any): void {
        if (subscription) {
            notificationService.unsubscribe(subscription);
        }
    }

    /**
     * Reset notification count (call when user visits notification screen)
     */
    resetNotificationCount() {
        this.unreadNotificationCount = 0;
    }

    /**
     * Get general notifications (calendar, system messages, etc.)
     */
    async getGeneralNotifications(): Promise<any[]> {
        if (!this.currentUserId) return [];
        return await notificationService.getGeneralNotifications(this.currentUserId);
    }

    /**
     * Mark all notifications as read (called when entering notification screen)
     */
    async markAllNotificationsAsRead(): Promise<void> {
        if (!this.currentUserId) return;
        await notificationService.markAllNotificationsAsRead(this.currentUserId);
        // Reset bell icon count
        this.resetNotificationCount();
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId: string): Promise<void> {
        await notificationService.deleteNotification(notificationId);
    }

    /**
     * Submit formal application after pre-match period
     * UC101_12: Youth submits formal adoption application
     * 
     * @param applicationId - The application ID
     * @param youthId - The youth user ID (passed from View layer)
     * @param formData - Motivation letter and other form data
     */
    async submitFormalApplication(
        applicationId: string,
        youthId: string,
        formData: {
            motivationLetter: string;
            availability?: string;
            commitmentLevel?: string;
            whatCanOffer?: string;
        }
    ): Promise<boolean> {
        console.log('🔵 [YouthVM] submitFormalApplication started', { applicationId, youthId });
        this.isLoading = true;
        this.error = null;

        try {
            if (!youthId) {
                console.error('❌ [YouthVM] No youthId provided');
                throw new Error('User not logged in');
            }

            console.log('🔵 [YouthVM] Calling matchingService.submitFormalApplication...');

            await matchingService.submitFormalApplication(applicationId, youthId, formData);

            console.log('✅ [YouthVM] Application submitted successfully');
            runInAction(() => {
                this.successMessage = 'Application submitted successfully!';
            });
            return true;
        } catch (e: any) {
            console.error('❌ [YouthVM] Submit failed:', e.message);
            runInAction(() => {
                this.error = e.message || 'Failed to submit application';
            });
            return false;
        } finally {
            console.log('🔵 [YouthVM] Submit completed (finally block)');
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }
}

export const youthMatchingViewModel = new YouthMatchingViewModel();

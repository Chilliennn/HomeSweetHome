import { makeAutoObservable, runInAction } from 'mobx';
import { matchingService } from '../../Model/Service/CoreService/matchingService';
import { notificationService } from '../../Model/Service/CoreService/notificationService';
import { supabase, Interest } from '@home-sweet-home/model';
import type { RealtimeChannel } from '@home-sweet-home/model';

export class ElderMatchingViewModel {
    incomingRequests: Interest[] = [];
    isLoading: boolean = false;
    error: string | null = null;
    successMessage: string | null = null;
    private subscription: RealtimeChannel | null = null;
    private notificationSubscription: RealtimeChannel | null = null;

    // ✅ Current user ID synced from AuthViewModel via Layout
    currentUserId: string | null = null;

    // ✅ Unread notification count for bell icon
    unreadNotificationCount: number = 0;

    constructor() {
        makeAutoObservable(this);
    }

    /**
     * Set current user context (called by Layout when auth state changes)
     */
    setCurrentUser(userId: string | null): void {
        runInAction(() => {
            this.currentUserId = userId;
        });
    }

    /**
     * Clear user context (on logout)
     */
    clearUser(): void {
        runInAction(() => {
            this.currentUserId = null;
            this.incomingRequests = [];
        });
    }

    /**
     * Load incoming interest requests for the elderly user.
     * UC102_3: Real-time updates for new interests
     */
    async loadRequests(elderlyId: string) {
        console.log('🔵 [ElderVM] Loading requests for:', elderlyId);

        // ✅ Save elderly ID for later use
        this.currentUserId = elderlyId;

        const data = await matchingService.getIncomingInterests(elderlyId);
        runInAction(() => {
            this.incomingRequests = data;
            console.log('✅ [ElderVM] Loaded:', this.incomingRequests.length, 'requests');
        });

        // Setup realtime for incoming interests
        if (!this.subscription) {
            console.log('🟢 [ElderVM] Setting up realtime for interests...');

            this.subscription = matchingService.subscribeToIncomingInterests(
                elderlyId,
                (newInterest) => {
                    console.log('🎉 [ElderVM] New interest received:', newInterest.id);

                    runInAction(() => {
                        const exists = this.incomingRequests.some(r => r.id === newInterest.id);
                        if (!exists) {
                            this.incomingRequests = [newInterest, ...this.incomingRequests];
                            console.log('✅ [ElderVM] Added, total:', this.incomingRequests.length);
                        }
                    });
                }
            );
        }

        // Setup realtime for notifications (bell icon updates)
        if (!this.notificationSubscription) {
            console.log('🟢 [ElderVM] Setting up realtime for notifications...');

            this.notificationSubscription = notificationService.subscribeToNotifications(
                elderlyId,
                (notification) => {
                    console.log('🔔 [ElderVM] New notification:', notification.type);
                    // ✅ Increment unread count immediately
                    runInAction(() => {
                        this.unreadNotificationCount += 1;
                    });
                    // Reload requests to get updated data with youth details
                    this.loadRequests(elderlyId);
                }
            );
        }

        // ✅ Load initial unread count
        await this.loadUnreadNotificationCount(elderlyId);
    }

    /**
     * Accept or decline an interest request.
     * If accepting, this triggers limit checks in the service.
     */
    async respondToInterest(interestId: string, youthId: string, elderlyId: string, accept: boolean) {
        this.isLoading = true;
        this.error = null;
        this.successMessage = null;

        try {
            await matchingService.respondToInterest(interestId, youthId, elderlyId, accept);

            runInAction(() => {
                this.successMessage = accept ? "Match started! You can now chat." : "Request declined.";
                // Optimistically remove the processed request from the list
                this.incomingRequests = this.incomingRequests.filter(req => req.id !== interestId);
            });
        } catch (e: any) {
            runInAction(() => {
                this.error = e.message || 'Failed to process response';
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    /**
     * Delete an interest request (remove from list without responding)
     */
    async deleteRequest(requestId: string) {
        this.isLoading = true;
        this.error = null;

        try {
            // Remove from local state
            runInAction(() => {
                this.incomingRequests = this.incomingRequests.filter(r => r.id !== requestId);
            });
        } catch (error: any) {
            runInAction(() => {
                this.error = error?.message || 'Failed to delete request';
            });
            throw error;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    dispose() {
        console.log('🔴 [ElderVM] Disposing subscriptions');
        if (this.subscription) {
            matchingService.unsubscribe(this.subscription);
            this.subscription = null;
        }
        if (this.notificationSubscription) {
            notificationService.unsubscribe(this.notificationSubscription);
            this.notificationSubscription = null;
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
            console.error('[ElderVM] Failed to load notification count', e);
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
     * Review formal application (approve/reject)
     * UC102: Elderly decides on formal application
     */
    async reviewFormalApplication(applicationId: string, decision: 'approve' | 'reject'): Promise<boolean> {
        this.isLoading = true;
        this.error = null;

        try {
            // ✅ Use cached ID, fallback to supabase.auth.getUser
            let elderlyId = this.currentUserId;
            if (!elderlyId) {
                const { data: { user } } = await supabase.auth.getUser();
                elderlyId = user?.id || null;
            }

            if (!elderlyId) {
                throw new Error('User not logged in');
            }

            await matchingService.reviewFormalApplication(applicationId, elderlyId, decision);

            runInAction(() => {
                this.successMessage = decision === 'approve'
                    ? 'Application approved! Match confirmed.'
                    : 'Application rejected.';
            });
            return true;
        } catch (e: any) {
            runInAction(() => {
                this.error = e.message || 'Failed to process application';
            });
            return false;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // ============================================
    // NEW: Elderly responds to admin-approved applications
    // ============================================

    pendingElderlyReviewApplications: Interest[] = [];

    /**
     * Load applications pending elderly review (admin already approved)
     */
    async loadPendingElderlyReview(elderlyId: string) {
        console.log('[ElderVM] Loading pending elderly review for:', elderlyId);

        // ✅ Save elderly ID for later use
        this.currentUserId = elderlyId;

        try {
            const data = await matchingService.getApplicationsPendingElderlyReview(elderlyId);
            runInAction(() => {
                this.pendingElderlyReviewApplications = data;
                console.log('[ElderVM] Loaded:', data.length, 'pending review applications');
            });
        } catch (e: any) {
            console.error('[ElderVM] Failed to load pending review:', e);
        }
    }

    /**
     * Elderly responds to admin-approved application
     * @param applicationId - Application ID
     * @param decision - 'accept' or 'reject'
     * @param rejectReason - Optional rejection reason
     */
    async respondToApprovedApplication(
        applicationId: string,
        decision: 'accept' | 'reject',
        rejectReason?: string
    ): Promise<boolean> {
        this.isLoading = true;
        this.error = null;
        this.successMessage = null;

        try {
            // ✅ Use cached ID, fallback to supabase.auth.getUser
            let elderlyId = this.currentUserId;
            if (!elderlyId) {
                const { data: { user } } = await supabase.auth.getUser();
                elderlyId = user?.id || null;
            }

            if (!elderlyId) {
                throw new Error('User not logged in');
            }

            console.log('[ElderVM] respondToApprovedApplication using elderlyId:', elderlyId);

            await matchingService.elderlyRespondToApprovedApplication(
                applicationId,
                elderlyId,
                decision,
                rejectReason
            );

            runInAction(() => {
                this.successMessage = decision === 'accept'
                    ? 'Application accepted! Relationship started.'
                    : 'Application declined.';
                // Remove from pending list
                this.pendingElderlyReviewApplications =
                    this.pendingElderlyReviewApplications.filter(app => app.id !== applicationId);
            });
            return true;
        } catch (e: any) {
            runInAction(() => {
                this.error = e.message || 'Failed to process response';
            });
            return false;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    /**
     * Get application by ID
     * Used by Views to fetch detailed application data
     */
    async getApplicationById(applicationId: string) {
        return matchingService.getApplicationById(applicationId);
    }
}

export const elderMatchingViewModel = new ElderMatchingViewModel();

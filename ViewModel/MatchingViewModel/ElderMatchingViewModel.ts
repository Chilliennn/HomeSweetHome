import { makeAutoObservable, runInAction } from 'mobx';
import { matchingService } from '../../Model/Service/CoreService/matchingService';
import { supabase, Interest } from '@home-sweet-home/model';
import type { RealtimeChannel } from '@home-sweet-home/model';

export class ElderMatchingViewModel {
    incomingRequests: Interest[] = [];
    isLoading: boolean = false;
    error: string | null = null;
    successMessage: string | null = null;
    private subscription: RealtimeChannel | null = null;
    private notificationSubscription: RealtimeChannel | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    /**
     * Load incoming interest requests for the elderly user.
     * UC102_3: Real-time updates for new interests
     */
    async loadRequests(elderlyId: string) {
        console.log('🔵 [ElderVM] Loading requests for:', elderlyId);

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

            this.notificationSubscription = matchingService.subscribeToNotifications(
                elderlyId,
                (notification) => {
                    console.log('🔔 [ElderVM] New notification:', notification.type);
                    // Reload requests to get updated data with youth details
                    this.loadRequests(elderlyId);
                }
            );
        }
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
    dispose() {
        console.log('🔴 [ElderVM] Disposing subscriptions');
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
     * Review formal application (approve/reject)
     * UC102: Elderly decides on formal application
     */
    async reviewFormalApplication(applicationId: string, decision: 'approve' | 'reject'): Promise<boolean> {
        this.isLoading = true;
        this.error = null;

        try {
            // Get elderly ID from auth
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not logged in');
            }

            await matchingService.reviewFormalApplication(applicationId, user.id, decision);

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
}

export const elderMatchingViewModel = new ElderMatchingViewModel();

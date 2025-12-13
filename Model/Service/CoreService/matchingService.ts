import { matchingRepository } from '../../Repository/UserRepository/matchingRepository';
import { notificationRepository } from '../../Repository/UserRepository/notificationRepository';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { UserType } from '../../types';
import type { Interest } from '../../Repository/UserRepository/matchingRepository';

// ============================================================================
// CONSTANTS
// ============================================================================
const PRE_MATCH_LIMITS = {
    youth: 3,
    elderly: 5,
};

// ============================================================================
// SERVICE
// ============================================================================
export const matchingService = {
    // ============================================
    // READ OPERATIONS
    // ============================================
    async getAvailableElderlyProfiles(filters?: any) {
        return await matchingRepository.getAvailableElderlyProfiles(filters);
    },

    async getIncomingInterests(elderlyId: string) {
        return await matchingRepository.getIncomingInterests(elderlyId);
    },

    async getYouthApplications(youthId: string) {
        // Assuming incoming applications in matchingRepository can also filter by generic column or we reuse getIncomingInterests logic if applicable.
        // But getIncomingInterests is specifically for elderly_id.
        // We'll trust matchingRepo has a generic way or we need to add it.
        // Since I haven't added `getYouthApplications` to repo yet, I will simulate it 
        // by calling a new method I will add to repo, or by using Supabase directly if I could.
        // Better: let's add `getYouthApplications` to matchingRepository next.
        // For now, I'll return specific repo call.
        return await matchingRepository.getYouthApplications(youthId);
    },

    // ============================================
    // WRITE / LOGIC OPERATIONS
    // ============================================

    /**
     * Check if a user has reached their pre-match limit (C1/C2 constraints).
     * Returns TRUE if they CANNOT start a new pre-match (limit reached).
     */
    async checkPreMatchLimit(userId: string, userType: UserType): Promise<boolean> {
        if (userType === 'admin') return false;

        const currentCount = await matchingRepository.getActivePreMatchCount(userId, userType);
        const limit = PRE_MATCH_LIMITS[userType];

        return currentCount >= limit;
    },

    /**
     * Check if a specific pair can start a pre-match.
     * Validates limits for BOTH the youth and the elderly.
     */
    async canStartPreMatch(youthId: string, elderlyId: string): Promise<{
        allowed: boolean;
        reason?: 'youth_limit_reached' | 'elderly_limit_reached'
    }> {
        // Check Youth Limit
        const youthLimitReached = await this.checkPreMatchLimit(youthId, 'youth');
        if (youthLimitReached) {
            return { allowed: false, reason: 'youth_limit_reached' };
        }

        // Check Elderly Limit
        const elderlyLimitReached = await this.checkPreMatchLimit(elderlyId, 'elderly');
        if (elderlyLimitReached) {
            return { allowed: false, reason: 'elderly_limit_reached' };
        }

        return { allowed: true };
    },

    /**
     * Youth expresses interest in an elderly profile.
     * First checks limits, then creates the interest record.
     */
    async expressInterest(youthId: string, elderlyId: string) {
        // 1. Check Youth Limit
        const limitReached = await this.checkPreMatchLimit(youthId, 'youth');
        if (limitReached) {
            throw new Error('You have reached the maximum number of active chats (3). End an existing chat to connect with someone new.');
        }

        // 2. Create Interest
        return await matchingRepository.createInterest(youthId, elderlyId);
    },

    /**
     * Elderly responds to an interest (Accept/Decline).
     * If accepting, it verifies limits again to ensure creating the active pre-match is safe.
     * UC101_9: Creates notification AND welcome message for youth when elderly accepts
     */
    async respondToInterest(interestId: string, youthId: string, elderlyId: string, accept: boolean) {
        console.log('[Service] respondToInterest called', { interestId, youthId, elderlyId, accept });
        if (accept) {
            // If accepting, we must ensure BOTH parties still have space.
            // (The youth might have started other chats since sending this interest)
            const check = await this.canStartPreMatch(youthId, elderlyId);
            console.log('[Service] canStartPreMatch result', check);
            if (!check.allowed) {
                if (check.reason === 'youth_limit_reached') {
                    throw new Error('This youth student has reached their active chat limit.');
                } else {
                    throw new Error('You have reached your active chat limit (5). End an older chat to accept this one.');
                }
            }
        }

        // Update status in Repository (Repository only does DB operations)
        const updatedApplication = await matchingRepository.updateInterestStatus(
            interestId,
            accept ? 'accept' : 'decline',
            accept ? 'pre_chat_active' : 'rejected'
        );
        console.log('[Service] Repository update complete', updatedApplication);

        // UC101_9: Service layer handles business logic (notifications + welcome message)
        if (accept) {
            const elderlyName = updatedApplication.elderly?.full_name || 'An Elderly';

            // Create notification for youth
            console.log('[Service] Creating notification for youth:', youthId);
            await notificationRepository.createNotification({
                user_id: youthId,
                type: 'interest_accepted',
                title: 'Interest Accepted!',
                message: `${elderlyName} has accepted your interest. Start chatting now!`,
                reference_id: interestId,
                reference_table: 'applications',
            });
            console.log('[Service] Notification created');

            // Create welcome message (business rule: send welcome on acceptance)
            console.log('[Service] Creating welcome message');
            const { communicationService } = await import('./communicationService');
            await communicationService.createWelcomeMessage(
                interestId,
                updatedApplication.youth_id,
                updatedApplication.elderly_id
            );
            console.log('[Service] Welcome message created');
        } else {
            // Optional: Notify rejection
            const elderlyName = updatedApplication.elderly?.full_name || 'An Elderly';
            console.log('[Service] Creating rejection notification for youth:', youthId);
            await notificationRepository.createNotification({
                user_id: youthId,
                type: 'interest_rejected',
                title: 'Interest Update',
                message: `${elderlyName} has declined your interest. Keep browsing for other matches!`,
                reference_id: interestId,
                reference_table: 'applications',
            });
            console.log('[Service] Rejection notification created');
        }
    },
    /**
     * Subscribe to incoming interests through Repository
     */
    subscribeToIncomingInterests(
        elderlyId: string,
        callback: (interest: Interest) => void
    ): RealtimeChannel {
        return matchingRepository.subscribeToIncomingInterests(elderlyId, callback);
    },

    /**
     * Subscribe to application updates through Repository
     */
    subscribeToApplicationUpdates(
        youthId: string,
        callback: (application: Interest) => void
    ): RealtimeChannel {
        return matchingRepository.subscribeToApplicationUpdates(youthId, callback);
    },

    /**
     * Subscribe to notifications through Repository
     * UC101_4: Real-time notification updates
     */
    subscribeToNotifications(
        userId: string,
        callback: (notification: any) => void
    ): RealtimeChannel {
        return matchingRepository.subscribeToNotifications(userId, callback);
    },

    /**
     * ✅ Unsubscribe from realtime channel
     */
    unsubscribe(channel: RealtimeChannel): void {
        matchingRepository.unsubscribe(channel);
    }
};

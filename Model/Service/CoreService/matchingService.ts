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
    },

    // ============================================
    // FORMAL APPLICATION OPERATIONS (UC101/UC102)
    // ============================================

    /**
     * Submit formal application after pre-match period
     * UC101_12: Youth submits formal adoption application
     * 
     * @param applicationId - The pre-match application ID
     * @param youthId - Youth user ID
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
    ): Promise<Interest> {
        console.log('[matchingService] submitFormalApplication', { applicationId, youthId });

        // Verify the application belongs to this youth
        const application = await matchingRepository.getApplicationById(applicationId);
        if (!application) {
            throw new Error('Application not found');
        }
        if (application.youth_id !== youthId) {
            throw new Error('You are not authorized to submit this application');
        }
        if (application.status !== 'pre_chat_active') {
            throw new Error('This pre-match is not active');
        }

        // Check minimum duration (7 days)
        const { communicationService } = await import('./communicationService');
        const status = communicationService.calcPreMatchStatus(application.applied_at);
        if (!status.canApply) {
            throw new Error(`Minimum pre-match period not met. ${7 - status.daysPassed} days remaining.`);
        }

        // Update application with motivation letter and change status
        const updated = await matchingRepository.submitFormalApplication(
            applicationId,
            formData.motivationLetter,
            {
                availability: formData.availability,
                commitmentLevel: formData.commitmentLevel,
                whatCanOffer: formData.whatCanOffer,
            }
        );

        // Create notification for elderly
        const youthName = application.youth?.full_name || 'A Youth';
        await notificationRepository.createNotification({
            user_id: application.elderly_id,
            type: 'application_submitted',
            title: 'New Formal Application 📋',
            message: `${youthName} has submitted a formal adoption application. Please review.`,
            reference_id: applicationId,
            reference_table: 'applications',
        });

        console.log('[matchingService] Formal application submitted successfully');
        return updated;
    },

    /**
     * Elderly reviews formal application (approve/reject)
     * UC102: Elderly decides on formal application
     */
    async reviewFormalApplication(
        applicationId: string,
        elderlyId: string,
        decision: 'approve' | 'reject',
        notes?: string
    ): Promise<Interest> {
        console.log('[matchingService] reviewFormalApplication', { applicationId, elderlyId, decision });

        // Verify the application
        const application = await matchingRepository.getApplicationById(applicationId);
        if (!application) {
            throw new Error('Application not found');
        }
        if (application.elderly_id !== elderlyId) {
            throw new Error('You are not authorized to review this application');
        }
        if (application.status !== 'pending_review') {
            throw new Error('This application is not pending review');
        }

        // Update elderly decision
        const newElderlyDecision = decision === 'approve' ? 'accept' : 'decline';
        await matchingRepository.updateElderlyDecision(applicationId, newElderlyDecision);

        // Update application status
        const newStatus = decision === 'approve' ? 'both_accepted' : 'rejected';
        const updated = await matchingRepository.updateApplicationStatus(applicationId, newStatus);

        // Create notification for youth
        const elderlyName = application.elderly?.full_name || 'The Elderly';
        if (decision === 'approve') {
            await notificationRepository.createNotification({
                user_id: application.youth_id,
                type: 'application_approved',
                title: 'Application Approved! 🎉',
                message: `${elderlyName} has approved your application. Confirm to begin your journey!`,
                reference_id: applicationId,
                reference_table: 'applications',
            });

            // TODO: Create relationship record (handled by DB trigger or separate function)
        } else {
            await notificationRepository.createNotification({
                user_id: application.youth_id,
                type: 'application_rejected',
                title: 'Application Update',
                message: `${elderlyName} has declined your application. Keep browsing for other matches!`,
                reference_id: applicationId,
                reference_table: 'applications',
            });
        }

        console.log('[matchingService] Application reviewed:', decision);
        return updated;
    },

    /**
     * Get application by ID for detail view
     */
    async getApplicationById(applicationId: string): Promise<Interest> {
        return await matchingRepository.getApplicationById(applicationId);
    },

    /**
     * Get formal applications pending review for elderly
     * UC102_1: Elderly views pending applications
     */
    async getPendingApplicationsForElderly(elderlyId: string): Promise<Interest[]> {
        const allApplications = await matchingRepository.getElderlyApplications(elderlyId);
        return allApplications.filter(app => app.status === 'pending_review');
    }
};

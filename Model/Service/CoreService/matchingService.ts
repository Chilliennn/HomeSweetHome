import { matchingRepository, ElderlyFilters, ElderlyProfilesResult } from '../../Repository/UserRepository/matchingRepository';
import { notificationRepository } from '../../Repository/UserRepository/notificationRepository';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { User, UserType } from '../../types';
import type { Interest } from '../../Repository/UserRepository/matchingRepository';

// ============================================================================
// CONSTANTS
// ============================================================================
const PRE_MATCH_LIMITS = {
    youth: 3,
    elderly: 5,
};

// Match scoring weights
const MATCH_SCORE_WEIGHTS = {
    SAME_INTEREST: 10,      // +10 per shared interest
    SAME_LANGUAGE: 15,      // +15 per shared language
    SAME_LOCATION: 20,      // +20 for same location
    AGE_PREFERENCE: 10,     // +10 if within preferred age range
};

// ============================================================================
// SERVICE
// ============================================================================
export const matchingService = {
    // ============================================
    // READ OPERATIONS
    // ============================================

    /**
     * Calculate match score between youth and elderly
     */
    calculateMatchScore(youthProfile: User | null, elderlyProfile: User): number {
        if (!youthProfile) return 0;

        let score = 0;

        // Match interests
        const youthInterests = youthProfile.profile_data?.interests || [];
        const elderlyInterests = elderlyProfile.profile_data?.interests || [];
        for (const interest of youthInterests) {
            if (elderlyInterests.includes(interest)) {
                score += MATCH_SCORE_WEIGHTS.SAME_INTEREST;
            }
        }

        // Match languages
        const youthLanguages = youthProfile.languages || [];
        const elderlyLanguages = elderlyProfile.languages || [];
        for (const lang of youthLanguages) {
            if (elderlyLanguages.includes(lang)) {
                score += MATCH_SCORE_WEIGHTS.SAME_LANGUAGE;
            }
        }

        // Match location
        if (youthProfile.location && elderlyProfile.location) {
            if (youthProfile.location.toLowerCase() === elderlyProfile.location.toLowerCase()) {
                score += MATCH_SCORE_WEIGHTS.SAME_LOCATION;
            }
        }

        return score;
    },

    /**
     * Get available elderly profiles with filtering, scoring, and pagination
     * UC101_1, UC101_3, UC101_4: Display and filter elderly profiles
     */
    async getAvailableElderlyProfiles(
        filters?: ElderlyFilters,
        youthProfile?: User
    ): Promise<ElderlyProfilesResult> {
        const result = await matchingRepository.getAvailableElderlyProfiles(filters, youthProfile);

        // Calculate match scores and sort by score (highest first)
        const profilesWithScores = result.profiles.map(profile => ({
            profile,
            score: this.calculateMatchScore(youthProfile || null, profile)
        }));

        profilesWithScores.sort((a, b) => b.score - a.score);

        return {
            profiles: profilesWithScores.map(p => p.profile),
            totalCount: result.totalCount,
            hasMore: result.hasMore
        };
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
        console.log('🔵 [matchingService] submitFormalApplication START', { applicationId, youthId });

        // NEW: Check if youth already has a pending application (pending_review or approved)
        console.log('🔵 [matchingService] Step 0: Checking for existing applications under review...');
        const existingPending = await matchingRepository.getYouthPendingApplications(youthId);
        if (existingPending.length > 0) {
            const existingApp = existingPending[0];
            const statusText = existingApp.status === 'pending_review'
                ? 'under admin review'
                : 'awaiting elderly decision';
            console.error('❌ [matchingService] Youth already has application:', existingApp.status);
            throw new Error(`You already have an application ${statusText}. You can only submit one application at a time.`);
        }

        // Verify the application belongs to this youth
        console.log('🔵 [matchingService] Step 1: Getting application by ID...');
        const application = await matchingRepository.getApplicationById(applicationId);
        console.log('🔵 [matchingService] Step 1 complete, application:', application?.id, 'status:', application?.status);

        if (!application) {
            console.error('❌ [matchingService] Application not found');
            throw new Error('Application not found');
        }
        if (application.youth_id !== youthId) {
            console.error('❌ [matchingService] Unauthorized - youth_id mismatch');
            throw new Error('You are not authorized to submit this application');
        }
        if (application.status !== 'pre_chat_active') {
            console.error('❌ [matchingService] Status is not pre_chat_active, got:', application.status);
            throw new Error(`This pre-match is not active. Current status: ${application.status}`);
        }

        // Check minimum duration (7 days) - inline calculation to avoid circular import
        console.log('🔵 [matchingService] Step 2: Calculating pre-match status...');
        const applicationDate = new Date(application.applied_at);
        const now = new Date();
        const daysPassed = Math.floor((now.getTime() - applicationDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const canApply = daysPassed >= 7;
        console.log('🔵 [matchingService] Pre-match status:', { daysPassed, canApply });

        if (!canApply) {
            console.error('❌ [matchingService] Minimum duration not met');
            throw new Error(`Minimum pre-match period not met. ${7 - daysPassed} days remaining.`);
        }

        // Update application with motivation letter and change status
        console.log('🔵 [matchingService] Step 3: Submitting to repository...');
        const updated = await matchingRepository.submitFormalApplication(
            applicationId,
            formData.motivationLetter,
            {
                availability: formData.availability,
                commitmentLevel: formData.commitmentLevel,
                whatCanOffer: formData.whatCanOffer,
            }
        );
        console.log('🔵 [matchingService] Step 3 complete, updated application:', updated?.id);

        // Create notification for elderly
        console.log('🔵 [matchingService] Step 4: Creating notification for elderly...');
        const youthName = application.youth?.full_name || 'A Youth';
        await notificationRepository.createNotification({
            user_id: application.elderly_id,
            type: 'application_submitted',
            title: 'New Formal Application 📋',
            message: `${youthName} has submitted a formal adoption application. Please review.`,
            reference_id: applicationId,
            reference_table: 'applications',
        });

        console.log('✅ [matchingService] Formal application submitted successfully');
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
        const youthName = application.youth?.full_name || 'The Youth';

        if (decision === 'approve') {
            await notificationRepository.createNotification({
                user_id: application.youth_id,
                type: 'application_approved',
                title: 'Application Approved! 🎉',
                message: `${elderlyName} has approved your application. Confirm to begin your journey!`,
                reference_id: applicationId,
                reference_table: 'applications',
            });

            // Auto-end other pre-matches for this youth and notify those elderly
            console.log('[matchingService] Auto-ending other pre-matches for youth:', application.youth_id);
            await this.endOtherPreMatchesOnApproval(application.youth_id, applicationId, youthName);

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
     * End other pre-matches when an application is approved
     * Sends apology notification to other elderly and removes chat from their list
     */
    async endOtherPreMatchesOnApproval(youthId: string, approvedApplicationId: string, youthName: string): Promise<void> {
        // Get all active pre-matches for this youth (excluding the approved one)
        const allApplications = await matchingRepository.getYouthApplications(youthId);
        const otherActivePreMatches = allApplications.filter(app =>
            app.id !== approvedApplicationId &&
            (app.status === 'pre_chat_active' || app.status === 'pending_review')
        );

        console.log('[matchingService] Found', otherActivePreMatches.length, 'other pre-matches to end');

        // End each pre-match and notify the elderly
        for (const app of otherActivePreMatches) {
            try {
                // Update application status to 'withdrawn' (ended by system)
                await matchingRepository.updateApplicationStatus(app.id, 'withdrawn');

                // Send apology notification to elderly
                await notificationRepository.createNotification({
                    user_id: app.elderly_id,
                    type: 'prematch_ended',
                    title: 'Pre-Match Ended',
                    message: `${youthName} has been matched with another elderly and is no longer available. Thank you for your understanding! 💙`,
                    reference_id: app.id,
                    reference_table: 'applications',
                });

                console.log('[matchingService] Ended pre-match and notified elderly:', app.elderly_id);
            } catch (error) {
                console.error('[matchingService] Failed to end pre-match:', app.id, error);
            }
        }
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
    },

    /**
     * Get applications pending elderly review (status = 'approved')
     * Called after admin approves, waiting for elderly decision
     */
    async getApplicationsPendingElderlyReview(elderlyId: string): Promise<Interest[]> {
        return await matchingRepository.getApplicationsPendingElderlyReview(elderlyId);
    },

    /**
     * Elderly responds to admin-approved application
     * Called when application status is 'approved' (after admin approval)
     * 
     * @param applicationId - Application ID
     * @param elderlyId - Elderly user ID (for verification)
     * @param decision - 'accept' or 'reject'
     * @param rejectReason - Optional rejection reason
     */
    async elderlyRespondToApprovedApplication(
        applicationId: string,
        elderlyId: string,
        decision: 'accept' | 'reject',
        rejectReason?: string
    ): Promise<Interest> {
        console.log('[matchingService] elderlyRespondToApprovedApplication', { applicationId, elderlyId, decision });

        // Verify the application
        const application = await matchingRepository.getApplicationById(applicationId);
        if (!application) {
            throw new Error('Application not found');
        }
        if (application.elderly_id !== elderlyId) {
            throw new Error('You are not authorized to review this application');
        }
        if (application.status !== 'approved') {
            throw new Error(`This application is not awaiting your review. Current status: ${application.status}`);
        }

        // Update application via repository
        const updated = await matchingRepository.elderlyRespondToApprovedApplication(
            applicationId,
            decision === 'accept' ? 'accept' : 'decline',
            rejectReason
        );

        const elderlyName = application.elderly?.full_name || 'The Elderly';
        const youthName = application.youth?.full_name || 'The Youth';

        if (decision === 'accept') {
            // Notify youth of success
            await notificationRepository.createNotification({
                user_id: application.youth_id,
                type: 'application_approved',
                title: 'Application Approved! 🎉',
                message: `${elderlyName} has accepted your application. Welcome to the bonding stage!`,
                reference_id: applicationId,
                reference_table: 'applications',
            });

            // Create relationship record
            console.log('[matchingService] Creating relationship for approved application');
            try {
                const { supabase } = await import('../APIService/supabase');
                await supabase.from('relationships').insert({
                    youth_id: application.youth_id,
                    elderly_id: application.elderly_id,
                    application_id: applicationId,
                    current_stage: 'getting_to_know',
                    status: 'active',
                });
                console.log('[matchingService] Relationship created successfully');
            } catch (error) {
                console.error('[matchingService] Failed to create relationship:', error);
            }

            // Auto-end other pre-matches for this youth
            await this.endOtherPreMatchesOnApproval(application.youth_id, applicationId, youthName);

        } else {
            // Notify youth of rejection with optional reason
            const reasonText = rejectReason
                ? `Reason: ${rejectReason}`
                : 'Please confirm to close this chat.';

            await notificationRepository.createNotification({
                user_id: application.youth_id,
                type: 'application_rejected',
                title: 'Application Not Approved',
                message: `${elderlyName} has decided not to proceed with your application. ${reasonText}`,
                reference_id: applicationId,
                reference_table: 'applications',
            });
        }

        console.log('[matchingService] Elderly response processed:', decision);
        return updated;
    },

    /**
     * Youth confirms rejection and deletes the application/chat
     * Called after youth sees rejection notification
     */
    async confirmAndDeleteRejectedApplication(
        applicationId: string,
        youthId: string
    ): Promise<void> {
        console.log('[matchingService] confirmAndDeleteRejectedApplication', { applicationId, youthId });

        // Verify the application
        const application = await matchingRepository.getApplicationById(applicationId);
        if (!application) {
            throw new Error('Application not found');
        }
        if (application.youth_id !== youthId) {
            throw new Error('You are not authorized to delete this application');
        }
        if (application.status !== 'rejected') {
            throw new Error('This application is not in rejected status');
        }

        // Delete application and messages
        await matchingRepository.deleteApplication(applicationId);
        console.log('[matchingService] Application deleted successfully');
    }
};

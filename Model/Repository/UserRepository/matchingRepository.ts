import { supabase } from '../../Service/APIService/supabase';
import { User, Application } from '../../types';
import { RealtimeChannel } from '@supabase/supabase-js';

// We map "Interest" to an Application record with specific status
export interface Interest extends Application {
    youth?: User;
    elderly?: User;
}

/**
 * Filter options for elderly profiles (UC101_C6)
 */
export interface ElderlyFilters {
    interests?: string[];
    location?: string;
    languages?: string[];
    ageRange?: { min: number; max: number };
    offset?: number;
    limit?: number;
}

/**
 * Result with pagination info
 */
export interface ElderlyProfilesResult {
    profiles: User[];
    totalCount: number;
    hasMore: boolean;
}

export const matchingRepository = {
    /**
     * Fetch available elderly profiles with filters and pagination
     * Excludes elderly users who are already in active relationships
     */
    async getAvailableElderlyProfiles(
        filters?: ElderlyFilters,
        youthProfile?: User
    ): Promise<ElderlyProfilesResult> {
        const limit = filters?.limit || 10;
        const offset = filters?.offset || 0;

        // First, get elderly IDs that are in active relationships (to exclude)
        const { data: activeRelationships, error: relError } = await supabase
            .from('relationships')
            .select('elderly_id')
            .eq('status', 'active');

        if (relError) throw relError;
        const excludedElderlyIds = (activeRelationships || []).map(r => r.elderly_id);

        // Build main query
        let query = supabase
            .from('users')
            .select('*', { count: 'exact' })
            .eq('user_type', 'elderly')
            .eq('is_active', true);

        // Exclude elderly in active relationships
        if (excludedElderlyIds.length > 0) {
            query = query.not('id', 'in', `(${excludedElderlyIds.join(',')})`);
        }

        // Apply location filter
        if (filters?.location) {
            query = query.ilike('location', `%${filters.location}%`);
        }

        // Apply language filter (contains any of the selected languages)
        if (filters?.languages && filters.languages.length > 0) {
            query = query.overlaps('languages', filters.languages);
        }

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        let profiles = data || [];

        // Post-query filtering for interests (in profile_data jsonb)
        if (filters?.interests && filters.interests.length > 0) {
            profiles = profiles.filter(user => {
                const userInterests = user.profile_data?.interests || [];
                return filters.interests!.some(interest =>
                    userInterests.includes(interest)
                );
            });
        }

        // Post-query filtering for age range (based on verified_age)
        if (filters?.ageRange) {
            profiles = profiles.filter(user => {
                const age = user.profile_data?.verified_age;
                if (!age) return true; // Include if age unknown
                return age >= filters.ageRange!.min && age <= filters.ageRange!.max;
            });
        }

        return {
            profiles,
            totalCount: count || 0,
            hasMore: (offset + profiles.length) < (count || 0)
        };
    },

    /**
     * Get incoming interests (Mapped to Applications pending review/decision)
     * Fetches full youth details using the youth_id foreign key relation.
     */
    async getIncomingInterests(elderlyId: string): Promise<Interest[]> {
        const { data, error } = await supabase
            .from('applications')
            // Select all application fields AND the joined youth table/object
            .select('*, youth:youth_id(*)')
            .eq('elderly_id', elderlyId)
            .eq('elderly_decision', 'pending')
            // Now using the correct status for interests based on updated DB constraint
            .eq('status', 'pending_interest')
            .order('applied_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get applications for a youth (To show status updates/notifications)
     */
    async getYouthApplications(youthId: string): Promise<Interest[]> {
        const { data, error } = await supabase
            .from('applications')
            .select('*, elderly:elderly_id(*)')
            .eq('youth_id', youthId)
            .order('applied_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get all applications for an elderly (including accepted ones for chat list)
     */
    async getElderlyApplications(elderlyId: string): Promise<Interest[]> {
        const { data, error } = await supabase
            .from('applications')
            .select('*, youth:youth_id(*)')
            .eq('elderly_id', elderlyId)
            .order('applied_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get application by ID with user details
     * Used by Service layer to fetch application details
     */
    async getApplicationById(applicationId: string): Promise<Interest> {
        const { data, error } = await supabase
            .from('applications')
            .select('*, youth:youth_id(*), elderly:elderly_id(*)')
            .eq('id', applicationId)
            .single();

        if (error) throw error;
        return data as Interest;
    },

    /**
     * Create an Interest (Creates a new Application)
     */
    async createInterest(youthId: string, elderlyId: string): Promise<Interest> {
        const { data, error } = await supabase
            .from('applications')
            .insert({
                youth_id: youthId,
                elderly_id: elderlyId,
                motivation_letter: 'Expressing Interest', // Default placeholder
                status: 'pending_interest', // Correct status now available
                youth_decision: 'accept', // Youth initiated it
                elderly_decision: 'pending',
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update interest status (Accept/Decline)
     * Repository ONLY handles database operations
     * Business logic (welcome messages) moved to Service layer
     */
    async updateInterestStatus(
        interestId: string,
        elderlyDecision: 'accept' | 'decline',
        newStatus: string
    ): Promise<Interest> {
        console.log('[Repo] updateInterestStatus', { interestId, elderlyDecision, newStatus });

        // Update application status
        const { data, error } = await supabase
            .from('applications')
            .update({
                elderly_decision: elderlyDecision,
                status: newStatus,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', interestId)
            .select('*, youth:youth_id(*), elderly:elderly_id(*)')
            .single();

        console.log('[Repo] update result', { data, error });
        if (error) throw error;

        return data as Interest;
    },

    /**
     * Count active pre-matches for limit checking
     */
    async getActivePreMatchCount(userId: string, userType: 'youth' | 'elderly'): Promise<number> {
        const column = userType === 'youth' ? 'youth_id' : 'elderly_id';

        const { count, error } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq(column, userId)
            .eq('status', 'pre_chat_active');

        if (error) throw error;
        return count || 0;
    },

    /**
     * Get all active pre-match applications (for batch expiration)
     * UC104 A7: Used by expireOverduePreMatches service function
     */
    async getActivePreMatchApplications(): Promise<Interest[]> {
        const { data, error } = await supabase
            .from('applications')
            .select('*, youth:youth_id(*), elderly:elderly_id(*)')
            .eq('status', 'pre_chat_active');

        if (error) {
            console.error('[matchingRepository] Error fetching active pre-matches:', error);
            throw error;
        }

        return data || [];
    },
    /**
     *  Subscribe to incoming interests for elderly
     */
    subscribeToIncomingInterests(
        elderlyId: string,
        onInsert: (interest: Interest) => void
    ): RealtimeChannel {
        const channel = supabase
            .channel('incoming-requests-' + elderlyId)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'applications',
                filter: `elderly_id=eq.${elderlyId}`,
            }, (payload) => {
                const row = payload.new as Interest;
                if (row.status === 'pending_interest' && row.elderly_decision === 'pending') {
                    onInsert(row);
                }
            })
            .subscribe();
        return channel;
    },
    /**
    * Subscribe to application updates for youth
    */
    subscribeToApplicationUpdates(
        youthId: string,
        onUpdate: (application: Interest) => void
    ): RealtimeChannel {
        const channel = supabase
            .channel('youth-updates-' + youthId)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'applications',
                filter: `youth_id=eq.${youthId}`,
            }, (payload) => {
                const updated = payload.new as Interest;
                onUpdate(updated);
            })
            .subscribe();

        return channel;
    },
    /**
     * Subscribe to notifications table for real-time updates
     * UC101_4: Youth receives notification when elderly accepts
     */
    subscribeToNotifications(
        userId: string,
        onInsert: (notification: any) => void
    ): RealtimeChannel {
        const channel = supabase
            .channel('notifications-' + userId)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`,
            }, (payload) => {
                const notification = payload.new;
                onInsert(notification);
            })
            .subscribe();
        return channel;
    },

    /**
     * Unsubscribe from a channel
    */
    unsubscribe(channel: RealtimeChannel): void {
        supabase.removeChannel(channel);
    },

    /**
     * Update application status
     * UC104_7: Mark pre-match as ended
     */
    async updateApplicationStatus(applicationId: string, newStatus: string): Promise<Interest> {
        const { data, error } = await supabase
            .from('applications')
            .update({
                status: newStatus,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', applicationId)
            .select('*, youth:youth_id(*), elderly:elderly_id(*)')
            .single();

        if (error) throw error;
        return data as Interest;
    },

    /**
     * Update youth decision
     * UC101_12: Youth submits formal application decision
     */
    async updateYouthDecision(applicationId: string, decision: 'accept' | 'decline' | 'pending'): Promise<Interest> {
        const { data, error } = await supabase
            .from('applications')
            .update({
                youth_decision: decision,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', applicationId)
            .select('*, youth:youth_id(*), elderly:elderly_id(*)')
            .single();

        if (error) throw error;
        return data as Interest;
    },

    /**
     * Update elderly decision
     * UC102: Elderly decides on application
     */
    async updateElderlyDecision(applicationId: string, decision: 'accept' | 'decline' | 'pending'): Promise<Interest> {
        const { data, error } = await supabase
            .from('applications')
            .update({
                elderly_decision: decision,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', applicationId)
            .select('*, youth:youth_id(*), elderly:elderly_id(*)')
            .single();

        if (error) throw error;
        return data as Interest;
    },

    /**
     * Submit formal application with motivation letter
     * UC101_12: Youth submits formal adoption application
     */
    async submitFormalApplication(
        applicationId: string,
        motivationLetter: string,
        additionalData?: {
            availability?: string;
            commitmentLevel?: string;
            whatCanOffer?: string;
        }
    ): Promise<Interest> {
        console.log('🔵 [Repo] submitFormalApplication START', { applicationId, motivationLetterLength: motivationLetter.length });

        const { data, error } = await supabase
            .from('applications')
            .update({
                motivation_letter: motivationLetter,
                status: 'pending_review',
                youth_decision: 'accept',
                reviewed_at: new Date().toISOString()
            })
            .eq('id', applicationId)
            .select('*, youth:youth_id(*), elderly:elderly_id(*)')
            .single();

        console.log('🔵 [Repo] submitFormalApplication supabase result:', { data: data?.id, error });

        if (error) {
            console.error('❌ [Repo] submitFormalApplication error:', error);
            throw error;
        }

        console.log('✅ [Repo] submitFormalApplication SUCCESS');
        return data as Interest;
    },

    /**
     * Get youth's pending applications (status = pending_review)
     * Used to prevent multiple simultaneous applications
     */
    async getYouthPendingApplications(youthId: string): Promise<Interest[]> {
        const { data, error } = await supabase
            .from('applications')
            .select('*, elderly:elderly_id(*)')
            .eq('youth_id', youthId)
            .eq('status', 'pending_review');

        if (error) throw error;
        return data || [];
    },

    /**
     * Elderly responds to admin-approved application
     * Called after admin approves (status = 'approved')
     */
    async elderlyRespondToApprovedApplication(
        applicationId: string,
        decision: 'accept' | 'decline',
        rejectReason?: string
    ): Promise<Interest> {
        console.log('[Repo] elderlyRespondToApprovedApplication', { applicationId, decision });

        const updateData: any = {
            elderly_decision: decision,
            status: decision === 'accept' ? 'both_accepted' : 'rejected',
            reviewed_at: new Date().toISOString()
        };

        // Store rejection reason in ngo_notes field (optional)
        if (decision === 'decline' && rejectReason) {
            updateData.ngo_notes = `Elderly rejection reason: ${rejectReason}`;
        }

        const { data, error } = await supabase
            .from('applications')
            .update(updateData)
            .eq('id', applicationId)
            .select('*, youth:youth_id(*), elderly:elderly_id(*)')
            .single();

        if (error) throw error;
        return data as Interest;
    },

    /**
     * Get applications pending elderly review (status = 'approved')
     * After admin approval, elderly needs to review
     */
    async getApplicationsPendingElderlyReview(elderlyId: string): Promise<Interest[]> {
        const { data, error } = await supabase
            .from('applications')
            .select('*, youth:youth_id(*)')
            .eq('elderly_id', elderlyId)
            .eq('status', 'approved')
            .order('reviewed_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Delete application and related messages
     * Called when youth confirms rejection
     */
    async deleteApplication(applicationId: string): Promise<void> {
        console.log('[Repo] deleteApplication', { applicationId });

        // First delete messages related to this application
        const { error: msgError } = await supabase
            .from('messages')
            .delete()
            .eq('application_id', applicationId);

        if (msgError) {
            console.error('[Repo] Error deleting messages:', msgError);
            throw msgError;
        }

        // Then delete the application
        const { error: appError } = await supabase
            .from('applications')
            .delete()
            .eq('id', applicationId);

        if (appError) {
            console.error('[Repo] Error deleting application:', appError);
            throw appError;
        }

        console.log('[Repo] Application and messages deleted successfully');
    }
};
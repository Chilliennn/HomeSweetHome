import { supabase } from '../../Service/APIService/supabase';
import { User, Application } from '../../types';
import { RealtimeChannel } from '@supabase/supabase-js';
// We map "Interest" to an Application record with specific status
export interface Interest extends Application {
    youth?: User;
    elderly?: User;
}

export const matchingRepository = {
    /**
     * Fetch available elderly profiles
     */
    async getAvailableElderlyProfiles(filters?: any): Promise<User[]> {
        let query = supabase
            .from('users')
            .select('*')
            .eq('user_type', 'elderly')
            .eq('is_active', true);

        // placeholder for filter
        if (filters?.location) {
            // query = query.eq('location', filters.location);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
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
     * UC101_9: Creates pre-match communication session when elderly accepts
     */
    async updateInterestStatus(interestId: string, status: 'accepted' | 'declined'): Promise<void> {
        
        const updates: any = {
            elderly_decision: status === 'accepted' ? 'accept' : 'decline',
            reviewed_at: new Date().toISOString()
        };

        if (status === 'accepted') {
            // If accepted, move to pre-chat
            updates.status = 'pre_chat_active';
        } else {
            updates.status = 'rejected';
        }
        console.log('🔵 [Repo] updateInterestStatus', { interestId, status });
        // Get application details before update (for welcome message)
        const { data: application, error: fetchError } = await supabase
            .from('applications')
            .select('youth_id, elderly_id')
            .eq('id', interestId)
            .single();
        console.log('🔵 [Repo] fetched application for welcome', { application, fetchError });
        if (fetchError) {
            console.log('🛑 [Repo] fetchError', fetchError);
            throw fetchError;
        }

        // Update application status
        const { error } = await supabase
            .from('applications')
            .update(updates)
            .eq('id', interestId);
        console.log('🔵 [Repo] update result', error);
        if (error) throw error;

        // UC101_9: Create welcome message when elderly accepts
        if (status === 'accepted' && application) {
            console.log('🔵 [Repo] calling communicationService.createWelcomeMessage');
            // Import here to avoid circular dependency
            const { communicationService } = await import('../../Service/CoreService/communicationService');
            await communicationService.createWelcomeMessage(
                interestId,
                application.youth_id,
                application.elderly_id
            );
        }
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
     *  Subscribe to incoming interests for elderly
     */
    subscribeToIncomingInterests(
        elderlyId: string,
        onInsert: (interest: Interest) => void
    ) : RealtimeChannel{
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
    }
};
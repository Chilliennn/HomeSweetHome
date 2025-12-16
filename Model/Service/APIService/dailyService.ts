import { supabase } from './supabase';

/**
 * dailyService - Handles interaction with Daily.co API via Supabase Edge Functions
 * 
 * Responsibilities:
 * - Create rooms for video/voice calls
 * - Manage room tokens (if needed in future)
 */
export const dailyService = {
    /**
     * Create a new Daily.co room
     * Calls the 'create-daily-room' Edge Function
     */
    async createRoom(): Promise<{ url: string; name: string }> {
        try {
            const { data, error } = await supabase.functions.invoke('create-daily-room', {
                body: {},
            });

            if (error) {
                console.error('[dailyService] Edge Function error:', error);
                throw new Error(`Failed to create call room: ${error.message}`);
            }

            if (!data || !data.url) {
                console.error('[dailyService] Invalid response:', data);
                throw new Error('Invalid response from daily service');
            }

            return {
                url: data.url,
                name: data.name,
            };
        } catch (error) {
            console.error('[dailyService] createRoom error:', error);
            throw error;
        }
    },
};

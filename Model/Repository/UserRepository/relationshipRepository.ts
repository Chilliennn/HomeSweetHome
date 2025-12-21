import { supabase } from '../../Service/APIService/supabase'
import type { User } from '../../types';

/**
 * Relationship type from DB
 */
export interface Relationship {
    id: string;
    youth_id: string;
    elderly_id: string;
    application_id: string;
    current_stage: 'getting_to_know' | 'trial_period' | 'official_ceremony' | 'family_life';
    stage_start_date: string;
    stage_metrics: {
        message_count: number;
        active_days: number;
        video_calls: number;
        meetings: number;
        progress_percentage: number;
        requirements_met: boolean;
    };
    status: 'active' | 'paused' | 'ended';
    risk_level: 'healthy' | 'caution' | 'critical'; // Auto-calculated or manually set
    risk_level_manual: boolean; // True if admin manually set, false if auto-calculated
    last_message_at: string | null; // Timestamp of last message for auto-calculation
    updated_at: string;
    family_name: string | null;
    ceremony_date: string | null;
    certificate_url: string | null;
    created_at: string;
    ended_at: string | null;
    // Additional fields for admin monitoring
    last_message_at?: string;
    risk_level?: 'healthy' | 'caution' | 'critical';
    // Populated relations
    youth?: User;
    elderly?: User;
}

/**
 * relationshipRepository - Handles relationship data access
 * 
 * MVVM Architecture:
 * - Repository layer: Data access only, no business logic
 * - Returns raw data from relationships table
 * - Used by Services for business operations
 */
export const relationshipRepository = {
    /**
     * Get all relationships (for admin monitoring)
     */
    async getAllRelationships(): Promise<Relationship[]> {
        const { data, error } = await supabase
            .from('relationships')
            .select('*, youth:youth_id(*), elderly:elderly_id(*)')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return (data || []) as Relationship[];
    },

    /**
     * Get active relationship for a user (youth or elderly)
     */
    async getActiveRelationshipByUserId(userId: string): Promise<Relationship | null> {
        const { data, error } = await supabase
            .from('relationships')
            .select('*, youth:youth_id(*), elderly:elderly_id(*)')
            .or(`youth_id.eq.${userId},elderly_id.eq.${userId}`)
            .eq('status', 'active')
            .maybeSingle();

        if (error) throw error;
        return data as Relationship | null;
    },

    /**
     * Get relationship by application ID
     */
    async getRelationshipByApplicationId(applicationId: string): Promise<Relationship | null> {
        const { data, error } = await supabase
            .from('relationships')
            .select('*, youth:youth_id(*), elderly:elderly_id(*)')
            .eq('application_id', applicationId)
            .maybeSingle();

        if (error) throw error;
        return data as Relationship | null;
    },

    /**
     * Get relationship by ID
     */
    async getRelationshipById(relationshipId: string): Promise<Relationship | null> {
        const { data, error } = await supabase
            .from('relationships')
            .select('*, youth:youth_id(*), elderly:elderly_id(*)')
            .eq('id', relationshipId)
            .single();

        if (error) throw error;
        return data as Relationship;
    },

    /**
     * Get all relationships (for admin dashboard)
     */
    async getAllRelationships(): Promise<Relationship[]> {
        const { data, error } = await supabase
            .from('relationships')
            .select('*, youth:youth_id(*), elderly:elderly_id(*)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[relationshipRepository] Error fetching all relationships:', error);
            throw error;
        }
        return (data as Relationship[]) || [];
    },
};

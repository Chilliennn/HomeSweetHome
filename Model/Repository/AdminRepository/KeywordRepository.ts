// Model/Repository/AdminRepository/KeywordRepository.ts
import { SupabaseClient } from "@supabase/supabase-js";

export interface KeywordDashboardStats {
    activeKeywordCount: number;
    keywordsAddedThisWeek: number;
    detectionsToday: number;
    suggestionsRemaining: number;
}

export interface KeywordSuggestionRecord {
    id: string;
    keyword: string;
    category: string;
    severity: "low" | "medium" | "high" | "critical";
    detection_count_last_7_days: number;
    status: "pending" | "accepted" | "rejected";
    created_at: string;
}

export interface KeywordRecord {
    id: string;
    keyword: string;
    category: string;
    severity: "low" | "medium" | "high" | "critical";
    is_active: boolean;
    created_at: string;
}

export class KeywordRepository {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async fetchDashboardStats(): Promise<KeywordDashboardStats> {
        // Get active keyword count
        const { count: activeCount, error: activeError } = await this.supabase
            .from('keywords')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        if (activeError) {
            console.error('Error fetching active keywords count:', activeError);
        }

        // Get keywords added this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { count: weekCount, error: weekError } = await this.supabase
            .from('keywords')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', oneWeekAgo.toISOString());

        if (weekError) {
            console.error('Error fetching keywords added this week:', weekError);
        }

        // Get pending suggestions count
        const { count: suggestionsCount, error: suggestionsError } = await this.supabase
            .from('keyword_suggestions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        if (suggestionsError) {
            console.error('Error fetching suggestions count:', suggestionsError);
        }

        return {
            activeKeywordCount: activeCount || 0,
            keywordsAddedThisWeek: weekCount || 0,
            detectionsToday: 0, // TODO: Implement detection tracking
            suggestionsRemaining: suggestionsCount || 0,
        };
    }

    async fetchKeywordSuggestions(): Promise<KeywordSuggestionRecord[]> {
        const { data, error } = await this.supabase
            .from('keyword_suggestions')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching keyword suggestions:', error);
            throw new Error('Failed to fetch suggestions. Please try again.');
        }

        return data || [];
    }

    async fetchKeywords(): Promise<KeywordRecord[]> {
        const { data, error } = await this.supabase
            .from('keywords')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching keywords:', error);
            throw new Error('Failed to fetch keywords. Please try again.');
        }

        return data || [];
    }

    async acceptSuggestion(id: string): Promise<void> {
        // Update suggestion status to accepted
        const { error } = await this.supabase
            .from('keyword_suggestions')
            .update({ status: 'accepted' })
            .eq('id', id);

        if (error) {
            console.error('Error accepting suggestion:', error);
            throw new Error('Failed to accept suggestion. Please try again.');
        }

        // TODO: Optionally add the keyword to the keywords table
    }

    async rejectSuggestion(id: string): Promise<void> {
        const { error } = await this.supabase
            .from('keyword_suggestions')
            .update({ status: 'rejected' })
            .eq('id', id);

        if (error) {
            console.error('Error rejecting suggestion:', error);
            throw new Error('Failed to reject suggestion. Please try again.');
        }
    }

    async addKeyword(keyword: string, category_id: string, severity: string): Promise<void> {
        const { error } = await this.supabase
            .from('keywords')
            .insert({
                keyword,
                category_id,
                severity,
                is_active: true,
            });

        if (error) {
            console.error('Error adding keyword:', error);
            throw new Error('Failed to add keyword. Please try again.');
        }
    }

    async updateKeyword(id: string, data: { keyword: string; category_id: string; severity: string }): Promise<void> {
        const { error } = await this.supabase
            .from('keywords')
            .update({
                keyword: data.keyword,
                category_id: data.category_id,
                severity: data.severity,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            console.error('Error updating keyword:', error);
            throw new Error('Failed to update keyword. Please try again.');
        }
    }

    async deleteKeyword(id: string): Promise<void> {
        // Soft delete: set is_active to false instead of actually deleting
        const { error } = await this.supabase
            .from('keywords')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Error deleting keyword:', error);
            throw new Error('Failed to delete keyword. Please try again.');
        }
    }
}

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
        // For now, return mock data until Supabase tables are set up
        return {
            activeKeywordCount: 48,
            keywordsAddedThisWeek: 3,
            detectionsToday: 23,
            suggestionsRemaining: 5,
        };
    }

    async fetchKeywordSuggestions(): Promise<KeywordSuggestionRecord[]> {
        // For now, return mock data until Supabase tables are set up
        return [
            {
                id: "1",
                keyword: "bank details",
                category: "Financial Exploitation",
                severity: "critical",
                detection_count_last_7_days: 12,
                status: "pending",
                created_at: new Date().toISOString(),
            },
            {
                id: "2",
                keyword: "password reset",
                category: "Personal Information",
                severity: "high",
                detection_count_last_7_days: 8,
                status: "pending",
                created_at: new Date().toISOString(),
            },
        ];
    }

    async fetchKeywords(): Promise<KeywordRecord[]> {
        // For now, return mock data until Supabase tables are set up
        return [];
    }

    async acceptSuggestion(id: string): Promise<void> {
        console.log(`Accepting suggestion ${id}`);
        // TODO: Implement with Supabase
    }

    async rejectSuggestion(id: string): Promise<void> {
        console.log(`Rejecting suggestion ${id}`);
        // TODO: Implement with Supabase
    }

    async addKeyword(keyword: string, category: string, severity: string): Promise<void> {
        console.log(`Adding keyword: ${keyword}, ${category}, ${severity}`);
        // TODO: Implement with Supabase
    }

    async updateKeyword(id: string, data: { keyword: string; category: string; severity: string }): Promise<void> {
        console.log(`Updating keyword ${id}:`, data);
        // TODO: Implement with Supabase
    }

    async deleteKeyword(id: string): Promise<void> {
        console.log(`Deleting keyword ${id}`);
        // TODO: Implement with Supabase
    }
}

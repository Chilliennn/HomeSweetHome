import { makeAutoObservable } from 'mobx';
import { supabase } from '../../Model/Service/APIService/supabase';
import { KeywordSuggestionService } from '../../Model/Service/CoreService/KeywordSuggestionService';
import { KeywordRepository } from '../../Model/Repository/AdminRepository/KeywordRepository';

// Define KeywordRecord type locally (matches database schema)
export interface KeywordRecord {
    id: string;
    keyword: string;
    category: string;
    category_id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface KeywordSuggestion {
    id: string;
    keyword: string;
    category: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    detectionSummary: string;
}

export interface KeywordStats {
    activeKeywordCount: number;
    suggestionsRemaining: number;
    detectionsToday: number;
    keywordsAddedThisWeek: number;
}

export class KeywordManagementViewModel {
    activeKeywords: KeywordRecord[] = [];
    suggestions: KeywordSuggestion[] = [];
    stats: KeywordStats | null = null;
    isLoading: boolean = false;
    isMutating: boolean = false;
    errorMessage: string | null = null;
    activeModal: 'add' | 'edit' | 'delete' | null = null;
    selectedKeyword: KeywordRecord | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    async loadDashboard(): Promise<void> {
        this.isLoading = true;
        try {
            // Get real detections count from database
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { count: detectionsCount, error: detectionsError } = await supabase
                .from('keyword_detections')
                .select('*', { count: 'exact', head: true })
                .gte('detected_at', today.toISOString());

            if (detectionsError) {
                console.warn('[KeywordManagementVM] Error fetching detections:', detectionsError);
            }

            // Get keywords added this week
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const { count: weekCount, error: weekError } = await supabase
                .from('keywords')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', oneWeekAgo.toISOString());

            if (weekError) {
                console.warn('[KeywordManagementVM] Error fetching week count:', weekError);
            }

            // Update stats with real data
            this.stats = {
                activeKeywordCount: this.activeKeywords.length,
                suggestionsRemaining: this.suggestions.length,
                detectionsToday: detectionsCount || 0,
                keywordsAddedThisWeek: weekCount || 0
            };
        } catch (error) {
            console.error('[KeywordManagementVM] Error loading dashboard:', error);
            this.errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard';
        } finally {
            this.isLoading = false;
        }
    }

    async loadActiveKeywords(): Promise<void> {
        this.isLoading = true;
        try {
            // Map category_id to category name
            const categoryIdToName: Record<string, string> = {
                '1': 'Financial Exploitation',
                '2': 'Personal Information',
                '3': 'Inappropriate Content',
                '4': 'Abuse & Harassment'
            };

            // Fetch active keywords from Supabase
            const { data, error } = await supabase
                .from('keywords')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.activeKeywords = (data || []).map((row: any) => ({
                id: row.id,
                keyword: row.keyword,
                // Use stored category name OR map from category_id
                category: row.category || categoryIdToName[row.category_id] || 'Financial Exploitation',
                category_id: row.category_id || '1',
                severity: row.severity || 'medium',
                is_active: row.is_active ?? true,
                created_at: row.created_at,
                updated_at: row.updated_at || row.created_at
            }));

            // Update stats after loading
            this.updateStats();
        } catch (error) {
            console.error('[KeywordManagementVM] Error loading keywords:', error);
            this.errorMessage = error instanceof Error ? error.message : 'Failed to load keywords';
        } finally {
            this.isLoading = false;
        }
    }

    async loadSuggestions(): Promise<void> {
        this.isLoading = true;
        try {
            // Fetch pending keyword suggestions from Supabase
            const { data, error } = await supabase
                .from('keyword_suggestions')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.suggestions = (data || []).map((row: any) => ({
                id: row.id,
                keyword: row.keyword,
                category: row.category || 'Financial Exploitation',
                severity: row.severity || 'Medium',
                detectionSummary: row.detection_summary || `Detected ${row.detection_count || 0} times`
            }));

            // Update stats after loading
            this.updateStats();
        } catch (error) {
            console.error('[KeywordManagementVM] Error loading suggestions:', error);
            this.errorMessage = error instanceof Error ? error.message : 'Failed to load suggestions';
        } finally {
            this.isLoading = false;
        }
    }



    async generateSuggestions(): Promise<void> {
        this.isMutating = true;
        this.errorMessage = null;
        try {
            console.log('[KeywordManagementVM] Starting AI chat analysis...');

            // Create service instances
            const keywordRepo = new KeywordRepository(supabase);
            const suggestionService = new KeywordSuggestionService(keywordRepo);

            // Run AI analysis on messages from last 30 days
            const suggestionsGenerated = await suggestionService.runSuggestionGeneration(30);

            console.log(`[KeywordManagementVM] AI generated ${suggestionsGenerated} new suggestions`);

            // Reload suggestions to show new ones
            await this.loadSuggestions();

            // Update dashboard stats
            await this.loadDashboard();
        } catch (error) {
            console.error('[KeywordManagementVM] AI analysis error:', error);
            this.errorMessage = error instanceof Error ? error.message : 'Failed to generate suggestions';
        } finally {
            this.isMutating = false;
        }
    }

    async addKeyword(keyword: string, category: string, severity: 'Low' | 'Medium' | 'High' | 'Critical'): Promise<void> {
        this.isMutating = true;
        try {
            // Map category name to ID
            const categoryMap: Record<string, string> = {
                'Financial Exploitation': '1',
                'Personal Information': '2',
                'Inappropriate Content': '3',
                'Abuse & Harassment': '4'
            };
            const category_id = categoryMap[category] || '1';

            // Insert into Supabase
            const { error } = await supabase
                .from('keywords')
                .insert({
                    keyword,
                    category_id,
                    severity: severity.toLowerCase(),
                    is_active: true,
                });

            if (error) throw error;

            // Reload from database to get the new keyword with proper ID
            await this.loadActiveKeywords();
            this.setModalState(null);
        } catch (error) {
            console.error('[KeywordManagementVM] Error adding keyword:', error);
            this.errorMessage = error instanceof Error ? error.message : 'Failed to add keyword';
        } finally {
            this.isMutating = false;
        }
    }

    async updateKeyword(id: string, keyword: string, category: string, severity: 'Low' | 'Medium' | 'High' | 'Critical'): Promise<void> {
        this.isMutating = true;
        try {
            // Map category name to ID
            const categoryMap: Record<string, string> = {
                'Financial Exploitation': '1',
                'Personal Information': '2',
                'Inappropriate Content': '3',
                'Abuse & Harassment': '4'
            };
            const category_id = categoryMap[category] || '1';

            // Update in Supabase
            const { error } = await supabase
                .from('keywords')
                .update({
                    keyword,
                    category_id,
                    severity: severity.toLowerCase(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) throw error;

            // Reload from database
            await this.loadActiveKeywords();
            this.setModalState(null);
        } catch (error) {
            console.error('[KeywordManagementVM] Error updating keyword:', error);
            this.errorMessage = error instanceof Error ? error.message : 'Failed to update keyword';
        } finally {
            this.isMutating = false;
        }
    }

    async deleteKeyword(id: string): Promise<void> {
        this.isMutating = true;
        try {
            // Soft delete: set is_active to false
            const { error } = await supabase
                .from('keywords')
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            // Reload from database
            await this.loadActiveKeywords();
            this.setModalState(null);
        } catch (error) {
            console.error('[KeywordManagementVM] Error deleting keyword:', error);
            this.errorMessage = error instanceof Error ? error.message : 'Failed to delete keyword';
        } finally {
            this.isMutating = false;
        }
    }

    async acceptSuggestion(suggestionId: string): Promise<void> {
        this.isMutating = true;
        try {
            const suggestion = this.suggestions.find(s => s.id === suggestionId);
            if (suggestion) {
                // Add keyword to database
                await this.addKeyword(suggestion.keyword, suggestion.category, suggestion.severity);

                // Mark suggestion as accepted in database
                const { error } = await supabase
                    .from('keyword_suggestions')
                    .update({ status: 'accepted' })
                    .eq('id', suggestionId);

                if (error) throw error;

                // Reload suggestions
                await this.loadSuggestions();
            }
        } catch (error) {
            console.error('[KeywordManagementVM] Error accepting suggestion:', error);
            this.errorMessage = error instanceof Error ? error.message : 'Failed to accept suggestion';
        } finally {
            this.isMutating = false;
        }
    }

    async rejectSuggestion(suggestionId: string): Promise<void> {
        this.isMutating = true;
        try {
            // Mark suggestion as rejected in database
            const { error } = await supabase
                .from('keyword_suggestions')
                .update({ status: 'rejected' })
                .eq('id', suggestionId);

            if (error) throw error;

            // Reload suggestions
            await this.loadSuggestions();
        } catch (error) {
            console.error('[KeywordManagementVM] Error rejecting suggestion:', error);
            this.errorMessage = error instanceof Error ? error.message : 'Failed to reject suggestion';
        } finally {
            this.isMutating = false;
        }
    }

    setModalState(modal: 'add' | 'edit' | 'delete' | null, keyword?: KeywordRecord): void {
        this.activeModal = modal;
        this.selectedKeyword = keyword || null;
    }

    private updateStats(): void {
        if (this.stats) {
            this.stats.activeKeywordCount = this.activeKeywords.length;
            this.stats.suggestionsRemaining = this.suggestions.length;
        }
    }
}

// Singleton instance
export const keywordManagementViewModel = new KeywordManagementViewModel();

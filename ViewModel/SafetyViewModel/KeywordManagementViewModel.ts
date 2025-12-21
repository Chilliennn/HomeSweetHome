import { makeAutoObservable } from 'mobx';
import { supabase } from '../../Model/Service/APIService/supabase';

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
            // Update stats based on loaded data
            this.stats = {
                activeKeywordCount: this.activeKeywords.length,
                suggestionsRemaining: this.suggestions.length,
                detectionsToday: 12,
                keywordsAddedThisWeek: 3
            };
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard';
        } finally {
            this.isLoading = false;
        }
    }

    async loadActiveKeywords(): Promise<void> {
        this.isLoading = true;
        try {
            // Category ID to name mapping
            const categoryIdToName: { [key: string]: string } = {
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

            this.activeKeywords = (data || []).map((row: any) => {
                // Map category_id to category name
                const categoryId = String(row.category_id || '1');
                const categoryName = categoryIdToName[categoryId] || row.category || 'Financial Exploitation';

                return {
                    id: row.id,
                    keyword: row.keyword,
                    category: categoryName,
                    category_id: categoryId,
                    severity: row.severity || 'medium',
                    is_active: row.is_active ?? true,
                    created_at: row.created_at,
                    updated_at: row.updated_at || row.created_at
                };
            });

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
        try {
            // Stub: AI analysis would go here
            console.log('[KeywordManagementVM] AI suggestion generation not implemented');
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to generate suggestions';
        } finally {
            this.isMutating = false;
        }
    }

    async addKeyword(keyword: string, category: string, severity: 'Low' | 'Medium' | 'High' | 'Critical'): Promise<void> {
        this.isMutating = true;
        try {
            // Stub: Add to database later
            const newKeyword: KeywordRecord = {
                id: crypto.randomUUID(),
                keyword,
                category,
                severity: severity.toLowerCase() as any,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                category_id: '1'
            };
            this.activeKeywords.push(newKeyword);
            this.updateStats();
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to add keyword';
        } finally {
            this.isMutating = false;
        }
    }

    async updateKeyword(id: string, keyword: string, category: string, severity: 'Low' | 'Medium' | 'High' | 'Critical'): Promise<void> {
        this.isMutating = true;
        try {
            const index = this.activeKeywords.findIndex(k => k.id === id);
            if (index !== -1) {
                this.activeKeywords[index] = {
                    ...this.activeKeywords[index],
                    keyword,
                    category,
                    severity: severity.toLowerCase() as any,
                    updated_at: new Date().toISOString()
                };
            }
            this.setModalState(null);
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to update keyword';
        } finally {
            this.isMutating = false;
        }
    }

    async deleteKeyword(id: string): Promise<void> {
        this.isMutating = true;
        try {
            this.activeKeywords = this.activeKeywords.filter(k => k.id !== id);
            this.updateStats();
            this.setModalState(null);
        } catch (error) {
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
                await this.addKeyword(suggestion.keyword, suggestion.category, suggestion.severity);
                this.suggestions = this.suggestions.filter(s => s.id !== suggestionId);
            }
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to accept suggestion';
        } finally {
            this.isMutating = false;
        }
    }

    async rejectSuggestion(suggestionId: string): Promise<void> {
        this.isMutating = true;
        try {
            this.suggestions = this.suggestions.filter(s => s.id !== suggestionId);
        } catch (error) {
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

// viewmodels/KeywordManagementViewModel.ts
import { makeAutoObservable, runInAction } from "mobx";
import { KeywordService, type NormalizedSuggestion } from "../../Model/Service/CoreService/KeywordService";
import { type KeywordDashboardStats, type KeywordRecord } from "../../Model/Repository/AdminRepository/KeywordRepository";

type TabKey = "new" | "current";

export type ModalType = "add" | "edit" | "delete" | null;

export class KeywordAdminViewModel {
    // observable state
    stats: KeywordDashboardStats | null = null;
    suggestions: NormalizedSuggestion[] = [];
    activeKeywords: KeywordRecord[] = []; // New State

    isLoadingDashboard = false;
    isLoadingSuggestions = false;
    isLoadingActiveKeywords = false; // New State

    isMutating = false;
    errorMessage: string | null = null;
    activeTab: TabKey = "new";

    // Modal State
    activeModal: ModalType = null;
    selectedKeyword: KeywordRecord | null = null;


    // constructor injection of Service (not Repo / Supabase)
    private keywordService: KeywordService;

    constructor(keywordService: KeywordService) {
        makeAutoObservable(this);
        this.keywordService = keywordService;
    }

    // actions
    // actions
    setActiveTab(tab: TabKey) {
        this.activeTab = tab;
        if (tab === "current") {
            this.loadActiveKeywords();
        }
    }

    setModalState(type: ModalType, keyword: KeywordRecord | null = null) {
        this.activeModal = type;
        this.selectedKeyword = keyword;
    }


    async loadDashboard() {
        this.isLoadingDashboard = true;
        this.errorMessage = null;

        try {
            const stats = await this.keywordService.getDashboardStats();
            runInAction(() => {
                this.stats = stats;
            });
        } catch (err: any) {
            runInAction(() => {
                this.errorMessage = "Failed to load keyword dashboard.";
            });
        } finally {
            runInAction(() => {
                this.isLoadingDashboard = false;
            });
        }
    }

    async loadSuggestions() {
        this.isLoadingSuggestions = true;
        this.errorMessage = null;

        try {
            const suggestions = await this.keywordService.getNormalizedSuggestions();
            runInAction(() => {
                this.suggestions = suggestions;
            });
        } catch (err: any) {
            runInAction(() => {
                this.errorMessage = "Failed to load AI keyword suggestions.";
            });
        } finally {
            runInAction(() => {
                this.isLoadingSuggestions = false;
            });
        }
    }

    async generateSuggestions() {
        this.isMutating = true;
        this.errorMessage = null;
        try {
            await this.keywordService.generateSuggestions();
            await this.loadSuggestions();
        } catch (err: any) {
            runInAction(() => {
                this.errorMessage = "Failed to generate suggestions.";
            });
        } finally {
            runInAction(() => {
                this.isMutating = false;
            });
        }
    }

    async refreshAll() {
        await Promise.all([this.loadDashboard(), this.loadSuggestions()]);
    }

    async acceptSuggestion(id: string) {
        this.isMutating = true;
        this.errorMessage = null;
        try {
            await this.keywordService.acceptSuggestion(id);
            await this.refreshAll();
        } catch (err: any) {
            runInAction(() => {
                this.errorMessage = "Unable to accept suggestion. Please try again.";
            });
        } finally {
            runInAction(() => {
                this.isMutating = false;
            });
        }
    }

    async rejectSuggestion(id: string) {
        this.isMutating = true;
        this.errorMessage = null;
        try {
            await this.keywordService.rejectSuggestion(id);
            await this.loadSuggestions();
        } catch (err: any) {
            runInAction(() => {
                this.errorMessage = "Unable to reject suggestion. Please try again.";
            });
        } finally {
            runInAction(() => {
                this.isMutating = false;
            });
        }
    }


    async loadActiveKeywords() {
        this.isLoadingActiveKeywords = true;
        this.errorMessage = null;
        try {
            const keywords = await this.keywordService.getActiveKeywords();
            runInAction(() => {
                this.activeKeywords = keywords;
            });
        } catch (err: any) {
            runInAction(() => {
                this.errorMessage = "Failed to load active keywords.";
            });
        } finally {
            runInAction(() => {
                this.isLoadingActiveKeywords = false;
            });
        }
    }

    async addKeyword(keyword: string, category: string, severity: "Low" | "Medium" | "High" | "Critical") {
        this.isMutating = true;
        this.errorMessage = null;
        try {
            await this.keywordService.addKeyword(keyword, category, severity);
            await this.loadActiveKeywords();
            this.setModalState(null); // Close modal on success
        } catch (err: any) {
            runInAction(() => {
                this.errorMessage = "Failed to add keyword.";
            });
        } finally {
            runInAction(() => {
                this.isMutating = false;
            });
        }
    }

    async updateKeyword(id: string, keyword: string, category: string, severity: "Low" | "Medium" | "High" | "Critical") {
        this.isMutating = true;
        this.errorMessage = null;
        try {
            await this.keywordService.updateKeyword(id, keyword, category, severity);
            await this.loadActiveKeywords();
            this.setModalState(null);
        } catch (err: any) {
            runInAction(() => {
                this.errorMessage = "Failed to update keyword.";
            });
        } finally {
            runInAction(() => {
                this.isMutating = false;
            });
        }
    }

    async deleteKeyword(id: string) {
        this.isMutating = true;
        this.errorMessage = null;
        try {
            await this.keywordService.deleteKeyword(id);
            await this.loadActiveKeywords();
            this.setModalState(null);
        } catch (err: any) {
            runInAction(() => {
                this.errorMessage = "Failed to delete keyword.";
            });
        } finally {
            runInAction(() => {
                this.isMutating = false;
            });
        }
    }
}

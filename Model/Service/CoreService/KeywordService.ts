// services/KeywordService.ts
import {
    type KeywordDashboardStats,
    KeywordRepository,
    type KeywordSuggestionRecord,
    type KeywordRecord,
} from "../../Repository/AdminRepository/KeywordRepository";
import { KeywordDetectionService } from "./KeywordDetectionService";
import { KeywordDetectionRepository } from "../../Repository/AdminRepository/KeywordDetectionRepository";
import { supabase } from "../APIService/supabase";
import { KeywordSuggestionService } from "./KeywordSuggestionService";

export interface NormalizedSuggestion {
    id: string;
    keyword: string;
    category: string;
    severity: "Low" | "Medium" | "High" | "Critical";
    detectionSummary: string; // e.g. "Detected 12 times in financial conversations over the past 7 days"
    badges: string[]; // ["Financial Exploitation", "Critical"]
}

// Helper function to map category names to IDs
function getCategoryId(categoryName: string): string {
    const categoryMap: { [key: string]: string } = {
        "Financial Exploitation": "1",
        "Personal Information": "2",
        "Inappropriate Content": "3",
        "Abuse & Harassment": "4"
    };
    return categoryMap[categoryName] || "1"; // Default to Financial Exploitation
}

export class KeywordService {
    private keywordRepo: KeywordRepository;
    private detectionService: KeywordDetectionService;
    private suggestionService: KeywordSuggestionService;

    constructor(keywordRepo: KeywordRepository) {
        this.keywordRepo = keywordRepo;

        // Initialize detection service
        const detectionRepo = new KeywordDetectionRepository(supabase);
        this.detectionService = new KeywordDetectionService(detectionRepo, keywordRepo);

        // Initialize suggestion service
        this.suggestionService = new KeywordSuggestionService(keywordRepo);
    }

    async generateSuggestions(): Promise<number> {
        return this.suggestionService.runSuggestionGeneration();
    }

    async getDashboardStats(): Promise<KeywordDashboardStats> {
        const baseStats = await this.keywordRepo.fetchDashboardStats();

        // Get real detection count for today
        const detectionsToday = await this.detectionService.getDetectionsToday();

        return {
            ...baseStats,
            detectionsToday
        };
    }

    async getNormalizedSuggestions(): Promise<NormalizedSuggestion[]> {
        const raw: KeywordSuggestionRecord[] =
            await this.keywordRepo.fetchKeywordSuggestions();

        return raw.map((r) => ({
            id: r.id,
            keyword: r.keyword,
            category: r.category,
            severity: this.toLabelSeverity(r.severity),
            detectionSummary: `Detected ${r.detection_count_last_7_days} times in concerning conversations over the past 7 days`,
            badges: [r.category, this.toLabelSeverity(r.severity)],
        }));
    }

    async acceptSuggestion(id: string): Promise<void> {
        // future: enforce constraints like "no duplicate keywords"
        await this.keywordRepo.acceptSuggestion(id);
    }

    async rejectSuggestion(id: string): Promise<void> {
        await this.keywordRepo.rejectSuggestion(id);
    }

    private toLabelSeverity(
        severity: KeywordSuggestionRecord["severity"]
    ): NormalizedSuggestion["severity"] {
        switch (severity) {
            case "critical":
                return "Critical";
            case "high":
                return "High";
            case "medium":
                return "Medium";
            default:
                return "Low";
        }
    }

    // --- New CRUD Methods ---

    async getActiveKeywords(): Promise<KeywordRecord[]> {
        return this.keywordRepo.fetchKeywords();
    }

    async addKeyword(keyword: string, categoryName: string, severity: "Low" | "Medium" | "High" | "Critical"): Promise<void> {
        // Convert category name to ID
        const category_id = getCategoryId(categoryName);
        // map UI severity to DB severity
        const dbSeverity = severity.toLowerCase() as any;
        await this.keywordRepo.addKeyword(keyword, category_id, dbSeverity);
    }

    async updateKeyword(id: string, keyword: string, categoryName: string, severity: "Low" | "Medium" | "High" | "Critical"): Promise<void> {
        // Convert category name to ID
        const category_id = getCategoryId(categoryName);
        const dbSeverity = severity.toLowerCase() as any;
        await this.keywordRepo.updateKeyword(id, { keyword, category_id, severity: dbSeverity });
    }

    async deleteKeyword(id: string): Promise<void> {
        await this.keywordRepo.deleteKeyword(id);
    }
}

// services/KeywordService.ts
import {
    type KeywordDashboardStats,
    KeywordRepository,
    type KeywordSuggestionRecord,
    type KeywordRecord,
} from "../../Repository/AdminRepository/KeywordRepository";

export interface NormalizedSuggestion {
    id: string;
    keyword: string;
    category: string;
    severity: "Low" | "Medium" | "High" | "Critical";
    detectionSummary: string; // e.g. "Detected 12 times in financial conversations over the past 7 days"
    badges: string[]; // ["Financial Exploitation", "Critical"]
}

export class KeywordService {
    private keywordRepo: KeywordRepository;

    constructor(keywordRepo: KeywordRepository) {
        this.keywordRepo = keywordRepo;
    }

    async getDashboardStats(): Promise<KeywordDashboardStats> {
        return this.keywordRepo.fetchDashboardStats();
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

    async addKeyword(keyword: string, category: string, severity: "Low" | "Medium" | "High" | "Critical"): Promise<void> {
        // map UI severity to DB severity
        const dbSeverity = severity.toLowerCase() as any;
        await this.keywordRepo.addKeyword(keyword, category, dbSeverity);
    }

    async updateKeyword(id: string, keyword: string, category: string, severity: "Low" | "Medium" | "High" | "Critical"): Promise<void> {
        const dbSeverity = severity.toLowerCase() as any;
        await this.keywordRepo.updateKeyword(id, { keyword, category, severity: dbSeverity });
    }

    async deleteKeyword(id: string): Promise<void> {
        await this.keywordRepo.deleteKeyword(id);
    }
}

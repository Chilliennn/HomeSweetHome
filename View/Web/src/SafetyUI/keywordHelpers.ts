// Temporary helper to group keywords by category from ViewModel data
// This will replace the hardcoded initialKeywordCategories

import { type KeywordRecord } from "@home-sweet-home/model";

export function groupKeywordsByCategory(keywords: KeywordRecord[]): { [category: string]: { keyword: string; id: string; severity: string }[] } {
    const grouped: { [category: string]: { keyword: string; id: string; severity: string }[] } = {
        "Financial Exploitation": [],
        "Personal Information": [],
        "Inappropriate Content": [],
        "Abuse & Harassment": []
    };

    // Map category IDs to names
    const categoryIdToName: { [id: string]: string } = {
        "1": "Financial Exploitation",
        "2": "Personal Information",
        "3": "Inappropriate Content",
        "4": "Abuse & Harassment"
    };

    keywords.forEach(kw => {
        const categoryName = categoryIdToName[kw.category] || "Financial Exploitation";
        if (grouped[categoryName]) {
            grouped[categoryName].push({
                keyword: kw.keyword,
                id: kw.id,
                severity: kw.severity
            });
        }
    });

    return grouped;
}

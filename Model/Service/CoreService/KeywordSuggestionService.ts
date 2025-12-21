// Model/Service/CoreService/KeywordSuggestionService.ts

import { supabase } from '../APIService/supabase';
import { KeywordRepository } from '../../Repository/AdminRepository/KeywordRepository';

export interface SuggestionCandidate {
    phrase: string;
    frequency: number;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    examples: string[];
}

/**
 * KeywordSuggestionService - AI-powered keyword suggestion generation
 * 
 * Analyzes message patterns to suggest new keywords
 */
export class KeywordSuggestionService {
    constructor(private keywordRepo: KeywordRepository) { }

    /**
     * Analyze messages and generate keyword suggestions
     */
    async generateSuggestions(daysBack: number = 30): Promise<SuggestionCandidate[]> {
        // Get messages from last N days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);

        const { data: messages, error } = await supabase
            .from('messages')
            .select('content, sent_at')
            .gte('sent_at', cutoffDate.toISOString())
            .not('content', 'is', null);

        if (error) {
            console.error('[AI Debug] Error fetching messages:', error);
            throw error;
        }

        console.log(`[AI Debug] Found ${messages?.length || 0} messages to analyze.`);

        // Get existing keywords to avoid duplicates
        const existingKeywords = await this.keywordRepo.fetchKeywords();
        const existingPhrases = new Set(
            existingKeywords.map((k: { keyword: string }) => k.keyword.toLowerCase())
        );

        // Extract and analyze phrases
        const phraseCounts = new Map<string, { count: number; examples: string[] }>();

        messages?.forEach(msg => {
            if (!msg.content) return;
            // console.log('[AI Debug] Analyzing message:', msg.content); 

            const content = msg.content.toLowerCase();

            // Extract 2-4 word phrases
            const words = content.split(/\s+/);
            for (let len = 2; len <= 4; len++) {
                for (let i = 0; i <= words.length - len; i++) {
                    const phrase = words.slice(i, i + len).join(' ');

                    // Filter out common phrases and existing keywords
                    if (this.isDangerousPhrase(phrase) && !existingPhrases.has(phrase)) {
                        console.log(`[AI Debug] MATCH! Found suspicious phrase: "${phrase}"`);
                        const current = phraseCounts.get(phrase) || { count: 0, examples: [] };
                        current.count++;
                        if (current.examples.length < 3) {
                            current.examples.push(msg.content.substring(0, 100));
                        }
                        phraseCounts.set(phrase, current);
                    }
                }
            }
        });

        // Generate suggestions from frequent phrases
        const suggestions: SuggestionCandidate[] = [];

        for (const [phrase, data] of phraseCounts.entries()) {
            // Only suggest if detected multiple times (Lowered to 1 for testing)
            if (data.count >= 1) {
                const analysis = this.analyzePhrase(phrase);

                suggestions.push({
                    phrase,
                    frequency: data.count,
                    category: analysis.category,
                    severity: analysis.severity,
                    reason: `Detected ${data.count} times in concerning ${analysis.category.toLowerCase()} contexts over the past ${daysBack} days`,
                    examples: data.examples
                });
            }
        }

        // Sort by frequency (most common first)
        suggestions.sort((a, b) => b.frequency - a.frequency);

        return suggestions.slice(0, 20); // Return top 20
    }

    /**
     * Check if a phrase is potentially dangerous
     */
    private isDangerousPhrase(phrase: string): boolean {
        const dangerousPatterns = [
            // Financial
            /bank|account|credit card|money|transfer|payment|cash|loan|debt/,
            // Personal Info
            /password|pin|ssn|social security|address|phone number|email/,
            // Inappropriate
            /nude|naked|sex|explicit|inappropriate|vulgar/,
            // Threats/Abuse
            /kill|hurt|harm|threat|abuse|violence|hate/,
            // Scam indicators
            /urgent|emergency|secret|don't tell|wire|gift card/
        ];

        return dangerousPatterns.some(pattern => pattern.test(phrase));
    }

    /**
     * Analyze phrase to determine category and severity
     */
    private analyzePhrase(phrase: string): { category: string; severity: 'low' | 'medium' | 'high' | 'critical' } {
        const phraseLower = phrase.toLowerCase();

        // Financial Exploitation
        if (/bank|account|credit|money|transfer|wire|cash/.test(phraseLower)) {
            const isCritical = /bank account|credit card|wire transfer|send money/.test(phraseLower);
            return {
                category: 'Financial Exploitation',
                severity: isCritical ? 'critical' : 'high'
            };
        }

        // Personal Information
        if (/password|pin|ssn|social security|address/.test(phraseLower)) {
            return {
                category: 'Personal Information',
                severity: 'critical'
            };
        }

        // Inappropriate Content
        if (/nude|naked|sex|explicit|vulgar/.test(phraseLower)) {
            return {
                category: 'Inappropriate Content',
                severity: 'high'
            };
        }

        // Abuse & Harassment
        if (/kill|hurt|harm|threat|abuse|violence/.test(phraseLower)) {
            return {
                category: 'Abuse & Harassment',
                severity: 'critical'
            };
        }

        // Default
        return {
            category: 'Financial Exploitation',
            severity: 'medium'
        };
    }

    /**
     * Save suggestions to database
     */
    async saveSuggestions(suggestions: SuggestionCandidate[]): Promise<void> {
        // Map category names to IDs
        const categoryMap: Record<string, string> = {
            'Financial Exploitation': '1',
            'Personal Information': '2',
            'Inappropriate Content': '3',
            'Abuse & Harassment': '4'
        };

        for (const suggestion of suggestions) {
            try {
                await supabase
                    .from('keyword_suggestions')
                    .insert({
                        keyword: suggestion.phrase,
                        category: suggestion.category, // Schema uses 'category' string, not ID
                        severity: suggestion.severity,
                        status: 'pending',
                        detection_count_last_7_days: suggestion.frequency // Schema uses this specific name
                    });
            } catch (error) {
                console.error('[KeywordSuggestionService] Error saving suggestion:', error);
            }
        }
    }

    /**
     * Run full suggestion generation and save to database
     */
    async runSuggestionGeneration(daysBack: number = 30): Promise<number> {
        const suggestions = await this.generateSuggestions(daysBack);
        await this.saveSuggestions(suggestions);
        return suggestions.length;
    }
}

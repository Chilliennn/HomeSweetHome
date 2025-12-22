// Model/Service/CoreService/SafetyReportService.ts

import type { SafetyReportRepository } from "../../Repository/AdminRepository/SafetyReportRepository";
import type { SafetyReport, SafetyReportSubmission, SeverityLevel } from "../../types/SafetyTypes";

export class SafetyReportService {
    private repository: SafetyReportRepository;

    constructor(repository: SafetyReportRepository) {
        this.repository = repository;
    }

    /**
     * Platform-agnostic config getter
     */
    private getConfig(key: string): string | undefined {
        return process.env[`EXPO_PUBLIC_${key}`] || process.env[key] || undefined;
    }

    /**
     * Analyze sentiment using AI (Gemini) with fallback to keyword matching
     * UC401_9: AI sentiment analysis for auto-categorization
     * 
     * @param description - The safety report description to analyze
     * @returns SeverityLevel determined by AI or keyword matching
     */
    async analyzeSentimentWithAI(description: string): Promise<SeverityLevel> {
        try {
            const apiKey = this.getConfig('GEMINI_API_KEY');
            if (!apiKey) {
                console.log('[SafetyReportService] No Gemini API key, using keyword analysis');
                return this.analyzeSentimentKeyword(description);
            }

            const prompt = `You are a safety analysis AI for an intergenerational matching app (youth-elderly relationships).
Analyze this safety report and determine its severity level.

Report content: "${description}"

Severity Levels:
- Critical: Immediate danger, abuse, violence, threats, self-harm, financial exploitation, emergency situations
- High: Serious issues like harassment, bullying, threats, unsafe situations, exploitation patterns
- Medium: Moderate concerns like conflicts, arguments, disrespectful behavior, uncomfortable situations
- Low: General feedback, minor issues, suggestions, non-urgent matters

Return ONLY one of these exact words: Critical, High, Medium, or Low
Nothing else, just the severity level word.`;

            // Try multiple models in case some are not available
            const models = [
                'gemini-1.5-flash',
                'gemini-1.5-flash-latest',
                'gemini-1.5-pro',
                'gemini-pro',
                'gemini-1.0-pro'
            ];

            for (const model of models) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
                    console.log(`[SafetyReportService] Trying Gemini model: ${model}`);

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-goog-api-key': apiKey
                        },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature: 0.1,
                                maxOutputTokens: 10,
                            }
                        })
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.log(`[SafetyReportService] Model ${model} failed: ${response.status} - ${errorText}`);
                        continue; // Try next model
                    }

                    const data = await response.json();
                    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
                    console.log(`[SafetyReportService] AI response from ${model}: "${responseText}"`);

                    // Validate and return the severity level
                    if (['Critical', 'High', 'Medium', 'Low'].includes(responseText)) {
                        console.log(`[SafetyReportService] AI determined severity: ${responseText}`);
                        return responseText as SeverityLevel;
                    }

                    // Invalid response, try next model
                    console.log(`[SafetyReportService] Invalid response "${responseText}", trying next model`);
                } catch (modelError) {
                    console.log(`[SafetyReportService] Error with model ${model}:`, modelError);
                    continue;
                }
            }

            // All models failed, use keyword fallback
            console.log('[SafetyReportService] All Gemini models failed, using keyword analysis');
            return this.analyzeSentimentKeyword(description);

        } catch (error) {
            console.error('[SafetyReportService] AI analysis error:', error);
            return this.analyzeSentimentKeyword(description);
        }
    }

    /**
     * Keyword-based sentiment analysis (fallback when AI is unavailable)
     * 
     * Severity Levels:
     * - Critical: Immediate danger, abuse, or severe conflict
     * - High: Serious issues requiring prompt action
     * - Medium: Moderate concerns requiring attention
     * - Low: General feedback, minor issues
     */
    analyzeSentimentKeyword(description: string): SeverityLevel {
        const lowerDesc = description.toLowerCase();

        // Critical keywords: immediate danger, abuse, violence
        const CRITICAL_KEYWORDS = [
            'abuse', 'abused', 'abusing',
            'danger', 'dangerous', 'threatened', 'threatening',
            'urgent', 'emergency', 'help',
            'violence', 'violent', 'attack', 'attacking',
            'hurt', 'hurting', 'injured', 'injury',
            'scared', 'afraid', 'fear', 'terrified',
            'assault', 'assaulted',
            'suicide', 'kill', 'death',
            'weapon', 'gun', 'knife'
        ];

        // High keywords: serious concerns
        const HIGH_KEYWORDS = [
            'concern', 'concerned', 'worry', 'worried',
            'uncomfortable', 'distressed',
            'inappropriate', 'improper',
            'harass', 'harassment', 'harassed',
            'bully', 'bullying', 'bullied',
            'threaten', 'threat',
            'unsafe', 'insecure',
            'exploit', 'exploitation'
        ];

        // Medium keywords: moderate issues
        const MEDIUM_KEYWORDS = [
            'issue', 'problem', 'trouble',
            'conflict', 'disagree', 'disagreement',
            'argument', 'arguing',
            'upset', 'frustrated', 'frustration',
            'annoyed', 'annoying',
            'rude', 'disrespectful'
        ];

        // Check for critical keywords
        if (CRITICAL_KEYWORDS.some(keyword => lowerDesc.includes(keyword))) {
            return 'Critical';
        }

        // Check for high keywords
        if (HIGH_KEYWORDS.some(keyword => lowerDesc.includes(keyword))) {
            return 'High';
        }

        // Check for medium keywords
        if (MEDIUM_KEYWORDS.some(keyword => lowerDesc.includes(keyword))) {
            return 'Medium';
        }

        // Default to Low for general feedback
        return 'Low';
    }

    /**
     * Legacy synchronous method - kept for backwards compatibility
     * Now uses keyword-based analysis only
     */
    analyzeSentiment(description: string): SeverityLevel {
        return this.analyzeSentimentKeyword(description);
    }

    /**
     * Submit a safety report
     * UC401_7 to UC401_12: Complete submission flow
     */
    async submitReport(submission: SafetyReportSubmission, userId: string): Promise<SafetyReport> {
        console.log('[SafetyReportService] submitReport called:', { userId, reportType: submission.report_type });
        try {
            // UC401_9: Analyze sentiment using AI to determine severity
            console.log('[SafetyReportService] Analyzing sentiment...');
            const severityLevel = await this.analyzeSentimentWithAI(submission.description);
            console.log('[SafetyReportService] Severity determined:', severityLevel);

            // UC401_10: Save report to database
            console.log('[SafetyReportService] Saving report to database...');
            const report = await this.repository.submitReport(submission, userId, severityLevel);
            console.log('[SafetyReportService] Report saved with ID:', report.id);

            // UC401_6: Upload evidence files if provided
            if (submission.evidence_files && submission.evidence_files.length > 0) {
                console.log('[SafetyReportService] Uploading evidence files...');
                const evidenceUrls = await this.repository.uploadEvidence(
                    submission.evidence_files,
                    report.id
                );
                console.log('[SafetyReportService] Evidence uploaded, URLs:', evidenceUrls);

                // Save evidence URLs to the database
                await this.repository.updateEvidenceUrls(report.id, evidenceUrls);
                report.evidence_urls = evidenceUrls;
            }

            // UC401_11: If Critical, send alert to NGO admin
            if (severityLevel === 'Critical') {
                await this.sendCriticalAlert(report);
            }

            return report;
        } catch (error) {
            console.error('Error submitting safety report:', error);
            throw error;
        }
    }

    /**
     * Send critical alert notification to NGO admin
     * UC401_11 & C2: Critical Alert Notification Required (within 30 seconds)
     */
    private async sendCriticalAlert(report: SafetyReport): Promise<void> {
        console.log('🚨 CRITICAL ALERT: Sending notification to NGO admin');
        console.log('Report ID:', report.id);
        console.log('Subject:', report.subject);
        console.log('Severity:', report.severity_level);

        // TODO: Implement with Supabase
        // 1. Create in-app notification
        // await this.supabase.from('notifications').insert({
        //     recipient_role: 'ngo_admin',
        //     type: 'critical_safety_report',
        //     title: '🚨 CRITICAL: Safety Report Submitted',
        //     message: `Report ID: ${report.id} - ${report.subject}`,
        //     report_id: report.id,
        //     priority: 'critical',
        //     created_at: new Date().toISOString()
        // });

        // 2. Send email via Supabase Edge Function
        // await this.supabase.functions.invoke('send-critical-alert-email', {
        //     body: {
        //         reportId: report.id,
        //         subject: report.subject,
        //         description: report.description,
        //         userId: report.user_id
        //     }
        // });
    }

    /**
     * Get user's report history
     * UC401_13: User can view and track their submitted reports
     */
    async getUserReports(userId: string): Promise<SafetyReport[]> {
        return await this.repository.getUserReports(userId);
    }

    /**
     * Get form configuration
     * UC401_2: Fetch form configuration from database
     */
    async getFormConfig() {
        // For now, return static config
        // TODO: Fetch from database
        return {
            report_types: ['Positive Feedback', 'Safety Concern'] as const,
            max_files: 5,
            max_file_size_mb: 10,
            allowed_file_formats: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
        };
    }
}

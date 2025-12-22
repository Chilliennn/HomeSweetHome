import { adminRepository } from '../../Repository/AdminRepository';
import type { SafetyAlertWithProfiles, SafetyAlertStats } from '../../Repository/AdminRepository';
import type { Severity, IncidentStatus } from '../../types';

// Critical severity threshold in minutes (30 minutes for critical alerts)
const CRITICAL_RESPONSE_THRESHOLD_MINUTES = 30;
const HIGH_RESPONSE_THRESHOLD_MINUTES = 120;
const MEDIUM_RESPONSE_THRESHOLD_MINUTES = 480;

// Action reasons
const DISMISSAL_REASONS = [
    'False positive - no violation detected',
    'Duplicate report',
    'Insufficient evidence',
    'Already resolved by other admin',
    'User clarification resolved issue',
    'Other (requires explanation)'
];

const WARNING_TYPES = [
    'First warning - verbal caution',
    'Second warning - formal notice',
    'Final warning - suspension pending'
];

export const safetyService = {
    /**
     * Get all safety alerts with filtering
     */
    async getAlerts(
        severity?: Severity,
        status?: IncidentStatus,
        sortBy: 'newest' | 'oldest' = 'newest',
        limit = 50,
        offset = 0
    ): Promise<SafetyAlertWithProfiles[]> {
        return adminRepository.getSafetyAlerts(severity, status, sortBy, limit, offset);
    },

    /**
     * Get single alert with validation
     */
    async getAlertById(alertId: string): Promise<SafetyAlertWithProfiles> {
        const alert = await adminRepository.getSafetyAlertById(alertId);
        if (!alert) {
            throw new Error('Safety alert not found');
        }
        return alert;
    },

    /**
     * Get dashboard statistics
     */
    async getAlertStats(): Promise<SafetyAlertStats> {
        return adminRepository.getSafetyAlertStats();
    },

    /**
     * Format waiting time for display
     */
    formatWaitingTime(minutes: number): string {
        if (minutes < 60) {
            return `${minutes} minutes`;
        } else if (minutes < 1440) { // Less than 24 hours
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
        } else {
            const days = Math.floor(minutes / 1440);
            return `${days} days`;
        }
    },

    /**
     * Check if response time is urgent based on severity
     */
    isResponseUrgent(severity: Severity, waitingTimeMinutes: number): boolean {
        switch (severity) {
            case 'critical':
                return waitingTimeMinutes >= CRITICAL_RESPONSE_THRESHOLD_MINUTES;
            case 'high':
                return waitingTimeMinutes >= HIGH_RESPONSE_THRESHOLD_MINUTES;
            case 'medium':
                return waitingTimeMinutes >= MEDIUM_RESPONSE_THRESHOLD_MINUTES;
            default:
                return false;
        }
    },

    /**
     * Get response time remaining for SLA
     */
    getResponseTimeRemaining(severity: Severity, waitingTimeMinutes: number): string {
        let threshold: number;
        switch (severity) {
            case 'critical':
                threshold = CRITICAL_RESPONSE_THRESHOLD_MINUTES;
                break;
            case 'high':
                threshold = HIGH_RESPONSE_THRESHOLD_MINUTES;
                break;
            case 'medium':
                threshold = MEDIUM_RESPONSE_THRESHOLD_MINUTES;
                break;
            default:
                return 'No SLA';
        }

        const remaining = threshold - waitingTimeMinutes;
        if (remaining <= 0) {
            return 'OVERDUE';
        }
        return this.formatWaitingTime(remaining);
    },

    /**
     * Issue warning to user with validation
     */
    async issueWarning(
        alertId: string,
        adminId: string,
        warningType: string,
        notes: string
    ): Promise<void> {
        if (!WARNING_TYPES.includes(warningType)) {
            throw new Error('Invalid warning type');
        }

        if (!notes || notes.trim().length < 10) {
            throw new Error('Warning notes must be at least 10 characters');
        }

        const fullNotes = `Warning Type: ${warningType}\n\nDetails: ${notes}`;
        await adminRepository.issueWarning(alertId, adminId, fullNotes);
    },

    /**
     * Suspend user with validation
     */
    async suspendUser(
        alertId: string,
        userId: string,
        adminId: string,
        reason: string,
        duration?: 'temporary' | 'permanent'
    ): Promise<void> {
        if (!reason || reason.trim().length < 20) {
            throw new Error('Suspension reason must be at least 20 characters');
        }

        const fullNotes = `Suspension Duration: ${duration || 'temporary'}\n\nReason: ${reason}`;
        await adminRepository.suspendUser(alertId, userId, adminId, fullNotes);
    },

    /**
     * Dismiss report with validation
     */
    async dismissReport(
        alertId: string,
        adminId: string,
        reason: string,
        explanation?: string
    ): Promise<void> {
        if (!DISMISSAL_REASONS.includes(reason)) {
            throw new Error('Invalid dismissal reason');
        }

        if (reason === 'Other (requires explanation)' && (!explanation || explanation.trim().length < 10)) {
            throw new Error('Explanation required for "Other" reason');
        }

        const fullReason = explanation ? `${reason}\n\n${explanation}` : reason;
        await adminRepository.dismissReport(alertId, adminId, fullReason);
    },

    /**
     * Contact user (log intent for follow-up)
     */
    async initiateContact(
        alertId: string,
        adminId: string,
        contactMethod: 'email' | 'phone' | 'in_app',
        notes: string
    ): Promise<void> {
        // Log contact attempt - actual contact would be through separate system
        await adminRepository.assignAlert(alertId, adminId);
        console.log(`Contact initiated via ${contactMethod} for alert ${alertId}: ${notes}`);
    },

    /**
     * Delete alert entirely
     */
    async deleteAlert(alertId: string): Promise<void> {
        await adminRepository.deleteAlert(alertId);
    },

    /**
     * Get valid dismissal reasons
     */
    getDismissalReasons(): string[] {
        return DISMISSAL_REASONS;
    },

    /**
     * Get warning types
     */
    getWarningTypes(): string[] {
        return WARNING_TYPES;
    },

    /**
     * Platform-agnostic config getter
     */
    getConfig(key: string): string | undefined {
        return process.env[`EXPO_PUBLIC_${key}`] || process.env[`VITE_${key}`] || process.env[key] || undefined;
    },

    /**
     * Analyze risk factors using AI (Gemini) with fallback to rule-based
     */
    async analyzeRiskFactorsWithAI(alert: SafetyAlertWithProfiles): Promise<string[]> {
        console.log('[safetyService] analyzeRiskFactorsWithAI called for alert:', alert.id);
        try {
            const apiKey = this.getConfig('GEMINI_API_KEY');
            console.log('[safetyService] Gemini API key found:', !!apiKey, apiKey ? `(starts with ${apiKey.substring(0, 10)}...)` : '');

            if (!apiKey) {
                console.log('[safetyService] No Gemini API key, using rule-based analysis');
                return this.analyzeRiskFactorsRuleBased(alert);
            }

            const prompt = `You are a safety analyst for an intergenerational matching app (elderly-youth relationships).
Analyze this safety report and identify key risk factors.

Report Details:
- Severity: ${alert.severity}
- Incident Type: ${alert.incident_type}
- Description: "${alert.description}"
- Detected Keywords: ${alert.detected_keywords.join(', ') || 'none'}
- Reporter Type: ${alert.reporter.user_type}, Age: ${alert.reporter.age || 'unknown'}
- Reporter Previous Warnings: ${alert.reported_user?.previous_warnings || 0}
- Waiting Time: ${alert.waiting_time_minutes} minutes

List 2-4 specific risk factors for this case. Each should be a brief statement.
Return ONLY a JSON array of strings, nothing else. Example: ["Factor 1", "Factor 2"]`;

            const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

            for (const model of models) {
                try {
                    console.log(`[safetyService] Trying Gemini model: ${model}`);
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { temperature: 0.3, maxOutputTokens: 200 }
                        })
                    });

                    console.log(`[safetyService] Model ${model} response status:`, response.status);
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.log(`[safetyService] Model ${model} error:`, errorText);
                        continue;
                    }

                    const data = await response.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
                    const match = text.match(/\[[\s\S]*\]/);
                    if (match) {
                        const factors = JSON.parse(match[0]);
                        if (Array.isArray(factors)) {
                            console.log('[safetyService] AI risk factors:', factors);
                            return factors;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            return this.analyzeRiskFactorsRuleBased(alert);
        } catch (error) {
            console.error('[safetyService] AI risk analysis error:', error);
            return this.analyzeRiskFactorsRuleBased(alert);
        }
    },

    /**
     * Rule-based risk factor analysis (fallback)
     */
    analyzeRiskFactorsRuleBased(alert: SafetyAlertWithProfiles): string[] {
        const factors: string[] = [];

        if (alert.detected_keywords.length > 0) {
            factors.push(`High-risk keyword detected: "${alert.detected_keywords.join('", "')}"`);
        }
        if (alert.reported_user && alert.reported_user.previous_warnings > 0) {
            factors.push(`Previous warning on file for reported user (${alert.reported_user.previous_warnings} total)`);
        }
        if (alert.reporter.user_type === 'elderly' && alert.reporter.age >= 70) {
            factors.push(`Vulnerable elderly reporter (${alert.reporter.age} years old)`);
        }
        if (alert.severity === 'critical' || alert.severity === 'high') {
            factors.push(`${alert.severity.toUpperCase()} severity - requires immediate attention`);
        }
        if (alert.incident_type === 'financial_request') {
            factors.push('Pattern matches known financial exploitation tactics');
        }
        if (this.isResponseUrgent(alert.severity, alert.waiting_time_minutes)) {
            factors.push('Response time SLA exceeded - escalation recommended');
        }

        return factors;
    },

    /**
     * Synchronous wrapper for risk factors (for backward compatibility)
     */
    analyzeRiskFactors(alert: SafetyAlertWithProfiles): string[] {
        return this.analyzeRiskFactorsRuleBased(alert);
    },

    /**
     * Generate recommendation using AI (Gemini) with fallback to rule-based
     */
    async generateRecommendationWithAI(alert: SafetyAlertWithProfiles): Promise<string> {
        try {
            const apiKey = this.getConfig('GEMINI_API_KEY');
            if (!apiKey) {
                return this.generateRecommendationRuleBased(alert);
            }

            const prompt = `You are a safety advisor for an intergenerational matching app.
Based on this safety report, provide a recommended action for the admin.

Report: Severity ${alert.severity}, Type: ${alert.incident_type}
Description: "${alert.description}"

Provide ONE concise recommendation (1-2 sentences) for how the admin should handle this case.
Return only the recommendation text, nothing else.`;

            const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

            for (const model of models) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { temperature: 0.3, maxOutputTokens: 100 }
                        })
                    });

                    if (!response.ok) continue;

                    const data = await response.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
                    if (text.length > 10) {
                        console.log('[safetyService] AI recommendation:', text);
                        return text;
                    }
                } catch (e) {
                    continue;
                }
            }
            return this.generateRecommendationRuleBased(alert);
        } catch (error) {
            console.error('[safetyService] AI recommendation error:', error);
            return this.generateRecommendationRuleBased(alert);
        }
    },

    /**
     * Rule-based recommendation (fallback)
     */
    generateRecommendationRuleBased(alert: SafetyAlertWithProfiles): string {
        if (alert.severity === 'critical') {
            if (alert.incident_type === 'financial_request') {
                return 'Immediate suspension recommended. This pattern matches known financial exploitation tactics. Contact both parties separately to investigate further.';
            }
            return 'Immediate review required. Take protective action for the reporter and investigate the reported user\'s account activity.';
        }
        if (alert.severity === 'high') {
            return 'Formal warning recommended. Review chat history and evidence. Consider temporary suspension if behavior continues.';
        }
        if (alert.severity === 'medium') {
            return 'Issue verbal caution and monitor situation. Review relationship progress and communication patterns.';
        }
        return 'Review report and take appropriate action based on evidence provided.';
    },

    /**
     * Synchronous wrapper for recommendation (for backward compatibility)
     */
    generateRecommendation(alert: SafetyAlertWithProfiles): string {
        return this.generateRecommendationRuleBased(alert);
    }
};

export default safetyService;

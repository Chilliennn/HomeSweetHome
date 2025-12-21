// Model/Service/CoreService/SafetyReportService.ts

import type { SafetyReportRepository } from "../../Repository/AdminRepository/SafetyReportRepository";
import type { SafetyReport, SafetyReportSubmission, SeverityLevel } from "../../types/SafetyTypes";

export class SafetyReportService {
    private repository: SafetyReportRepository;

    constructor(repository: SafetyReportRepository) {
        this.repository = repository;
    }

    /**
     * Analyze sentiment of description to determine severity level
     * UC401_9: AI sentiment analysis for auto-categorization
     * 
     * Severity Levels:
     * - Critical: Immediate danger, abuse, or severe conflict
     * - High: Serious issues requiring prompt action
     * - Medium: Moderate concerns requiring attention
     * - Low: General feedback, minor issues
     */
    analyzeSentiment(description: string): SeverityLevel {
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
     * Submit a safety report
     * UC401_7 to UC401_12: Complete submission flow
     */
    async submitReport(submission: SafetyReportSubmission, userId: string): Promise<SafetyReport> {
        try {
            // UC401_9: Analyze sentiment to determine severity
            const severityLevel = this.analyzeSentiment(submission.description);

            // UC401_10: Save report to database
            const report = await this.repository.submitReport(submission, userId, severityLevel);

            // UC401_6: Upload evidence files if provided
            if (submission.evidence_files && submission.evidence_files.length > 0) {
                const evidenceUrls = await this.repository.uploadEvidence(
                    submission.evidence_files,
                    report.id
                );
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

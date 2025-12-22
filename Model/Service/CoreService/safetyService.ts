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
     * Analyze risk factors from alert
     */
    analyzeRiskFactors(alert: SafetyAlertWithProfiles): string[] {
        const factors: string[] = [];

        // High-risk keywords
        if (alert.detected_keywords.length > 0) {
            factors.push(`High-risk keyword detected: "${alert.detected_keywords.join('", "')}"`);
        }

        // Previous warnings
        if (alert.reported_user && alert.reported_user.previous_warnings > 0) {
            factors.push(`Previous warning on file for reported user (${alert.reported_user.previous_warnings} total)`);
        }

        // Elderly reporter (vulnerable)
        if (alert.reporter.user_type === 'elderly' && alert.reporter.age >= 70) {
            factors.push(`Vulnerable elderly reporter (${alert.reporter.age} years old)`);
        }

        // Critical or high severity
        if (alert.severity === 'critical' || alert.severity === 'high') {
            factors.push(`${alert.severity.toUpperCase()} severity - requires immediate attention`);
        }

        // Financial exploitation pattern
        if (alert.incident_type === 'financial_request') {
            factors.push('Pattern matches known financial exploitation tactics');
        }

        // Response time overdue
        if (this.isResponseUrgent(alert.severity, alert.waiting_time_minutes)) {
            factors.push('Response time SLA exceeded - escalation recommended');
        }

        return factors;
    },

    /**
     * Generate recommended action based on alert analysis
     */
    generateRecommendation(alert: SafetyAlertWithProfiles): string {
        if (alert.severity === 'critical') {
            if (alert.incident_type === 'financial_request') {
                return 'Immediate suspension recommended. This pattern matches known financial exploitation tactics. Contact both parties separately to investigate further. Consider permanent ban if exploitation confirmed.';
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
    }
};

export default safetyService;

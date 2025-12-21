import { makeAutoObservable, runInAction } from 'mobx';
import { safetyService } from '../../Model/Service/CoreService/safetyService';
import type { SafetyAlertWithProfiles, SafetyAlertStats } from '../../Model/Repository/AdminRepository';
import type { Severity, IncidentStatus } from '../../Model/types';

export interface SafetyState {
    alerts: SafetyAlertWithProfiles[];
    selectedAlert: SafetyAlertWithProfiles | null;
    stats: SafetyAlertStats | null;
    isLoading: boolean;
    errorMessage: string | null;
    filterSeverity: Severity | 'all';
    filterStatus: IncidentStatus | 'all';
    sortBy: 'newest' | 'oldest';
    currentPage: number;
    itemsPerPage: number;
    isProcessing: boolean;
}

export class SafetyViewModel {
    alerts: SafetyAlertWithProfiles[] = [];
    selectedAlert: SafetyAlertWithProfiles | null = null;
    stats: SafetyAlertStats | null = null;
    isLoading: boolean = false;
    errorMessage: string | null = null;
    filterSeverity: Severity | 'all' = 'all';
    filterStatus: IncidentStatus | 'all' = 'new';
    sortBy: 'newest' | 'oldest' = 'newest';
    currentPage: number = 1;
    itemsPerPage: number = 20;
    isProcessing: boolean = false;
    currentAdminId: string = '';

    // Options for forms
    dismissalReasons: string[] = [];
    warningTypes: string[] = [];

    constructor() {
        makeAutoObservable(this);
        this.dismissalReasons = safetyService.getDismissalReasons();
        this.warningTypes = safetyService.getWarningTypes();
    }

    /**
     * Load safety alerts with current filters
     */
    async loadAlerts(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = null;

        try {
            const severity = this.filterSeverity === 'all' ? undefined : this.filterSeverity;
            const status = this.filterStatus === 'all' ? undefined : this.filterStatus;
            const offset = (this.currentPage - 1) * this.itemsPerPage;

            this.alerts = await safetyService.getAlerts(
                severity,
                status,
                this.sortBy,
                this.itemsPerPage,
                offset
            );
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to load safety alerts';
            console.error('Error loading safety alerts:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Load statistics
     */
    async loadStats(): Promise<void> {
        try {
            const stats = await safetyService.getAlertStats();
            runInAction(() => {
                this.stats = stats;
            });
        } catch (error) {
            console.error('Error loading safety stats:', error);
        }
    }

    /**
     * Select alert for detailed view
     */
    async selectAlert(alertId: string): Promise<void> {
        this.isLoading = true;
        this.errorMessage = null;

        try {
            this.selectedAlert = await safetyService.getAlertById(alertId);
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to load alert details';
            console.error('Error selecting alert:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Clear selected alert and return to list
     */
    backToList(): void {
        this.selectedAlert = null;
    }

    /**
     * Issue warning to reported user
     */
    async issueWarning(warningType: string, notes: string): Promise<boolean> {
        if (!this.selectedAlert) {
            this.errorMessage = 'No alert selected';
            return false;
        }

        this.isProcessing = true;
        this.errorMessage = null;

        try {
            await safetyService.issueWarning(
                this.selectedAlert.id,
                this.currentAdminId,
                warningType,
                notes
            );

            // Update local state
            this.selectedAlert.status = 'resolved';
            this.selectedAlert.admin_action_taken = 'warning_issued';
            await this.loadStats();

            return true;
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to issue warning';
            console.error('Error issuing warning:', error);
            return false;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Suspend reported user
     */
    async suspendUser(reason: string, duration: 'temporary' | 'permanent' = 'temporary'): Promise<boolean> {
        if (!this.selectedAlert) {
            this.errorMessage = 'No alert selected';
            return false;
        }

        this.isProcessing = true;
        this.errorMessage = null;

        try {
            await safetyService.suspendUser(
                this.selectedAlert.id,
                this.selectedAlert.reported_user.id,
                this.currentAdminId,
                reason,
                duration
            );

            // Update local state
            this.selectedAlert.status = 'resolved';
            this.selectedAlert.admin_action_taken = 'user_suspended';
            this.selectedAlert.reported_user.account_status = 'suspended';
            await this.loadStats();

            return true;
        } catch (error: any) {
            this.errorMessage = error.message || (typeof error === 'string' ? error : 'Failed to suspend user');
            console.error('Error suspending user:', error);
            return false;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Dismiss report as false positive
     */
    async dismissReport(reason: string, explanation?: string): Promise<boolean> {
        if (!this.selectedAlert) {
            this.errorMessage = 'No alert selected';
            return false;
        }

        this.isProcessing = true;
        this.errorMessage = null;

        try {
            await safetyService.dismissReport(
                this.selectedAlert.id,
                this.currentAdminId,
                reason,
                explanation
            );

            // Update local state
            this.selectedAlert.status = 'false_positive';
            this.selectedAlert.admin_action_taken = 'dismissed';
            await this.loadStats();

            return true;
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to dismiss report';
            console.error('Error dismissing report:', error);
            return false;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Initiate contact with user
     */
    async contactUser(method: 'email' | 'phone' | 'in_app', notes: string): Promise<boolean> {
        if (!this.selectedAlert) {
            this.errorMessage = 'No alert selected';
            return false;
        }

        this.isProcessing = true;

        try {
            await safetyService.initiateContact(
                this.selectedAlert.id,
                this.currentAdminId,
                method,
                notes
            );
            return true;
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to initiate contact';
            console.error('Error initiating contact:', error);
            return false;
        } finally {
            this.isProcessing = false;
        }
    }

    // ==================
    // FILTER & SORT
    // ==================

    setFilterSeverity(severity: Severity | 'all'): void {
        if (this.filterSeverity !== severity) {
            this.filterSeverity = severity;
            this.currentPage = 1;
        }
    }

    setFilterStatus(status: IncidentStatus | 'all'): void {
        if (this.filterStatus !== status) {
            this.filterStatus = status;
            this.currentPage = 1;
        }
    }

    setSortBy(sortBy: 'newest' | 'oldest'): void {
        if (this.sortBy !== sortBy) {
            this.sortBy = sortBy;
            this.currentPage = 1;
        }
    }

    goToPage(page: number): void {
        this.currentPage = page;
    }

    // ==================
    // COMPUTED HELPERS
    // ==================

    /**
     * Get formatted waiting time for an alert
     */
    getWaitingTime(alert: SafetyAlertWithProfiles): string {
        return safetyService.formatWaitingTime(alert.waiting_time_minutes);
    }

    /**
     * Check if alert response is urgent
     */
    isUrgent(alert: SafetyAlertWithProfiles): boolean {
        return safetyService.isResponseUrgent(alert.severity, alert.waiting_time_minutes);
    }

    /**
     * Get response time remaining for SLA
     */
    getResponseTimeRemaining(alert: SafetyAlertWithProfiles): string {
        return safetyService.getResponseTimeRemaining(alert.severity, alert.waiting_time_minutes);
    }

    /**
     * Get risk factors analysis
     */
    getRiskFactors(alert: SafetyAlertWithProfiles): string[] {
        return safetyService.analyzeRiskFactors(alert);
    }

    /**
     * Get recommended action
     */
    getRecommendation(alert: SafetyAlertWithProfiles): string {
        return safetyService.generateRecommendation(alert);
    }

    /**
     * Get severity display label
     */
    getSeverityLabel(severity: Severity): string {
        const labels: Record<Severity, string> = {
            critical: 'Critical',
            high: 'High Priority',
            medium: 'Medium',
            low: 'Low'
        };
        return labels[severity] || severity;
    }

    /**
     * Get status display label
     */
    getStatusLabel(status: IncidentStatus): string {
        const labels: Record<IncidentStatus, string> = {
            new: 'Pending Review',
            under_review: 'Under Review',
            resolved: 'Resolved',
            false_positive: 'Dismissed'
        };
        return labels[status] || status;
    }

    /**
     * Set current admin ID
     */
    setCurrentAdminId(adminId: string): void {
        this.currentAdminId = adminId;
    }
}

// Singleton instance
export const safetyViewModel = new SafetyViewModel();

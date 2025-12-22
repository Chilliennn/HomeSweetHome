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

    // AI Analysis state
    aiRiskFactors: string[] = [];
    aiRecommendation: string = '';
    isLoadingAI: boolean = false;

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

            const data = await safetyService.getAlerts(
                severity,
                status,
                this.sortBy,
                this.itemsPerPage,
                offset
            );

            runInAction(() => {
                this.alerts = data;
                this.errorMessage = null;
            });
        } catch (error) {
            runInAction(() => {
                this.errorMessage = error instanceof Error ? error.message : 'Failed to load safety alerts';
            });
            console.error('Error loading safety alerts:', error);
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
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
        // Clear previous AI results
        this.aiRiskFactors = [];
        this.aiRecommendation = '';

        try {
            const alert = await safetyService.getAlertById(alertId);
            runInAction(() => {
                this.selectedAlert = alert;
                this.errorMessage = null;
            });

            // Load AI analysis in the background
            if (alert) {
                this.loadAIAnalysis(alert);
            }
        } catch (error) {
            runInAction(() => {
                this.errorMessage = error instanceof Error ? error.message : 'Failed to load alert details';
            });
            console.error('Error selecting alert:', error);
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    /**
     * Load AI analysis for an alert (risk factors + recommendation)
     */
    async loadAIAnalysis(alert: SafetyAlertWithProfiles): Promise<void> {
        this.isLoadingAI = true;
        console.log('[SafetyViewModel] Loading AI analysis for alert:', alert.id);

        try {
            // Fetch both AI results in parallel
            const [riskFactors, recommendation] = await Promise.all([
                safetyService.analyzeRiskFactorsWithAI(alert),
                safetyService.generateRecommendationWithAI(alert)
            ]);

            runInAction(() => {
                this.aiRiskFactors = riskFactors;
                this.aiRecommendation = recommendation;
                console.log('[SafetyViewModel] AI analysis loaded:', { riskFactors, recommendation });
            });
        } catch (error) {
            console.error('[SafetyViewModel] Error loading AI analysis:', error);
            // Fallback to rule-based
            runInAction(() => {
                this.aiRiskFactors = safetyService.analyzeRiskFactors(alert);
                this.aiRecommendation = safetyService.generateRecommendation(alert);
            });
        } finally {
            runInAction(() => {
                this.isLoadingAI = false;
            });
        }
    }

    /**
     * Clear selected alert and return to list
     */
    backToList(): void {
        this.selectedAlert = null;
        this.aiRiskFactors = [];
        this.aiRecommendation = '';
    }

    /**
     * Issue warning to reported user
     */
    async issueWarning(warningType: string, notes: string): Promise<boolean> {
        console.log('[SafetyViewModel] issueWarning called:', { warningType, notes, adminId: this.currentAdminId });
        if (!this.selectedAlert) {
            this.errorMessage = 'No alert selected';
            console.error('[SafetyViewModel] issueWarning failed: No alert selected');
            return false;
        }

        this.isProcessing = true;
        this.errorMessage = null;

        try {
            const alertId = this.selectedAlert.id;
            console.log('[SafetyViewModel] Calling safetyService.issueWarning for alertId:', alertId);
            await safetyService.issueWarning(
                alertId,
                this.currentAdminId,
                warningType,
                notes
            );

            // Refetch to ensure we have latest DB state (including updated counts)
            await this.selectAlert(alertId);
            await this.loadStats();

            return true;
        } catch (error) {
            runInAction(() => {
                this.errorMessage = error instanceof Error ? error.message : 'Failed to issue warning';
            });
            console.error('Error issuing warning:', error);
            return false;
        } finally {
            runInAction(() => {
                this.isProcessing = false;
            });
        }
    }

    /**
     * Suspend reported user
     */
    async suspendUser(reason: string, duration: 'temporary' | 'permanent' = 'temporary'): Promise<boolean> {
        console.log('[SafetyViewModel] suspendUser called:', { reason, duration, adminId: this.currentAdminId });
        if (!this.selectedAlert) {
            this.errorMessage = 'No alert selected';
            console.error('[SafetyViewModel] suspendUser failed: No alert selected');
            return false;
        }

        this.isProcessing = true;
        this.errorMessage = null;

        try {
            if (!this.selectedAlert.reported_user) {
                this.errorMessage = 'No reported user found for this alert';
                console.error('[SafetyViewModel] suspendUser failed: No reported user');
                return false;
            }

            const alertId = this.selectedAlert.id;
            console.log('[SafetyViewModel] Calling safetyService.suspendUser for alertId:', alertId);
            await safetyService.suspendUser(
                alertId,
                this.selectedAlert.reported_user.id,
                this.currentAdminId,
                reason,
                duration
            );

            // Refetch to ensure we have latest DB state
            await this.selectAlert(alertId);
            await this.loadStats();

            return true;
        } catch (error: any) {
            runInAction(() => {
                this.errorMessage = error.message || (typeof error === 'string' ? error : 'Failed to suspend user');
            });
            console.error('Error suspending user:', error);
            return false;
        } finally {
            runInAction(() => {
                this.isProcessing = false;
            });
        }
    }

    /**
     * Dismiss report as false positive
     */
    async dismissReport(reason: string, explanation?: string): Promise<boolean> {
        console.log('[SafetyViewModel] dismissReport called:', { reason, explanation, adminId: this.currentAdminId });
        if (!this.selectedAlert) {
            this.errorMessage = 'No alert selected';
            console.error('[SafetyViewModel] dismissReport failed: No alert selected');
            return false;
        }

        const alertId = this.selectedAlert.id;
        this.isProcessing = true;
        this.errorMessage = null;

        try {
            console.log('[SafetyViewModel] Calling safetyService.dismissReport for alertId:', alertId);
            await safetyService.dismissReport(
                alertId,
                this.currentAdminId,
                reason,
                explanation
            );

            runInAction(() => {
                this.selectedAlert = null;
            });
            await this.loadAlerts(); // Refresh list
            await this.loadStats();

            return true;
        } catch (error) {
            runInAction(() => {
                this.errorMessage = error instanceof Error ? error.message : 'Failed to dismiss report';
            });
            console.error('Error dismissing report:', error);
            return false;
        } finally {
            runInAction(() => {
                this.isProcessing = false;
            });
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
            runInAction(() => {
                this.errorMessage = error instanceof Error ? error.message : 'Failed to initiate contact';
            });
            console.error('Error initiating contact:', error);
            return false;
        } finally {
            runInAction(() => {
                this.isProcessing = false;
            });
        }
    }

    /**
     * Delete alert entirely
     */
    async deleteAlert(): Promise<boolean> {
        if (!this.selectedAlert) {
            this.errorMessage = 'No alert selected';
            return false;
        }

        const alertId = this.selectedAlert.id;
        this.isProcessing = true;
        this.errorMessage = null;

        try {
            await safetyService.deleteAlert(alertId);
            runInAction(() => {
                this.selectedAlert = null;
            });
            await this.loadAlerts(); // Refresh list
            await this.loadStats();
            return true;
        } catch (error) {
            runInAction(() => {
                this.errorMessage = error instanceof Error ? error.message : 'Failed to delete alert';
            });
            console.error('Error deleting alert:', error);
            return false;
        } finally {
            runInAction(() => {
                this.isProcessing = false;
            });
        }
    }

    // ==================
    // FILTER & SORT
    // ==================

    setFilterSeverity(severity: Severity | 'all'): void {
        runInAction(() => {
            if (this.filterSeverity !== severity) {
                this.filterSeverity = severity;
                this.currentPage = 1;
            }
        });
    }

    setFilterStatus(status: IncidentStatus | 'all'): void {
        runInAction(() => {
            if (this.filterStatus !== status) {
                this.filterStatus = status;
                this.currentPage = 1;
            }
        });
    }

    setSortBy(sortBy: 'newest' | 'oldest'): void {
        runInAction(() => {
            if (this.sortBy !== sortBy) {
                this.sortBy = sortBy;
                this.currentPage = 1;
            }
        });
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

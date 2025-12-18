import { makeAutoObservable } from 'mobx';
import { consultationService } from '../../Model/Service/CoreService/consultationService';
import type { ConsultationRequest, Advisor, ConsultationStats } from '../../Model/Repository/AdminRepository/adminRepository';

export class ConsultationViewModel {
    consultations: ConsultationRequest[] = [];
    selectedConsultation: ConsultationRequest | null = null;
    advisors: Advisor[] = [];
    stats: ConsultationStats | null = null;
    isLoading: boolean = false;
    errorMessage: string | null = null;
    filter: 'all' | 'pending_assignment' | 'assigned' | 'in_progress' | 'completed' | 'dismissed' = 'all';
    sortBy: 'newest' | 'oldest' = 'newest';
    currentAdminId: string = '';

    constructor() {
        makeAutoObservable(this);
    }

    /**
     * Load all consultations with current filters
     */
    async loadConsultations(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = null;

        try {
            const status = this.filter === 'all' ? undefined : this.filter;
            this.consultations = await consultationService.getConsultations(status, undefined, this.sortBy);
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to load consultations';
            console.error('Error loading consultations:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Load statistics
     */
    async loadStats(): Promise<void> {
        try {
            this.stats = await consultationService.getConsultationStats();
        } catch (error) {
            console.error('Error loading consultation stats:', error);
        }
    }

    /**
     * Load available advisors
     */
    async loadAdvisors(): Promise<void> {
        try {
            this.advisors = await consultationService.getAdvisors();
        } catch (error) {
            console.error('Error loading advisors:', error);
        }
    }

    /**
     * Select a consultation for detailed view
     */
    async selectConsultation(id: string): Promise<void> {
        this.isLoading = true;
        this.errorMessage = null;

        try {
            this.selectedConsultation = await consultationService.getConsultationById(id);
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to load consultation';
            console.error('Error selecting consultation:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Go back to list
     */
    backToList(): void {
        this.selectedConsultation = null;
    }

    /**
     * Assign advisor to request
     */
    async assignAdvisor(consultationId: string, advisorId: string): Promise<void> {
        this.isLoading = true;
        this.errorMessage = null;

        try {
            await consultationService.assignAdvisor(consultationId, advisorId, this.currentAdminId);
            // Refresh data
            await this.loadConsultations();
            await this.loadStats();
            if (this.selectedConsultation?.id === consultationId) {
                await this.selectConsultation(consultationId);
            }
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to assign advisor';
            console.error('Error assigning advisor:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Dismiss a request
     */
    async dismissRequest(consultationId: string, reason: string): Promise<void> {
        this.isLoading = true;
        this.errorMessage = null;

        try {
            await consultationService.dismissRequest(consultationId, this.currentAdminId, reason);
            await this.loadConsultations();
            await this.loadStats();
            this.selectedConsultation = null;
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to dismiss request';
            console.error('Error dismissing request:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Set filter
     */
    setFilter(filter: 'all' | 'pending_assignment' | 'assigned' | 'in_progress' | 'completed' | 'dismissed'): void {
        if (this.filter !== filter) {
            this.filter = filter;
            this.loadConsultations();
        }
    }

    /**
     * Set sort order
     */
    setSortBy(sortBy: 'newest' | 'oldest'): void {
        if (this.sortBy !== sortBy) {
            this.sortBy = sortBy;
            this.loadConsultations();
        }
    }

    /**
     * Set current admin ID
     */
    setCurrentAdminId(adminId: string): void {
        this.currentAdminId = adminId;
    }

    /**
     * Get formatted waiting time
     */
    getWaitingTime(submittedAt: string): string {
        return consultationService.formatWaitingTime(submittedAt);
    }

    /**
     * Check if waiting time is alerting
     */
    isWaitingTimeAlert(submittedAt: string): boolean {
        return consultationService.isWaitingTimeAlert(submittedAt);
    }

    /**
     * Submit a new consultation request (for mobile users)
     */
    async submitConsultationRequest(
        requesterId: string,
        partnerId: string,
        relationshipId: string | null,
        consultationType: string,
        concernDescription: string,
        urgency: 'normal' | 'high' = 'normal',
        preferredMethod: 'video_call' | 'phone' | 'chat' = 'video_call',
        preferredDateTime: string = ''
    ): Promise<boolean> {
        this.isLoading = true;
        this.errorMessage = null;

        try {
            await consultationService.submitRequest(
                requesterId,
                partnerId,
                relationshipId,
                consultationType,
                concernDescription,
                urgency,
                preferredMethod,
                preferredDateTime
            );
            return true;
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to submit request';
            console.error('Error submitting consultation request:', error);
            return false;
        } finally {
            this.isLoading = false;
        }
    }
}

export const consultationViewModel = new ConsultationViewModel();

import { consultationRepository } from '../../Repository/AdminRepository/adminRepository';
import type { ConsultationRequest, Advisor, ConsultationStats } from '../../Repository/AdminRepository/adminRepository';

export const consultationService = {
    /**
     * Get all consultation requests with filtering and sorting
     */
    async getConsultations(
        status?: string,
        urgency?: string,
        sortBy: 'newest' | 'oldest' = 'newest',
        limit: number = 50,
        offset: number = 0
    ): Promise<ConsultationRequest[]> {
        return consultationRepository.getConsultations(status, urgency, sortBy, limit, offset);
    },

    /**
     * Get single consultation request by ID
     */
    async getConsultationById(id: string): Promise<ConsultationRequest> {
        const consultation = await consultationRepository.getConsultationById(id);
        if (!consultation) {
            throw new Error('Consultation request not found');
        }
        return consultation;
    },

    /**
     * Get dashboard statistics
     */
    async getConsultationStats(): Promise<ConsultationStats> {
        return consultationRepository.getConsultationStats();
    },

    /**
     * Get available advisors
     */
    async getAdvisors(status?: string): Promise<Advisor[]> {
        return consultationRepository.getAdvisors(status);
    },

    /**
     * Assign an advisor to a consultation request
     */
    async assignAdvisor(consultationId: string, advisorId: string, adminId: string): Promise<void> {
        if (!advisorId) {
            throw new Error('Advisor ID is required');
        }
        await consultationRepository.assignAdvisor(consultationId, advisorId, adminId);
    },

    /**
     * Dismiss a consultation request
     */
    async dismissRequest(consultationId: string, adminId: string, reason: string): Promise<void> {
        if (!reason || reason.trim().length === 0) {
            throw new Error('Dismissal reason is required');
        }
        await consultationRepository.dismissRequest(consultationId, adminId, reason);
    },

    /**
     * Complete a consultation request
     */
    async completeRequest(consultationId: string, notes: string): Promise<void> {
        await consultationRepository.completeRequest(consultationId, notes);
    },

    /**
     * Calculate waiting time in hours
     */
    calculateWaitingTime(submittedAt: string): number {
        const submitted = new Date(submittedAt);
        const now = new Date();
        const diffMs = now.getTime() - submitted.getTime();
        return Math.round(diffMs / (1000 * 60 * 60));
    },

    /**
     * Check if waiting time exceeds alert threshold (24 hours)
     */
    isWaitingTimeAlert(submittedAt: string): boolean {
        const waitingHours = this.calculateWaitingTime(submittedAt);
        return waitingHours >= 24;
    },

    /**
     * Format waiting time for display
     */
    formatWaitingTime(submittedAt: string): string {
        const hours = this.calculateWaitingTime(submittedAt);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h`;
    }
};

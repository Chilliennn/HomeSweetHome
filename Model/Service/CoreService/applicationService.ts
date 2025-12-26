import { adminRepository } from '../../Repository/AdminRepository/adminRepository';
import type { ApplicationWithProfiles, ApplicationStats } from '../../Repository/AdminRepository/adminRepository';

const REJECTION_REASONS = [
  'Insufficient motivation letter',
  'Age verification failed',
  'Inappropriate match',
  'Incomplete profile',
  'Other (requires detailed explanation)',
];

export const applicationService = {
  /**
   * Get all applications with filtering and sorting
   */
  async getApplications(
    status?: string,
    sortBy: 'oldest' | 'newest' = 'oldest',
    limit: number = 50,
    offset: number = 0
  ): Promise<ApplicationWithProfiles[]> {
    return adminRepository.getApplications(status, sortBy, limit, offset);
  },

  /**
   * Get single application with validation
   */
  async getApplicationById(applicationId: string): Promise<ApplicationWithProfiles> {
    const app = await adminRepository.getApplicationById(applicationId);
    if (!app) {
      throw new Error('Application not found');
    }
    return app;
  },

  /**
   * Get dashboard statistics
   */
  async getApplicationStats(): Promise<ApplicationStats> {
    return adminRepository.getApplicationStats();
  },

  /**
   * Validate application review criteria
   */
  validateReviewCriteria(application: ApplicationWithProfiles): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!application.youth.age_verified) {
      issues.push('Age verification not completed for youth');
    }

    if (!application.elderly.age_verified) {
      issues.push('Age verification not completed for elderly');
    }

    if (!application.motivation_letter || application.motivation_letter.trim().length < 50) {
      issues.push('Motivation letter is too short or missing');
    }

    if (application.motivation_letter && application.motivation_letter.length > 1000) {
      issues.push('Motivation letter exceeds maximum length (1000 characters)');
    }

    if (!application.youth.full_name || !application.elderly.full_name) {
      issues.push('Profile information incomplete');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  },

  /**
   * Get valid rejection reasons
   */
  getRejectionReasons(): string[] {
    return REJECTION_REASONS;
  },

  /**
   * Calculate waiting time in hours
   */
  calculateWaitingTime(appliedAt: string): number {
    const appliedDate = new Date(appliedAt);
    const now = new Date();
    const diffMs = now.getTime() - appliedDate.getTime();
    return Math.round(diffMs / (1000 * 60 * 60));
  },

  /**
   * Check if waiting time exceeds alert threshold (3 days = 72 hours)
   */
  isWaitingTimeAlert(appliedAt: string): boolean {
    const waitingHours = this.calculateWaitingTime(appliedAt);
    return waitingHours >= 72;
  },

  /**
   * Approve application with validation
   */
  async approveApplication(
    applicationId: string,
    adminId: string,
    notes?: string
  ): Promise<void> {
    const application = await this.getApplicationById(applicationId);
    const validation = this.validateReviewCriteria(application);

    if (!validation.isValid) {
      console.warn('Application has issues but proceeding with approval:', validation.issues);
    }

    await adminRepository.approveApplication(applicationId, adminId, notes);
  },

  /**
   * Reject application with validation
   */
  async rejectApplication(
    applicationId: string,
    adminId: string,
    rejectionReason: string,
    notes: string
  ): Promise<void> {
    if (!REJECTION_REASONS.includes(rejectionReason) && rejectionReason !== 'Other (requires detailed explanation)') {
      throw new Error('Invalid rejection reason');
    }

    if (rejectionReason === 'Other (requires detailed explanation)' && !notes) {
      throw new Error('Detailed explanation required for "Other" reason');
    }

    // Get the application to find youthId and elderlyId for notifications
    const application = await this.getApplicationById(applicationId);
    await adminRepository.rejectApplication(applicationId, adminId, rejectionReason, notes, application.youth.id, application.elderly.id);
  },

  /**
   * Request more information with validation
   */
  async requestMoreInfo(
    applicationId: string,
    adminId: string,
    infoRequested: string,
    notes: string
  ): Promise<void> {
    if (!infoRequested || infoRequested.trim().length === 0) {
      throw new Error('Information request cannot be empty');
    }

    // Get the application to find youthId for notification
    const application = await this.getApplicationById(applicationId);
    await adminRepository.requestMoreInfo(applicationId, adminId, infoRequested, notes, application.youth.id);
  },

  /**
   * Lock application for review
   */
  async lockApplication(applicationId: string, adminId: string): Promise<void> {
    await adminRepository.lockApplication(applicationId, adminId);
  },

  /**
   * Release application lock
   */
  async releaseApplication(applicationId: string): Promise<void> {
    await adminRepository.releaseApplication(applicationId);
  },
};

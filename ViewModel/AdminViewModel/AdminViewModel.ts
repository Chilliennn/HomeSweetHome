import { makeAutoObservable } from 'mobx';
import { applicationService } from '../../Model/Service/CoreService/applicationService';
import type { ApplicationWithProfiles, ApplicationStats } from '../../Model/Repository/AdminRepository/adminRepository';

export interface AdminState {
  applications: ApplicationWithProfiles[];
  selectedApplication: ApplicationWithProfiles | null;
  stats: ApplicationStats | null;
  isLoading: boolean;
  errorMessage: string | null;
  filter: 'all' | 'pending' | 'info_requested' | 'locked';
  sortBy: 'oldest' | 'newest';
  currentPage: number;
  itemsPerPage: number;
  rejectionReasons: string[];
  isApproving: boolean;
  isRejecting: boolean;
  isRequestingInfo: boolean;
}

export class AdminViewModel {
  applications: ApplicationWithProfiles[] = [];
  selectedApplication: ApplicationWithProfiles | null = null;
  stats: ApplicationStats | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  filter: 'all' | 'pending' | 'info_requested' | 'locked' = 'pending';
  sortBy: 'oldest' | 'newest' = 'oldest';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  rejectionReasons: string[] = [];
  isApproving: boolean = false;
  isRejecting: boolean = false;
  isRequestingInfo: boolean = false;
  currentAdminId: string = ''; // Set after authentication

  constructor() {
    makeAutoObservable(this);
    this.rejectionReasons = applicationService.getRejectionReasons();
  }

  /**
   * Load applications with current filters
   */
  async loadApplications(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const status = this.filter === 'all' ? undefined :
        this.filter === 'pending' ? 'pending_review' :
          this.filter === 'info_requested' ? 'info_requested' : undefined;

      const offset = (this.currentPage - 1) * this.itemsPerPage;
      this.applications = await applicationService.getApplications(
        status,
        this.sortBy,
        this.itemsPerPage,
        offset
      );
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Failed to load applications';
      console.error('Error loading applications:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load statistics
   */
  async loadStats(): Promise<void> {
    try {
      this.stats = await applicationService.getApplicationStats();
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  /**
   * Select application for review
   */
  async selectApplication(applicationId: string): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      // Try to lock the application for current admin (optional - don't fail if lock fails)
      try {
        if (this.currentAdminId) {
          await applicationService.lockApplication(applicationId, this.currentAdminId);
        }
      } catch (lockError) {
        console.warn('Could not lock application (may already be locked):', lockError);
        // Continue to load the application anyway
      }

      // Fetch the application details
      this.selectedApplication = await applicationService.getApplicationById(applicationId);

      if (!this.selectedApplication) {
        this.errorMessage = 'Application not found';
      }
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Failed to load application';
      console.error('Error selecting application:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Go back to list
   */
  async backToList(): Promise<void> {
    if (this.selectedApplication) {
      try {
        await applicationService.releaseApplication(this.selectedApplication.id);
      } catch (error) {
        console.error('Error releasing application:', error);
      }
    }
    this.selectedApplication = null;
    await this.loadApplications();
  }

  /**
   * Approve current application
   */
  async approveApplication(notes?: string): Promise<void> {
    if (!this.selectedApplication) {
      this.errorMessage = 'No application selected';
      return;
    }

    this.isApproving = true;
    this.errorMessage = null;

    try {
      await applicationService.approveApplication(
        this.selectedApplication.id,
        this.currentAdminId,
        notes
      );
      // Update local state
      this.selectedApplication.status = 'approved';
      // Reload stats
      await this.loadStats();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Failed to approve application';
      console.error('Error approving application:', error);
    } finally {
      this.isApproving = false;
    }
  }

  /**
   * Approve current application and move to next one in the queue
   */
  async approveAndReviewNext(notes?: string): Promise<void> {
    // First approve the current application
    await this.approveApplication(notes);

    if (this.errorMessage) {
      return; // Don't proceed if approval failed
    }

    // Release the current application lock
    if (this.selectedApplication) {
      try {
        await applicationService.releaseApplication(this.selectedApplication.id);
      } catch (error) {
        console.error('Error releasing application:', error);
      }
    }

    // Reload the applications list
    await this.loadApplications();

    // Find the next pending application
    const nextApp = this.applications.find(app =>
      app.status === 'pending_review' && app.id !== this.selectedApplication?.id
    );

    if (nextApp) {
      // Select the next application
      await this.selectApplication(nextApp.id);
    } else {
      // No more pending applications, go back to list
      this.selectedApplication = null;
    }
  }

  /**
   * Reject current application
   */
  async rejectApplication(reason: string, notes: string): Promise<void> {
    if (!this.selectedApplication) {
      this.errorMessage = 'No application selected';
      return;
    }

    this.isRejecting = true;
    this.errorMessage = null;

    try {
      await applicationService.rejectApplication(
        this.selectedApplication.id,
        this.currentAdminId,
        reason,
        notes
      );
      // Update local state
      this.selectedApplication.status = 'rejected';
      // Reload stats
      await this.loadStats();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Failed to reject application';
      console.error('Error rejecting application:', error);
    } finally {
      this.isRejecting = false;
    }
  }

  /**
   * Request more information
   */
  async requestMoreInfo(infoNeeded: string, notes: string): Promise<void> {
    if (!this.selectedApplication) {
      this.errorMessage = 'No application selected';
      return;
    }

    this.isRequestingInfo = true;
    this.errorMessage = null;

    try {
      await applicationService.requestMoreInfo(
        this.selectedApplication.id,
        this.currentAdminId,
        infoNeeded,
        notes
      );
      // Update local state
      this.selectedApplication.status = 'info_requested';
      // Reload stats
      await this.loadStats();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Failed to request information';
      console.error('Error requesting info:', error);
    } finally {
      this.isRequestingInfo = false;
    }
  }

  /**
   * Set filter
   */
  setFilter(filter: 'all' | 'pending' | 'info_requested' | 'locked'): void {
    if (this.filter !== filter) {
      this.filter = filter;
      this.currentPage = 1;
    }
  }

  /**
   * Set sort
   */
  setSortBy(sortBy: 'oldest' | 'newest'): void {
    if (this.sortBy !== sortBy) {
      this.sortBy = sortBy;
      this.currentPage = 1;
    }
  }

  /**
   * Go to page
   */
  goToPage(page: number): void {
    this.currentPage = page;
  }

  /**
   * Calculate waiting time for application
   */
  getWaitingTime(appliedAt: string): string {
    const hours = applicationService.calculateWaitingTime(appliedAt);
    if (hours < 24) {
      return `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  /**
   * Check if waiting time alert
   */
  isWaitingAlert(appliedAt: string): boolean {
    return applicationService.isWaitingTimeAlert(appliedAt);
  }

  /**
   * Get display status
   */
  getDisplayStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending_review: 'Pending Review',
      approved: 'Approved',
      info_requested: 'Info Requested',
      rejected: 'Rejected',
    };
    return statusMap[status] || status;
  }

  /**
   * Set current admin ID
   */
  setCurrentAdminId(adminId: string): void {
    this.currentAdminId = adminId;
  }
}

export const adminViewModel = new AdminViewModel();

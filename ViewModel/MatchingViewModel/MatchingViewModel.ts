import { makeAutoObservable, runInAction } from 'mobx';
import { matchingService } from '../../Model/Service/CoreService/matchingService';


export class MatchingViewModel {
  // =============================================================
  // Observable State
  // =============================================================

  /** Whether the user has seen the journey walkthrough */
  hasSeenWalkthrough = false;

  /** Whether walkthrough is currently being shown */
  showWalkthrough = false;

  /** Loading walkthrough status from database */
  isLoadingWalkthrough = false;

  /** Loading state */
  isLoading = false;

  /** Error message */
  errorMessage: string | null = null;

  /** Current authenticated user ID (sync'd from AuthViewModel) */
  currentUserId: string | null = null;

  /** Current user type (sync'd from AuthViewModel) */
  currentUserType: 'youth' | 'elderly' | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // =============================================================
  // User Context Management
  // =============================================================

  /**
   * Set current user context
   * Called by root layout when auth state changes
   */
  setCurrentUser(userId: string | null, userType: 'youth' | 'elderly' | null): void {
    runInAction(() => {
      this.currentUserId = userId;
      this.currentUserType = userType;
    });

    // Load walkthrough status when user context is set
    if (userId) {
      this.loadWalkthroughStatus();
    }
  }

  /**
   * Clear user context (on logout)
   */
  clearUser(): void {
    runInAction(() => {
      this.currentUserId = null;
      this.currentUserType = null;
    });
  }

  // =============================================================
  // Walkthrough Actions
  // =============================================================

  /**
   * Load walkthrough completion status from database
   * Called when user context is set or when entering matching screen
   */
  async loadWalkthroughStatus() {
    if (!this.currentUserId) return;

    runInAction(() => {
      this.isLoadingWalkthrough = true;
    });

    try {
      const completed = await matchingService.getWalkthroughStatus(this.currentUserId);
      runInAction(() => {
        this.hasSeenWalkthrough = completed;
        this.isLoadingWalkthrough = false;
      });
    } catch (error) {
      console.error('[MatchingViewModel] Failed to load walkthrough status:', error);
      // Default to false (show walkthrough)
      runInAction(() => {
        this.hasSeenWalkthrough = false;
        this.isLoadingWalkthrough = false;
      });
    }
  }

  /**
   * Check if walkthrough should be shown (first time user)
   * Called when entering matching screen after profile completion
   * @param isFirstTimeUser - Whether user is newly registered (triggers check)
   * @param force - Force show walkthrough (e.g. "Learn More" button)
   */
  checkWalkthroughStatus(isFirstTimeUser: boolean = true, force: boolean = false) {
    // Force always shows walkthrough (Learn More button)
    if (force) {
      this.showWalkthrough = true;
      return;
    }

    // Only show if first time AND user has NOT seen it before (from database)
    if (isFirstTimeUser && !this.hasSeenWalkthrough) {
      this.showWalkthrough = true;
    } else {
      this.showWalkthrough = false;
    }
  }

  /**
   * Mark walkthrough as completed and persist to database
   * Called when user finishes or skips walkthrough
   */
  async completeWalkthrough() {
    runInAction(() => {
      this.showWalkthrough = false;
      this.hasSeenWalkthrough = true;
    });

    if (!this.currentUserId) {
      console.warn('[MatchingViewModel] Cannot save walkthrough: no userId');
      return;
    }

    // Persist to database via MatchingService → UserRepository
    try {
      await matchingService.updateWalkthroughStatus(this.currentUserId, true);
      console.log('[MatchingViewModel] Walkthrough completion saved to database');
    } catch (error) {
      console.error('[MatchingViewModel] Failed to save walkthrough status:', error);
    }
  }

  /**
   * Reset walkthrough state (for testing or re-showing)
   * Also clears persisted database record
   */
  async resetWalkthrough() {
    runInAction(() => {
      this.hasSeenWalkthrough = false;
      this.showWalkthrough = false;
    });

    if (!this.currentUserId) return;

    // Clear from database via MatchingService → UserRepository
    try {
      await matchingService.updateWalkthroughStatus(this.currentUserId, false);
      console.log('[MatchingViewModel] Walkthrough status reset in database');
    } catch (error) {
      console.error('[MatchingViewModel] Failed to reset walkthrough status:', error);
    }
  }

  // =============================================================
  // Error Handling
  // =============================================================

  setError(message: string | null) {
    this.errorMessage = message;
  }

  clearError() {
    this.errorMessage = null;
  }
}

// Singleton instance
export const matchingViewModel = new MatchingViewModel();

import { makeAutoObservable, runInAction } from 'mobx';

/**
 * MatchingViewModel - Manages matching flow state
 * 
 * MVVM Architecture:
 * - Manages UI state for elderly browsing and adoption process
 * - Tracks journey walkthrough completion
 * - Handles pre-match and application states
 */
export class MatchingViewModel {
  // =============================================================
  // Observable State
  // =============================================================

  /** Whether the user has seen the journey walkthrough */
  hasSeenWalkthrough = false;

  /** Whether walkthrough is currently being shown */
  showWalkthrough = false;

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
  // Placeholder Methods
  // =============================================================

  // =============================================================
  // Walkthrough Actions
  // =============================================================

  /**
   * Check if walkthrough should be shown (first time user)
   * Called when entering matching screen after profile completion
   */
  /**
   * Check if walkthrough should be shown (first time user)
   * Called when entering matching screen after profile completion
   * @param isFirstTimeUser - Whether user is newly registered (triggers check)
   * @param force - Force show walkthrough (e.g. "Learn More" button)
   */
  checkWalkthroughStatus(isFirstTimeUser: boolean = true, force: boolean = false) {
    if (force || (isFirstTimeUser && !this.hasSeenWalkthrough)) {
      this.showWalkthrough = true;
    }
  }

  /**
   * Mark walkthrough as completed
   * Called when user finishes or skips walkthrough
   */
  completeWalkthrough() {
    runInAction(() => {
      this.showWalkthrough = false;
      this.hasSeenWalkthrough = true;
    });
    // TODO: Persist to storage/backend
  }

  /**
   * Reset walkthrough state (for testing or re-showing)
   */
  resetWalkthrough() {
    this.hasSeenWalkthrough = false;
    this.showWalkthrough = false;
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

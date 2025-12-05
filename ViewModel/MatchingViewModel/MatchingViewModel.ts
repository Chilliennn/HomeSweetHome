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

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // =============================================================
  // Walkthrough Actions
  // =============================================================

  /**
   * Check if walkthrough should be shown (first time user)
   * Called when entering matching screen after profile completion
   */
  checkWalkthroughStatus(isFirstTimeUser: boolean = true) {
    if (isFirstTimeUser && !this.hasSeenWalkthrough) {
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

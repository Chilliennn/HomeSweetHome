import { makeAutoObservable, runInAction } from 'mobx';
import { authService } from '@home-sweet-home/model';
import type { User } from '@home-sweet-home/model';

/**
 * SettingsViewModel - Manages settings screen state
 * 
 * MVVM Architecture:
 * - This ViewModel is a class with observable properties (MobX)
 * - View binds to observable properties for automatic updates
 * - ViewModel calls Service layer for business logic
 * - No direct access to Repository or Database
 * 
 * Single Responsibility:
 * - Manages UI state for settings screen
 * - Handles notification preferences
 * - Manages logout flow
 */
export class SettingsViewModel {
  // =============================================================
  // Observable State - UI binds to these properties
  // =============================================================
  
  currentUser: User | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  
  // Notification preferences
  notificationSettings = {
    newInterests: true,
    messages: true,
    applicationUpdates: true,
    safetyAlerts: true,
    platformUpdates: false,
  };

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // =============================================================
  // Actions
  // =============================================================

  /**
   * Load current user profile
   */
  async loadUserProfile(userId: string) {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const result = await authService.getCurrentUserWithProfile();
      runInAction(() => {
        this.currentUser = result?.appUser || null;
      });
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error?.message || 'Failed to load profile';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Toggle notification setting
   */
  toggleNotification(key: keyof typeof this.notificationSettings) {
    this.notificationSettings[key] = !this.notificationSettings[key];
    // TODO: Persist to backend when notification service is implemented
  }


  /**
   * Clear error message
   */
  clearError() {
    this.errorMessage = null;
  }
}

// Singleton instance for global state management
export const settingsViewModel = new SettingsViewModel();

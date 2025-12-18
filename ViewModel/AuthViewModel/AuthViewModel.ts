import { makeAutoObservable, runInAction } from 'mobx';
// Force update
import {
  AgeVerificationPayload,
  AgeVerificationResult,
  DisplayIdentityPayload,
  ProfileCompletionState,
  ProfileInfoPayload,
  RealIdentityPayload,
  User,
  UserType,
  profileCompletionService,
  authService,
} from '@home-sweet-home/model';

/**
 * Profile Setup Step - represents the current step in the profile setup flow
 */
export type ProfileSetupStep =
  | 'welcome'
  | 'age-verification'
  | 'camera'
  | 'verifying'
  | 'verified'
  | 'real-identity'
  | 'display-identity'
  | 'profile-info'
  | 'complete';

/**
 * Profile Setup Data - holds the data collected during profile setup
 */
interface ProfileSetupData {
  realIdentity: RealIdentityPayload | null;
  displayIdentity: DisplayIdentityPayload | null;
  profileInfo: ProfileInfoPayload | null;
}

/**
 * Auth State - represents the current authentication state
 */
interface AuthState {
  isAuthenticated: boolean;
  currentUserId: string | null;
  currentUserEmail: string | null;
}

/**
 * AuthViewModel - Manages authentication and profile setup state
 * 
 * MVVM Architecture:
 * - This ViewModel is a class with observable properties (MobX)
 * - View binds to observable properties for automatic updates
 * - ViewModel calls Service layer for business logic
 * - No direct access to Repository or Database
 * 
 * Single Responsibility:
 * - Manages UI state for authentication flows
 * - Manages UI state for profile setup flow (UC-103)
 * - Transforms Service results to UI-friendly state
 */
export class AuthViewModel {
  // =============================================================
  // Observable State - UI binds to these properties
  // =============================================================

  // Authentication state
  authState: AuthState = {
    isAuthenticated: false,
    currentUserId: null,
    currentUserEmail: null,
  };

  // Profile setup flow state
  currentStep: ProfileSetupStep = 'welcome';
  isLoading = false;
  errorMessage: string | null = null;

  // Age verification state
  verifiedAge: number | null = null;
  userType: UserType = 'youth';
  verificationResult: AgeVerificationResult | null = null;

  // Profile data collected during setup
  profileData: ProfileSetupData = {
    realIdentity: null,
    displayIdentity: null,
    profileInfo: null,
  };

  // Profile completion tracking
  profileCompletion: ProfileCompletionState = {
    ageVerified: false,
    realIdentityCompleted: false,
    displayIdentityCompleted: false,
    profileInfoCompleted: false,
    profileCompleted: false,
  };

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // =============================================================
  // Computed Properties - Derived state for UI
  // =============================================================

  /**
   * Check if user can proceed to matching
   * Based on UC103 C1: Matching features require age verification
   */
  get canAccessMatching(): boolean {
    return this.profileCompletion.ageVerified;
  }

  /**
   * Check if profile setup is fully complete
   */
  get isProfileComplete(): boolean {
    return this.profileCompletion.profileCompleted;
  }

  /**
   * Get current step number for progress indicator
   */
  get currentStepNumber(): number {
    const stepMap: Record<ProfileSetupStep, number> = {
      'welcome': 0,
      'age-verification': 1,
      'camera': 1,
      'verifying': 1,
      'verified': 1,
      'real-identity': 2,
      'display-identity': 3,
      'profile-info': 4,
      'complete': 5,
    };
    return stepMap[this.currentStep];
  }

  /**
   * Total number of main steps (excluding sub-steps)
   */
  get totalSteps(): number {
    return 5;
  }

  // =============================================================
  // Auth Actions - Delegate to AuthService
  // =============================================================

  /**
   * Sign in user with email and password
   */
  async signIn(email: string, password: string) {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const result = await authService.signIn(email, password);
      runInAction(() => {
        this.authState = {
          isAuthenticated: true,
          // Prototype mode: use appUser id/email since we skip Supabase auth
          currentUserId: result.appUser?.id || result.user?.id || null,
          currentUserEmail: result.appUser?.email || result.user?.email || null,
        };
        // Update user type if available from profile
        if (result.appUser?.user_type) {
          this.userType = result.appUser.user_type;
        }
      });
      return result;
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = this.mapAuthError(error);
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Sign up new user with email and password
   */
  async signUp(email: string, password: string) {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const result = await authService.signUp(email, password);
      runInAction(() => {
        this.authState = {
          isAuthenticated: true,
          currentUserId: result.user?.id || null,
          currentUserEmail: result.user?.email || null,
        };
      });
      return result;
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = this.mapAuthError(error);
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      await authService.signOut();
      runInAction(() => {
        this.authState = {
          isAuthenticated: false,
          currentUserId: null,
          currentUserEmail: null,
        };
        this.resetFlow();
      });
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = this.mapAuthError(error);
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Check and restore authentication state
   */
  async checkAuthState() {
    try {
      const result = await authService.getCurrentUserWithProfile();
      runInAction(() => {
        if (result) {
          this.authState = {
            isAuthenticated: true,
            currentUserId: result.user?.id || null,
            currentUserEmail: result.user?.email || null,
          };
          if (result.appUser?.user_type) {
            this.userType = result.appUser.user_type;
          }
        }
      });
      return result;
    } catch {
      // Session invalid or expired
      runInAction(() => {
        this.authState = {
          isAuthenticated: false,
          currentUserId: null,
          currentUserEmail: null,
        };
      });
      return null;
    }
  }

  // =============================================================
  // Profile Setup State Helpers
  // =============================================================

  /**
   * Reset the profile setup flow to initial state
   */
  resetFlow(userType: UserType = 'youth') {
    this.currentStep = 'welcome';
    this.userType = userType;
    this.verifiedAge = null;
    this.verificationResult = null;
    this.profileData = { realIdentity: null, displayIdentity: null, profileInfo: null };
    this.profileCompletion = {
      ageVerified: false,
      realIdentityCompleted: false,
      displayIdentityCompleted: false,
      profileInfoCompleted: false,
      profileCompleted: false,
    };
    this.errorMessage = null;
    this.isLoading = false;
  }

  /**
   * Set the current step in the profile setup flow
   */
  setStep(step: ProfileSetupStep) {
    this.currentStep = step;
  }

  /**
   * Set error message
   */
  setError(message: string | null) {
    this.errorMessage = message;
  }

  /**
   * Clear error message
   */
  clearError() {
    this.errorMessage = null;
  }

  // =============================================================
  // UC103: Age Verification - Delegate to ProfileCompletionService
  // =============================================================

  /**
   * Verify age using captured photo
   * UC103_2, UC103_3, UC103_4
   */
  async verifyAgeWithCapture(payload: AgeVerificationPayload) {
    this.isLoading = true;
    this.errorMessage = null;
    this.currentStep = 'verifying';

    try {
      const result = await profileCompletionService.verifyAgeAndPersist(payload);
      runInAction(() => {
        this.verificationResult = result;
        this.verifiedAge = result.verifiedAge;
        this.profileCompletion.ageVerified = result.ageVerified;
        this.userType = payload.userType;
        this.currentStep = 'verified';
      });
      return result;
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = this.mapVerificationError(error);
        this.currentStep = 'age-verification';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  // =============================================================
  // UC103: Profile Sections - Delegate to ProfileCompletionService
  // =============================================================

  /**
   * Save real identity information
   * UC103_5, UC103_6
   */
  async saveRealIdentity(userId: string, data: RealIdentityPayload) {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const user = await profileCompletionService.saveRealIdentity(userId, data);
      runInAction(() => {
        this.profileData.realIdentity = data;
        this.profileCompletion.realIdentityCompleted = true;
      });
      return user;
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error?.message || 'Unable to save real identity';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Save display identity information
   * UC103_7, UC103_8, UC103_9, UC103_10
   */
  async saveDisplayIdentity(userId: string, data: DisplayIdentityPayload) {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const user = await profileCompletionService.saveDisplayIdentity(userId, data);
      runInAction(() => {
        this.profileData.displayIdentity = data;
        this.profileCompletion.displayIdentityCompleted = true;
      });
      return user;
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error?.message || 'Unable to save display identity';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Save profile information
   * UC103_11, UC103_12, UC103_13, UC103_14, UC103_15
   */
  async saveProfileInfo(userId: string, data: ProfileInfoPayload) {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const user = await profileCompletionService.saveProfileInfo(userId, data);
      runInAction(() => {
        this.profileData.profileInfo = data;
        this.profileCompletion.profileInfoCompleted = true;
      });
      return user;
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error?.message || 'Unable to save profile info';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Mark profile as complete
   * UC103_16, UC103_17, UC103_18
   */
  async markProfileComplete(userId: string) {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const user = await profileCompletionService.markProfileComplete(userId);
      runInAction(() => {
        this.profileCompletion.profileCompleted = true;
        this.currentStep = 'complete';
      });
      return user;
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error?.message || 'Unable to complete profile';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Load existing profile data for a user
   */
  async loadProfile(userId: string): Promise<User | null> {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const user = await profileCompletionService.loadUser(userId);
      runInAction(() => {
        this.profileCompletion = profileCompletionService.getCompletionState(user);

        if (user?.profile_data?.verified_age) {
          this.verifiedAge = user.profile_data.verified_age;
          this.profileCompletion.ageVerified = !!user.profile_data.age_verified;
        }

        if (user?.user_type) {
          this.userType = user.user_type;
        }

        // Real Identity: phone & location from users table, real_photo from profile_data
        if (user?.phone || user?.location || user?.profile_data?.real_identity) {
          this.profileData.realIdentity = {
            phoneNumber: user.phone || '',
            location: user.location || '',
            realPhotoUrl: user.profile_data?.real_identity?.real_photo_url || null,
          };
        }

        // Display Identity: all from profile_data
        if (user?.profile_data?.avatar_meta || user?.profile_data?.display_name) {
          this.profileData.displayIdentity = {
            displayName: user.profile_data.display_name || '',
            avatarType: (user.profile_data.avatar_meta?.type as 'default' | 'custom') || 'default',
            selectedAvatarIndex: user.profile_data.avatar_meta?.selected_avatar_index ?? null,
            customAvatarUrl: user.profile_data.avatar_url || null,
          };
        }

        // Profile Info: languages from users table, interests & intro from profile_data
        if (user?.languages || user?.profile_data?.interests) {
          this.profileData.profileInfo = {
            interests: user.profile_data?.interests || [],
            selfIntroduction: user.profile_data?.self_introduction || '',
            languages: user.languages || [],
          };
        }
      });
      return user;
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error?.message || 'Unable to load profile';
      });
      return null;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  // =============================================================
  // Private Helper Methods - Error Mapping
  // =============================================================

  /**
   * Map auth errors to user-friendly messages
   */
  private mapAuthError(error: any): string {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('invalid login credentials')) {
      return 'Invalid email or password';
    }
    if (message.includes('email not confirmed')) {
      return 'Please verify your email before signing in';
    }
    if (message.includes('user already registered')) {
      return 'An account with this email already exists';
    }
    if (message.includes('password')) {
      return 'Password must be at least 6 characters';
    }
    if (message.includes('email')) {
      return 'Please enter a valid email address';
    }

    return error?.message || 'Authentication failed. Please try again.';
  }

  /**
   * Map verification errors to user-friendly messages
   */
  private mapVerificationError(error: any): string {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('below minimum')) {
      if (this.userType === 'youth') {
        return 'You must be at least 18 years old to register as a youth';
      }
      return 'You must be at least 60 years old to register as an elderly';
    }
    if (message.includes('exceeds maximum')) {
      if (this.userType === 'youth') {
        return 'Youth users must be 40 years old or younger';
      }
      return 'Age verification failed';
    }

    return error?.message || 'Age verification failed. Please try again.';
  }
}

// Singleton instance for global state management
export const authViewModel = new AuthViewModel();

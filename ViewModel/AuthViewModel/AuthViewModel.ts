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
  notificationService,
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
  | 'profile-form'
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

  // Current user object (for display purposes like profile_photo_url)
  currentUser: User | null = null;

  /** Whether user has active relationship (for disabling tabs) */
  hasActiveRelationship = false;

  // Profile Info Form validation errors (managed by ViewModel per MVVM rules)
  profileInfoErrors: Record<string, string> = {};

  // Profile Setup Form validation errors (managed by ViewModel per MVVM rules)
  profileSetupErrors: Record<string, string> = {};

  // Profile Info Form validation constants (exposed for View to display limits)
  static readonly VALIDATION_RULES = {
    interests: { minCount: 3, maxCount: 10 },
    languages: { minCount: 1, maxCount: 10 },
    selfIntroduction: { minLength: 50, maxLength: 500 },
  };

  // Profile Setup Form validation constants
  static readonly PROFILE_SETUP_RULES = {
    phoneNumber: { pattern: /^\+?[\d\s-]{10,}$/ },
    fullName: { minLength: 2, maxLength: 50 },
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
      'profile-form': 2,
      'profile-info': 3,
      'complete': 4,
    };
    return stepMap[this.currentStep];
  }

  /**
   * Total number of main steps (excluding sub-steps)
   */
  get totalSteps(): number {
    return 4; // Welcome, Age Verification, Profile Form, Profile Info
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
   * Sign up new user with email, password, and user type
   * Creates both Supabase auth account AND app user profile
   */
  async signUpWithProfile(email: string, password: string, userType: 'youth' | 'elderly') {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const result = await authService.signUpWithProfile(email, password, userType);
      runInAction(() => {
        this.authState = {
          isAuthenticated: true,
          currentUserId: result.appUser?.id || result.user?.id || null,
          currentUserEmail: result.appUser?.email || result.user?.email || null,
        };
        this.userType = userType;
        this.currentUser = result.appUser;
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

  /**
   * Get active relationship for a user
   * Used during login to determine if user should go to bonding or matching
   */
  async getActiveRelationship(userId: string) {
    const { relationshipService } = await import('@home-sweet-home/model');
    return relationshipService.getActiveRelationship(userId);
  }

  /**
   * Check if user has active relationship (for tab enabling/disabling)
   */
  async checkActiveRelationship(userId: string): Promise<void> {
    try {
      const { relationshipService } = await import('@home-sweet-home/model');
      const relationship = await relationshipService.getActiveRelationship(userId);
      runInAction(() => {
        this.hasActiveRelationship = relationship !== null;
      });
    } catch (error) {
      console.error('[AuthViewModel] Error checking active relationship:', error);
      runInAction(() => {
        this.hasActiveRelationship = false;
      });
    }
  }

  /**
   * Check if user account is suspended (is_active = false)
   * Used by main layout to force logout suspended users
   * @returns true if user is suspended, false otherwise
   */
  async checkSuspensionStatus(userId: string): Promise<boolean> {
    try {
      return await authService.checkSuspensionStatus(userId);
    } catch (error) {
      console.error('[AuthViewModel] Error checking suspension status:', error);
      return false;
    }
  }

  /**
   * Manually set auth state (for prototype mode)
   * Used when login flow bypasses authService
   */
  setAuthState(state: AuthState) {
    runInAction(() => {
      this.authState = state;
    });
  }

  /**
   * Manually set user type
   */
  setUserType(userType: UserType) {
    runInAction(() => {
      this.userType = userType;
    });
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
    console.log('[AuthViewModel] verifyAgeWithCapture START:', payload.userId);

    this.isLoading = true;
    this.errorMessage = null;
    this.currentStep = 'verifying';
    console.log('[AuthViewModel] Step set to: verifying');

    try {
      const result = await profileCompletionService.verifyAgeAndPersist(payload);
      console.log('[AuthViewModel] Service returned result:', result);

      runInAction(() => {
        console.log('[AuthViewModel] runInAction: updating state');
        this.verificationResult = result;
        this.verifiedAge = result.verifiedAge;
        this.profileCompletion.ageVerified = result.ageVerified;
        this.userType = payload.userType;
        this.currentStep = 'verified';
        console.log('[AuthViewModel] Step set to: verified, age:', result.verifiedAge);
      });
      return result;
    } catch (error: any) {
      console.error('[AuthViewModel] verifyAgeWithCapture ERROR:', error);
      runInAction(() => {
        this.errorMessage = this.mapVerificationError(error);
        this.currentStep = 'age-verification';
        console.log('[AuthViewModel] Step set to: age-verification (error recovery)');
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
        console.log('[AuthViewModel] isLoading set to false');
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
   * Validate profile setup data (ViewModel-level validation for UI)
   * Per MVVM rules: Basic validation in ViewModel
   * 
   * @param data - Profile setup data to validate
   * @param locationOptions - Valid location options
   * @returns true if valid, false if validation errors
   */
  validateProfileSetup(
    data: { phoneNumber: string; location: string; fullName: string },
    locationOptions: string[]
  ): boolean {
    const errors: Record<string, string> = {};
    const rules = AuthViewModel.PROFILE_SETUP_RULES;

    // Validate phone number
    if (!data.phoneNumber.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!rules.phoneNumber.pattern.test(data.phoneNumber)) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Validate location
    if (!data.location.trim()) {
      errors.location = 'Location is required';
    } else if (!locationOptions.includes(data.location)) {
      errors.location = 'Please select a valid location from the list';
    }

    // Validate full name
    if (!data.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (data.fullName.length < rules.fullName.minLength || data.fullName.length > rules.fullName.maxLength) {
      errors.fullName = `Full name must be ${rules.fullName.minLength}-${rules.fullName.maxLength} characters`;
    }

    runInAction(() => {
      this.profileSetupErrors = errors;
    });

    return Object.keys(errors).length === 0;
  }

  /**
   * Clear profile setup validation errors
   */
  clearProfileSetupErrors() {
    runInAction(() => {
      this.profileSetupErrors = {};
    });
  }

  /**
   * Clear a specific profile setup error field
   */
  clearProfileSetupError(field: string) {
    runInAction(() => {
      const newErrors = { ...this.profileSetupErrors };
      delete newErrors[field];
      this.profileSetupErrors = newErrors;
    });
  }

  /**
   * Save combined profile setup (merged Step 1 + Step 2)
   * Handles: phone, location, displayName, avatar upload
   * 
   * NOTE: For custom avatars, the View layer must read the file and pass base64 data.
   * The ViewModel does NOT handle file system operations.
   */
  async saveProfileSetup(
    userId: string,
    data: {
      phoneNumber: string;
      location: string;
      fullName: string;
      avatarType: 'default' | 'custom';
      selectedAvatarId: string | null;
      // For profile photo: base64 data and extension (from View layer)
      profilePhotoBase64: string | null;
      profilePhotoExtension: string | null;
    }
  ) {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const user = await profileCompletionService.saveProfileSetup(userId, data);

      // Convert selectedAvatarId to index for storage in profileData
      let avatarIndex: number | null = null;
      if (data.selectedAvatarId) {
        if (data.selectedAvatarId.startsWith('img-')) {
          avatarIndex = parseInt(data.selectedAvatarId.replace('img-', ''), 10);
        } else if (data.selectedAvatarId.startsWith('emoji-')) {
          avatarIndex = parseInt(data.selectedAvatarId.replace('emoji-', ''), 10) + 2;
        }
      }

      runInAction(() => {
        // FIXED: Update realIdentity data (phone, location only)
        this.profileData.realIdentity = {
          phoneNumber: data.phoneNumber,
          location: data.location,
        };
        // FIXED: Update displayIdentity data (avatar_meta only)
        this.profileData.displayIdentity = {
          avatarType: data.avatarType,
          selectedAvatarIndex: avatarIndex,
        };
        this.profileCompletion.realIdentityCompleted = true;
        this.profileCompletion.displayIdentityCompleted = true;
      });
      return user;
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error?.message || 'Unable to save profile';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Validate profile info data (ViewModel-level validation for UI)
   * Per MVVM rules: Basic validation in ViewModel, business rules in Service
   * UC103_11, UC103_12, UC103_13, UC103_15
   * 
   * @param data - Profile info data to validate
   * @returns true if valid, false if validation errors
   */
  validateProfileInfo(data: ProfileInfoPayload): boolean {
    console.log('[AuthViewModel] validateProfileInfo called with:', data);
    const errors: Record<string, string> = {};
    const rules = AuthViewModel.VALIDATION_RULES;

    // Count valid custom entries
    const validCustomInterestsCount = (data.customInterests || []).filter(i => i.trim()).length;
    const validCustomLanguagesCount = (data.customLanguages || []).filter(l => l.trim()).length;

    // Validate interests count (UC103_11)
    const totalInterests = data.interests.length + validCustomInterestsCount;
    console.log('[AuthViewModel] totalInterests:', totalInterests, 'min:', rules.interests.minCount);
    if (totalInterests < rules.interests.minCount) {
      errors.interests = `Please select at least ${rules.interests.minCount} interests`;
    } else if (totalInterests > rules.interests.maxCount) {
      errors.interests = `Maximum ${rules.interests.maxCount} interests allowed`;
    }

    // Validate self-introduction (UC103_12, UC103_13)
    if (!data.selfIntroduction.trim()) {
      errors.introduction = 'Self introduction is required';
    } else if (data.selfIntroduction.length < rules.selfIntroduction.minLength) {
      errors.introduction = `Minimum ${rules.selfIntroduction.minLength} characters required`;
    } else if (data.selfIntroduction.length > rules.selfIntroduction.maxLength) {
      errors.introduction = `Maximum ${rules.selfIntroduction.maxLength} characters allowed`;
    }

    // Validate languages count (UC103_15)
    const totalLanguages = data.languages.length + validCustomLanguagesCount;
    console.log('[AuthViewModel] totalLanguages:', totalLanguages);
    if (totalLanguages < rules.languages.minCount) {
      errors.languages = 'Please select at least one language';
    }

    console.log('[AuthViewModel] validation errors:', errors);
    console.log('[AuthViewModel] this.profileInfoErrors BEFORE:', this.profileInfoErrors);

    runInAction(() => {
      this.profileInfoErrors = errors;
    });

    console.log('[AuthViewModel] this.profileInfoErrors AFTER:', this.profileInfoErrors);

    return Object.keys(errors).length === 0;
  }

  /**
   * Clear profile info validation errors
   */
  clearProfileInfoErrors() {
    runInAction(() => {
      this.profileInfoErrors = {};
    });
  }

  /**
   * Clear a specific profile info error field
   */
  clearProfileInfoError(field: string) {
    runInAction(() => {
      const newErrors = { ...this.profileInfoErrors };
      delete newErrors[field];
      this.profileInfoErrors = newErrors;
    });
  }

  /**
   * Save profile information
   * UC103_11, UC103_12, UC103_13, UC103_14, UC103_15
   */
  async saveProfileInfo(userId: string, data: ProfileInfoPayload) {
    // Validate before saving (ViewModel validation)
    if (!this.validateProfileInfo(data)) {
      return null; // Validation failed, errors are in profileInfoErrors
    }

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
   * Get current user object (with profile_photo_url, etc.)
   * Use this for display purposes in Settings/Profile screens
   */
  async getCurrentUser(userId: string): Promise<User | null> {
    try {
      const user = await profileCompletionService.loadUser(userId);
      runInAction(() => {
        this.currentUser = user;
      });
      return user;
    } catch (error: any) {
      console.error('[AuthViewModel] Failed to get current user:', error);
      runInAction(() => {
        this.currentUser = null;
      });
      return null;
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
        this.currentUser = user;
      });
      runInAction(() => {
        this.profileCompletion = profileCompletionService.getCompletionState(user);

        if (user?.profile_data?.verified_age) {
          this.verifiedAge = user.profile_data.verified_age;
          this.profileCompletion.ageVerified = !!user.profile_data.age_verified;
        }

        if (user?.user_type) {
          this.userType = user.user_type;
        }

        // FIXED: Real Identity: phone & location from users table only
        if (user?.phone || user?.location) {
          this.profileData.realIdentity = {
            phoneNumber: user.phone || '',
            location: user.location || '',
          };
        }

        // FIXED: Display Identity: avatar_meta only (profile_photo_url in users table)
        if (user?.profile_data?.avatar_meta) {
          this.profileData.displayIdentity = {
            avatarType: (user.profile_data.avatar_meta?.type as 'default' | 'custom') || 'default',
            selectedAvatarIndex: user.profile_data.avatar_meta?.selected_avatar_index ?? null,
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
  // Push Notification Methods (for View layer hooks)
  // =============================================================

  /**
   * Save push notification token for current user
   * Called by View layer hooks after getting Expo push token
   * 
   * @param userId - User ID to save token for
   * @param token - Expo push token
   */
  async savePushToken(userId: string, token: string): Promise<void> {
    try {
      await notificationService.savePushToken(userId, token);
      console.log('[AuthViewModel] Push token saved successfully');
    } catch (error) {
      console.error('[AuthViewModel] Failed to save push token:', error);
      // Don't throw - push token save failure shouldn't break the app
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

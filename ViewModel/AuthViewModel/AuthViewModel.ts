import { makeAutoObservable, runInAction } from 'mobx';
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
  userRepository,
  supabase,
} from '@home-sweet-home/model';

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

interface ProfileSetupData {
  realIdentity: RealIdentityPayload | null;
  displayIdentity: DisplayIdentityPayload | null;
  profileInfo: ProfileInfoPayload | null;
}

export class AuthViewModel {
  currentStep: ProfileSetupStep = 'welcome';
  isLoading = false;
  errorMessage: string | null = null;

  verifiedAge: number | null = null;
  userType: UserType = 'youth';
  verificationResult: AgeVerificationResult | null = null;

  profileData: ProfileSetupData = {
    realIdentity: null,
    displayIdentity: null,
    profileInfo: null,
  };

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
  // Auth actions (reuse existing supabase flows)
  // =============================================================
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // =============================================================
  // Profile setup state helpers
  // =============================================================
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

  setStep(step: ProfileSetupStep) {
    this.currentStep = step;
  }

  setError(message: string | null) {
    this.errorMessage = message;
  }

  // =============================================================
  // UC103: Age verification
  // =============================================================
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
        this.errorMessage = error?.message || 'Age verification failed';
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
  // UC103: Profile sections
  // =============================================================
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

  async loadProfile(userId: string): Promise<User | null> {
    const user = await userRepository.getById(userId);
    runInAction(() => {
      this.profileCompletion = profileCompletionService.getCompletionState(user);
      if (user?.profile_data?.verified_age) {
        this.verifiedAge = user.profile_data.verified_age;
        this.profileCompletion.ageVerified = !!user.profile_data.age_verified;
      }
      if (user?.user_type) {
        this.userType = user.user_type;
      }
      if (user?.profile_data?.real_identity) {
        this.profileData.realIdentity = {
          phoneNumber: user.profile_data.real_identity.phone_number || '',
          email: user.profile_data.real_identity.email || '',
          realPhotoUrl: user.profile_data.real_identity.real_photo_url || null,
        };
      }
      if (user?.profile_data?.avatar_meta || user?.profile_data?.display_name) {
        this.profileData.displayIdentity = {
          displayName: user.profile_data.display_name || '',
          avatarType: (user.profile_data.avatar_meta?.type as any) || 'default',
          selectedAvatarIndex: user.profile_data.avatar_meta?.selected_avatar_index ?? null,
          customAvatarUrl: user.profile_data.avatar_url || null,
        };
      }
      if (user?.profile_data?.profile_info) {
        this.profileData.profileInfo = {
          interests: user.profile_data.profile_info.interests || [],
          selfIntroduction: user.profile_data.profile_info.self_introduction || '',
          languages: user.profile_data.profile_info.languages || [],
        };
      }
    });
    return user;
  }
}

export const authViewModel = new AuthViewModel();

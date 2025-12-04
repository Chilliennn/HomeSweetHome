import {
  AgeVerificationPayload,
  AgeVerificationResult,
  DisplayIdentityPayload,
  ProfileCompletionState,
  ProfileInfoPayload,
  RealIdentityPayload,
  User,
  UserProfileData,
} from '../../types';
import { userRepository } from '../../Repository';
import { ageVerificationService } from './ageVerificationService';

function mergeProfileData(existing: UserProfileData | null, changes: Partial<UserProfileData>): UserProfileData {
  return {
    ...(existing || {}),
    ...changes,
    profile_completion: {
      ...(existing?.profile_completion || {}),
      ...(changes.profile_completion || {}),
    },
    profile_info: {
      ...(existing?.profile_info || {}),
      ...(changes.profile_info || {}),
    },
    real_identity: {
      ...(existing?.real_identity || {}),
      ...(changes.real_identity || {}),
    },
    avatar_meta: {
      ...(existing?.avatar_meta || {}),
      ...(changes.avatar_meta || {}),
    },
  };
}

export const profileCompletionService = {
  async loadUser(userId: string): Promise<User | null> {
    return userRepository.getById(userId);
  },

  async verifyAgeAndPersist(payload: AgeVerificationPayload): Promise<AgeVerificationResult> {
    const result = await ageVerificationService.verify(payload);
    const user = await userRepository.getById(payload.userId);
    const mergedProfile = mergeProfileData(user?.profile_data || null, {
      age_verified: result.ageVerified,
      verified_age: result.verifiedAge,
      verification_reference: result.referenceId,
      verified_at: result.verifiedAt,
    });

    await userRepository.updateVerificationStatus(payload.userId, result.status);
    await userRepository.updateProfileData(payload.userId, mergedProfile);

    return result;
  },

  async saveRealIdentity(userId: string, data: RealIdentityPayload): Promise<User> {
    const user = await userRepository.getById(userId);
    const mergedProfile = mergeProfileData(user?.profile_data || null, {
      real_identity: {
        phone_number: data.phoneNumber,
        email: data.email,
        real_photo_url: data.realPhotoUrl,
      },
      profile_completion: {
        ...(user?.profile_data?.profile_completion || {}),
        real_identity_completed: true,
      },
    });

    return userRepository.updateProfileData(userId, mergedProfile);
  },

  async saveDisplayIdentity(userId: string, data: DisplayIdentityPayload): Promise<User> {
    const user = await userRepository.getById(userId);
    const mergedProfile = mergeProfileData(user?.profile_data || null, {
      display_name: data.displayName,
      avatar_url: data.avatarType === 'custom' ? data.customAvatarUrl : null,
      avatar_meta: {
        type: data.avatarType,
        selected_avatar_index: data.selectedAvatarIndex,
      },
      profile_completion: {
        ...(user?.profile_data?.profile_completion || {}),
        display_identity_completed: true,
      },
    });

    return userRepository.updateProfileData(userId, mergedProfile);
  },

  async saveProfileInfo(userId: string, data: ProfileInfoPayload): Promise<User> {
    const user = await userRepository.getById(userId);
    const mergedProfile = mergeProfileData(user?.profile_data || null, {
      profile_info: {
        interests: data.interests,
        self_introduction: data.selfIntroduction,
        languages: data.languages,
      },
      interests: data.interests,
      self_introduction: data.selfIntroduction,
      languages: data.languages,
      profile_completion: {
        ...(user?.profile_data?.profile_completion || {}),
        profile_info_completed: true,
      },
    });

    return userRepository.updateProfileData(userId, mergedProfile);
  },

  async markProfileComplete(userId: string): Promise<User> {
    const user = await userRepository.getById(userId);
    const now = new Date().toISOString();
    const mergedProfile = mergeProfileData(user?.profile_data || null, {
      profile_completed: true,
      profile_completed_at: now,
      profile_completion: {
        ...(user?.profile_data?.profile_completion || {}),
        profile_completed: true,
      },
    });

    return userRepository.updateProfileData(userId, mergedProfile);
  },

  getCompletionState(user?: User | null): ProfileCompletionState {
    const profile = user?.profile_data;
    return {
      ageVerified: !!profile?.age_verified,
      realIdentityCompleted: !!profile?.profile_completion?.real_identity_completed,
      displayIdentityCompleted: !!profile?.profile_completion?.display_identity_completed,
      profileInfoCompleted: !!profile?.profile_completion?.profile_info_completed,
      profileCompleted: !!profile?.profile_completed,
    };
  },
};

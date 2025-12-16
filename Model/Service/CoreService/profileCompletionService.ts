import type {
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

// ============================================================================
// VALIDATION TYPES & CONSTANTS
// ============================================================================
interface ValidationResult {
  valid: boolean;
  errors: string[];
  fieldErrors?: Record<string, string>;
}

const VALIDATION_RULES = {
  // UC103_13: Self-introduction requirements
  selfIntroduction: {
    minLength: 50,
    maxLength: 500,
  },
  // UC103_11: Interest requirements  
  interests: {
    minCount: 3,
    maxCount: 10,
  },
  // UC103_15: Language requirements
  languages: {
    minCount: 1,
    maxCount: 6,
  },
  // UC103_8: Display name requirements
  displayName: {
    minLength: 2,
    maxLength: 30,
  },
  // UC103_6: Photo requirements
  photo: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'] as const,
  },
  // Phone number
  phoneNumber: {
    minLength: 10,
    pattern: /^\+?[\d\s-]{10,}$/,
  },
  // Location
  location: {
    minLength: 3,
    maxLength: 100,
  },
};

// ============================================================================
// PRIVATE VALIDATION HELPERS
// ============================================================================
function validateStringLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string
): string | null {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  if (value.length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters`;
  }
  return null;
}

function validateArrayCount(
  array: unknown[],
  minCount: number,
  maxCount: number,
  fieldName: string
): string | null {
  if (array.length < minCount) {
    return `Please select at least ${minCount} ${fieldName}`;
  }
  if (array.length > maxCount) {
    return `Please select at most ${maxCount} ${fieldName}`;
  }
  return null;
}

function validateRequired(
  value: string | null | undefined,
  fieldName: string
): string | null {
  if (!value || !value.trim()) {
    return `${fieldName} is required`;
  }
  return null;
}

function validatePattern(
  value: string,
  pattern: RegExp,
  errorMessage: string
): string | null {
  if (!pattern.test(value)) {
    return errorMessage;
  }
  return null;
}

// ============================================================================
// PRIVATE DOMAIN VALIDATION FUNCTIONS
// ============================================================================
function validateProfileInfo(data: ProfileInfoPayload): ValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  // UC103_11: Validate interests count
  const interestError = validateArrayCount(
    data.interests,
    VALIDATION_RULES.interests.minCount,
    VALIDATION_RULES.interests.maxCount,
    'interests'
  );
  if (interestError) {
    errors.push(interestError);
    fieldErrors.interests = interestError;
  }

  // UC103_13: Validate self-introduction length
  const introError = validateStringLength(
    data.selfIntroduction,
    VALIDATION_RULES.selfIntroduction.minLength,
    VALIDATION_RULES.selfIntroduction.maxLength,
    'Self-introduction'
  );
  if (introError) {
    errors.push(introError);
    fieldErrors.selfIntroduction = introError;
  }

  // UC103_15: Validate languages
  const langError = validateArrayCount(
    data.languages,
    VALIDATION_RULES.languages.minCount,
    VALIDATION_RULES.languages.maxCount,
    'languages'
  );
  if (langError) {
    errors.push(langError);
    fieldErrors.languages = langError;
  }

  return { valid: errors.length === 0, errors, fieldErrors };
}

function validateDisplayIdentity(data: DisplayIdentityPayload): ValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  // UC103_8: Validate display name
  const nameRequiredError = validateRequired(data.displayName, 'Display name');
  if (nameRequiredError) {
    errors.push(nameRequiredError);
    fieldErrors.displayName = nameRequiredError;
  } else {
    const nameLengthError = validateStringLength(
      data.displayName,
      VALIDATION_RULES.displayName.minLength,
      VALIDATION_RULES.displayName.maxLength,
      'Display name'
    );
    if (nameLengthError) {
      errors.push(nameLengthError);
      fieldErrors.displayName = nameLengthError;
    }
  }

  // UC103_9, UC103_10: Validate avatar selection
  if (data.avatarType === 'default' && data.selectedAvatarIndex === null) {
    const avatarError = 'Please select an avatar';
    errors.push(avatarError);
    fieldErrors.avatar = avatarError;
  }
  if (data.avatarType === 'custom' && !data.customAvatarUrl) {
    const avatarError = 'Please upload a custom avatar';
    errors.push(avatarError);
    fieldErrors.avatar = avatarError;
  }

  return { valid: errors.length === 0, errors, fieldErrors };
}

function validateRealIdentity(data: RealIdentityPayload): ValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  // Validate phone number
  const phoneRequiredError = validateRequired(data.phoneNumber, 'Phone number');
  if (phoneRequiredError) {
    errors.push(phoneRequiredError);
    fieldErrors.phoneNumber = phoneRequiredError;
  } else {
    const phonePatternError = validatePattern(
      data.phoneNumber,
      VALIDATION_RULES.phoneNumber.pattern,
      'Please enter a valid phone number'
    );
    if (phonePatternError) {
      errors.push(phonePatternError);
      fieldErrors.phoneNumber = phonePatternError;
    }
  }

  // Validate location
  const locationRequiredError = validateRequired(data.location, 'Location');
  if (locationRequiredError) {
    errors.push(locationRequiredError);
    fieldErrors.location = locationRequiredError;
  } else {
    const locationLengthError = validateStringLength(
      data.location,
      VALIDATION_RULES.location.minLength,
      VALIDATION_RULES.location.maxLength,
      'Location'
    );
    if (locationLengthError) {
      errors.push(locationLengthError);
      fieldErrors.location = locationLengthError;
    }
  }

  // UC103_5: Validate real photo
  if (!data.realPhotoUrl) {
    const photoError = 'Real photo is required for verification';
    errors.push(photoError);
    fieldErrors.realPhoto = photoError;
  }

  return { valid: errors.length === 0, errors, fieldErrors };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function mergeProfileData(existing: UserProfileData | null, changes: Partial<UserProfileData>): UserProfileData {
  return {
    ...(existing || {}),
    ...changes,
    profile_completion: {
      ...(existing?.profile_completion || {}),
      ...(changes.profile_completion || {}),
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
    // Validate (UC103_5, UC103_6)
    const validation = validateRealIdentity(data);
    if (!validation.valid) {
      throw new Error(validation.errors[0]);
    }

    const user = await userRepository.getById(userId);
    
    // real_photo_url goes to profile_data (private, only revealed after match)
    const mergedProfile = mergeProfileData(user?.profile_data || null, {
      real_identity: {
        real_photo_url: data.realPhotoUrl,
      },
      profile_completion: {
        ...(user?.profile_data?.profile_completion || {}),
        real_identity_completed: true,
      },
    });

    // phone and location are common fields - store in users table directly
    return userRepository.updateUser(userId, {
      phone: data.phoneNumber,
      location: data.location,
      profile_data: mergedProfile,
    });
  },

  async saveDisplayIdentity(userId: string, data: DisplayIdentityPayload): Promise<User> {
    // Validate (UC103_7 to UC103_10)
    const validation = validateDisplayIdentity(data);
    if (!validation.valid) {
      throw new Error(validation.errors[0]);
    }

    const user = await userRepository.getById(userId);
    const mergedProfile = mergeProfileData(user?.profile_data || null, {
      display_name: data.displayName,
      avatar_url: data.avatarType === 'custom' ? (data.customAvatarUrl ?? undefined) : undefined,
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
    // Validate (UC103_11, UC103_13, UC103_15)
    const validation = validateProfileInfo(data);
    if (!validation.valid) {
      throw new Error(validation.errors[0]);
    }

    const user = await userRepository.getById(userId);
    
    // interests and self_introduction go to profile_data (user-type specific presentation)
    const mergedProfile = mergeProfileData(user?.profile_data || null, {
      interests: data.interests,
      self_introduction: data.selfIntroduction,
      profile_completion: {
        ...(user?.profile_data?.profile_completion || {}),
        profile_info_completed: true,
      },
    });

    // languages is a common field - store in users table directly
    return userRepository.updateUser(userId, {
      languages: data.languages,
      profile_data: mergedProfile,
    });
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

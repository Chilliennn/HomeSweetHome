import type { AgeVerificationPayload, AgeVerificationResult, UserType } from '../../types';

const AGE_LIMITS: Record<UserType, { min: number; max: number }> = {
  youth: { min: 18, max: 45 },
  elderly: { min: 60, max: 100 },
  admin: { min: 18, max: 100 },
};

function validateAgeForUserType(age: number, userType: UserType): void {
  const limits = AGE_LIMITS[userType] || AGE_LIMITS.admin;
  if (age < limits.min) {
    throw new Error(`Age below minimum for ${userType}: ${limits.min}`);
  }
  if (age > limits.max) {
    throw new Error(`Age exceeds maximum for ${userType}: ${limits.max}`);
  }
}

/**
 * Generate random age based on user type
 * Youth: 18-45
 * Elderly: 60-100
 */
function getRandomAge(userType: 'youth' | 'elderly' | 'admin'): number {
  if (userType === 'youth') {
    // Random age between 18 and 45 (inclusive)
    return Math.floor(Math.random() * (45 - 18 + 1)) + 18;
  } else if (userType === 'elderly') {
    // Random age between 60 and 100 (inclusive)
    return Math.floor(Math.random() * (100 - 60 + 1)) + 60;
  }
  // Admin: default to 30
  return 30;
}

function simulateVerification(payload: AgeVerificationPayload): AgeVerificationResult {
  console.log('[ageVerificationService] simulateVerification called with:', payload.userType);

  const simulatedAge = getRandomAge(payload.userType);
  console.log('[ageVerificationService] Generated random age:', simulatedAge);

  // Skip validation for prototype - allow any age
  // validateAgeForUserType(simulatedAge, payload.userType);

  const result = {
    ageVerified: true,
    verifiedAge: simulatedAge,
    status: 'verified' as const,
    referenceId: `sim-${Date.now()}`,
    verifiedAt: new Date().toISOString(),
    notes: 'Prototype verification: camera capture accepted.',
  };

  console.log('[ageVerificationService] Returning result:', result);
  return result;
}

export const ageVerificationService = {
  /**
   * Verify age using provided payload. In prototype, this simulates a passed verification.
   * Replace simulateVerification with real MyDigital ID integration when available.
   */
  async verify(payload: AgeVerificationPayload): Promise<AgeVerificationResult> {
    return simulateVerification(payload);
  },
};

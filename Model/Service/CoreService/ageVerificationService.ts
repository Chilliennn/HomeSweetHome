import type { AgeVerificationPayload, AgeVerificationResult, UserType } from '../../types';

const AGE_LIMITS: Record<UserType, { min: number; max: number }> = {
  youth: { min: 18, max: 40 },
  elderly: { min: 60, max: 120 },
  admin: { min: 18, max: 120 },
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
 * Youth: 18-40
 * Elderly: 41-100 (changed from 60+ per user request)
 */
function getRandomAge(userType: 'youth' | 'elderly' | 'admin'): number {
  if (userType === 'youth') {
    // Random age between 18 and 40 (inclusive)
    return Math.floor(Math.random() * (40 - 18 + 1)) + 18;
  } else if (userType === 'elderly') {
    // Random age between 41 and 100 (inclusive)
    return Math.floor(Math.random() * (100 - 41 + 1)) + 41;
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

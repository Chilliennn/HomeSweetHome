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

function simulateVerification(payload: AgeVerificationPayload): AgeVerificationResult {
  const simulatedAge = payload.userType === 'elderly' ? 62 : 25;
  validateAgeForUserType(simulatedAge, payload.userType);

  return {
    ageVerified: true,
    verifiedAge: simulatedAge,
    status: 'verified',
    referenceId: `sim-${Date.now()}`,
    verifiedAt: new Date().toISOString(),
    notes: 'Prototype verification: camera capture accepted.',
  };
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

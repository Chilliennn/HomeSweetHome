// User Repository
export { userRepository, storageRepository } from './UserRepository';

// Auth Repository
export { authRepository, type AuthResult } from './UserRepository';

export { Interest } from './UserRepository';

// Matching Repository
export { matchingRepository } from './UserRepository';

// Admin Repository  
export { adminRepository, consultationRepository } from './AdminRepository';
export type {
    ApplicationWithProfiles,
    ApplicationStats,
    UserProfile,
    SafetyAlertWithProfiles,
    SafetyAlertStats,
    ConsultationRequest,
    Advisor,
    ConsultationStats
} from './AdminRepository';

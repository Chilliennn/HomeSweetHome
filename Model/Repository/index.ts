// User Repository
export { userRepository } from './UserRepository';

// Auth Repository
export { authRepository, type AuthResult } from './UserRepository';

export type { Interest } from './UserRepository';

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

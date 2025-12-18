// User Repository
export { userRepository, storageRepository, notificationRepository } from './UserRepository';

// Auth Repository
export { authRepository, type AuthResult } from './UserRepository';

export type { Interest } from './UserRepository';

// Matching Repository
export { matchingRepository } from './UserRepository';

// Admin Repository  
export { adminRepository, consultationRepository, getAdminNotifications } from './AdminRepository';
export type {
    ApplicationWithProfiles,
    ApplicationStats,
    UserProfile,
    SafetyAlertWithProfiles,
    SafetyAlertStats,
    ConsultationRequest,
    Advisor,
    ConsultationStats,
    AdminNotification
} from './AdminRepository';


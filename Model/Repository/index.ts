// User Repository
export { userRepository, storageRepository, notificationRepository, relationshipRepository } from './UserRepository';


// Auth Repository
export { authRepository, type AuthResult } from './UserRepository';

export type { Interest } from './UserRepository';

// Matching Repository
export { matchingRepository } from './UserRepository';
export type { ElderlyFilters, ElderlyProfilesResult } from './UserRepository/matchingRepository';

// Relationship Repository (relationshipRepository already exported above)
export type { Relationship } from './UserRepository';

// Admin Repository  
export * from './AdminRepository/KeywordRepository';
export * from './AdminRepository/SafetyReportRepository';
export * from './AdminRepository/KeywordDetectionRepository';
export * from './AdminRepository/SentimentAnalyticsRepository';
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

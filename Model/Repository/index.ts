// User Repository
export { userRepository, storageRepository } from './UserRepository';

// Auth Repository
export { authRepository, type AuthResult } from './UserRepository';

// Matching Repository
export { matchingRepository } from './UserRepository';

// Admin Repository  
export * from './AdminRepository/KeywordRepository';
export * from './AdminRepository/SafetyReportRepository';
export * from './AdminRepository/KeywordDetectionRepository';
export { adminRepository } from './AdminRepository';
export type { ApplicationWithProfiles, ApplicationStats } from './AdminRepository';

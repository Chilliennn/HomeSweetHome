import { adminRepository, consultationRepository, getAdminNotifications } from './adminRepository';

export { adminRepository, consultationRepository, getAdminNotifications };
export type { ApplicationWithProfiles, ApplicationStats, UserProfile, SafetyAlertWithProfiles, SafetyAlertStats, ConsultationRequest, Advisor, ConsultationStats, AdminNotification } from './adminRepository';
export default adminRepository; 
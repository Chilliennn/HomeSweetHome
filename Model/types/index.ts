// ============================================
// USER TYPES
// ============================================
export type UserType = "youth" | "elderly" | "admin";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type Gender = "male" | "female";

export interface User {
  id: string;
  user_type: UserType;
  email: string;
  phone: string | null;
  full_name: string;
  date_of_birth: string;
  gender: Gender | null;
  location: string | null;
  languages: string[] | null;
  profile_photo_url: string | null;
  verification_status: VerificationStatus;
  is_active: boolean;
  profile_data: UserProfileData | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileData {
  // Display Identity (stored in profile_data)
  display_name?: string;
  avatar_url?: string;
  avatar_meta?: {
    type?: "default" | "custom";
    selected_avatar_index?: number | null;
  };

  // Real Identity - only private photo stored here
  // (phone & location are stored in users table directly)
  real_identity?: {
    real_photo_url?: string | null;
  };

  // Profile Info - only user-type specific data
  // (languages stored in users table directly)
  interests?: string[];
  self_introduction?: string;

  // Verification
  age_verified?: boolean;
  verified_age?: number;
  verification_reference?: string;
  verified_at?: string;

  // Profile Completion tracking
  profile_completed?: boolean;
  profile_completed_at?: string;
  profile_completion?: {
    real_identity_completed?: boolean;
    display_identity_completed?: boolean;
    profile_info_completed?: boolean;
    profile_completed?: boolean;
  };
}

export type CommunicationStyle =
  | "text_messaging"
  | "voice_calls"
  | "video_calls"
  | "in_person"
  | "flexible";

// ============================================
// APPLICATION TYPES
// ============================================
export type ApplicationStatus =
  | "pending_interest"
  | "pending_review"
  | "info_requested"
  | "approved"
  | "pre_chat_active"
  | "both_accepted"
  | "rejected"
  | "withdrawn";

export type Decision = "pending" | "accept" | "decline";

export interface Application {
  id: string;
  youth_id: string;
  elderly_id: string;
  motivation_letter: string;
  status: ApplicationStatus;
  ngo_reviewer_id: string | null;
  ngo_notes: string | null;
  youth_decision: Decision;
  elderly_decision: Decision;
  applied_at: string;
  reviewed_at: string | null;
}

// ============================================
// RELATIONSHIP TYPES
// ============================================
export type RelationshipStage =
  | "getting_to_know"
  | "trial_period"
  | "official_ceremony"
  | "family_life";

export type RelationshipStatus = "active" | "paused" | "ended";

export type EndRequestStatus =
  | "none"
  | "pending_cooldown"
  | "under_review"
  | "approved"
  | "rejected";

export interface StageMetrics {
  message_count: number;
  active_days: number;
  video_calls: number;
  meetings: number;
  progress_percentage: number;
  requirements_met: boolean;
}

export interface Relationship {
  id: string;
  youth_id: string;
  elderly_id: string;
  application_id: string;
  current_stage: RelationshipStage;
  stage_start_date: string;
  stage_metrics: StageMetrics;
  status: RelationshipStatus;
  updated_at: string;
  family_name: string | null;
  ceremony_date: string | null;
  certificate_url: string | null;
  end_request_status: EndRequestStatus;
  end_request_by: string | null;
  end_request_reason: string | null;
  end_request_at: string | null;
  end_admin_notes: string | null;
  created_at: string;
  ended_at: string | null;
}

export interface JourneyStats {
  daysTogether: number;
  videoCalls: number;
  homeVisits: number;
  memories: number;
}

export interface StageFeatureFlags {
  text: boolean;
  diary: boolean;
  scheduling: boolean;
  video_call: boolean;
  photo_share: boolean;
}

export interface StageRequirement {
  id: string;
  title: string;
  description: string;
  is_completed: boolean;
  required_value?: number;
  current_value?: number;
}

export interface StageInfo {
  stage: RelationshipStage;
  display_name: string;
  order: number;
  is_current: boolean;
  is_completed: boolean;
  start_date?: string;
  completion_date?: string;
}

export interface LockedStageDetail {
  stage_order: number;
  stage: RelationshipStage;
  title: string;
  description: string;
  unlock_message: string;
  preview_requirements: string[];
}

export interface Feature {
  key: string;
  name: string;
  description: string;
  is_unlocked: boolean;
  unlock_stage?: RelationshipStage;
  unlock_message?: string;
}

// ============================================
// MESSAGE TYPES
// ============================================
export type MessageType = "text" | "voice" | "image" | "video" | "video_call";

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  application_id: string | null;
  relationship_id: string | null;
  message_type: MessageType;
  content: string | null;
  media_url: string | null;
  call_duration_minutes: number | null;
  is_read: boolean;
  sent_at: string;
}

// ============================================
// COMMUNICATION CAPABILITIES TYPES
// ============================================
/**
 * Communication capabilities define what features are enabled
 * for a given stage (pre-match, getting_to_know, trial_period, etc.)
 *
 * This allows the Communication module to be reusable across stages
 * by simply changing the capability configuration
 */
export interface CommunicationCapabilities {
  // Messaging
  canSendText: boolean;
  canSendVoice: boolean;
  canSendImage: boolean;
  canSendVideo: boolean;

  // Calls
  canVoiceCall: boolean;
  canVideoCall: boolean;

  // Advanced features
  canScheduleMeetings: boolean;
  canShareDiary: boolean;
  canShareGallery: boolean;

  // Limits (null = unlimited)
  textMessageLimit?: number | null; // chars per message
  voiceMessageLimit?: number | null; // seconds per message
  dailyMessageLimit?: number | null; // messages per day

  // Moderation
  moderationEnabled: boolean;
  autoBlockEnabled: boolean;
}

// ============================================
// MODERATION TYPES
// ============================================
export type ModerationSeverity = "safe" | "warning" | "blocked";
export type ModerationAction =
  | "allow"
  | "warn_user"
  | "block_message"
  | "report_admin";

export interface ModerationResult {
  isAllowed: boolean;
  severity: ModerationSeverity;
  reason?: string;
  detectedIssues?: string[];
  suggestedAction: ModerationAction;
  adminNotificationRequired: boolean;
}

// ============================================
// SAFETY TYPES
// ============================================
export type IncidentType =
  | "financial_request"
  | "negative_sentiment"
  | "harassment"
  | "abuse"
  | "inappropriate_content"
  | "other";

export type Severity = "low" | "medium" | "high" | "critical";
export type IncidentStatus =
  | "new"
  | "under_review"
  | "resolved"
  | "false_positive";

export interface SafetyIncident {
  id: string;
  relationship_id: string;
  reporter_id: string | null;
  reported_user_id: string | null;
  incident_type: IncidentType;
  severity: Severity;
  description: string;
  evidence: Record<string, any> | null;
  status: IncidentStatus;
  assigned_admin_id: string | null;
  admin_notes: string | null;
  admin_action_taken: string | null;
  detected_at: string;
  resolved_at: string | null;
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export type NotificationType =
  | "stage_milestone"
  | "new_message"
  | "calendar_reminder"
  | "safety_alert"
  | "admin_notice"
  | "application_update"
  | "new_interest"
  | "interest_accepted"
  | "interest_rejected"
  | "application_submitted"
  | "application_under_review"
  | "application_approved"
  | "application_rejected"
  | "pre_chat_ending_soon"
  | "prematch_ended"
  | "relationship_accepted"
  | "relationship_ended"
  | "profile_viewed"
  | "platform_update"
  | "consultation_assigned";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_id?: string;
  reference_table?: string;
  is_read: boolean;
  created_at: string;
}

// ============================================
// PROFILE SETUP / UC103 TYPES
// ============================================
export interface AgeVerificationPayload {
  userId: string;
  userType: UserType;
  photoUri: string;
}

export interface AgeVerificationResult {
  ageVerified: boolean;
  verifiedAge: number;
  status: VerificationStatus;
  referenceId: string;
  verifiedAt: string;
  notes?: string;
}

export interface RealIdentityPayload {
  phoneNumber: string;
  location: string;
  realPhotoUrl: string | null;
}

export interface DisplayIdentityPayload {
  displayName: string;
  avatarType: "default" | "custom";
  selectedAvatarIndex: number | null;
  customAvatarUrl: string | null;
}

export interface ProfileInfoPayload {
  interests: string[];
  customInterest?: string;
  selfIntroduction: string;
  languages: string[];
  customLanguage?: string;
}

export interface ProfileCompletionState {
  ageVerified: boolean;
  realIdentityCompleted: boolean;
  displayIdentityCompleted: boolean;
  profileInfoCompleted: boolean;
  profileCompleted: boolean;
}

// ============================================
// FAMILY LIFE & MEMORY TYPES (UC300-UC304)
// ============================================
export type MoodType =
  | 'happy'
  | 'sad'
  | 'neutral'
  | 'excited'
  | 'anxious'
  | 'grateful';

export type MediaType = 'photo' | 'voice' | 'video' | 'document';
export type MediaCategory = 'family_album' | 'diary_attachment' | 'chat_media' | 'other';

export interface MediaItem {
  id: string;
  uploader_id: string;
  relationship_id: string;
  media_type: MediaType;
  media_category: MediaCategory;
  file_url: string;
  caption: string | null;
  tags: string[] | null;
  memory_id: string | null;
  uploaded_at: string;
}

export interface Memory {
  id: string;
  relationship_id: string;
  uploader_id: string;
  caption: string | null;
  thumbnail_url: string;
  media_count: number;
  uploaded_at: string;
  // Optional: populated when fetching with joined media
  media?: MediaItem[];
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  relationship_id: string;
  content: string;
  mood: MoodType;
  is_private: boolean;
  created_at: string;
}

export type EventType = 'meetup' | 'birthday' | 'anniversary' | 'activity' | 'other';

export interface CalendarEvent {
  id: string;
  relationship_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  event_date: string;
  event_time: string | null;
  location: string | null;
  reminder_sent: boolean;
  created_at: string;
}

export type AISuggestionType = 'activity' | 'conversation_topic';

export interface AISuggestion {
  id: string;
  relationship_id: string;
  suggestion_type: AISuggestionType;
  activity_title: string | null;
  activity_description: string | null;
  topic_text: string | null;
  topic_for_stage: string | null;
  is_used: boolean;
  generated_at: string;
}

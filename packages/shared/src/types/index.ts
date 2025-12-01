export interface User {
  id: string;
  user_type: 'youth' | 'elderly' | 'admin';
  email: string;
  phone: string | null;
  full_name: string;
  date_of_birth: string; // date stored as ISO string
  gender: 'male' | 'female' | null;
  location: string | null;
  languages: string[] | null;
  profile_photo_url: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  is_active: boolean;
  profile_data: Record<string, any> | null; // jsonb
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  service_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

// Add Relationship type for proper typing
export interface Relationship {
  id: string;
  youth_id: string;
  elderly_id: string;
  application_id: string;
  current_stage: 'getting_to_know' | 'trial_period' | 'official_ceremony' | 'family_life';
  stage_start_date: string;
  stage_metrics: {
    meetings: number;
    active_days: number;
    video_calls: number;
    message_count: number;
    requirements_met: boolean;
    progress_percentage: number;
  };
  status: 'active' | 'paused' | 'ended';
  updated_at: string;
  family_name: string | null;
  ceremony_date: string | null;
  certificate_url: string | null;
  end_request_status: 'none' | 'pending_cooldown' | 'under_review' | 'approved' | 'rejected';
  end_request_by: string | null;
  end_request_reason: string | null;
  end_request_at: string | null;
  end_admin_notes: string | null;
  created_at: string;
  ended_at: string | null;
}
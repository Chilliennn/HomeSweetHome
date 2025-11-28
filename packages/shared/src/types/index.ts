export interface User {
  id: string;
  email: string;
  role: 'elderly' | 'volunteer' | 'service_provider' | 'admin';
  created_at: string;
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

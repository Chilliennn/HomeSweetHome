import { supabase } from '../../Service/APIService/supabase';
import type { User, Relationship, VerificationStatus, UserProfileData } from '../../types';

export const userRepository = {
  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getActiveRelationship(userId: string): Promise<Relationship | null> {
    const { data, error } = await supabase
      .from('relationships')
      .select('*')
      .or(`youth_id.eq.${userId},elderly_id.eq.${userId}`)
      .eq('status', 'active')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateProfileData(userId: string, profileData: UserProfileData) {
    const { data, error } = await supabase
      .from('users')
      .update({
        profile_data: profileData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update user's common fields (shared between youth and elderly)
   * These are stored directly in the users table, not in profile_data
   */
  async updateUserFields(userId: string, fields: {
    phone?: string;
    location?: string;
    languages?: string[];
    profile_photo_url?: string;
  }) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...fields,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update both common fields and profile_data in a single call
   */
  async updateUser(userId: string, update: {
    phone?: string;
    location?: string;
    languages?: string[];
    profile_photo_url?: string;
    profile_data?: UserProfileData;
  }) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...update,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateVerificationStatus(userId: string, status: VerificationStatus) {
    const { data, error } = await supabase
      .from('users')
      .update({
        verification_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

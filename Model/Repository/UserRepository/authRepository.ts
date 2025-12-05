import { supabase } from '../../Service/APIService/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

/**
 * AuthRepository - Data access layer for authentication
 * 
 * Single Responsibility: Only handles Supabase auth queries
 * No business logic - just data access operations
 */

export interface AuthResult {
  user: SupabaseUser | null;
  session: Session | null;
}

export const authRepository = {
  /**
   * Sign in with email only (prototype mode - no password validation)
   * NOTE: In production, replace with signInWithPassword using supabase.auth
   */
  async signInWithEmail(email: string): Promise<AuthResult> {
    // Prototype mode: Query user directly from users table by email
    // This skips actual authentication - for demo/testing only
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (userError || !userData) {
      throw new Error('No account found with this email');
    }

    // Return user info without real Supabase auth session
    return { 
      user: { id: userData.id, email: userData.email } as SupabaseUser, 
      session: null 
    };
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password 
    });
    if (error) throw error;
    return { user: data.user, session: data.session };
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<SupabaseUser | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
};

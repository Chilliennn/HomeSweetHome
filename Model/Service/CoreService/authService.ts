import { authRepository, AuthResult } from '../../Repository/UserRepository';
import { userRepository } from '../../Repository/UserRepository';
import type { User, UserType } from '../../types';

/**
 * AuthService - Business logic layer for authentication
 * 
 * Single Responsibility: Handles authentication business logic
 * - Coordinates auth operations with user profile operations
 * - Validates authentication requirements
 * - No direct database access - uses Repository layer
 */

export interface SignInResult extends AuthResult {
  appUser: User | null;
}

export interface SignUpResult extends AuthResult {
  appUser: User | null;
}

export const authService = {
  /**
   * Sign in and fetch associated app user profile
   * NOTE: Prototype mode - password field kept for UI but not validated
   */
  async signIn(email: string, _password: string): Promise<SignInResult> {
    // Validate inputs
    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }

    // Authenticate via repository (prototype mode - email only)
    const authResult = await authRepository.signInWithEmail(email);
    
    // Fetch app user profile if auth successful
    let appUser: User | null = null;
    if (authResult.user?.id) {
      appUser = await userRepository.getById(authResult.user.id);
    }

    return {
      ...authResult,
      appUser,
    };
  },

  /**
   * Sign up new user
   */
  async signUp(email: string, password: string): Promise<SignUpResult> {
    // Validate inputs
    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Create auth account via repository
    const authResult = await authRepository.signUp(email, password);

    return {
      ...authResult,
      appUser: null, // New user has no profile yet
    };
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await authRepository.signOut();
  },

  /**
   * Get current authenticated user with app profile
   */
  async getCurrentUserWithProfile(): Promise<SignInResult | null> {
    const session = await authRepository.getSession();
    if (!session?.user) {
      return null;
    }

    const appUser = await userRepository.getById(session.user.id);
    
    return {
      user: session.user,
      session,
      appUser,
    };
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await authRepository.getSession();
    return !!session;
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return authRepository.onAuthStateChange(callback);
  },

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<void> {
    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }
    await authRepository.resetPassword(email);
  },

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<void> {
    if (!newPassword) {
      throw new Error('New password is required');
    }
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    await authRepository.updatePassword(newPassword);
  },

  /**
   * Check if profile is complete for a user
   */
  async checkProfileComplete(userId: string): Promise<boolean> {
    const user = await userRepository.getById(userId);
    return !!user?.profile_data?.profile_completed;
  },

  /**
   * Get user type
   */
  async getUserType(userId: string): Promise<UserType | null> {
    const user = await userRepository.getById(userId);
    return user?.user_type || null;
  },
};

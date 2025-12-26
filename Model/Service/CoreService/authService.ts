import { authRepository } from '../../Repository/UserRepository';
import type { AuthResult } from '../../Repository/UserRepository';
import { userRepository } from '../../Repository/UserRepository';
import type { User, UserType } from '../../types';



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
   * Sign up new user with profile creation
   * Creates both Supabase auth account AND app user profile
   */
  async signUpWithProfile(
    email: string,
    password: string,
    userType: 'youth' | 'elderly'
  ): Promise<SignUpResult> {
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
    if (!userType || !['youth', 'elderly'].includes(userType)) {
      throw new Error('User type must be either youth or elderly');
    }

    // Create auth account via repository
    const authResult = await authRepository.signUp(email, password);

    if (!authResult.user?.id) {
      throw new Error('Failed to create auth account');
    }

    // Create user profile in users table
    const appUser = await userRepository.create({
      email: email.trim(),
      user_type: userType,
      // Nullable fields - will be filled during profile setup
      full_name: null as unknown as string,
      date_of_birth: null as unknown as string,
      phone: null as unknown as string,
      gender: null as unknown as 'male' | 'female',
      location: null as unknown as string,
      languages: [],
      profile_photo_url: null as unknown as string,
      is_active: true,
      verification_status: 'pending' as const,
      profile_data: {
        profile_completed: false,
      },
      updated_at: new Date().toISOString(),
    });

    return {
      ...authResult,
      appUser,
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

  /**
   * Check if user account is suspended (is_active = false)
   * @returns true if user is suspended, false otherwise
   */
  async checkSuspensionStatus(userId: string): Promise<boolean> {
    try {
      const user = await userRepository.getById(userId);
      return user?.is_active === false;
    } catch (error) {
      console.error('[authService] Error checking suspension status:', error);
      return false;
    }
  },
};

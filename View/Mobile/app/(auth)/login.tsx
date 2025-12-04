import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { userRepository } from '@home-sweet-home/model';

/**
 * Login Screen (Route: /(auth)/login)
 * 
 * Entry point for user authentication.
 * After login, checks profile completion status:
 * - Incomplete profile → /(auth)/profile-setup
 * - Complete profile → /(main)/matching or /(main)/bonding
 * 
 * TODO: Refactor to use AuthViewModel for state management
 * TODO: Move UI to AuthUI/LoginScreen.tsx and re-export here
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const user = await userRepository.getByEmail(email.toLowerCase().trim());
      console.log('userRepository.getByEmail result:', user);

      if (!user) {
        Alert.alert('Error', 'No account found with this email');
        setLoading(false);
        return;
      }

      // ============================================================================
      // UC-103: CHECK PROFILE COMPLETION STATUS
      // If profile is not complete, redirect to profile-setup flow
      // Profile completion is required before accessing matching/bonding features
      // ============================================================================
      const isProfileComplete = user.profile_data?.profile_completed === true;
      const isAgeVerified = user.profile_data?.age_verified === true;

      if (!isProfileComplete || !isAgeVerified) {
        // First time user or incomplete profile → Go to profile-setup
        router.replace({
          pathname: '/(auth)/profile-setup',
          params: { 
            userId: user.id, 
            userName: user.full_name,
            userType: user.user_type,
          },
        });
        return;
      }

      // ============================================================================
      // PROFILE COMPLETE: Check relationship status and navigate accordingly
      // ============================================================================
      const relationship = await userRepository.getActiveRelationship(user.id);
      console.log('userRepository.getActiveRelationship result:', relationship);

      if (relationship) {
        // User has active relationship → Go to bonding
        router.replace({
          pathname: '/(main)/bonding',
          params: { userId: user.id, userName: user.full_name },
        });
      } else {
        // No relationship yet → Go to matching
        router.replace({
          pathname: '/(main)/matching',
          params: { userId: user.id, userName: user.full_name },
        });
      }
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Example@email.com"
          placeholderTextColor="#A0A0A0"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#A0A0A0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>© 2025 HomeSweetHome All rights reserved.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 150,
    height: 150,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#E89B8E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    color: '#999',
    fontSize: 12,
  },
});
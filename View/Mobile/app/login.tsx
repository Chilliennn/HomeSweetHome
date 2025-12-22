import { useEffect, useState } from 'react';
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
import { authViewModel } from '@home-sweet-home/viewmodel';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const navigation = useNavigation();
  useEffect(() => {
    const sub = navigation.addListener('state', () => {
      console.log('Navigation state changed', Date.now());
    });
    return sub;
  }, [navigation]);
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
      // ✅ MVVM: Use authViewModel.signIn() instead of direct repository access
      const result = await authViewModel.signIn(email.trim(), password);
      console.log('authViewModel.signIn result:', result);

      if (!result.appUser) {
        Alert.alert('Error', 'No account found with this email');
        setLoading(false);
        return;
      }

      // ✅ Check if user is suspended (is_active = false)
      if (result.appUser.is_active === false) {
        Alert.alert(
          'Account Suspended',
          'Your account has been suspended due to a violation of safety policies. Please contact support for more information.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // ✅ MVVM: Use authViewModel method to get relationship
      const relationship = await authViewModel.getActiveRelationship(result.appUser.id);
      console.log('authViewModel.getActiveRelationship result:', relationship);

      if (relationship) {
        router.replace({
          pathname: '/bonding',
          params: { userId: result.appUser.id, userName: result.appUser.full_name },
        });

        router.replace({
          pathname: '/(main)/bonding',
          params: { userId: result.appUser.id, userName: result.appUser.full_name },
        });
      } else {
        router.replace({
          pathname: '/matching',
          params: { userId: result.appUser.id, userName: result.appUser.full_name },
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
          onFocus={() => {
            console.log('Password input onFocus', { route: 'login', time: Date.now() });
          }}
          onBlur={() => {
            console.log('Password input onBlur', { time: Date.now() });
          }}
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

        {/* Sign Up Link */}
        <TouchableOpacity
          onPress={() => router.replace('/signup')}
          style={styles.signupLink}
        >
          <Text style={styles.signupLinkText}>
            Don't have an account? <Text style={styles.signupLinkBold}>Sign up</Text>
          </Text>
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
  signupLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  signupLinkText: {
    fontSize: 14,
    color: '#666',
  },
  signupLinkBold: {
    fontWeight: '600',
    color: '#E89B8E',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    color: '#999',
    fontSize: 12,
  },
});
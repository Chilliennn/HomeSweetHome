/**
 * Sign Up Screen
 * 
 * Route: /signup
 * 
 * MVVM Architecture:
 * - This View only handles UI rendering and user interactions
 * - All business logic is delegated to AuthViewModel (MobX observable)
 */
import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { authViewModel } from '@home-sweet-home/viewmodel';
import { SafeAreaView } from 'react-native-safe-area-context';

const SignUpScreenComponent: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userType, setUserType] = useState<'youth' | 'elderly' | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Validation functions
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password: string) => {
        return password.length >= 6;
    };

    const handleSignUp = async () => {
        // Validate email
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }
        if (!validateEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        // Validate password
        if (!password) {
            Alert.alert('Error', 'Please enter a password');
            return;
        }
        if (!validatePassword(password)) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        // Validate confirm password
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        // Validate role selection
        if (!userType) {
            Alert.alert('Error', 'Please select your role (Youth or Elderly)');
            return;
        }

        setLoading(true);

        try {
            // Call ViewModel to sign up with userType
            const result = await authViewModel.signUpWithProfile(
                email.trim(),
                password,
                userType
            );

            if (result.appUser) {
                // Navigate to profile setup
                router.replace({
                    pathname: '/profile-setup',
                    params: { userId: result.appUser.id },
                });
            } else {
                Alert.alert('Error', 'Failed to create account. Please try again.');
            }
        } catch (error: any) {
            console.error('Sign up error:', error);

            // Parse error message for user-friendly display
            const errorMessage = error?.message || '';
            let userMessage = 'An error occurred during sign up. Please try again.';

            // Handle common Supabase auth errors
            if (errorMessage.toLowerCase().includes('invalid') && errorMessage.toLowerCase().includes('email')) {
                userMessage = 'The email address you entered is invalid. Please check and try again.';
            } else if (errorMessage.toLowerCase().includes('already registered') || errorMessage.toLowerCase().includes('already exists')) {
                userMessage = 'This email is already registered. Please sign in instead.';
            } else if (errorMessage.toLowerCase().includes('password') && errorMessage.toLowerCase().includes('weak')) {
                userMessage = 'Your password is too weak. Please use a stronger password with at least 6 characters.';
            } else if (errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('too many')) {
                userMessage = 'Too many sign up attempts. Please wait a moment and try again.';
            } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
                userMessage = 'Network error. Please check your internet connection and try again.';
            } else if (errorMessage) {
                // Show the original error message if it's not a known type
                userMessage = errorMessage;
            }

            Alert.alert('Sign Up Failed', userMessage);
        } finally {
            setLoading(false);
        }
    };

    const navigateToLogin = () => {
        router.replace('/login');
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../assets/images/logo.png')}
                            style={styles.logo}
                            contentFit="contain"
                        />
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        {/* Email */}
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

                        {/* Password */}
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

                        {/* Confirm Password */}
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your confirm password"
                            placeholderTextColor="#A0A0A0"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            editable={!loading}
                        />

                        {/* Role Selection */}
                        <Text style={styles.label}>What's your role</Text>
                        <View style={styles.roleContainer}>
                            <TouchableOpacity
                                style={styles.roleOption}
                                onPress={() => setUserType('youth')}
                                disabled={loading}
                            >
                                <View style={[styles.radioCircle, userType === 'youth' && styles.radioSelected]}>
                                    {userType === 'youth' && <View style={styles.radioInner} />}
                                </View>
                                <Text style={styles.roleText}>Youth</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.roleOption}
                                onPress={() => setUserType('elderly')}
                                disabled={loading}
                            >
                                <View style={[styles.radioCircle, userType === 'elderly' && styles.radioSelected]}>
                                    {userType === 'elderly' && <View style={styles.radioInner} />}
                                </View>
                                <Text style={styles.roleText}>Elderly</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Sign Up Button */}
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSignUp}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.buttonText}>Sign Up</Text>
                            )}
                        </TouchableOpacity>

                        {/* Login Link */}
                        <TouchableOpacity onPress={navigateToLogin} style={styles.loginLink}>
                            <Text style={styles.loginLinkText}>
                                Already have an account? <Text style={styles.loginLinkBold}>Sign in</Text>
                            </Text>
                        </TouchableOpacity>

                        {/* Footer - Inside form to avoid overlap */}
                        <Text style={styles.footer}>© 2025 HomeSweetHome All rights reserved.</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FAF9F6',
    },
    container: {
        flex: 1,
        backgroundColor: '#FAF9F6',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingVertical: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
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
    roleContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 40,
        marginBottom: 24,
        marginTop: 4,
    },
    roleOption: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#A0A0A0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    radioSelected: {
        borderColor: '#E89B8E',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#E89B8E',
    },
    roleText: {
        fontSize: 16,
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
    loginLink: {
        alignItems: 'center',
        marginTop: 20,
    },
    loginLinkText: {
        fontSize: 14,
        color: '#666',
    },
    loginLinkBold: {
        fontWeight: '600',
        color: '#E89B8E',
    },
    footer: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        marginTop: 30,
        marginBottom: 20,
    },
});

export const SignUpScreen = SignUpScreenComponent;
export default SignUpScreen;

import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "mobx-react-lite";
import { authViewModel } from "@home-sweet-home/viewmodel";
import { relationshipService } from "@home-sweet-home/model";

/**
 * Login Screen (Route: /(auth)/login)
 *
 * MVVM Architecture:
 * - View: This component handles only UI rendering
 * - ViewModel: authViewModel handles authentication state and logic
 * - Uses observer() for automatic re-renders when ViewModel state changes
 *
 * After login:
 * 1. Check Relationship -> Bonding
 * 2. Check Profile -> Profile Setup
 * 3. Default -> Matching (Browse/ElderlyHome)
 */
const LoginScreen = observer(function LoginScreen() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const router = useRouter();

  // Get loading and error state from ViewModel
  const { isLoading, errorMessage } = authViewModel;

  // Clear error when email/password changes
  React.useEffect(() => {
    if (errorMessage) {
      authViewModel.clearError();
    }
  }, [email, errorMessage, password]);

  const validateEmail = (emailToValidate: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmed = emailToValidate.trim();
    console.log(
      "Validating email:",
      trimmed,
      "Result:",
      emailRegex.test(trimmed)
    );
    return emailRegex.test(trimmed);
  };

  const handleLogin = async () => {
    // Basic validation in View (presentation logic)
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      // Delegate to ViewModel - it handles business logic via Service
      console.log("Calling signIn with email:", trimmedEmail.toLowerCase());
      const result = await authViewModel.signIn(
        trimmedEmail.toLowerCase(),
        password
      );
      console.log("SignIn result:", result);

      if (!result.appUser) {
        Alert.alert("Error", "No account found with this email");
        return;
      }

      // ✅ Check if user is suspended (is_active = false)
      if (result.appUser.is_active === false) {
        Alert.alert(
          'Account Suspended',
          'Your account has been suspended due to a violation of safety policies. Please contact support for more information.',
          [{ text: 'OK' }]
        );
        return;
      }

      const user = result.appUser;

      // ============================================================================
      // 1. CHECK RELATIONSHIP STATUS (including paused)
      // Prioritize relationship status over profile completion
      // ============================================================================
      console.log('[Login] Checking relationship for user:', user.id);
      const relationship = await relationshipService.getAnyRelationship(
        user.id
      );
      console.log('[Login] Relationship found:', relationship);

      if (relationship) {
        if (relationship.status === "paused") {
          console.log('[Login] User has paused relationship → journey-pause');
          router.replace({
            pathname: "/journey-pause",
            params: { userId: user.id },
          });
          return;
        }

        // User has active relationship → Go to bonding
        if (relationship.status === "active") {
          console.log('[Login] User has active relationship → bonding');
          router.replace({
            pathname: "/bonding",
            params: { userId: user.id, userName: user.full_name },
          });
          return;
        }
      }

      console.log('[Login] No active/paused relationship found → checking profile');

      // ============================================================================
      // 2. CHECK PROFILE COMPLETION STATUS
      // ============================================================================
      const isProfileComplete = user.profile_data?.profile_completed === true;
      const isAgeVerified = user.profile_data?.age_verified === true;

      if (!isProfileComplete || !isAgeVerified) {
        // First time user or incomplete profile → Go to profile-setup
        router.replace({
          pathname: "/(auth)/profile-setup",
          params: {
            userId: user.id,
            userName: user.full_name,
            userType: user.user_type,
          },
        });
        return;
      }

      // ============================================================================
      // 3. NO RELATIONSHIP & PROFILE COMPLETE -> GO TO MATCHING
      // ============================================================================
      router.replace({
        pathname: "/(main)/matching",
        params: {
          userId: user.id,
          userName: user.full_name,
          userType: user.user_type,
          isFirstTime: "true", // Trigger walkthrough check if needed
        },
      });
    } catch (error: any) {
      // Error is already set in ViewModel, show it in Alert
      const message =
        authViewModel.errorMessage ||
        "An error occurred during login. Please try again.";
      Alert.alert("Error", message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.container}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require("@/assets/images/logo.png")}
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
                  editable={!isLoading}
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#A0A0A0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isLoading}
                />

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>Sign in</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>

            <Text style={styles.footer}>
              © 2025 HomeSweetHome All rights reserved.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
});

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  logo: {
    width: 150,
    height: 150,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  formContainer: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 20,
    color: "#333",
  },
  button: {
    backgroundColor: "#E89B8E",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    paddingBottom: 20,
  },
});

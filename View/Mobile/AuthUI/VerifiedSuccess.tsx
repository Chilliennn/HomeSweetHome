import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, IconCircle, AlertBanner } from '../components/ui';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
export type UserType = 'youth' | 'elderly';

// ============================================================================
// PROPS INTERFACE
// ============================================================================
interface VerifiedSuccessProps {
  /** The verified age from MyDigital ID - provided by ViewModel */
  verifiedAge: number;
  /** User type category based on age - provided by ViewModel */
  userType: UserType;
  /** Callback when user taps "Continue to Profile" */
  onContinue: () => void;
  /** Loading state for continue button - controlled by ViewModel */
  isLoading?: boolean;
  /** Custom title (optional) */
  title?: string;
  /** Custom subtitle (optional) */
  subtitle?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const USER_TYPE_LABELS: Record<UserType, string> = {
  youth: 'Youth User',
  elderly: 'Elderly User',
};

const DEFAULT_TITLE = 'Verified!';
const DEFAULT_SUBTITLE = 'Your age has been successfully verified. You can now continue with your profile setup.';
const SECURITY_MESSAGE = 'Your IC information has been securely processed and will not be stored. Only your verified age status is saved.';

// ============================================================================
// COMPONENT
// ============================================================================
export const VerifiedSuccess: React.FC<VerifiedSuccessProps> = ({
  verifiedAge,
  userType,
  onContinue,
  isLoading = false,
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
}) => {
  const userTypeLabel = USER_TYPE_LABELS[userType];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <IconCircle icon="✓" size={120} backgroundColor="#7ECEC5" contentScale={0.5} style={styles.icon} />

        {/* Success Title */}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Verification Result Card */}
        <Card style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={styles.resultIndicator} />
            <Text style={styles.resultTitle}>✓ Age Verification Complete</Text>
          </View>
          <View style={styles.resultContent}>
            <Text style={styles.resultText}>
              Verified age: <Text style={styles.bold}>{verifiedAge} years old</Text>
            </Text>
            <Text style={styles.resultText}>
              Category: <Text style={styles.bold}>{userTypeLabel}</Text>
            </Text>
          </View>
        </Card>

        {/* Security Notice */}
        <AlertBanner
          type="success"
          message={SECURITY_MESSAGE}
          icon="🔒"
          style={styles.alert}
        />

        {/* Continue Button */}
        <Button
          title="Continue to Profile"
          onPress={onContinue}
          variant="primary"
          style={styles.button}
          loading={isLoading}
          disabled={isLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  icon: {
    marginTop: 60,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  resultCard: {
    width: '100%',
    marginBottom: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultIndicator: {
    width: 4,
    height: 40,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
    marginRight: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  resultContent: {
    marginLeft: 16,
  },
  resultText: {
    fontSize: 15,
    color: '#333',
    marginTop: 4,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
  },
  alert: {
    width: '100%',
    marginBottom: 24,
  },
  button: {
    width: '100%',
  },
});

export default VerifiedSuccess;
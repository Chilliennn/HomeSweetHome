import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  Header,
  StepIndicator,
  AlertBanner,
  IconCircle,
} from '../components/ui';

// ============================================================================
// PROPS INTERFACE
// ============================================================================
interface AgeVerificationProps {
  /** Callback when user taps "Start Verification" button */
  onStartVerification: () => void;
  /** Callback when user taps back button */
  onBack: () => void;
  /** Loading state for verification button - controlled by ViewModel */
  isLoading?: boolean;
}

// ============================================================================
// CONSTANTS - For reusability and maintainability
// ============================================================================
const AGE_REQUIREMENTS = [
  {
    id: 'youth',
    emoji: '👦',
    title: 'Youth Users',
    description: '18 - 40 years old',
  },
  {
    id: 'elderly',
    emoji: '👵',
    title: 'Elderly Users',
    description: '60 years and above',
  },
];

const TOTAL_ONBOARDING_STEPS = 3;
const CURRENT_STEP = 1;

// ============================================================================
// COMPONENT
// ============================================================================
export const AgeVerification: React.FC<AgeVerificationProps> = ({
  onStartVerification,
  onBack,
  isLoading = false,
}) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top','bottom']}>
      <View style={styles.container}>
        {/* Header with Back Button */}
        <Header title="Age Verification" onBack={onBack} />
        {/* Step Indicator */}
          <StepIndicator
            totalSteps={TOTAL_ONBOARDING_STEPS}
            currentStep={CURRENT_STEP}
            style={styles.steps}
          />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          

          {/* Important Notice */}
          <AlertBanner
            type="warning"
            message="Age verification is required to continue. This ensures a safe community for everyone."
            icon="⚠️"
            style={styles.alert}
          />

          {/* MyDigital ID Info Card - Refactored from InfoCard */}
          <Card style={[styles.infoCard, styles.infoCardContent]}>
            <IconCircle
              icon="🪪"
              size={60}
              backgroundColor="#9DE2D0" // Colors.light.secondary
            />
            <Text style={styles.infoTitle}>Verify with MyDigital ID</Text>
            <Text style={styles.infoDesc}>
              We use Malaysia's official digital identity system to verify your age securely.
            </Text>
          </Card>

          {/* Age Requirements Card */}
          <Card style={styles.requirementsCard}>
            <View style={styles.requirementsHeader}>
              <Text style={styles.requirementsIcon}>👤</Text>
              <Text style={styles.requirementsTitle}>Age Requirements</Text>
            </View>

            {AGE_REQUIREMENTS.map((requirement, index) => (
              <React.Fragment key={requirement.id}>
                <View style={styles.requirementItem}>
                  <Text style={styles.emoji}>{requirement.emoji}</Text>
                  <View style={styles.requirementText}>
                    <Text style={styles.requirementTitle}>{requirement.title}</Text>
                    <Text style={styles.requirementDesc}>{requirement.description}</Text>
                  </View>
                </View>
                {index < AGE_REQUIREMENTS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </Card>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              title="Start Verification"
              onPress={onStartVerification}
              variant="primary"
              style={styles.primaryButton}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  steps: {
    marginBottom: 24,
  },
  alert: {
    marginBottom: 24,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoCardContent: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F5F5', // Colors.light.surface
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  infoDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  requirementsCard: {
    marginBottom: 24,
  },
  requirementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  requirementsIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  emoji: {
    fontSize: 24,
    marginRight: 16,
  },
  requirementText: {
    flex: 1,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  requirementDesc: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    marginBottom: 0,
  },
});

export default AgeVerification;
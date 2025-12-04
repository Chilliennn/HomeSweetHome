import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  Button,
  Card,
  Header,
  StepIndicator,
  AlertBanner,
  InfoCard,
} from '../ui';

interface AgeVerificationProps {
  onStartVerification: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const AgeVerification: React.FC<AgeVerificationProps> = ({
  onStartVerification,
  onSkip,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      <Header title="Age Verification" onBack={onBack} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <StepIndicator totalSteps={4} currentStep={1} style={styles. steps} />

        <AlertBanner
          type="warning"
          message="Age verification is required to access matching and adoption features."
          icon="⚠️"
          style={styles.alert}
        />

        <InfoCard
          icon="🪪"
          title="Verify with MyDigital ID"
          description="We use Malaysia's official digital identity system to verify your age securely."
          style={styles.infoCard}
        />

        <Card style={styles.requirementsCard}>
          <View style={styles.requirementsHeader}>
            <Text style={styles.requirementsIcon}>👤</Text>
            <Text style={styles.requirementsTitle}>Age Requirements</Text>
          </View>

          <View style={styles.requirementItem}>
            <Text style={styles. emoji}>👦</Text>
            <View style={styles.requirementText}>
              <Text style={styles.requirementTitle}>Youth Users</Text>
              <Text style={styles.requirementDesc}>18 - 40 years old</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.requirementItem}>
            <Text style={styles.emoji}>👵</Text>
            <View style={styles.requirementText}>
              <Text style={styles.requirementTitle}>Elderly Users</Text>
              <Text style={styles.requirementDesc}>60 years and above</Text>
            </View>
          </View>
        </Card>

        <Button
          title="Start Verification"
          onPress={onStartVerification}
          variant="primary"
          style={styles.primaryButton}
        />

        <Button
          title="I'll Do This Later"
          onPress={onSkip}
          variant="outline"
          style={styles.secondaryButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  content: {
    padding: 24,
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
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {},
});

export default AgeVerification;
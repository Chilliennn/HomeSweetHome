import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, IconCircle } from '../components/ui';

// ============================================================================
// TYPES
// ============================================================================
interface ProfileCompleteProps {
  /** Callback when user taps "Start Browsing" */
  onStartBrowsing: () => void;
  /** Callback when user taps "View My Profile" */
  onViewProfile: () => void;
  /** Loading state */
  isLoading?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const UNLOCKED_FEATURES = [
  'Browse Profiles',
  'Express Interest',
  'Pre-Match Communication',
  'Submit Applications',
];

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * Profile Complete Screen (UC103_17, UC103_18)
 * Shows success message and unlocked features after profile completion
 * M11: Msg Profile Complete
 */
export const ProfileComplete: React.FC<ProfileCompleteProps> = ({
  onStartBrowsing,
  onViewProfile,
  isLoading = false,
}) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <IconCircle
          icon="🎉"
          size={100}
          backgroundColor="#9DE2D0"
          contentScale={0.48}
          style={styles.iconContainer}
        />

        {/* Success Message */}
        <Text style={styles.title}>Profile Complete!</Text>
        <Text style={styles.subtitle}>
          Your profile is complete and age is verified! You can now browse profiles and start the adoption process.
        </Text>

        {/* Features Unlocked Card */}
        <Card style={styles.featuresCard}>
          <View style={styles.featuresHeader}>
            <Text style={styles.lockIcon}>🔓</Text>
            <Text style={styles.featuresTitle}>Features Unlocked</Text>
          </View>

          {UNLOCKED_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Start Browsing"
            onPress={onStartBrowsing}
            variant="primary"
            style={styles.primaryButton}
            loading={isLoading}
            disabled={isLoading}
          />

          <Button
            title="View My Profile"
            onPress={onViewProfile}
            variant="outline"
            style={styles.secondaryButton}
            disabled={isLoading}
          />
        </View>
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
    backgroundColor: '#FFFDF5',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
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
  featuresCard: {
    width: '100%',
    marginBottom: 32,
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D4E5AE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkIcon: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
});

export default ProfileComplete;

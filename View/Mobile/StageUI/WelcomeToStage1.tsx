import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  Button,
  Card,
  IconCircle,
  FeatureCheckItem,
} from '../components/ui';

// ============================================================================
// TYPES
// ============================================================================
interface WelcomeToStage1Props {
  /** Partner's display name */
  partnerName?: string;
  /** Callback when Start Your Journey is pressed */
  onStartJourney?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * WelcomeToStage1 - Welcome screen after match is confirmed
 * 
 * Introduces Stage 1: Getting to Know phase and lists unlocked features.
 * This screen appears after both youth and elderly confirm the match.
 * 
 * ViewModel bindings needed:
 * - partnerName: string (from StageViewModel.currentMatch.partner.displayName)
 * - onStartJourney: () => void (calls StageViewModel.acknowledgeStageStart, navigates to main chat)
 * - currentStage: Stage (from StageViewModel.currentStage)
 * - unlockedFeatures: Feature[] (from StageViewModel.unlockedFeatures)
 */
export const WelcomeToStage1: React.FC<WelcomeToStage1Props> = ({
  partnerName = 'Ah Ma Mei',
  onStartJourney,
}) => {
  // TODO: Replace with ViewModel bindings
  // const { currentStage, unlockedFeatures } = stageViewModel;

  // Placeholder unlocked features - will come from ViewModel
  const unlockedFeatures = [
    { label: 'Real Identity Revealed' },
    { label: 'Video Calls' },
    { label: 'Photo Sharing' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Icon */}
        <View style={styles.iconContainer}>
          <IconCircle
            icon="🎉"
            size={80}
            backgroundColor="#9DE2D0"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Welcome to Stage 1!</Text>

        {/* Description */}
        <Text style={styles.description}>
          Congratulations! Your companionship with{' '}
          <Text style={styles.boldText}>{partnerName}</Text> is now official.
        </Text>

        {/* Stage Banner */}
        <View style={styles.stageBanner}>
          <Text style={styles.stageBannerTitle}>Stage 1: Getting to Know</Text>
          <Text style={styles.stageBannerSubtitle}>
            Build your foundation through regular communication
          </Text>
        </View>

        {/* Unlocked Features Card */}
        <Card style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>🔓 Unlocked Features</Text>
          {unlockedFeatures.map((feature, index) => (
            <FeatureCheckItem
              key={index}
              label={feature.label}
              checked
              checkColor="#D4E5AE"
            />
          ))}
        </Card>

        {/* Start Journey Button */}
        <Button
          title="Start Your Journey"
          onPress={onStartJourney || (() => {})}
          style={styles.startButton}
        />
      </ScrollView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4A9E8C',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  boldText: {
    fontWeight: '700',
    color: '#333',
  },
  stageBanner: {
    width: '100%',
    backgroundColor: '#9DE2D0',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  stageBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  stageBannerSubtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  featuresCard: {
    width: '100%',
    padding: 20,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  startButton: {
    width: '100%',
  },
});

export default WelcomeToStage1;

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, IconCircle, Card } from '../components/ui';

// ============================================================================
// TYPES
// ============================================================================
interface JourneyWalkthroughProps {
  /** Callback when user completes or skips walkthrough */
  onComplete: () => void;
  /** User type for personalized content */
  userType?: 'youth' | 'elderly';
}

interface WalkthroughStep {
  id: number;
  icon: string;
  iconBg: string;
  title: string;
  subtitle: string;
  highlights: { number: number; text: string }[];
}

// ============================================================================
// CONSTANTS
// ============================================================================
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 0,
    icon: '🗺️',
    iconBg: '#9DE2D0',
    title: 'Your Journey Begins',
    subtitle: 'A 4-step process to find your perfect companion',
    highlights: [
      { number: 1, text: 'Browse & Express Interest' },
      { number: 2, text: 'Pre-Match Communication' },
      { number: 3, text: 'Formal Application' },
      { number: 4, text: '4 Bonding Stages' },
    ],
  },
  {
    id: 1,
    icon: '1',
    iconBg: '#9DE2D0',
    title: 'Browse & Express Interest',
    subtitle: 'Discover profiles and find someone you connect with',
    highlights: [
      { number: 1, text: 'Browse elderly/youth profiles' },
      { number: 2, text: 'View interests, background & preferences' },
      { number: 3, text: 'Express interest to start conversation' },
      { number: 4, text: 'Wait for acceptance (max 3 active)' },
    ],
  },
  {
    id: 2,
    icon: '2',
    iconBg: '#C8ADD6',
    title: 'Pre-Match Communication',
    subtitle: 'A safe 7-14 day period to get to know each other with no commitment',
    highlights: [
      { number: 1, text: '7-14 days of anonymous chat' },
      { number: 2, text: 'Display names only (real ID hidden)' },
      { number: 3, text: 'No commitment required' },
      { number: 4, text: 'Either party can end anytime' },
    ],
  },
  {
    id: 3,
    icon: '3',
    iconBg: '#FADE9F',
    title: 'Formal Application',
    subtitle: 'Ready to commit? Submit your application for review',
    highlights: [
      { number: 1, text: 'Write motivation letter' },
      { number: 2, text: 'NGO reviews for safety' },
      { number: 3, text: 'Both parties must approve' },
      { number: 4, text: 'Real identities revealed after match' },
    ],
  },
  {
    id: 4,
    icon: '4',
    iconBg: '#D4E5AE',
    title: '4 Bonding Stages',
    subtitle: 'After adoption, you will build a lasting relationship through these 4 stages',
    highlights: [
      { number: 1, text: 'Getting to Know – Build trust' },
      { number: 2, text: 'Trial Period – Deepen connection' },
      { number: 3, text: 'Official Ceremony – Celebrate bond' },
      { number: 4, text: 'Family Life – Enjoy companionship' },
    ],
  },
];

// ============================================================================
// COMPONENT
// ============================================================================
export const JourneyWalkthrough: React.FC<JourneyWalkthroughProps> = ({
  onComplete,
  userType = 'youth',
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = WALKTHROUGH_STEPS.length;
  const step = WALKTHROUGH_STEPS[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Content */}
        <View style={styles.content}>
          {/* Icon - emoji for first screen, number for others */}
          {step.id === 0 ? (
            <IconCircle
              icon={step.icon}
              size={120}
              backgroundColor={step.iconBg}
              contentScale={0.45}
              style={styles.iconContainer}
            />
          ) : (
            <View style={[styles.numberCircle, { backgroundColor: step.iconBg }]}>
              <Text style={styles.numberText}>{step.icon}</Text>
            </View>
          )}

          {/* Title & Subtitle */}
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>

          {/* Highlights Card */}
          <Card style={styles.highlightsCard}>
            {step.highlights.map((highlight, index) => (
              <View
                key={index}
                style={[
                  styles.highlightRow,
                  index < step.highlights.length - 1 && styles.highlightBorder,
                ]}
              >
                <View style={styles.highlightNumberCircle}>
                  <Text style={styles.highlightNumber}>{highlight.number}</Text>
                </View>
                <Text style={styles.highlightText}>{highlight.text}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Progress Dots */}
        <View style={styles.dotsContainer}>
          {WALKTHROUGH_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.dotActive,
                index < currentStep && styles.dotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <Button
              title="Back"
              onPress={handleBack}
              variant="outline"
              style={styles.backButton}
            />
          )}
          <Button
            title={isLastStep ? "Let's Go!" : 'Next'}
            onPress={handleNext}
            variant="primary"
            style={currentStep === 0 ? styles.fullWidth : styles.nextButton}
          />
        </View>
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
    paddingHorizontal: 24,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  numberCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  numberText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
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
  highlightsCard: {
    width: '100%',
    paddingVertical: 8,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  highlightBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  highlightNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9DE2D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  highlightNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  highlightText: {
    fontSize: 16,
    color: '#444',
    flex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 6,
  },
  dotActive: {
    backgroundColor: '#9DE2D0',
    width: 24,
  },
  dotCompleted: {
    backgroundColor: '#9DE2D0',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  fullWidth: {
    flex: 1,
  },
});

export default JourneyWalkthrough;

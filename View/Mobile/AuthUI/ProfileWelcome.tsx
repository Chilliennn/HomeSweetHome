import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Button, 
  Card, 
  StepIndicator, 
  ChecklistItem, 
  IconCircle 
} from '../components/ui';

// ============================================================================
// PROPS INTERFACE
// ============================================================================
interface ProfileWelcomeProps {
  /** Callback when user taps "Let's Start!" button */
  onStart: () => void;
  /** Loading state - controlled by ViewModel */
  isLoading?: boolean;
}

// ============================================================================
// CONSTANTS - For reusability and maintainability
// ============================================================================
const CHECKLIST_ITEMS = [
  {
    number: 1,
    title: 'Malaysian IC (MyKad)',
    description: 'For age verification',
  },
  {
    number: 2,
    title: 'A Recent Photo',
    description: 'Clear face photo',
  },
  {
    number: 3,
    title: '5 Minutes of Your Time',
    description: 'To fill in your interests',
  },
];

const TOTAL_ONBOARDING_STEPS = 4;
const CURRENT_STEP = 1;

// ============================================================================
// COMPONENT
// ============================================================================
export const ProfileWelcome: React.FC<ProfileWelcomeProps> = ({ 
  onStart,
  isLoading = false,
}) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <IconCircle
          imageSource={require('@/assets/images/logo.png')}
          size={100}
          backgroundColor="#B8E6E6"
          contentScale={1.5}
          style={styles.logo}
        />

        {/* Welcome Text */}
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>
          Let's complete your profile to start connecting. This should take about 5-10 minutes.
        </Text>

        {/* Step Indicator */}
        <StepIndicator 
          totalSteps={TOTAL_ONBOARDING_STEPS} 
          currentStep={CURRENT_STEP} 
          style={styles.steps} 
        />

        {/* Requirements Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📋</Text>
            <Text style={styles.cardTitle}>What You'll Need</Text>
          </View>

          {CHECKLIST_ITEMS.map((item, index) => (
            <ChecklistItem
              key={item.number}
              number={item.number}
              title={item.title}
              description={item.description}
              showDivider={index < CHECKLIST_ITEMS.length - 1}
            />
          ))}
        </Card>

        {/* CTA Button */}
        <Button
          title="Let's Start!"
          onPress={onStart}
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
    backgroundColor: '#FFFDF5',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  logo: {
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  steps: {
    marginBottom: 32,
  },
  card: {
    width: '100%',
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  button: {
    width: '100%',
  },
});

export default ProfileWelcome;
import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageSourcePropType } from 'react-native';
import {
  Card,
  NotificationBell,
  IconCircle,
  JourneyProgressDropdown,
} from '../components/ui';

// ============================================================================
// TYPES
// ============================================================================
interface ElderlyHomeProps {
  /** Elderly's display name */
  displayName?: string;
  /** Avatar image source */
  avatarSource?: ImageSourcePropType;
  /** Avatar emoji fallback */
  avatarEmoji?: string;
  /** Notification count */
  notificationCount?: number;
  /** Profile completeness percentage (0-100) */
  profileCompleteness?: number;
  /** Current journey step (1-4) */
  currentStep?: number;
  /** Callback when notification bell is pressed */
  onNotificationPress?: () => void;
  /** Callback when "Learn more" about process is pressed */
  onLearnMore?: () => void;
}

// ============================================================================
// ELDERLY JOURNEY STEPS
// ============================================================================
const ELDERLY_JOURNEY_STEPS = [
  { number: 1, label: 'Wait' },
  { number: 2, label: 'Pre-Match' },
  { number: 3, label: 'Review' },
  { number: 4, label: 'Match' },
];

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * ElderlyHome - Home screen for elderly users after completing profile setup
 * 
 * Shows welcome message, how it works, profile completeness, safety info,
 * and journey progress dropdown.
 * 
 * ViewModel bindings needed:
 * - displayName: string (from AuthViewModel.currentUser.displayName)
 * - avatarSource: ImageSource (from AuthViewModel.currentUser.avatarUrl)
 * - notificationCount: number (from CommunicationViewModel.unreadCount)
 * - profileCompleteness: number (from AuthViewModel.profileCompleteness)
 * - currentStep: number (from StageViewModel.currentJourneyStep)
 * - onNotificationPress: () => void (navigation to notifications)
 * - onLearnMore: () => void (navigation to journey walkthrough)
 */
export const ElderlyHome: React.FC<ElderlyHomeProps> = ({
  displayName = 'Rose',
  avatarSource,
  avatarEmoji,
  notificationCount = 1,
  profileCompleteness = 100,
  currentStep = 1,
  onNotificationPress,
  onLearnMore,
}) => {
  // TODO: Replace with ViewModel bindings
  // const { currentUser, profileCompleteness } = authViewModel;
  // const { unreadCount } = communicationViewModel;
  // const { currentJourneyStep } = stageViewModel;

  // How it works items
  const howItWorksItems = [
    'Youth browse profiles and express interest in connecting',
    "You'll receive notifications when someone is interested",
    'Review their profile and decide to accept or decline',
    'Start chatting anonymously for 7-14 days',
    'Decide if you want to become official companions!',
  ];

  // Get profile status message
  const getProfileStatusMessage = () => {
    if (profileCompleteness >= 100) {
      return 'Looking Great! ✨';
    } else if (profileCompleteness >= 70) {
      return 'Almost There!';
    } else {
      return 'Needs Attention';
    }
  };

  // Get journey descriptions for elderly
  const getCurrentDescription = () => {
    switch (currentStep) {
      case 1:
        return 'Waiting for youth to express interest';
      case 2:
        return 'Chatting anonymously with interested youth';
      case 3:
        return 'Reviewing formal application';
      case 4:
        return 'Confirming your match';
      default:
        return 'Waiting for youth to express interest';
    }
  };

  const getNextDescription = () => {
    switch (currentStep) {
      case 1:
        return 'Review & decide on connection requests';
      case 2:
        return 'Youth submits formal application after 7+ days';
      case 3:
        return 'Approve or decline the application';
      case 4:
        return 'Begin your companionship journey!';
      default:
        return 'Review & decide on connection requests';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <NotificationBell
          count={notificationCount}
          onPress={onNotificationPress}
        />
        <Text style={styles.greeting}>
          Hello, {displayName} 👋
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Icon */}
        <View style={styles.welcomeIconContainer}>
          <IconCircle
            icon={avatarSource ? undefined : '👵'}
            imageSource={avatarSource}
            size={100}
            backgroundColor="#9DE2D0"
            contentScale={0.7}
          />
        </View>

        {/* Welcome Title */}
        <Text style={styles.title}>Welcome to{'\n'}GrandConnect!</Text>
        <Text style={styles.description}>
          Your profile is complete and ready. Youth users can now view your
          profile and express interest in connecting with you.
        </Text>

        {/* Journey Progress Dropdown */}
        <JourneyProgressDropdown
          currentStep={currentStep}
          steps={ELDERLY_JOURNEY_STEPS}
          currentDescription={getCurrentDescription()}
          nextDescription={getNextDescription()}
          onLearnMore={onLearnMore}
          style={styles.journeyDropdown}
        />

        {/* How It Works Card */}
        <Card style={styles.howItWorksCard}>
          <Text style={styles.cardTitle}>✨ How It Works</Text>
          {howItWorksItems.map((item, index) => (
            <View key={index} style={styles.howItWorksItem}>
              <Text style={styles.itemNumber}>{index + 1}.</Text>
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </Card>

        {/* Profile Completeness Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.profileBadge}>
              <Text style={styles.profilePercentage}>{profileCompleteness}%</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileLabel}>Profile Completeness</Text>
              <Text style={styles.profileStatus}>{getProfileStatusMessage()}</Text>
            </View>
          </View>

          {/* Tip Card */}
          <Card style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡 Tip:</Text>
            <Text style={styles.tipText}>
              Complete profiles with clear photos and detailed interests receive
              3x more connection requests. Keep your information updated!
            </Text>
          </Card>
        </View>

        {/* Safety Card */}
        <Card style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>🛡️ Your Safety</Text>
          <Text style={styles.safetyText}>
            Your real identity remains private during pre-match. Only your
            display name and avatar are shown. Real names are revealed only
            after official match confirmation.
          </Text>
        </Card>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  welcomeIconContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  journeyDropdown: {
    width: '100%',
    marginBottom: 20,
  },
  howItWorksCard: {
    width: '100%',
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  howItWorksItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9DE2D0',
    marginRight: 8,
    width: 20,
  },
  itemText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },
  profileSection: {
    width: '100%',
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D4E5AE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profilePercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A7C23',
  },
  profileInfo: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  profileStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A7C23',
  },
  tipCard: {
    padding: 16,
    backgroundColor: '#FAFFF5',
  },
  tipIcon: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  safetyCard: {
    width: '100%',
    padding: 20,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});

export default ElderlyHome;

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageSourcePropType, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { elderMatchingViewModel } from '@home-sweet-home/viewmodel';
import { authViewModel } from '@home-sweet-home/viewmodel';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTabNavigation } from '@/hooks/use-tab-navigation';
import {
  Card,
  NotificationBell,
  IconCircle,
  JourneyProgressDropdown,
  Button,
  BottomTabBar,
  DEFAULT_TABS,
} from '@/components/ui';

// ============================================================================
// TYPES
// ============================================================================
interface ElderlyHomeProps {
  displayName?: string;
  avatarSource?: ImageSourcePropType;
  profileCompleteness?: number;
  currentStep?: number;
  onTabPress?: (tabKey: string) => void;
  activeTab?: string;
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

/**
 * ElderlyHome - Home screen for elderly users.
 * 
 * */
export const ElderlyHome: React.FC<ElderlyHomeProps> = observer(({
  displayName: propDisplayName,
  avatarSource,
  profileCompleteness = 100,
  currentStep = 1,
  onTabPress,
  activeTab: propActiveTab,
}) => {
  const router = useRouter();
  const vm = elderMatchingViewModel;
  
  // Use activeTab from prop or default to 'matching'
  const activeTab = propActiveTab || 'matching';
  
  // Use tab navigation hook
  const { handleTabPress: hookHandleTabPress } = useTabNavigation(activeTab);
  const handleTabPress = onTabPress || hookHandleTabPress;

  // Use real user ID from AuthViewModel
  const currentElderlyId = authViewModel.authState.currentUserId;
  // Use real name if not passed as prop
  const displayName = propDisplayName || authViewModel.profileData.displayIdentity?.displayName || 'Elderly User';

  // Poll for requests or load on mount
  useEffect(() => {
    console.log('Mounting');
    if (currentElderlyId) {
      vm.loadRequests(currentElderlyId);
    }
    return () => {
      console.log('Mounting');
      vm.dispose();
    };
  }, [currentElderlyId]);

  const handleNotificationPress = () => {
    console.log('🔔 [ElderlyHome] Notification bell pressed, pendingCount:', pendingCount);
    // Navigate to the centralized Notification Screen
    router.push('/(main)/notification');
  };

  const pendingCount = vm.incomingRequests.length;
  console.log('🔵 [ElderlyHome] Rendering - pendingCount:', pendingCount, 'requests:', vm.incomingRequests.map(r => r.id));
  // How it works items
  const howItWorksItems = [
    'Youth browse profiles and express interest in connecting',
    "You'll receive notifications when someone is interested",
    'Review their profile and decide to accept or decline',
    'Start chatting anonymously for 7-14 days',
    'Decide if you want to become official companions!',
  ];

  const getProfileStatusMessage = () => {
    if (profileCompleteness >= 100) return 'Looking Great! ✨';
    if (profileCompleteness >= 70) return 'Almost There!';
    return 'Needs Attention';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <NotificationBell
          count={pendingCount}
          onPress={handleNotificationPress}
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
        {/* PENDING REQUESTS ALERT (New Section) */}
        {pendingCount > 0 && (
          <Card style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertTitle}>New Interest Received! 🎉</Text>
            </View>
            <Text style={styles.alertText}>
              {pendingCount} youth student{pendingCount > 1 ? 's are' : ' is'} interested in connecting with you.
            </Text>
            <Button
              title="View Requests"
              onPress={handleNotificationPress}
              variant="primary"
              style={styles.alertButton}
            />
          </Card>
        )}

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
          currentDescription="Waiting for youth to express interest"
          nextDescription="Review & decide to connect"
          onLearnMore={() => { }}
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
        </View>  
        {/* Safety Card */}
        <Card style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>🛡️ Your Safety</Text>
          <Text style={styles.safetyText}>
            Your real identity remains private during pre-match. Only your
            display name and avatar are shown.
          </Text>
        </Card>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <BottomTabBar
        tabs={DEFAULT_TABS}
        activeTab={activeTab}
        onTabPress={onTabPress || (() => {})}
      />
    </SafeAreaView>
  )
})

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
  alertCard: {
    width: '100%',
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
    marginBottom: 20,
    padding: 16,
  },
  alertHeader: {
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  alertText: {
    fontSize: 14,
    color: '#388E3C',
    marginBottom: 12,
  },
  alertButton: {
    width: '100%',
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

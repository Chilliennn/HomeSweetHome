import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  Card,
  IconCircle,
  NotificationBell,
  BottomTabBar,
  TimelineItem,
  DEFAULT_TABS,
} from '../components/ui';

// ============================================================================
// TYPES
// ============================================================================
interface ApplicationSubmittedProps {
  /** Notification count to display */
  notificationCount?: number;
  /** Current active tab key */
  activeTab?: string;
  /** Callback when notification bell is pressed */
  onNotificationPress?: () => void;
  /** Callback when filter is pressed */
  onFilterPress?: () => void;
  /** Callback when tab is selected */
  onTabSelect?: (key: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * ApplicationSubmitted - Success screen after formal application submission
 * 
 * Shows application timeline with current status and next steps.
 * Displays header with notification bell and filter button.
 * 
 * ViewModel bindings needed:
 * - applicationStatus: 'submitted' | 'admin_review' | 'elderly_review' | 'confirmed'
 *   (from MatchingViewModel.currentApplication.status)
 * - submittedAt: Date (from MatchingViewModel.currentApplication.submittedAt)
 * - notificationCount: number (from CommunicationViewModel.unreadCount)
 * - onNotificationPress: () => void (navigation to notifications)
 * - onFilterPress: () => void (open filter modal)
 * - activeTabIndex: number (from NavigationViewModel.activeTab)
 * - onTabSelect: (index) => void (calls NavigationViewModel.setActiveTab)
 */
export const ApplicationSubmitted: React.FC<ApplicationSubmittedProps> = ({
  notificationCount = 1,
  activeTab = 'matching',
  onNotificationPress,
  onFilterPress,
  onTabSelect,
}) => {
  // TODO: Replace with ViewModel bindings
  // const { currentApplication } = matchingViewModel;
  // const { unreadCount } = communicationViewModel;

  // Placeholder timeline data - will come from ViewModel
  const timelineSteps = [
    {
      title: 'Application Submitted',
      subtitle: 'Just now',
      status: 'completed' as const,
    },
    {
      title: 'Admin Review',
      subtitle: '24-48 hours',
      status: 'current' as const,
      icon: '⏳',
    },
    {
      title: 'Elderly Review',
      subtitle: 'After admin approval',
      status: 'pending' as const,
    },
    {
      title: 'Match Confirmation',
      subtitle: 'Final step',
      status: 'pending' as const,
    },
  ];

  const handleTabSelect = (key: string) => {
    if (onTabSelect) {
      onTabSelect(key);
    }
    // TODO: Call navigationViewModel.setActiveTab(key)
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <NotificationBell
          count={notificationCount}
          onPress={onNotificationPress}
        />
        <View style={styles.filterButton}>
          <Text style={styles.filterText} onPress={onFilterPress}>
            Filter
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <IconCircle
            icon="✓"
            size={100}
            backgroundColor="#9DE2D0"
          />
        </View>

        {/* Title & Description */}
        <Text style={styles.title}>Application Submitted!</Text>
        <Text style={styles.description}>
          Your application has been submitted successfully. We'll review it
          within 24-48 hours and notify you of the decision.
        </Text>

        {/* Timeline Card */}
        <Card style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>📋 Application Timeline</Text>
          <View style={styles.timeline}>
            {timelineSteps.map((step, index) => (
              <TimelineItem
                key={index}
                title={step.title}
                subtitle={step.subtitle}
                status={step.status}
                icon={step.icon}
                showLine={index < timelineSteps.length - 1}
              />
            ))}
          </View>
        </Card>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <BottomTabBar
        tabs={DEFAULT_TABS}
        activeTab={activeTab}
        onTabPress={handleTabSelect}
        disabledTabs={['journey', 'gallery']} // Journey and Gallery disabled until match
      />
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
  filterButton: {
    backgroundColor: '#9DE2D0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
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
  successIconContainer: {
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
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
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  timelineCard: {
    width: '100%',
    padding: 20,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  timeline: {
    paddingLeft: 4,
  },
});

export default ApplicationSubmitted;

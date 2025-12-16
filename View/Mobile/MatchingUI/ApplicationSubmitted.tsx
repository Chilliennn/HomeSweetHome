/**
 * ApplicationSubmitted - Success screen after formal application submission (101_2)
 * 
 * Shows application timeline with current status and next steps.
 * Displays partner info with icon-hug.
 * 
 * UC101_13: Youth sees application status after submission
 * 
 * MVVM: View layer - displays reactive ViewModel data
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Card,
  IconCircle,
  NotificationBell,
  BottomTabBar,
  TimelineItem,
  DEFAULT_TABS,
} from '../components/ui';
import { communicationViewModel } from '@home-sweet-home/viewmodel';
import { Colors } from '@/constants/theme';

// Project icons
const IconHug = require('@/assets/images/icon-hug.png');

export const ApplicationSubmitted = observer(function ApplicationSubmitted() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const applicationId = params.applicationId as string;

  const vm = communicationViewModel;
  const chat = vm.getChatByApplicationId(applicationId);
  const partner = chat?.partnerUser;

  // Load data if needed
  useEffect(() => {
    if (!chat && !vm.hasLoadedOnce) {
      vm.loadActiveChats();
    }
  }, [chat, vm.hasLoadedOnce]);

  // Timeline steps
  const timelineSteps = [
    {
      title: 'Application Submitted',
      subtitle: 'Just now',
      status: 'completed' as const,
    },
    {
      title: 'Elderly Review',
      subtitle: 'Waiting for response',
      status: 'current' as const,
      icon: '⏳',
    },
    {
      title: 'Match Confirmation',
      subtitle: 'Final step',
      status: 'pending' as const,
    },
  ];

  const handleNotificationPress = () => {
    router.push('/notifications' as any);
  };

  const handleTabSelect = (key: string) => {
    switch (key) {
      case 'home':
        router.push('/(main)/home' as any);
        break;
      case 'chat':
        router.push('/(main)/chat' as any);
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <NotificationBell
          count={0}
          onPress={handleNotificationPress}
        />
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon with Hug */}
        <View style={styles.successIconContainer}>
          <View style={styles.hugIconCircle}>
            <Image source={IconHug} style={styles.hugIcon} />
          </View>
        </View>

        {/* Title & Description */}
        <Text style={styles.title}>Application Submitted!</Text>
        <Text style={styles.description}>
          Your formal application for{' '}
          <Text style={styles.boldText}>{partner?.full_name || 'your partner'}</Text>
          {' '}has been submitted successfully. They will review it soon.
        </Text>

        {/* Partner Card */}
        {partner && (
          <Card style={styles.partnerCard}>
            <View style={styles.partnerRow}>
              <IconCircle
                icon="👵"
                size={64}
                backgroundColor="#C8ADD6"
                contentScale={0.65}
              />
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerName}>{partner.full_name}</Text>
                <Text style={styles.partnerStatus}>Reviewing your application...</Text>
              </View>
            </View>
          </Card>
        )}

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

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 What's Next?</Text>
          <Text style={styles.infoText}>
            While waiting for a response, you can continue chatting with your
            partner. Once they approve, you'll receive a notification!
          </Text>
        </Card>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <BottomTabBar
        tabs={DEFAULT_TABS}
        activeTab="matching"
        onTabPress={handleTabSelect}
        disabledTabs={['journey', 'gallery']}
      />
    </View>
  );
});

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
  headerSpacer: {
    width: 40,
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
  hugIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hugIcon: {
    width: 72,
    height: 72,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.success,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.light.text,
  },
  partnerCard: {
    width: '100%',
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F0F8FF',
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  partnerStatus: {
    fontSize: 14,
    color: Colors.light.primary,
    marginTop: 4,
  },
  timelineCard: {
    width: '100%',
    padding: 20,
    marginBottom: 16,
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
  infoCard: {
    width: '100%',
    padding: 20,
    backgroundColor: '#FADE9F',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
});

export default ApplicationSubmitted;

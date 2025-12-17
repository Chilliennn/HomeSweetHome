import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { youthMatchingViewModel } from '@home-sweet-home/viewmodel';
import { IconCircle, Card, Button, ChecklistItem } from '@/components/ui';

// ============================================================================
// WHAT YOU CAN DO LIST
// ============================================================================
const ALLOWED_ACTIONS = [
  'Send text messages',
  'Send voice notes (max 2 min)',
  'View display profile',
];

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * PreMatchStarted - UC101_5: Confirmation screen when elderly accepts interest
 * 
 * Features:
 * - Chat icon
 * - "Pre-Match Started!" title
 * - Pre-match period info card (7-14 days)
 * - What You Can Do checklist
 * - Privacy notice
 * - Start Chatting button
 * 
 * Architecture:
 * - Full component with logic and UI
 * - Uses youthMatchingViewModel for match data
 * - Handles navigation to chat
 */
export const PreMatchStarted = observer(function PreMatchStarted() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const vm = youthMatchingViewModel;
  
  const matchId = params.matchId as string;
  
  // UC101_5: Get match details from ViewModel
  const match = matchId ? vm.getMatchById(matchId) : null;
  const elderlyName = match?.elderly?.full_name || 'An Elderly';

  useEffect(() => {
    if (!matchId) {
      Alert.alert('Error', 'No match information found');
      router.back();
    }
  }, [matchId]);

  // UC101_6: Navigate to chat screen with application ID
  const handleStartChatting = () => {
    router.push(`/(main)/chat?applicationId=${matchId}`);
  };

  if (!match) {
    return null;
  }
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Chat Icon */}
        <View style={styles.iconSection}>
          <IconCircle
            icon="💬"
            size={80}
            backgroundColor="#9DE2D0"
            contentScale={0.5}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Pre-Match Started!</Text>

        {/* Message */}
        <Text style={styles.message}>
          Good news! <Text style={styles.nameHighlight}>{elderlyName}</Text> has accepted your interest. Your pre-match period has started.
        </Text>

        {/* Pre-Match Period Info Card */}
        <View style={styles.periodCard}>
          <View style={styles.periodHeader}>
            <Text style={styles.calendarIcon}>📅</Text>
            <Text style={styles.periodTitle}>Pre-Match Period: 7-14 Days</Text>
          </View>
          <Text style={styles.periodDescription}>
            Get to know each other anonymously. Minimum 7 days required before formal application.
          </Text>
        </View>

        {/* What You Can Do Card */}
        <Card style={styles.actionsCard}>
          <View style={styles.actionsHeader}>
            <Text style={styles.lightbulbIcon}>💡</Text>
            <Text style={styles.actionsTitle}>What You Can Do</Text>
          </View>
          
          {ALLOWED_ACTIONS.map((action, index) => (
            <View key={index} style={styles.actionItem}>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}
        </Card>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            Real identities remain hidden until official match confirmation.
          </Text>
        </View>

        {/* Start Chatting Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartChatting}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Chatting</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
});

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  iconSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  nameHighlight: {
    fontWeight: '700',
    color: '#333',
  },
  periodCard: {
    width: '100%',
    backgroundColor: '#9DE2D0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  periodDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionsCard: {
    width: '100%',
    padding: 16,
    marginBottom: 16,
  },
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lightbulbIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkIcon: {
    fontSize: 16,
    color: '#9DE2D0',
    marginRight: 12,
    fontWeight: '600',
  },
  actionText: {
    fontSize: 15,
    color: '#333',
  },
  privacyNotice: {
    width: '100%',
    backgroundColor: '#FADE9F',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  lockIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  startButton: {
    width: '100%',
    backgroundColor: '#EB8F80',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default PreMatchStarted;

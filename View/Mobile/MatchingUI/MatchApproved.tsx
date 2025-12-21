/**
 * MatchApproved - Screen shown when elderly approves the formal application (102_3)
 * 
 * Displays elderly info and asks youth to confirm the match.
 * Lists what happens after confirmation.
 * 
 * UC102_3: Youth sees approval notification and confirms match
 * 
 * MVVM: View layer - displays data and calls ViewModel actions
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, IconCircle, Button, Chip } from '../components/ui';
import { youthMatchingViewModel } from '@home-sweet-home/viewmodel';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Project icons
const IconHug = require('@/assets/images/icon-hug.png');

export const MatchApproved = observer(function MatchApproved() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const applicationId = params.applicationId as string;

  const vm = youthMatchingViewModel;
  const [isConfirming, setIsConfirming] = useState(false);
  const [application, setApplication] = useState<any>(null);

  // Load application data - ✅ MVVM: Use ViewModel method
  useEffect(() => {
    const loadApplication = async () => {
      try {
        const data = await vm.getApplicationById(applicationId);
        setApplication(data);
      } catch (error) {
        console.error('Failed to load application:', error);
      }
    };

    if (applicationId) {
      loadApplication();
    }
  }, [applicationId]);

  const handleBack = () => {
    router.back();
  };

  const handleConfirmMatch = async () => {
    Alert.alert(
      'Confirm Match',
      'Are you ready to begin your adoption journey?',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsConfirming(true);
            try {
              // TODO: Implement match confirmation in ViewModel
              Alert.alert(
                'Congratulations! 🎉',
                'Your match is confirmed! Welcome to your new family journey.',
                [{
                  text: 'Start Journey',
                  onPress: () => router.replace('/(main)/home' as any)
                }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to confirm match');
            } finally {
              setIsConfirming(false);
            }
          }
        }
      ]
    );
  };

  const handleNeedMoreTime = () => {
    Alert.alert(
      'Need More Time',
      'Take your time to think about this important decision. You can come back anytime.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  // Loading state
  if (!application) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const elderly = application.elderly;
  const elderlyProfile = elderly?.profile_data || {};

  const afterConfirmationItems = [
    'Real identities will be revealed',
    'Stage 1: Getting to Know begins',
    'More features will unlock',
    'A Family Advisor will be assigned',
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Match Approved</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hug Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.hugIconCircle}>
            <Image source={IconHug} style={styles.hugIcon} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Match Approved! 🎉</Text>

        {/* Description */}
        <Text style={styles.description}>
          <Text style={styles.boldText}>{elderly?.full_name || 'The Elderly'}</Text> has approved your
          application! Please confirm to officially begin your companionship
          journey.
        </Text>

        {/* Elderly Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <IconCircle
              icon={elderlyProfile.avatar_meta?.type === 'default' ? '👵' : '👤'}
              size={64}
              backgroundColor="#C8ADD6"
              contentScale={0.65}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{elderly?.full_name || 'Elderly Name'}</Text>
              <Text style={styles.profileDetails}>
                {elderly?.location || 'Location'} • Elderly
              </Text>
              {elderlyProfile.interests && elderlyProfile.interests.length > 0 && (
                <View style={styles.interestsRow}>
                  {elderlyProfile.interests.slice(0, 3).map((interest: string, index: number) => (
                    <Chip
                      key={index}
                      label={interest}
                      color={index % 2 === 0 ? '#9DE2D0' : '#D4E5AE'}
                      size="small"
                      style={styles.chip}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* After Confirmation Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>📋 After Confirmation</Text>
          {afterConfirmationItems.map((item, index) => (
            <View key={index} style={styles.infoItemRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.light.success} />
              <Text style={styles.infoItem}>{item}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.moreTimeButton, isConfirming && styles.buttonDisabled]}
          onPress={handleNeedMoreTime}
          disabled={isConfirming}
        >
          <Text style={styles.moreTimeButtonText}>Need More Time</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, isConfirming && styles.buttonDisabled]}
          onPress={handleConfirmMatch}
          disabled={isConfirming}
        >
          <Text style={styles.confirmButtonText}>
            {isConfirming ? 'Confirming...' : 'Confirm Match'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.light.text,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 24,
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
    fontSize: 28,
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
    paddingHorizontal: 8,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.light.text,
  },
  profileCard: {
    width: '100%',
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#9DE2D0',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    marginRight: 4,
  },
  infoCard: {
    width: '100%',
    padding: 20,
    marginBottom: 24,
    backgroundColor: '#FADE9F',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  infoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  infoItem: {
    fontSize: 14,
    color: '#555',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  moreTimeButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  moreTimeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.light.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default MatchApproved;

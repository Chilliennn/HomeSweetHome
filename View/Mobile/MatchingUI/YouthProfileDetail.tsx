import React from 'react';
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
import { elderMatchingViewModel } from '@home-sweet-home/viewmodel';
import { IconCircle, Card, Button } from '@/components/ui';
import { Colors } from '@/constants/theme';

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * YouthProfileDetail - UC102_5: Full youth profile view for elderly users
 * 
 * Displays complete youth information when elderly clicks "View Profile" 
 * from notification. Includes Accept/Decline actions.
 * 
 * Architecture:
 * - Full component with logic and UI
 * - Uses elderMatchingViewModel for data and actions
 * - Handles Accept/Decline with Alerts
 */
export const YouthProfileDetail = observer(function YouthProfileDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const vm = elderMatchingViewModel;
  
  const applicationId = params.applicationId as string;
  
  // Find the interest/application from ViewModel
  const interest = applicationId 
    ? vm.incomingRequests.find(r => r.id === applicationId)
    : null;

  if (!interest || !interest.youth) {
    return null;
  }

  const youth = interest.youth;
  const motivationLetter = interest.motivation_letter;
  
  // Extract youth data
  const age = youth.profile_data?.verified_age?.toString() || 'N/A';
  const occupation = 'Not specified'; // TODO: Add occupation to UserProfileData type
  const location = youth.location || 'Not specified';
  const languages = youth.languages || [];
  const communication: string[] = []; // TODO: Add communication to UserProfileData type
  const interests = youth.profile_data?.interests || [];
  const availability = 'Not specified'; // TODO: Add availability to UserProfileData type
  const accountCreated = youth.created_at ? new Date(youth.created_at).toLocaleDateString() : 'Unknown';

  const handleAccept = async () => {
    await vm.respondToInterest(applicationId, youth.id, vm.incomingRequests[0]?.elderly_id || '', true);
    
    if (vm.successMessage) {
      Alert.alert('Success', vm.successMessage, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else if (vm.error) {
      Alert.alert('Error', vm.error);
    }
  };

  const handleDecline = async () => {
    Alert.alert(
      'Decline Interest',
      'Are you sure you want to decline this interest?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            await vm.respondToInterest(applicationId, youth.id, vm.incomingRequests[0]?.elderly_id || '', false);
            if (!vm.error) {
              router.back();
            } else {
              Alert.alert('Error', vm.error);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Interest from Youth</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Avatar & Name */}
        <View style={styles.profileSection}>
          <IconCircle
            icon="👤"
            size={100}
            backgroundColor={Colors.light.secondary}
          />
          <Text style={styles.name}>{youth.full_name}</Text>
          <Text style={styles.age}>{age} years old</Text>
        </View>

        {/* Basic Information Card */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📋</Text>
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Occupation</Text>
            <Text style={styles.value}>{occupation}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Languages</Text>
            <Text style={styles.value}>
              {languages.length > 0 ? languages.join(', ') : 'Not specified'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Communication</Text>
            <Text style={styles.value}>
              {communication.length > 0 ? communication.join(', ') : 'Not specified'}
            </Text>
          </View>
        </Card>

        {/* Interests & Hobbies Card */}
        {interests.length > 0 && (
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>💚</Text>
              <Text style={styles.sectionTitle}>Interests & Hobbies</Text>
            </View>
            <View style={styles.tagsContainer}>
              {interests.map((interest, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagIcon}>🍳</Text>
                  <Text style={styles.tagText}>{interest}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Why They Want to Connect Card */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>✍️</Text>
            <Text style={styles.sectionTitle}>Why They Want to Connect</Text>
          </View>
          <View style={styles.motivationBox}>
            <Text style={styles.motivationText}>
              {motivationLetter || 'No message provided'}
            </Text>
          </View>
        </Card>

        {/* Additional Info Card */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📊</Text>
            <Text style={styles.sectionTitle}>Additional Info</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Availability</Text>
            <Text style={styles.value}>{availability}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Account Created</Text>
            <Text style={styles.value}>{accountCreated}</Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Accept Interest"
            onPress={handleAccept}
            variant="primary"
            style={styles.acceptButton}
            disabled={vm.isLoading}
          />
          <Button
            title="Decline"
            onPress={handleDecline}
            variant="outline"
            style={styles.declineButton}
            disabled={vm.isLoading}
          />
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 4,
  },
  age: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  motivationBox: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  motivationText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  actionButtons: {
    marginTop: 8,
    marginBottom: 24,
    gap: 12,
  },
  acceptButton: {
    backgroundColor: Colors.light.error,
  },
  declineButton: {
    borderColor: Colors.light.error,
  },
});

export default YouthProfileDetail;

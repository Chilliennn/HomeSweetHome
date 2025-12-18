/**
 * FormalApplication - Form screen for submitting formal adoption application
 * 
 * Shows after pre-match period is completed (7+ days).
 * Collects motivation letter, availability, commitment level, and offerings.
 * 
 * UC101_12: Youth submits formal adoption application
 * 
 * MVVM: View layer - collects form data and calls ViewModel
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  Alert,
  Image,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Header, Button, AlertBanner, FormField, Card, IconCircle, SelectModal } from '../components/ui';
import { youthMatchingViewModel, communicationViewModel } from '@home-sweet-home/viewmodel';
import { Colors } from '@/constants/theme';

// Project icons
const IconUpload = require('@/assets/images/icon-upload.png');

export const FormalApplication = observer(function FormalApplication() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const applicationId = params.applicationId as string;

  const vm = youthMatchingViewModel;
  const commVM = communicationViewModel;

  // Form state
  const [motivationLetter, setMotivationLetter] = useState('');
  const [availability, setAvailability] = useState('');
  const [commitmentLevel, setCommitmentLevel] = useState('');
  const [whatCanOffer, setWhatCanOffer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal visibility state
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);

  // Dropdown options
  const AVAILABILITY_OPTIONS = [
    { label: 'Weekday evenings (6-9pm)', value: 'Weekday evenings (6-9pm)' },
    { label: 'Weekends (full day)', value: 'Weekends (full day)' },
    { label: 'Flexible schedule', value: 'Flexible schedule' },
    { label: 'Weekday mornings', value: 'Weekday mornings' },
  ];

  const COMMITMENT_OPTIONS = [
    { label: 'Long-term (6+ months)', value: 'Long-term (6+ months)' },
    { label: 'Medium-term (3-6 months)', value: 'Medium-term (3-6 months)' },
    { label: 'Short-term (1-3 months)', value: 'Short-term (1-3 months)' },
  ];

  // Get application data
  const chat = commVM.getChatByApplicationId(applicationId);
  const partner = chat?.partnerUser;
  const status = commVM.getPreMatchStatus(applicationId);

  const characterCount = motivationLetter.length;
  const isValid =
    characterCount >= 100 &&
    characterCount <= 1000 &&
    availability.length > 0 &&
    commitmentLevel.length > 0 &&
    whatCanOffer.length > 0;

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    console.log('🟢 [View] handleSubmit called, isValid:', isValid);
    if (!isValid) return;

    // Get user ID from communicationViewModel (set during app initialization)
    const youthId = commVM.currentUser;
    console.log('🟢 [View] youthId from commVM:', youthId);
    if (!youthId) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    console.log('🟢 [View] Setting isSubmitting=true');
    setIsSubmitting(true);
    try {
      console.log('🟢 [View] Calling vm.submitFormalApplication...');
      console.log('🟢 [View] applicationId:', applicationId);
      console.log('🟢 [View] formData:', { motivationLetter: motivationLetter.length + ' chars', availability, commitmentLevel, whatCanOffer: whatCanOffer.length + ' chars' });

      // Submit via ViewModel/Service - pass youthId explicitly
      const success = await vm.submitFormalApplication(applicationId, youthId, {
        motivationLetter,
        availability,
        commitmentLevel,
        whatCanOffer,
      });

      console.log('🟢 [View] vm.submitFormalApplication returned:', success);

      if (success) {
        console.log('🟢 [View] Success! Navigating to success screen...');
        // Navigate to success screen
        router.replace({
          pathname: '/application-submitted',
          params: { applicationId }
        } as any);
      } else {
        console.log('🟢 [View] Submit returned false. vm.error:', vm.error);
        // ViewModel returned false, show error from ViewModel
        Alert.alert('Error', vm.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('❌ [View] handleSubmit catch error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      console.log('🟢 [View] handleSubmit finally block, setting isSubmitting=false');
      setIsSubmitting(false);
    }
  };

  const handleAvailabilitySelect = () => {
    setShowAvailabilityModal(true);
  };

  const handleCommitmentSelect = () => {
    setShowCommitmentModal(true);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Header title="Formal Application" onBack={handleBack} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Partner Info Card */}
          <Card style={styles.partnerCard}>
            <View style={styles.partnerRow}>
              <View style={styles.uploadIconContainer}>
                <Image source={IconUpload} style={styles.uploadIcon} />
              </View>
              <View style={styles.partnerInfo}>
                <Text style={styles.cardTitle}>Submit Application</Text>
                <Text style={styles.partnerName}>
                  For {partner?.full_name || 'your partner'}
                </Text>
                {status && (
                  <Text style={styles.daysText}>
                    Day {status.daysPassed} of pre-match
                  </Text>
                )}
              </View>
            </View>
          </Card>

          {/* Success Banner */}
          <AlertBanner
            type="success"
            icon="📝"
            message={`You've completed the pre-match period with ${partner?.full_name || 'your partner'}. Please complete this form to proceed.`}
            style={styles.banner}
          />

          {/* Motivation Letter */}
          <FormField
            label="Motivation Letter"
            required
            multiline
            numberOfLines={5}
            value={motivationLetter}
            onChangeText={setMotivationLetter}
            placeholder="I've really enjoyed our conversations over the past week. Your stories about teaching have inspired me, and I would love to learn more recipes from you..."
            helperText={`${characterCount} / 1000 characters (min: 100)`}
          />

          {/* Availability */}
          <FormField
            label="Availability"
            required
            isSelect
            value={availability}
            placeholder="Select your availability"
            onSelectPress={handleAvailabilitySelect}
          />

          {/* Commitment Level */}
          <FormField
            label="Commitment Level"
            required
            isSelect
            value={commitmentLevel}
            placeholder="Select commitment level"
            onSelectPress={handleCommitmentSelect}
          />

          {/* What Can You Offer */}
          <FormField
            label="What Can You Offer?"
            required
            multiline
            numberOfLines={3}
            value={whatCanOffer}
            onChangeText={setWhatCanOffer}
            placeholder="Help with technology, companionship, regular video calls..."
          />

          {/* Submit Button */}
          <Button
            title={isSubmitting ? "Submitting..." : "Submit Application"}
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Availability Selection Modal */}
      <SelectModal
        visible={showAvailabilityModal}
        title="Select Availability"
        options={AVAILABILITY_OPTIONS}
        selectedValue={availability}
        onSelect={setAvailability}
        onClose={() => setShowAvailabilityModal(false)}
      />

      {/* Commitment Level Selection Modal */}
      <SelectModal
        visible={showCommitmentModal}
        title="Select Commitment Level"
        options={COMMITMENT_OPTIONS}
        selectedValue={commitmentLevel}
        onSelect={setCommitmentLevel}
        onClose={() => setShowCommitmentModal(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  partnerCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F0F8FF',
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadIcon: {
    width: 40,
    height: 40,
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  partnerName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  daysText: {
    fontSize: 12,
    color: Colors.light.primary,
    marginTop: 2,
  },
  banner: {
    marginBottom: 24,
    backgroundColor: '#D4E5AE',
  },
  submitButton: {
    marginTop: 8,
  },
});

export default FormalApplication;

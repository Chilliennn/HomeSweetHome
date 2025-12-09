import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Header, Button, AlertBanner, FormField } from '../components/ui';

// ============================================================================
// TYPES
// ============================================================================
interface FormalApplicationProps {
  /** Elderly name to display in banner */
  elderlyName?: string;
  /** Callback when back is pressed */
  onBack?: () => void;
  /** Callback when application is submitted */
  onSubmit?: (data: ApplicationFormData) => void;
}

interface ApplicationFormData {
  motivationLetter: string;
  availability: string;
  commitmentLevel: string;
  whatCanOffer: string;
}

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * FormalApplication - Form screen for submitting formal adoption application
 * 
 * Shows after pre-match period is completed (7+ days).
 * Collects motivation letter, availability, commitment level, and offerings.
 * 
 * ViewModel bindings needed:
 * - elderlyName: string (from MatchingViewModel.selectedElderly.displayName)
 * - onBack: () => void (navigation back)
 * - onSubmit: (data) => void (calls MatchingViewModel.submitFormalApplication)
 * - formData: ApplicationFormData (bound to MatchingViewModel.applicationFormData)
 * - isSubmitting: boolean (from MatchingViewModel.isSubmitting)
 * - validationErrors: { [key]: string } (from MatchingViewModel.formErrors)
 * - characterCount: number (computed from motivationLetter.length)
 */
export const FormalApplication: React.FC<FormalApplicationProps> = ({
  elderlyName = 'Ah Ma Mei',
  onBack,
  onSubmit,
}) => {
  // Local state - will be replaced with ViewModel bindings
  const [motivationLetter, setMotivationLetter] = useState('');
  const [availability, setAvailability] = useState('');
  const [commitmentLevel, setCommitmentLevel] = useState('');
  const [whatCanOffer, setWhatCanOffer] = useState('');

  // TODO: Replace with ViewModel bindings
  // const { formData, setFormField, validationErrors, isSubmitting } = matchingViewModel;

  const characterCount = motivationLetter.length;
  const isValid =
    characterCount >= 100 &&
    characterCount <= 1000 &&
    availability.length > 0 &&
    commitmentLevel.length > 0 &&
    whatCanOffer.length > 0;

  const handleSubmit = () => {
    if (onSubmit && isValid) {
      onSubmit({
        motivationLetter,
        availability,
        commitmentLevel,
        whatCanOffer,
      });
    }
    // TODO: Call matchingViewModel.submitFormalApplication()
  };

  // TODO: Replace with ViewModel method
  const handleAvailabilitySelect = () => {
    // Open availability picker modal
    // For now, set placeholder value
    setAvailability('Weekday evenings (6-9pm)');
  };

  const handleCommitmentSelect = () => {
    // Open commitment level picker modal
    // For now, set placeholder value
    setCommitmentLevel('Long-term (6+ months)');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Header title="Formal Application" onBack={onBack} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Success Banner */}
          <AlertBanner
            type="success"
            icon="📝"
            message={`You've completed the pre-match period with ${elderlyName}. Please complete this form to proceed.`}
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
            // TODO: error={validationErrors.motivationLetter}
          />

          {/* Availability */}
          <FormField
            label="Availability"
            required
            isSelect
            value={availability}
            placeholder="Select your availability"
            onSelectPress={handleAvailabilitySelect}
            // TODO: error={validationErrors.availability}
          />

          {/* Commitment Level */}
          <FormField
            label="Commitment Level"
            required
            isSelect
            value={commitmentLevel}
            placeholder="Select commitment level"
            onSelectPress={handleCommitmentSelect}
            // TODO: error={validationErrors.commitmentLevel}
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
            // TODO: error={validationErrors.whatCanOffer}
          />

          {/* Submit Button */}
          <Button
            title="Submit Application"
            onPress={handleSubmit}
            disabled={!isValid}
            style={styles.submitButton}
            // TODO: loading={isSubmitting}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  banner: {
    marginBottom: 24,
    backgroundColor: '#D4E5AE',
  },
  submitButton: {
    marginTop: 8,
  },
});

export default FormalApplication;

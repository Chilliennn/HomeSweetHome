import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Header,
  StepIndicator,
} from '../components/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_PADDING = 24;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

// ============================================================================
// TYPES
// ============================================================================
export interface ProfileInfoData {
  interests: string[];
  customInterest?: string;
  selfIntroduction: string;
  languages: string[];
  customLanguage?: string;
}

interface ProfileInfoFormProps {
  /** Initial data (from ViewModel) */
  initialData?: Partial<ProfileInfoData>;
  /** Callback when form is submitted */
  onSubmit: (data: ProfileInfoData) => void;
  /** Callback for back navigation */
  onBack: () => void;
  /** Loading state */
  isLoading?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const TOTAL_STEPS = 3;
const CURRENT_STEP = 3; 

// Interests options - UC103_11
const INTERESTS_OPTIONS = [
  { id: 'cooking', label: 'Cooking', emoji: '🍳' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'gardening', label: 'Gardening', emoji: '🌱' },
  { id: 'arts', label: 'Arts', emoji: '🎨' },
  { id: 'reading', label: 'Reading', emoji: '📚' },
  { id: 'games', label: 'Games', emoji: '🎮' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'exercise', label: 'Exercise', emoji: '🏃' },
];

// Language options - UC103_15
const LANGUAGE_OPTIONS = [
  { id: 'malay', label: 'Malay' },
  { id: 'english', label: 'English' },
  { id: 'mandarin', label: 'Mandarin' },
  { id: 'tamil', label: 'Tamil' },
  { id: 'cantonese', label: 'Cantonese' },
  { id: 'hokkien', label: 'Hokkien' },
];

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 10;
const MIN_INTRO_LENGTH = 50;
const MAX_INTRO_LENGTH = 500;

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * Profile Info Form (UC103_11 to UC103_15)
 * Step 3 of 3: Collects interests, self-introduction, and language preferences
 */
export const ProfileInfoForm: React.FC<ProfileInfoFormProps> = ({
  initialData,
  onSubmit,
  onBack,
  isLoading = false,
}) => {
  // Form state
  const [interests, setInterests] = useState<string[]>(
    initialData?.interests || []
  );
  const [customInterest, setCustomInterest] = useState(
    initialData?.customInterest || ''
  );
  const [showCustomInterest, setShowCustomInterest] = useState(
    !!initialData?.customInterest
  );
  const [selfIntroduction, setSelfIntroduction] = useState(
    initialData?.selfIntroduction || ''
  );
  const [languages, setLanguages] = useState<string[]>(
    initialData?.languages || []
  );
  const [customLanguage, setCustomLanguage] = useState(
    initialData?.customLanguage || ''
  );
  const [showCustomLanguage, setShowCustomLanguage] = useState(
    !!initialData?.customLanguage
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const toggleInterest = (interestId: string) => {
    setInterests((prev) => {
      if (prev.includes(interestId)) {
        return prev.filter((id) => id !== interestId);
      } else if (prev.length < MAX_INTERESTS) {
        return [...prev, interestId];
      }
      return prev;
    });
    setErrors((prev) => ({ ...prev, interests: '' }));
  };

  const toggleLanguage = (languageId: string) => {
    setLanguages((prev) => {
      if (prev.includes(languageId)) {
        return prev.filter((id) => id !== languageId);
      }
      return [...prev, languageId];
    });
    setErrors((prev) => ({ ...prev, languages: '' }));
  };

  const toggleCustomInterest = () => {
    setShowCustomInterest((prev) => !prev);
    if (showCustomInterest) {
      setCustomInterest('');
    }
  };

  const toggleCustomLanguage = () => {
    setShowCustomLanguage((prev) => !prev);
    if (showCustomLanguage) {
      setCustomLanguage('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Count total interests including custom
    const totalInterests = interests.length + (customInterest.trim() ? 1 : 0);

    // Validate interests - UC103_11
    if (totalInterests < MIN_INTERESTS) {
      newErrors.interests = `Please select at least ${MIN_INTERESTS} interests`;
    } else if (totalInterests > MAX_INTERESTS) {
      newErrors.interests = `Maximum ${MAX_INTERESTS} interests allowed`;
    }

    // Validate self-introduction - UC103_12, UC103_13
    if (!selfIntroduction.trim()) {
      newErrors.introduction = 'Self introduction is required';
    } else if (selfIntroduction.length < MIN_INTRO_LENGTH) {
      newErrors.introduction = `Minimum ${MIN_INTRO_LENGTH} characters required`;
    } else if (selfIntroduction.length > MAX_INTRO_LENGTH) {
      newErrors.introduction = `Maximum ${MAX_INTRO_LENGTH} characters allowed`;
    }

    // Count total languages including custom
    const totalLanguages = languages.length + (customLanguage.trim() ? 1 : 0);

    // Validate languages - UC103_15
    if (totalLanguages === 0) {
      newErrors.languages = 'Please select at least one language';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        interests,
        customInterest: customInterest.trim() || undefined,
        selfIntroduction,
        languages,
        customLanguage: customLanguage.trim() || undefined,
      });
    }
  };

  // Calculate selection counts
  const totalInterests = interests.length + (customInterest.trim() ? 1 : 0);
  const totalLanguages = languages.length + (customLanguage.trim() ? 1 : 0);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.safeArea} edges={['top','bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <Header title="Step 3 of 3" onBack={onBack} />
        {/* Step Indicator */}
        <StepIndicator
          totalSteps={TOTAL_STEPS}
          currentStep={CURRENT_STEP}
          style={styles.stepIndicator}
        />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Interests Section - UC103_11 */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Your Interests <Text style={styles.required}>*</Text>
              <Text style={styles.hint}> (Select {MIN_INTERESTS}-{MAX_INTERESTS})</Text>
            </Text>
            
            {/* Interest Grid - 2 columns */}
            <View style={styles.gridContainer}>
              {INTERESTS_OPTIONS.map((interest) => {
                const isSelected = interests.includes(interest.id);
                return (
                  <TouchableOpacity
                    key={interest.id}
                    style={[
                      styles.gridItem,
                      isSelected && styles.gridItemSelected,
                    ]}
                    onPress={() => toggleInterest(interest.id)}
                    disabled={isLoading}
                  >
                    <Text style={styles.gridItemEmoji}>{interest.emoji}</Text>
                    <Text
                      style={[
                        styles.gridItemText,
                        isSelected && styles.gridItemTextSelected,
                      ]}
                    >
                      {interest.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Others Option */}
              <TouchableOpacity
                style={[
                  styles.othersItem,
                  showCustomInterest && styles.gridItemSelected,
                ]}
                onPress={toggleCustomInterest}
                disabled={isLoading}
              >
                <Text style={styles.gridItemEmoji}>✨</Text>
                <Text
                  style={[
                    styles.othersItemText,
                    showCustomInterest && styles.gridItemTextSelected,
                  ]}
                >
                  Others
                </Text>
                {showCustomInterest && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkIcon}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Custom Interest Input */}
            {showCustomInterest && (
              <TextInput
                style={styles.customInput}
                placeholder="Enter your interest..."
                placeholderTextColor="#A0A0A0"
                value={customInterest}
                onChangeText={setCustomInterest}
                maxLength={30}
                editable={!isLoading}
              />
            )}

            <Text style={styles.selectionCount}>{totalInterests} selected</Text>
            {errors.interests && (
              <Text style={styles.errorText}>{errors.interests}</Text>
            )}
          </View>

          {/* Self Introduction - UC103_12, UC103_13 */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Self Introduction <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textArea, errors.introduction && styles.inputError]}
              placeholder="Please briefly describe your educational background, work experience, and hobbies"
              placeholderTextColor="#A0A0A0"
              value={selfIntroduction}
              onChangeText={setSelfIntroduction}
              multiline
              numberOfLines={5}
              maxLength={MAX_INTRO_LENGTH}
              textAlignVertical="top"
              editable={!isLoading}
            />
            <Text style={styles.charCount}>
              {selfIntroduction.length} / {MAX_INTRO_LENGTH} characters (min: {MIN_INTRO_LENGTH})
            </Text>
            {errors.introduction && (
              <Text style={styles.errorText}>{errors.introduction}</Text>
            )}
          </View>

          {/* Languages - UC103_15 */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Languages <Text style={styles.required}>*</Text>
            </Text>
            
            {/* Language Grid - 2 columns */}
            <View style={styles.gridContainer}>
              {LANGUAGE_OPTIONS.map((language) => {
                const isSelected = languages.includes(language.id);
                return (
                  <TouchableOpacity
                    key={language.id}
                    style={[
                      styles.languageItem,
                      isSelected && styles.languageItemSelected,
                    ]}
                    onPress={() => toggleLanguage(language.id)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.languageItemText,
                        isSelected && styles.languageItemTextSelected,
                      ]}
                    >
                      {language.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkBadgeSmall}>
                        <Text style={styles.checkIconSmall}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Others Option */}
              <TouchableOpacity
                style={[
                  styles.othersItem,
                  showCustomLanguage && styles.languageItemSelected,
                ]}
                onPress={toggleCustomLanguage}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.othersLanguageItemText,
                    showCustomLanguage && styles.languageItemTextSelected,
                  ]}
                >
                  Others
                </Text>
                {showCustomLanguage && (
                  <View style={styles.checkBadgeSmall}>
                    <Text style={styles.checkIconSmall}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Custom Language Input */}
            {showCustomLanguage && (
              <TextInput
                style={styles.customInput}
                placeholder="Enter your language..."
                placeholderTextColor="#A0A0A0"
                value={customLanguage}
                onChangeText={setCustomLanguage}
                maxLength={30}
                editable={!isLoading}
              />
            )}

            <Text style={styles.selectionCount}>{totalLanguages} selected</Text>
            {errors.languages && (
              <Text style={styles.errorText}>{errors.languages}</Text>
            )}
          </View>

          {/* Submit Button */}
          <Button
            title="Complete Profile ✓"
            onPress={handleSubmit}
            variant="primary"
            style={styles.submitButton}
            loading={isLoading}
            disabled={isLoading}
          />
        </ScrollView>
      </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: GRID_PADDING,
    paddingBottom: 40,
  },
  stepIndicator: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  required: {
    color: '#EB8F80',
  },
  hint: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
  },
  
  // Grid Layout for Interests
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridItem: {
    width: ITEM_WIDTH,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  othersItem : {
    width: '100%',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  othersItemText: {
    fontSize: 15,
    color: '#333',
    flex: 0.84,
    textAlign: 'center',
  },
  othersLanguageItemText:{
    fontSize: 15,
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  gridItemSelected: {
    backgroundColor: '#9DE2D0',
    borderColor: '#9DE2D0',
  },
  gridItemEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  gridItemText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  gridItemTextSelected: {
    fontWeight: '600',
  },
  checkBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFDF5',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  
  // Language Items
  languageItem: {
    width: ITEM_WIDTH,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  languageItemSelected: {
    backgroundColor: '#9DE2D0',
    borderColor: '#9DE2D0',
  },
  languageItemText: {
    fontSize: 16,
    color: '#333',
  },
  languageItemTextSelected: {
    fontWeight: '600',
  },
  checkBadgeSmall: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFDF5',
  },
  checkIconSmall: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  
  // Custom Input
  customInput: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#9DE2D0',
  },
  
  selectionCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
  },
  
  // Text Area
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 120,
  },
  inputError: {
    borderColor: '#EB8F80',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    color: '#EB8F80',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 8,
  },
});

export default ProfileInfoForm;

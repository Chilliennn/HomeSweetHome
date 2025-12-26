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
import { observer } from 'mobx-react-lite';
import {
  Button,
  Header,
  StepIndicator,
} from '../components/ui';
import { authViewModel, AuthViewModel } from '../../../ViewModel/AuthViewModel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_PADDING = 24;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

// ============================================================================
// TYPES
// ============================================================================
export interface ProfileInfoData {
  interests: string[];
  customInterests?: string[];
  selfIntroduction: string;
  languages: string[];
  customLanguages?: string[];
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
  /** Edit mode - shows different title and button */
  editMode?: boolean;
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

const MIN_INTERESTS = AuthViewModel.VALIDATION_RULES.interests.minCount;
const MAX_INTERESTS = AuthViewModel.VALIDATION_RULES.interests.maxCount;
const MIN_INTRO_LENGTH = AuthViewModel.VALIDATION_RULES.selfIntroduction.minLength;
const MAX_INTRO_LENGTH = AuthViewModel.VALIDATION_RULES.selfIntroduction.maxLength;

// ============================================================================
// COMPONENT
// ============================================================================
const ProfileInfoFormComponent: React.FC<ProfileInfoFormProps> = ({
  initialData,
  onSubmit,
  onBack,
  isLoading = false,
  editMode = false,
}) => {
  // Form state
  const [interests, setInterests] = useState<string[]>(
    initialData?.interests || []
  );
  const [customInterests, setCustomInterests] = useState<string[]>(
    initialData?.customInterests || []
  );
  const [showCustomInterest, setShowCustomInterest] = useState(
    (initialData?.customInterests?.length || 0) > 0
  );
  const [selfIntroduction, setSelfIntroduction] = useState(
    initialData?.selfIntroduction || ''
  );
  const [languages, setLanguages] = useState<string[]>(
    initialData?.languages || []
  );
  const [customLanguages, setCustomLanguages] = useState<string[]>(
    initialData?.customLanguages || []
  );
  const [showCustomLanguage, setShowCustomLanguage] = useState(
    (initialData?.customLanguages?.length || 0) > 0
  );
  // NOTE: Errors are managed by ViewModel (authViewModel.profileInfoErrors) per MVVM rules

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
    authViewModel.clearProfileInfoError('interests');
  };

  const toggleLanguage = (languageId: string) => {
    setLanguages((prev) => {
      if (prev.includes(languageId)) {
        return prev.filter((id) => id !== languageId);
      }
      return [...prev, languageId];
    });
    authViewModel.clearProfileInfoError('languages');
  };

  const toggleCustomInterest = () => {
    if (showCustomInterest) {
      // Closing - clear all custom interests
      setCustomInterests([]);
      setShowCustomInterest(false);
    } else {
      // Opening - add one empty input
      setCustomInterests(['']);
      setShowCustomInterest(true);
    }
  };

  const toggleCustomLanguage = () => {
    if (showCustomLanguage) {
      // Closing - clear all custom languages
      setCustomLanguages([]);
      setShowCustomLanguage(false);
    } else {
      // Opening - add one empty input
      setCustomLanguages(['']);
      setShowCustomLanguage(true);
    }
  };

  // Add new custom interest input
  const addCustomInterest = () => {
    if (customInterests.length < 5) {
      setCustomInterests([...customInterests, '']);
    }
  };

  // Update a specific custom interest
  const updateCustomInterest = (index: number, value: string) => {
    const updated = [...customInterests];
    updated[index] = value;
    setCustomInterests(updated);
    authViewModel.clearProfileInfoError('interests');
  };

  // Remove a specific custom interest
  const removeCustomInterest = (index: number) => {
    const updated = customInterests.filter((_, i) => i !== index);
    if (updated.length === 0) {
      setShowCustomInterest(false);
    }
    setCustomInterests(updated);
  };

  // Add new custom language input
  const addCustomLanguage = () => {
    if (customLanguages.length < 3) {
      setCustomLanguages([...customLanguages, '']);
    }
  };

  // Update a specific custom language
  const updateCustomLanguage = (index: number, value: string) => {
    const updated = [...customLanguages];
    updated[index] = value;
    setCustomLanguages(updated);
    authViewModel.clearProfileInfoError('languages');
  };

  // Remove a specific custom language
  const removeCustomLanguage = (index: number) => {
    const updated = customLanguages.filter((_, i) => i !== index);
    if (updated.length === 0) {
      setShowCustomLanguage(false);
    }
    setCustomLanguages(updated);
  };

  // Count valid custom entries (non-empty)
  const validCustomInterestsCount = customInterests.filter(i => i.trim()).length;
  const validCustomLanguagesCount = customLanguages.filter(l => l.trim()).length;

  const handleSubmit = () => {
    // Filter out empty custom values before submitting
    const validCustomInterests = customInterests.filter(i => i.trim());
    const validCustomLanguages = customLanguages.filter(l => l.trim());

    const data = {
      interests,
      customInterests: validCustomInterests.length > 0 ? validCustomInterests : undefined,
      selfIntroduction,
      languages,
      customLanguages: validCustomLanguages.length > 0 ? validCustomLanguages : undefined,
    };

    // ViewModel validates and populates errors, View submits if valid
    if (authViewModel.validateProfileInfo(data)) {
      onSubmit(data);
    }
  };

  // Calculate selection counts
  const totalInterests = interests.length + validCustomInterestsCount;
  const totalLanguages = languages.length + validCustomLanguagesCount;

  // ============================================================================
  // RENDER
  // ============================================================================

  // Access observable at render time to ensure MobX tracks it
  const { interests: interestsError, introduction: introductionError, languages: languagesError } = authViewModel.profileInfoErrors;
  console.log('[ProfileInfoForm] Render - errors:', { interestsError, introductionError, languagesError });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <Header title={editMode ? "Edit Profile Info" : "Step 3 of 3"} onBack={onBack} />
        {/* Step Indicator - only show in setup mode */}
        {!editMode && (
          <StepIndicator
            totalSteps={TOTAL_STEPS}
            currentStep={CURRENT_STEP}
            style={styles.stepIndicator}
          />
        )}
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

            {/* Custom Interest Inputs */}
            {showCustomInterest && (
              <View style={styles.customInputContainer}>
                {customInterests.map((value, index) => (
                  <View key={index} style={styles.customInputRow}>
                    <TextInput
                      style={styles.customInputField}
                      placeholder={`Custom interest ${index + 1}...`}
                      placeholderTextColor="#A0A0A0"
                      value={value}
                      onChangeText={(text) => updateCustomInterest(index, text)}
                      maxLength={30}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeCustomInterest(index)}
                      disabled={isLoading}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {customInterests.length < 5 && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={addCustomInterest}
                    disabled={isLoading}
                  >
                    <Text style={styles.addButtonText}>+ Add another interest</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <Text style={styles.selectionCount}>{totalInterests} selected</Text>
            {interestsError && (
              <Text style={styles.errorText}>{interestsError}</Text>
            )}
          </View>

          {/* Self Introduction - UC103_12, UC103_13 */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Self Introduction <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textArea, introductionError && styles.inputError]}
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
            {introductionError && (
              <Text style={styles.errorText}>{introductionError}</Text>
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

            {/* Custom Language Inputs */}
            {showCustomLanguage && (
              <View style={styles.customInputContainer}>
                {customLanguages.map((value, index) => (
                  <View key={index} style={styles.customInputRow}>
                    <TextInput
                      style={styles.customInputField}
                      placeholder={`Custom language ${index + 1}...`}
                      placeholderTextColor="#A0A0A0"
                      value={value}
                      onChangeText={(text) => updateCustomLanguage(index, text)}
                      maxLength={30}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeCustomLanguage(index)}
                      disabled={isLoading}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {customLanguages.length < 3 && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={addCustomLanguage}
                    disabled={isLoading}
                  >
                    <Text style={styles.addButtonText}>+ Add another language</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <Text style={styles.selectionCount}>{totalLanguages} selected</Text>
            {languagesError && (
              <Text style={styles.errorText}>{languagesError}</Text>
            )}
          </View>

          {/* Submit Button */}
          <Button
            title={editMode ? "Save Changes" : "Complete Profile ✓"}
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
  othersItem: {
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
  othersLanguageItemText: {
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

  // Custom Input - Multi-value support
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
  customInputContainer: {
    marginTop: 12,
    gap: 8,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInputField: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#9DE2D0',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    color: '#EB8F80',
    fontWeight: '600',
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
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

// Wrap with observer for MobX reactivity (MVVM pattern)
export const ProfileInfoForm = observer(ProfileInfoFormComponent);
export default ProfileInfoForm;

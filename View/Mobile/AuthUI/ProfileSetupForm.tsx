import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import {
  Button,
  Header,
  StepIndicator,
  AlertBanner,
  IconCircle,
  ImageUploader,
} from '../components/ui';

// ============================================================================
// TYPES
// ============================================================================
interface AvatarOption {
  id: string;
  source?: ImageSourcePropType;
  emoji?: string;
  backgroundColor?: string;
}

export interface ProfileSetupFormData {
  // Real Identity Fields (without realPhoto)
  phoneNumber: string;
  location: string;
  // Display Identity Fields
  displayName: string;
  avatarType: 'default' | 'custom';
  selectedAvatarId: string | null;
  customAvatarUri: string | null;
}

interface ProfileSetupFormProps {
  /** Initial data (from ViewModel) */
  initialData?: Partial<ProfileSetupFormData>;
  /** User type to show appropriate avatars */
  userType: 'youth' | 'elderly';
  /** Callback when form is submitted */
  onNext: (data: ProfileSetupFormData) => Promise<void>;
  /** Callback for back navigation */
  onBack?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Edit mode - shows different header/navigation */
  editMode?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const TOTAL_STEPS = 3; // Age verification, Profile Setup, Interests
const CURRENT_STEP = 2; // Profile Setup step

// Avatar background colors - RESTORED: matching original DisplayIdentityForm.tsx
const AVATAR_COLORS = [
  '#C8ADD6', // Purple
  '#9DE2D0', // Teal/Mint
  '#FADE9F', // Yellow
  '#D4E5AE', // Light Green
  '#FFB6C1', // Pink
  '#87CEEB', // Sky Blue
  '#DDA0DD', // Plum
  '#F0E68C', // Khaki
];

// Youth avatar emojis - RESTORED: 8 options matching original
const YOUTH_EMOJIS = ['👦', '👧', '🧑', '👩', '🧒', '👨', '👱‍♀️', '👱'];

// Elderly avatar emojis - RESTORED: 8 options matching original
const ELDERLY_EMOJIS = ['👴', '👵', '🧓', '👨‍🦳', '👩‍🦳', '🧑‍🦳', '👨‍🦲', '👩‍🦲'];

// Build avatar options based on user type
// Structure: 2 image avatars (img-0, img-1) + 6 emoji avatars (emoji-0 to emoji-5)
const buildAvatarOptions = (userType: 'youth' | 'elderly'): AvatarOption[] => {
  const images = userType === 'youth'
    ? [require('@/assets/images/youth1.png'), require('@/assets/images/youth2.png')]
    : [require('@/assets/images/elderly1.png'), require('@/assets/images/elderly2.png')];

  const emojis = userType === 'youth' ? YOUTH_EMOJIS : ELDERLY_EMOJIS;

  const options: AvatarOption[] = [];

  // Add image-based avatars first - RESTORED: matching original logic
  images.forEach((source, index) => {
    options.push({
      id: `img-${index}`,
      source,
      backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
    });
  });

  // Add emoji-based avatars (6 shown from 8 options) - RESTORED: matching original
  emojis.slice(0, 6).forEach((emoji, index) => {
    options.push({
      id: `emoji-${index}`,
      emoji,
      backgroundColor: AVATAR_COLORS[(images.length + index) % AVATAR_COLORS.length],
    });
  });

  return options;
};

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * Profile Setup Form - Merged Step 1 & 2
 * Collects:
 * - Phone Number & Location (from old RealIdentityForm)
 * - Display Name & Avatar (from old DisplayIdentityForm)
 * 
 * Removed:
 * - Real Photo field (per requirements)
 * - Anonymous functionality (per requirements)
 */
export const ProfileSetupForm: React.FC<ProfileSetupFormProps> = ({
  initialData,
  userType,
  onNext,
  onBack,
  isLoading = false,
  editMode = false,
}) => {
  // Form state - Real Identity fields
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || '');
  const [location, setLocation] = useState(initialData?.location || '');

  // Form state - Display Identity fields
  const [displayName, setDisplayName] = useState(initialData?.displayName || '');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(
    initialData?.selectedAvatarId || null
  );
  const [customAvatarUri, setCustomAvatarUri] = useState<string | null>(
    initialData?.customAvatarUri || null
  );
  const [isUploading, setIsUploading] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Build avatar options based on user type
  const avatarOptions = buildAvatarOptions(userType);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Handle avatar selection from default options
   */
  const handleSelectAvatar = (id: string) => {
    setSelectedAvatarId(id);
    setCustomAvatarUri(null); // Clear custom avatar when selecting default
    setErrors((prev) => ({ ...prev, avatar: '' }));
  };

  /**
   * Handle custom avatar upload from gallery
   * - Validates file format (jpeg, png, webp)
   * - Validates file size (max 5MB)
   */
  const handlePickCustomAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErrors({ avatar: 'Permission to access gallery is required' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      // Validate file size (max 5MB per requirements)
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        setErrors({ avatar: 'Avatar size must be less than 5MB' });
        return;
      }

      // Validate file format
      const uri = asset.uri.toLowerCase();
      const isValidFormat = uri.endsWith('.jpg') || uri.endsWith('.jpeg') || 
                           uri.endsWith('.png') || uri.endsWith('.webp');
      if (!isValidFormat && asset.mimeType) {
        const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validMimes.includes(asset.mimeType)) {
          setErrors({ avatar: 'Please select a JPG, PNG, or WebP image' });
          return;
        }
      }

      setCustomAvatarUri(asset.uri);
      setSelectedAvatarId(null); // Clear default selection
      setErrors((prev) => ({ ...prev, avatar: '' }));
    }
  };

  /**
   * Validate all form fields
   */
  const validateForm = (): boolean => {
    console.log('[ProfileSetupForm] validateForm START', {
      phoneNumber,
      location,
      displayName,
      selectedAvatarId,
      customAvatarUri: customAvatarUri?.substring(0, 50),
    });
    
    const newErrors: Record<string, string> = {};

    // Validate phone number
    if (!phoneNumber.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(phoneNumber)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Validate location
    if (!location.trim()) {
      newErrors.location = 'Location is required';
    } else if (location.trim().length < 3) {
      newErrors.location = 'Please enter a valid location';
    }

    // Validate display name - UC103_8
    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.length < 2 || displayName.length > 20) {
      newErrors.displayName = 'Display name must be 2-20 characters';
    } else if (!/^[a-zA-Z0-9]+$/.test(displayName)) {
      newErrors.displayName = 'Only letters and numbers allowed';
    }

    // Validate avatar selection - UC103_9
    // Must select either a default avatar OR upload custom avatar
    if (selectedAvatarId === null && !customAvatarUri) {
      newErrors.avatar = 'Please select or upload an avatar';
    }

    console.log('[ProfileSetupForm] validateForm RESULT', {
      hasErrors: Object.keys(newErrors).length > 0,
      errors: newErrors,
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleNext = async () => {
    console.log('[ProfileSetupForm] handleNext called');
    
    const isValid = validateForm();
    console.log('[ProfileSetupForm] Form validation result:', isValid);
    
    if (!isValid) {
      console.log('[ProfileSetupForm] Form validation failed, aborting');
      return;
    }

    setIsUploading(true);
    console.log('[ProfileSetupForm] Calling onNext callback...');
    
    try {
      await onNext({
        phoneNumber,
        location,
        displayName,
        avatarType: customAvatarUri ? 'custom' : 'default',
        selectedAvatarId,
        customAvatarUri,
      });
      console.log('[ProfileSetupForm] onNext callback completed successfully');
    } catch (error) {
      console.error('[ProfileSetupForm] onNext callback failed:', error);
    } finally {
      setIsUploading(false);
      console.log('[ProfileSetupForm] handleNext completed');
    }
  };

  const isSubmitting = isLoading || isUploading;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.safeArea} edges={['top','bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <Header 
          title={editMode ? 'Edit Profile' : 'Profile Setup'} 
          onBack={onBack} 
        />
        {/* Step Indicator - only show when not in edit mode */}
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

          {/* Section 1: Contact Information */}
          <AlertBanner
            type="info"
            message="Contact Info - This information is private and only revealed after official match confirmation."
            icon="🔒"
            style={styles.banner}
          />

          {/* Phone Number Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="+60 12-345 6789"
              placeholderTextColor="#A0A0A0"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              editable={!isSubmitting}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Location Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Location <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.location && styles.inputError]}
              placeholder="e.g. Kuala Lumpur, Malaysia"
              placeholderTextColor="#A0A0A0"
              value={location}
              onChangeText={setLocation}
              autoCapitalize="words"
              editable={!isSubmitting}
            />
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>

          {/* Section 2: Display Identity */}
          <AlertBanner
            type="info"
            message="Display Identity - This is how you'll appear during browsing and pre-match. Be creative!"
            icon="👀"
            style={styles.sectionBanner}
          />

          {/* Display Name Field - UC103_7, UC103_8 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Display Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.displayName && styles.inputError]}
              placeholder="e.g. Faiz"
              placeholderTextColor="#A0A0A0"
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={20}
              editable={!isSubmitting}
            />
            <Text style={styles.hint}>2-20 characters, letters and numbers only</Text>
            {errors.displayName && (
              <Text style={styles.errorText}>{errors.displayName}</Text>
            )}
          </View>

          {/* Avatar Selection - UC103_9, UC103_10 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Choose Your Avatar <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.avatarGrid}>
              {avatarOptions.map((option) => (
                <IconCircle
                  key={option.id}
                  icon={option.source ? undefined : option.emoji}
                  imageSource={option.source}
                  size={72}
                  backgroundColor={option.backgroundColor}
                  contentScale={0.7}
                  selected={selectedAvatarId === option.id}
                  selectionColor="#EB8F80"
                  onPress={() => handleSelectAvatar(option.id)}
                  disabled={isSubmitting}
                />
              ))}
            </View>
          </View>

          {/* Custom Avatar Upload */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Or upload your own avatar</Text>
            <ImageUploader
              imageUri={customAvatarUri}
              onPress={handlePickCustomAvatar}
              placeholder="Tap to select file"
              hint="JPG, PNG, WebP • Max 5MB"
              disabled={isSubmitting}
              height={140}
              previewShape="circle"
              previewSize={100}
              selectedBorderColor="#9DE2D0"
            />
            {errors.avatar && <Text style={styles.errorText}>{errors.avatar}</Text>}
          </View>

          {/* Next Button */}
          <Button
            title={editMode ? 'Save Changes' : 'Next: Interests →'}
            onPress={handleNext}
            variant="primary"
            style={styles.nextButton}
            loading={isSubmitting}
            disabled={isSubmitting}
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
    padding: 24,
    paddingBottom: 40,
  },
  stepIndicator: {
    marginBottom: 24,
  },
  banner: {
    marginBottom: 24,
    backgroundColor: '#C8ADD6',
  },
  sectionBanner: {
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: '#9DE2D0',
  },
  fieldContainer: {
    marginBottom: 24,  // RESTORED: matching original DisplayIdentityForm.tsx
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#EB8F80',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputError: {
    borderColor: '#EB8F80',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  errorText: {
    color: '#EB8F80',
    fontSize: 12,
    marginTop: 4,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  nextButton: {
    marginTop: 24,
  },
});

export default ProfileSetupForm;

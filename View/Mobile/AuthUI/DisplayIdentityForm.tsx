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
  id: string | number;
  source?: ImageSourcePropType;
  emoji?: string;
  backgroundColor?: string;
}

export interface DisplayIdentityData {
  displayName: string;
  avatarType: 'default' | 'custom';
  selectedAvatarIndex: number | null;
  customAvatarUri: string | null;
}

interface DisplayIdentityFormProps {
  /** Initial data (from ViewModel) */
  initialData?: Partial<DisplayIdentityData>;
  /** User type to show appropriate avatars */
  userType: 'youth' | 'elderly';
  /** Callback when form is submitted */
  onNext: (data: DisplayIdentityData) => void;
  /** Callback for back navigation */
  onBack: () => void;
  /** Loading state */
  isLoading?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const TOTAL_STEPS = 4;
const CURRENT_STEP = 3; // Step 2 of 3 profile steps

// Avatar background colors
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

// Youth avatar emojis
const YOUTH_EMOJIS = ['👦', '👧', '🧑', '👩', '🧒', '👨', '👱‍♀️', '👱'];

// Elderly avatar emojis
const ELDERLY_EMOJIS = ['👴', '👵', '🧓', '👨‍🦳', '👩‍🦳', '🧑‍🦳', '👨‍🦲', '👩‍🦲'];

// Build avatar options based on user type
const buildAvatarOptions = (userType: 'youth' | 'elderly'): AvatarOption[] => {
  const images = userType === 'youth' 
    ? [require('@/assets/images/youth1.png'), require('@/assets/images/youth2.png')]
    : [require('@/assets/images/elderly1.png'), require('@/assets/images/elderly2.png')];
  
  const emojis = userType === 'youth' ? YOUTH_EMOJIS : ELDERLY_EMOJIS;
  
  const options: AvatarOption[] = [];
  
  // Add image-based avatars first
  images.forEach((source, index) => {
    options.push({
      id: `img-${index}`,
      source,
      backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
    });
  });
  
  // Add emoji-based avatars
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
 * Display Identity Form (UC103_7, UC103_8, UC103_9, UC103_10)
 * Step 2 of 3: Collects public display information
 * - Display Name
 * - Avatar selection (default or custom upload)
 */
export const DisplayIdentityForm: React.FC<DisplayIdentityFormProps> = ({
  initialData,
  userType,
  onNext,
  onBack,
  isLoading = false,
}) => {
  // Form state
  const [displayName, setDisplayName] = useState(initialData?.displayName || '');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | number | null>(
    initialData?.selectedAvatarIndex !== null && initialData?.selectedAvatarIndex !== undefined
      ? `img-${initialData.selectedAvatarIndex}`
      : null
  );
  const [customAvatarUri, setCustomAvatarUri] = useState<string | null>(
    initialData?.customAvatarUri || null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Build avatar options based on user type
  const avatarOptions = buildAvatarOptions(userType);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectAvatar = (id: string | number) => {
    setSelectedAvatarId(id);
    setCustomAvatarUri(null); // Clear custom avatar when selecting default
    setErrors((prev) => ({ ...prev, avatar: '' }));
  };

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

      // Validate file size (max 10MB)
      if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
        setErrors({ avatar: 'Avatar size must be less than 10MB' });
        return;
      }

      setCustomAvatarUri(asset.uri);
      setSelectedAvatarId(null); // Clear default selection
      setErrors((prev) => ({ ...prev, avatar: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate display name - UC103_8
    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.length < 2 || displayName.length > 20) {
      newErrors.displayName = 'Display name must be 2-20 characters';
    } else if (!/^[a-zA-Z0-9]+$/.test(displayName)) {
      newErrors.displayName = 'Only letters and numbers allowed';
    }

    // Validate avatar selection - UC103_9
    if (selectedAvatarId === null && !customAvatarUri) {
      newErrors.avatar = 'Please select or upload an avatar';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      // Convert selectedAvatarId back to index for backward compatibility
      let avatarIndex: number | null = null;
      if (selectedAvatarId !== null && typeof selectedAvatarId === 'string' && selectedAvatarId.startsWith('img-')) {
        avatarIndex = parseInt(selectedAvatarId.replace('img-', ''), 10);
      }

      onNext({
        displayName,
        avatarType: customAvatarUri ? 'custom' : 'default',
        selectedAvatarIndex: avatarIndex,
        customAvatarUri,
      });
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <Header title="Step 2 of 3" onBack={onBack} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step Indicator */}
          <StepIndicator
            totalSteps={TOTAL_STEPS}
            currentStep={CURRENT_STEP}
            style={styles.stepIndicator}
          />

          {/* Info Banner - M4 */}
          <AlertBanner
            type="info"
            message="Display Identity - This is how you'll appear during browsing and pre-match. Be creative!"
            icon="👀"
            style={styles.banner}
          />

          {/* Display Name Field - UC103_7, UC103_8 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Display Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.displayName && styles.inputError]}
              placeholder="Faiz"
              placeholderTextColor="#A0A0A0"
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={20}
              editable={!isLoading}
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
                  disabled={isLoading}
                />
              ))}
            </View>
          </View>

          {/* Custom Avatar Upload */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Upload your own avatar</Text>
            <ImageUploader
              imageUri={customAvatarUri}
              onPress={handlePickCustomAvatar}
              placeholder="Tap to select file"
              hint="JPG, PNG • Max 10MB"
              disabled={isLoading}
              height={140}
              previewShape="circle"
              previewSize={100}
              selectedBorderColor="#9DE2D0"
            />
            {errors.avatar && <Text style={styles.errorText}>{errors.avatar}</Text>}
          </View>

          {/* Next Button */}
          <Button
            title="Next: Interests →"
            onPress={handleNext}
            variant="primary"
            style={styles.nextButton}
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
    padding: 24,
    paddingBottom: 40,
  },
  stepIndicator: {
    marginBottom: 24,
  },
  banner: {
    marginBottom: 24,
    backgroundColor: '#9DE2D0',
  },
  fieldContainer: {
    marginBottom: 24,
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
  nextButton: {
    marginTop: 8,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
});

export default DisplayIdentityForm;

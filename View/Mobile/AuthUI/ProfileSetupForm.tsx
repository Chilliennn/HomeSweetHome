import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ImageSourcePropType,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { observer } from 'mobx-react-lite';
import {
  Button,
  Header,
  StepIndicator,
  AlertBanner,
  IconCircle,
  ImageUploader,
} from '../components/ui';
import { authViewModel } from '../../../ViewModel/AuthViewModel';

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
  // User's full name (maps to users.full_name in database)
  fullName: string;
  // Avatar selection (preset only - no custom upload here)
  avatarType: 'default' | 'custom';
  selectedAvatarId: string | null;
  // Profile photo upload (goes to users.profile_photo_url)
  profilePhotoUri: string | null;
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

// Malaysia Location Options - States and Federal Territories
const LOCATION_OPTIONS = [
  // States (13)
  { id: 'johor', label: 'Johor' },
  { id: 'kedah', label: 'Kedah' },
  { id: 'kelantan', label: 'Kelantan' },
  { id: 'melaka', label: 'Malacca (Melaka)' },
  { id: 'negeri-sembilan', label: 'Negeri Sembilan' },
  { id: 'pahang', label: 'Pahang' },
  { id: 'penang', label: 'Penang (Pulau Pinang)' },
  { id: 'perak', label: 'Perak' },
  { id: 'perlis', label: 'Perlis' },
  { id: 'sabah', label: 'Sabah' },
  { id: 'sarawak', label: 'Sarawak' },
  { id: 'selangor', label: 'Selangor' },
  { id: 'terengganu', label: 'Terengganu' },
  // Federal Territories (3)
  { id: 'kuala-lumpur', label: 'Kuala Lumpur' },
  { id: 'labuan', label: 'Labuan' },
  { id: 'putrajaya', label: 'Putrajaya' },
];

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
const ProfileSetupFormComponent: React.FC<ProfileSetupFormProps> = ({
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

  // Form state - User's full name
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(
    initialData?.selectedAvatarId || null
  );
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(
    initialData?.profilePhotoUri || null
  );
  const [isUploading, setIsUploading] = useState(false);

  // NOTE: Errors are managed by ViewModel (authViewModel.profileSetupErrors) per MVVM rules

  // Location picker state
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Build avatar options based on user type
  const avatarOptions = buildAvatarOptions(userType);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Handle location selection from picker
   */
  const handleSelectLocation = (locationLabel: string) => {
    setLocation(locationLabel);
    setShowLocationPicker(false);
    authViewModel.clearProfileSetupError('location');
  };

  /**
   * Handle avatar selection from default options
   */
  const handleSelectAvatar = (id: string) => {
    setSelectedAvatarId(id);
    setProfilePhotoUri(null); // Clear profile photo when selecting preset avatar
    authViewModel.clearProfileSetupError('avatar');
  };

  /**
   * Handle profile photo upload from gallery
   * This goes to users.profile_photo_url (real photo, not avatar)
   * - Validates file format (jpeg, png, webp)
   * - Validates file size (max 10MB)
   */
  const handlePickProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      authViewModel.profileSetupErrors = { avatar: 'Permission to access gallery is required' };
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // Square crop for circular display
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      // Validate file size (max 10MB for profile photos)
      if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
        authViewModel.profileSetupErrors = { avatar: 'Photo size must be less than 10MB' };
        return;
      }

      // Validate file format
      const uri = asset.uri.toLowerCase();
      const isValidFormat = uri.endsWith('.jpg') || uri.endsWith('.jpeg') ||
        uri.endsWith('.png') || uri.endsWith('.webp');
      if (!isValidFormat && asset.mimeType) {
        const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validMimes.includes(asset.mimeType)) {
          authViewModel.profileSetupErrors = { avatar: 'Please select a JPG, PNG, or WebP image' };
          return;
        }
      }

      setProfilePhotoUri(asset.uri);
      setSelectedAvatarId(null); // Clear preset avatar selection
      authViewModel.clearProfileSetupError('avatar');
    }
  };

  // Location options for validation
  const locationLabels = LOCATION_OPTIONS.map(opt => opt.label);

  /**
   * Handle form submission
   */
  const handleNext = async () => {
    console.log('[ProfileSetupForm] handleNext called');

    // Use ViewModel validation (MVVM pattern)
    const isValid = authViewModel.validateProfileSetup(
      { phoneNumber, location, fullName },
      locationLabels
    );
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
        fullName,
        avatarType: profilePhotoUri ? 'custom' : 'default',
        selectedAvatarId,
        profilePhotoUri,
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
              style={[styles.input, authViewModel.profileSetupErrors.phone && styles.inputError]}
              placeholder="+60 12-345 6789"
              placeholderTextColor="#A0A0A0"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              editable={!isSubmitting}
            />
            {authViewModel.profileSetupErrors.phone && <Text style={styles.errorText}>{authViewModel.profileSetupErrors.phone}</Text>}
          </View>

          {/* Location Field - Dropdown Selector */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Location <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.input, styles.selectInput, authViewModel.profileSetupErrors.location && styles.inputError]}
              onPress={() => setShowLocationPicker(true)}
              disabled={isSubmitting}
            >
              <Text style={[styles.selectText, !location && styles.placeholderText]}>
                {location || 'Select your state/territory'}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>Select from Malaysian states and federal territories</Text>
            {authViewModel.profileSetupErrors.location && <Text style={styles.errorText}>{authViewModel.profileSetupErrors.location}</Text>}
          </View>

          {/* Section 2: Display Identity */}
          <AlertBanner
            type="info"
            message="Display Identity - This is how you'll appear during browsing and pre-match. Be creative!"
            icon="👀"
            style={styles.sectionBanner}
          />

          {/* Full Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, authViewModel.profileSetupErrors.fullName && styles.inputError]}
              placeholder="e.g. Ahmad Faiz bin Abdullah"
              placeholderTextColor="#A0A0A0"
              value={fullName}
              onChangeText={setFullName}
              maxLength={50}
              editable={!isSubmitting}
            />
            <Text style={styles.hint}>Your full name (2-50 characters)</Text>
            {authViewModel.profileSetupErrors.fullName && (
              <Text style={styles.errorText}>{authViewModel.profileSetupErrors.fullName}</Text>
            )}
          </View>

          {/* Avatar Selection - UC103_9, UC103_10 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Choose Your Avatar (Optional)
            </Text>
            <Text style={styles.hint}>Select a preset avatar for display</Text>
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

          {/* Profile Photo Upload */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Or upload your profile photo</Text>
            <Text style={styles.hint}>Real photo shown to others (priority over avatar)</Text>
            <ImageUploader
              imageUri={profilePhotoUri}
              onPress={handlePickProfilePhoto}
              placeholder="Tap to select photo"
              hint="JPG, PNG, WebP • Max 10MB • Will be displayed as circle"
              disabled={isSubmitting}
              height={160}
              previewShape="circle"
              previewSize={120}
              selectedBorderColor="#9DE2D0"
            />
            {authViewModel.profileSetupErrors.avatar && <Text style={styles.errorText}>{authViewModel.profileSetupErrors.avatar}</Text>}
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

        {/* Location Picker Modal */}
        <Modal
          visible={showLocationPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLocationPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Location</Text>
                <TouchableOpacity
                  onPress={() => setShowLocationPicker(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={LOCATION_OPTIONS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.locationOption,
                      location === item.label && styles.locationOptionSelected,
                    ]}
                    onPress={() => handleSelectLocation(item.label)}
                  >
                    <Text
                      style={[
                        styles.locationOptionText,
                        location === item.label && styles.locationOptionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {location === item.label && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </Modal>
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
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#A0A0A0',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  locationOptionSelected: {
    backgroundColor: '#F0F9F7',
  },
  locationOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  locationOptionTextSelected: {
    fontWeight: '600',
    color: '#9DE2D0',
  },
  checkmark: {
    fontSize: 18,
    color: '#9DE2D0',
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 24,
  },
});

// Wrap with observer for MobX reactivity (MVVM pattern)
export const ProfileSetupForm = observer(ProfileSetupFormComponent);
export default ProfileSetupForm;

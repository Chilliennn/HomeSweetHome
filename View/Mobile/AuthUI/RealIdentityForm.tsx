import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  Button,
  Header,
  StepIndicator,
  AlertBanner,
  ImageUploader,
} from '../components/ui';

// ============================================================================
// TYPES
// ============================================================================
export interface RealIdentityData {
  phoneNumber: string;
  location: string;
  realPhotoUri: string | null;
}

interface RealIdentityFormProps {
  /** Initial data (from ViewModel) */
  initialData?: Partial<RealIdentityData>;
  /** Callback when form is submitted */
  onNext: (data: RealIdentityData) => void;
  /** Callback for back navigation */
  onBack?: () => void;
  /** Loading state */
  isLoading?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const TOTAL_STEPS = 4; // Including age verification
const CURRENT_STEP = 2; // Step 1 of 3 profile steps (after age verification)

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * Real Identity Form (UC103_5, UC103_6)
 * Step 1 of 3: Collects private information for verification
 * - Phone Number
 * - Location
 * - Real Photo upload
 */
export const RealIdentityForm: React.FC<RealIdentityFormProps> = ({
  initialData,
  onNext,
  onBack,
  isLoading = false,
}) => {
  // Form state
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [realPhotoUri, setRealPhotoUri] = useState<string | null>(
    initialData?.realPhotoUri || null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErrors({ photo: 'Permission to access gallery is required' });
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      
      // Validate file size (max 10MB) - UC103_6
      if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
        setErrors({ photo: 'Photo size must be less than 10MB' });
        return;
      }

      setRealPhotoUri(asset.uri);
      setErrors((prev) => ({ ...prev, photo: '' }));
    }
  };

  const validateForm = (): boolean => {
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

    // Validate photo - UC103_5
    if (!realPhotoUri) {
      newErrors.photo = 'Real photo is required for verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext({
        phoneNumber,
        location,
        realPhotoUri,
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
        <Header title="Step 1 of 3" onBack={onBack} />

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

          {/* Info Banner - M3 */}
          <AlertBanner
            type="info"
            message="Real Identity - This information is private and only revealed after official match confirmation."
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
              editable={!isLoading}
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
              editable={!isLoading}
            />
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>

          {/* Real Photo Upload - UC103_5, UC103_6 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Real Photo <Text style={styles.required}>*</Text>
            </Text>
            <ImageUploader
              imageUri={realPhotoUri}
              onPress={handlePickImage}
              placeholder="Tap to select files"
              hint="JPG, PNG • Max 10MB"
              disabled={isLoading}
              height={160}
              previewShape="square"
              selectedBorderColor="#C8ADD6"
              style={errors.photo ? styles.uploadError : undefined}
            />
            {errors.photo && <Text style={styles.errorText}>{errors.photo}</Text>}
          </View>

          {/* Next Button */}
          <Button
            title="Next: Display Identity →"
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
    backgroundColor: '#C8ADD6',
  },
  fieldContainer: {
    marginBottom: 20,
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
  errorText: {
    color: '#EB8F80',
    fontSize: 12,
    marginTop: 4,
  },
  uploadError: {
    borderColor: '#EB8F80',
  },
  nextButton: {
    marginTop: 24,
  },
});

export default RealIdentityForm;

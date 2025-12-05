import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';

// ============================================================================
// TYPES
// ============================================================================
interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  /** Field label */
  label: string;
  /** Whether the field is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper text / character count */
  helperText?: string;
  /** Whether this is a multiline text area */
  multiline?: boolean;
  /** Number of lines for multiline input */
  numberOfLines?: number;
  /** Whether the field is a dropdown/select (displays arrow) */
  isSelect?: boolean;
  /** Callback when select is pressed */
  onSelectPress?: () => void;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom input style */
  inputStyle?: TextStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * FormField - A reusable form input component
 * 
 * Usage:
 * ```tsx
 * <FormField
 *   label="Motivation Letter"
 *   required
 *   multiline
 *   numberOfLines={5}
 *   value={motivation}
 *   onChangeText={setMotivation}
 *   placeholder="I've really enjoyed..."
 *   helperText="156 / 1000 characters (min: 100)"
 * />
 * 
 * <FormField
 *   label="Availability"
 *   required
 *   isSelect
 *   value="Weekday evenings (6-9pm)"
 *   onSelectPress={() => openAvailabilityPicker()}
 * />
 * ```
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helperText,
  multiline = false,
  numberOfLines = 1,
  isSelect = false,
  onSelectPress,
  style,
  inputStyle,
  ...textInputProps
}) => {
  const InputComponent = isSelect ? (
    <TouchableOpacity
      style={[
        styles.input,
        styles.selectInput,
        error && styles.inputError,
      ]}
      onPress={onSelectPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.selectText,
          !textInputProps.value && styles.placeholder,
        ]}
        numberOfLines={1}
      >
        {textInputProps.value || textInputProps.placeholder || 'Select...'}
      </Text>
      <Text style={styles.selectArrow}>▼</Text>
    </TouchableOpacity>
  ) : (
    <TextInput
      style={[
        styles.input,
        multiline && styles.multilineInput,
        multiline && { height: numberOfLines * 24 + 28 },
        error && styles.inputError,
        inputStyle,
      ]}
      placeholderTextColor="#A0A0A0"
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? 'top' : 'center'}
      {...textInputProps}
    />
  );

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      {InputComponent}
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
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
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  multilineInput: {
    paddingTop: 14,
    paddingBottom: 14,
  },
  inputError: {
    borderColor: '#EB8F80',
  },
  selectText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholder: {
    color: '#A0A0A0',
  },
  selectArrow: {
    fontSize: 10,
    color: '#666',
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    textAlign: 'right',
  },
  errorText: {
    color: '#EB8F80',
    fontSize: 12,
    marginTop: 4,
  },
});

export default FormField;

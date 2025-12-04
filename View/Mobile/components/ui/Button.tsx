import React from 'react';
import {
    TouchableOpacity, // tap animation
    Text,
    StyleSheet, // create style objects
    ActivityIndicator, // loading spinner
    ViewStyle,
    TextStyle,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline'

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React. FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const buttonStyles = [
    styles.button,
    styles[variant],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ?  (
        <ActivityIndicator color={variant === 'primary' ? '#FFF' : '#E89B8E'} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  // Variants
  primary: {
    backgroundColor: '#E89B8E',
  },
  secondary: {
    backgroundColor: '#F0F0F0',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E89B8E',
  },
  // Text styles
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#333333',
  },
  outlineText: {
    color: '#E89B8E',
  },
  // Disabled
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});

export default Button;
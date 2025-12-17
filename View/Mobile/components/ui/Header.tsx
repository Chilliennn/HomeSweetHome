import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  /** Optional alias used by some screens; falls back to showBack */
  showBackButton?: boolean;
  onBack?: () => void;
  style?: ViewStyle;
  rightIcon?: string;
  onRightPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = true,
  showBackButton,
  onBack,
  style,
  rightIcon,
  onRightPress,
}) => {
  const router = useRouter();
  const shouldShowBack = showBackButton ?? showBack;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {shouldShowBack ? (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.title}>{title}</Text>
      {rightIcon && onRightPress ? (
        <TouchableOpacity style={styles.rightButton} onPress={onRightPress}>
          <Text style={styles.rightIcon}>{rightIcon}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7ECEC5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#FFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  rightButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7ECEC5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIcon: {
    fontSize: 20,
    color: '#FFF',
  },
});

export default Header;
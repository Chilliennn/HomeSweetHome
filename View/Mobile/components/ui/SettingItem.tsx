import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageSourcePropType } from 'react-native';

interface SettingItemProps {
  icon: ImageSourcePropType;
  iconBackgroundColor: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightContent?: React.ReactNode;
}

/**
 * SettingItem - Reusable component for settings list item
 * 
 * Used for account settings, privacy settings, support items, etc.
 * Follows the design pattern from the settings screen mockup.
 */
export const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  iconBackgroundColor,
  title,
  subtitle,
  onPress,
  showArrow = true,
  rightContent,
}) => {
  const content = (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: iconBackgroundColor }]}>
        <Image source={icon} style={styles.icon} />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {rightContent ? (
        <View style={styles.rightContent}>{rightContent}</View>
      ) : (
        showArrow && <Text style={styles.arrow}>›</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#999999',
  },
  rightContent: {
    marginLeft: 8,
  },
  arrow: {
    fontSize: 24,
    color: '#CCCCCC',
    marginLeft: 8,
  },
});

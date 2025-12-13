import React from 'react';
import { View, Text, Switch, StyleSheet, Image, ImageSourcePropType } from 'react-native';

interface ToggleSettingItemProps {
  icon: ImageSourcePropType;
  iconBackgroundColor: string;
  title: string;
  subtitle?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

/**
 * ToggleSettingItem - Reusable component for settings with toggle switch
 * 
 * Used for notification preferences and other on/off settings.
 * Follows the design pattern from the settings screen mockup.
 */
export const ToggleSettingItem: React.FC<ToggleSettingItemProps> = ({
  icon,
  iconBackgroundColor,
  title,
  subtitle,
  value,
  onToggle,
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: iconBackgroundColor }]}>
        <Image source={icon} style={styles.icon} />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E0E0E0', true: '#9DE2D0' }}
        thumbColor={value ? '#FFFFFF' : '#F4F4F4'}
        ios_backgroundColor="#E0E0E0"
      />
    </View>
  );
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
});

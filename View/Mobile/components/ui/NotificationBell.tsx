import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Image } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================
interface NotificationBellProps {
  /** Number of unread notifications */
  count?: number;
  /** Callback when bell is pressed */
  onPress?: () => void;
  /** Size of the bell container */
  size?: number;
  /** Custom container style */
  style?: ViewStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * NotificationBell - A bell icon with notification badge
 * 
 * Usage:
 * ```tsx
 * <NotificationBell count={3} onPress={() => openNotifications()} />
 * ```
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({
  count = 0,
  onPress,
  size = 48,
  style,
}) => {
  const showBadge = count > 0;
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Image
        source={require('../../assets/images/icon-noti.png')}
        style={[styles.bellIcon, { width: size * 0.5, height: size * 0.5 }]}
        resizeMode="contain"
      />
      
      {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#9DE2D0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellIcon: {
    // Size is set inline based on container size prop
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EB8F80',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFDF5',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default NotificationBell;

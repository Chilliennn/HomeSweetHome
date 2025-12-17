import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { IconCircle } from './IconCircle';

// ============================================================================
// TYPES
// ============================================================================
interface ProfileInfoRowProps {
  /** Icon emoji or character */
  icon: string;
  /** Icon background color */
  iconColor?: string;
  /** Section title/label */
  title: string;
  /** Content text */
  content: string;
  /** Custom container style */
  style?: ViewStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * ProfileInfoRow - A row for displaying profile information with icon
 * 
 * Used in profile detail pages for About Me, Languages, etc.
 * 
 * Usage:
 * ```tsx
 * <ProfileInfoRow
 *   icon="ℹ️"
 *   iconColor="#C8ADD6"
 *   title="About Me"
 *   content="Retired teacher who loves sharing stories."
 * />
 * ```
 */
export const ProfileInfoRow: React.FC<ProfileInfoRowProps> = ({
  icon,
  iconColor = '#C8ADD6',
  title,
  content,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <IconCircle
        icon={icon}
        size={40}
        backgroundColor={iconColor}
        contentScale={0.5}
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.content}>{content}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 13,
    color: '#999',
    marginBottom: 2,
  },
  content: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
});

export default ProfileInfoRow;

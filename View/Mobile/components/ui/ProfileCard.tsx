import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { IconCircle } from './IconCircle';
import { Chip } from './Chip';

// ============================================================================
// TYPES
// ============================================================================
interface ProfileCardProps {
  /** Display name */
  name: string;
  /** Age in years */
  age: number;
  /** Location */
  location: string;
  /** Avatar image source */
  avatarSource?: ImageSourcePropType;
  /** Avatar emoji fallback */
  avatarEmoji?: string;
  /** Avatar background color */
  avatarColor?: string;
  /** Interest tags to display (max 2-3 recommended) */
  interests?: Array<{ label: string; color?: string }>;
  /** Callback when card is pressed */
  onPress?: () => void;
  /** Custom container style */
  style?: ViewStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * ProfileCard - A card for displaying user profile in a list
 * 
 * Usage:
 * ```tsx
 * <ProfileCard
 *   name="Ah Ma Mei"
 *   age={68}
 *   location="Penang"
 *   avatarEmoji="👵"
 *   avatarColor="#C8ADD6"
 *   interests={[
 *     { label: 'Cooking', color: '#9DE2D0' },
 *     { label: 'Gardening', color: '#D4E5AE' },
 *   ]}
 *   onPress={() => viewProfile()}
 * />
 * ```
 */
export const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  age,
  location,
  avatarSource,
  avatarEmoji,
  avatarColor = '#C8ADD6',
  interests = [],
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Avatar */}
      <IconCircle
        icon={avatarSource ? undefined : avatarEmoji}
        imageSource={avatarSource}
        size={64}
        backgroundColor={avatarColor}
        contentScale={0.65}
      />

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.details}>
          {age} years • {location}
        </Text>
        
        {/* Interest Tags */}
        {interests.length > 0 && (
          <View style={styles.tagsContainer}>
            {interests.slice(0, 3).map((interest, index) => (
              <Chip
                key={index}
                label={interest.label}
                color={interest.color || '#9DE2D0'}
                size="small"
              />
            ))}
          </View>
        )}
      </View>

      {/* Arrow */}
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  details: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  arrow: {
    fontSize: 28,
    color: '#999',
    marginLeft: 8,
  },
});

export default ProfileCard;

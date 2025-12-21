import { ImageSourcePropType } from 'react-native';
import type { UserProfileData } from '@home-sweet-home/model';

/**
 * Avatar display configuration for rendering in IconCircle
 */
export interface AvatarDisplayConfig {
  /** Emoji icon (if using default emoji avatar) */
  icon?: string;
  /** Image source (local require or remote URI for custom avatar) */
  imageSource?: ImageSourcePropType;
  /** Background color for the avatar circle */
  backgroundColor: string;
}

// Avatar background colors (matching ProfileSetupForm.tsx)
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

// Youth avatar emojis (matching ProfileSetupForm.tsx)
const YOUTH_EMOJIS = ['👦', '👧', '🧑', '👩', '🧒', '👨', '👱‍♀️', '👱'];

// Elderly avatar emojis (matching ProfileSetupForm.tsx)
const ELDERLY_EMOJIS = ['👴', '👵', '🧓', '👨‍🦳', '👩‍🦳', '🧑‍🦳', '👨‍🦲', '👩‍🦲'];

// Image avatar sources (local requires)
const YOUTH_IMAGES = [
  require('@/assets/images/youth1.png'),
  require('@/assets/images/youth2.png'),
];

const ELDERLY_IMAGES = [
  require('@/assets/images/elderly1.png'),
  require('@/assets/images/elderly2.png'),
];

/**
 * Get avatar display configuration from user profile data
 * 
 * @param profileData - The user's profile_data from database
 * @param userType - 'youth' or 'elderly' (for fallback defaults)
 * @returns Avatar display configuration for IconCircle component
 * 
 * Usage:
 * ```tsx
 * const avatarConfig = getAvatarDisplay(user.profile_data, 'elderly');
 * 
 * <IconCircle
 *   icon={avatarConfig.icon}
 *   imageSource={avatarConfig.imageSource}
 *   backgroundColor={avatarConfig.backgroundColor}
 *   size={64}
 * />
 * ```
 */
export function getAvatarDisplay(
  profileData: UserProfileData | null | undefined,
  userType: 'youth' | 'elderly'
): AvatarDisplayConfig {
  // Default fallback
  const defaultConfig: AvatarDisplayConfig = {
    icon: userType === 'youth' ? '👦' : '👵',
    backgroundColor: userType === 'youth' ? '#9DE2D0' : '#C8ADD6',
  };

  if (!profileData) {
    return defaultConfig;
  }

  const avatarMeta = profileData.avatar_meta;
  // FIXED: Removed avatar_url - use profile_photo_url from users table instead

  // FIXED: Only support preset avatars, not custom avatars

  // Case: Default avatar (selected from options)
  if (avatarMeta?.type === 'default' && avatarMeta.selected_avatar_index !== null && avatarMeta.selected_avatar_index !== undefined) {
    const index = avatarMeta.selected_avatar_index;
    const images = userType === 'youth' ? YOUTH_IMAGES : ELDERLY_IMAGES;
    const emojis = userType === 'youth' ? YOUTH_EMOJIS : ELDERLY_EMOJIS;

    // Image avatars (index 0-1)
    if (index >= 0 && index < images.length) {
      return {
        imageSource: images[index],
        backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
      };
    }

    // Emoji avatars (index 2+, so emoji index = index - 2)
    const emojiIndex = index - images.length;
    if (emojiIndex >= 0 && emojiIndex < emojis.length) {
      return {
        icon: emojis[emojiIndex],
        backgroundColor: AVATAR_COLORS[(index) % AVATAR_COLORS.length],
      };
    }
  }

  // Fallback to default
  return defaultConfig;
}

/**
 * React hook version for components
 */
export function useAvatarDisplay(
  profileData: UserProfileData | null | undefined,
  userType: 'youth' | 'elderly'
): AvatarDisplayConfig {
  return getAvatarDisplay(profileData, userType);
}

export default useAvatarDisplay;

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle, Image, ImageSourcePropType } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================
export interface TabItem {
  /** Unique key for the tab */
  key: string;
  /** Icon emoji or character */
  iconActive: ImageSourcePropType;
  iconInactive: ImageSourcePropType;
  /** Optional label (not shown in current design) */
  label?: string;
}

interface BottomTabBarProps {
  /** Array of tab items */
  tabs: TabItem[];
  /** Currently active tab key */
  activeTab: string;
  /** Callback when a tab is pressed */
  onTabPress: (key: string) => void;
  /** Color for active tab */
  activeColor?: string;
  /** Color for inactive tabs */
  inactiveColor?: string;
  /** Array of tab keys that should be disabled */
  disabledTabs?: string[];
  /** Custom container style */
  style?: ViewStyle;
}

// ============================================================================
// DEFAULT TABS
// ============================================================================
export const DEFAULT_TABS: TabItem[] = [
  {
    key: 'matching',
    iconActive: require('../../assets/images/nav-home-active.png'),
    iconInactive: require('../../assets/images/nav-home.png'),
    label: 'Matching'
  },
  {
    key: 'diary',
    iconActive: require('../../assets/images/nav-diary-active.png'),
    iconInactive: require('../../assets/images/nav-diary.png'),
    label: 'diary'
  },
  { key: 'memory',
    iconActive: require('../../assets/images/nav-memory-active.png'), 
    iconInactive: require('../../assets/images/nav-memory.png'),
    label: 'memory'
  },
  { key: 'chat',
    iconActive: require('../../assets/images/nav-chat-active.png'), 
    iconInactive: require('../../assets/images/nav-chat.png'),
    label: 'chat'
  },
  { key: 'settings',
    iconActive: require('../../assets/images/nav-settings-active.png'), 
    iconInactive: require('../../assets/images/nav-settings.png'),
    label: 'settings'
  },
];

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * BottomTabBar - Navigation bar at the bottom of the screen
 * 
 * Usage:
 * ```tsx
 * <BottomTabBar
 *   tabs={DEFAULT_TABS}
 *   activeTab="matching"
 *   onTabPress={(key) => navigate(key)}
 *   disabledTabs={['journey', 'gallery']}
 * />
 * ```
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
  activeColor = '#EB8F80',
  inactiveColor = '#999999',
  disabledTabs = [],
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.tabsWrapper}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const isDisabled = disabledTabs.includes(tab.key);

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isActive && { backgroundColor: activeColor },
                isDisabled && styles.disabledTab,
              ]}
              onPress={() => !isDisabled && onTabPress(tab.key)}
              activeOpacity={isDisabled ? 1 : 0.7}
              disabled={isDisabled}
            >
              <Image
                source={isActive ? tab.iconActive : tab.iconInactive}
                style={[styles.iconImage, isDisabled && styles.disabledIcon]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  iconImage: {
    width: 24,
    height: 24,
  },
  disabledIcon: {
    opacity: 0.4,
  },
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  tabsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',

  },
  tab: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  activeTab: {
    // backgroundColor set dynamically
  },
  disabledTab: {
    opacity: 0.4,
  },
  icon: {
    fontSize: 24,
  },
});

export default BottomTabBar;

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================
export interface TabItem {
  /** Unique key for the tab */
  key: string;
  /** Icon emoji or character */
  icon: string;
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
  /** Custom container style */
  style?: ViewStyle;
}

// ============================================================================
// DEFAULT TABS
// ============================================================================
export const DEFAULT_TABS: TabItem[] = [
  { key: 'matching', icon: '👥', label: 'Matching' },
  { key: 'journey', icon: '📖', label: 'Journey' },
  { key: 'gallery', icon: '🖼️', label: 'Gallery' },
  { key: 'chat', icon: '💬', label: 'Chat' },
  { key: 'settings', icon: '⚙️', label: 'Settings' },
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
 * />
 * ```
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
  activeColor = '#EB8F80',
  inactiveColor = '#999999',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.tabsWrapper}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isActive && [styles.activeTab, { backgroundColor: activeColor }],
              ]}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.icon,
                  { color: isActive ? '#FFFFFF' : inactiveColor },
                ]}
              >
                {tab.icon}
              </Text>
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
  container: {
    backgroundColor: '#F5F5F0',
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
  },
  activeTab: {
    // backgroundColor set dynamically
  },
  icon: {
    fontSize: 24,
  },
});

export default BottomTabBar;

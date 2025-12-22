import { useRouter, useLocalSearchParams } from 'expo-router';

/**
 * Custom hook for bottom tab navigation
 * 
 * Handles navigation between main app tabs with proper params
 * Can be reused across all screens that have BottomTabBar
 * 
 * @param currentTab - The current active tab
 * @returns Object with handleTabPress function
 */
export const useTabNavigation = (currentTab: string) => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const userId = params.userId as string | undefined;
  const userName = params.userName as string | undefined;
  const userType = params.userType as 'youth' | 'elderly' | undefined;

  const handleTabPress = (tabKey: string) => {
    // Don't navigate if already on this tab
    if (tabKey === currentTab) return;
    
    // Route mapping - matching route handles both youth and elderly via userType param
    const routeMap: Record<string, string> = {
      matching: '/(main)/matching',
      diary: '/(main)/diary',
      memory: '/(main)/album',
      chat: '/(main)/chat',
      settings: '/(main)/settings',
    };

    if (routeMap[tabKey]) {
      router.push({
        pathname: routeMap[tabKey] as any,
        params: { userId, userName, userType },
      });
    }
  };

  return { handleTabPress, userId, userName, userType };
};
/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

const Palette = {
  primary: '#E89B8E', // Warm Pink
  secondary: '#9DE2D0', // Mint Green
  tertiary: '#D4E5AE', // Light Green
  error: '#EB8F80', // Red/Orange
  warning: '#FADE9F', // Yellow
  success: '#9DE2D0',
  text: '#333333',
  textLight: '#666666',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  border: '#F0F0F0',
};

export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.background,
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: Palette.primary,
    secondary: Palette.secondary,
    tertiary: Palette.tertiary,
    error: Palette.error,
    warning: Palette.warning,
    success: Palette.success,
    border: Palette.border,
    surface: Palette.surface,
    textLight: Palette.textLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: Palette.primary, // Keeping same for now, should be adjusted for dark mode
    secondary: Palette.secondary,
    tertiary: Palette.tertiary,
    error: Palette.error,
    warning: Palette.warning,
    success: Palette.success,
    border: '#333333',
    surface: '#2C2C2E',
    textLight: '#A1A1A1',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { DefaultTheme, Theme } from '@react-navigation/native';
import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const AppTheme = {
  colors: {
    background: '#F5F7FA',
    surface: '#FFFFFF',
    primary: '#C9A84C',
    primaryMuted: '#FFF8E7',
    text: '#1A1A2E',
    textMuted: '#8E8E93',
    divider: '#E8E8E8',
    queueBg: '#1B1F3B',
    success: '#34C759',
    danger: '#FF3B30',
    warning: '#FF9500',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
} as const;

export const NavigationTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: AppTheme.colors.primary,
    background: AppTheme.colors.background,
    card: AppTheme.colors.surface,
    text: AppTheme.colors.text,
    border: AppTheme.colors.divider,
    notification: AppTheme.colors.primary,
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      ...DefaultTheme.fonts.regular,
      fontFamily: 'System',
    },
    medium: {
      ...DefaultTheme.fonts.medium,
      fontFamily: 'System',
    },
    bold: {
      ...DefaultTheme.fonts.bold,
      fontFamily: 'System',
    },
    heavy: {
      ...DefaultTheme.fonts.heavy,
      fontFamily: 'System',
    },
  },
};

export const NavigationDarkTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: AppTheme.colors.primary,
    background: '#12131A',
    card: '#1B1D28',
    text: '#ECEDEE',
    border: '#2B2F3A',
    notification: AppTheme.colors.primary,
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      ...DefaultTheme.fonts.regular,
      fontFamily: 'System',
    },
    medium: {
      ...DefaultTheme.fonts.medium,
      fontFamily: 'System',
    },
    bold: {
      ...DefaultTheme.fonts.bold,
      fontFamily: 'System',
    },
    heavy: {
      ...DefaultTheme.fonts.heavy,
      fontFamily: 'System',
    },
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

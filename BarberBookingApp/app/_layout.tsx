import { ThemeProvider } from '@react-navigation/native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import 'react-native-reanimated';

import SplashScreen from '@/components/SplashScreen';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import { NavigationDarkTheme, NavigationTheme } from '@/constants/theme';
import '@/src/i18n';

void ExpoSplashScreen.preventAutoHideAsync().catch(() => {
  // Expo Go/dev runtime can fail to activate keep-awake in some Android setups.
  // We intentionally ignore this to avoid an uncaught startup promise rejection.
});

export const unstable_settings = {
  anchor: '(auth)',
};

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
    void ExpoSplashScreen.hideAsync().catch(() => {
      // Ignore hide errors if splash screen state is already managed by runtime.
    });
  }, []);

  if (!splashDone) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <SettingsProvider>
      <AppLayout />
    </SettingsProvider>
  );
}

function AppLayout() {
  const { t } = useTranslation();
  const { darkMode } = useSettings();

  return (
    <AuthProvider>
      <ThemeProvider value={(darkMode ? NavigationDarkTheme : NavigationTheme) as any}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(permissions)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(barber)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: t('common.modal') }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}

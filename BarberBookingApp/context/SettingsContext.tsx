import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { clientApi } from '@/services/client.api';

const SETTINGS_FILE = `${FileSystem.documentDirectory ?? ''}quickcut.settings.v1.json`;
const isExpoGo = (Constants as any)?.appOwnership === 'expo';

type StoredSettings = {
  darkMode: boolean;
  notificationsEnabled: boolean;
  permissionFlowSeen: boolean;
};

interface SettingsContextType {
  darkMode: boolean;
  notificationsEnabled: boolean;
  permissionFlowSeen: boolean;
  initialized: boolean;
  setDarkMode: (value: boolean) => Promise<void>;
  setNotificationsEnabled: (value: boolean) => Promise<boolean>;
  setPermissionFlowSeen: (value: boolean) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  darkMode: false,
  notificationsEnabled: false,
  permissionFlowSeen: false,
  initialized: false,
  setDarkMode: async () => {},
  setNotificationsEnabled: async () => false,
  setPermissionFlowSeen: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkModeState] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [permissionFlowSeen, setPermissionFlowSeenState] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

  const persist = useCallback(async (next: StoredSettings) => {
    try {
      if (!FileSystem.documentDirectory) return;
      await FileSystem.writeAsStringAsync(SETTINGS_FILE, JSON.stringify(next));
    } catch {
      // Ignore write failures and keep runtime state.
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!FileSystem.documentDirectory) return;
        const info = await FileSystem.getInfoAsync(SETTINGS_FILE);
        if (!info.exists) return;
        const raw = await FileSystem.readAsStringAsync(SETTINGS_FILE);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<StoredSettings>;
        if (!mounted) return;
        setDarkModeState(Boolean(parsed.darkMode));
        setNotificationsEnabledState(Boolean(parsed.notificationsEnabled));
        setPermissionFlowSeenState(Boolean(parsed.permissionFlowSeen));
      } catch {
        // Ignore storage read failures and continue with defaults.
      } finally {
        if (mounted) setInitialized(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const setDarkMode = useCallback(
    async (value: boolean) => {
      setDarkModeState(value);
      await persist({ darkMode: value, notificationsEnabled, permissionFlowSeen });
    },
    [notificationsEnabled, permissionFlowSeen, persist],
  );

  const setNotificationsEnabled = useCallback(
    async (value: boolean) => {
      if (value) {
        if (isExpoGo) {
          return false;
        }

        try {
          const Notifications = await import('expo-notifications');
          const permission = await Notifications.requestPermissionsAsync();
          if (!permission.granted) {
            return false;
          }

          const projectId =
            (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
            (Constants as any)?.easConfig?.projectId;
          const tokenResponse = await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined,
          );

          if (!tokenResponse?.data) {
            return false;
          }

          await clientApi.registerDeviceToken(tokenResponse.data);
          setPushToken(tokenResponse.data);
        } catch {
          return false;
        }
      } else if (pushToken) {
        await clientApi.deregisterDeviceToken(pushToken).catch(() => undefined);
        setPushToken(null);
      }

      setNotificationsEnabledState(value);
      await persist({ darkMode, notificationsEnabled: value, permissionFlowSeen });
      return true;
    },
    [darkMode, permissionFlowSeen, persist, pushToken],
  );

  const setPermissionFlowSeen = useCallback(
    async (value: boolean) => {
      setPermissionFlowSeenState(value);
      await persist({ darkMode, notificationsEnabled, permissionFlowSeen: value });
    },
    [darkMode, notificationsEnabled, persist],
  );

  const contextValue = useMemo(
    () => ({
      darkMode,
      notificationsEnabled,
      permissionFlowSeen,
      initialized,
      setDarkMode,
      setNotificationsEnabled,
      setPermissionFlowSeen,
    }),
    [
      darkMode,
      initialized,
      notificationsEnabled,
      permissionFlowSeen,
      setDarkMode,
      setNotificationsEnabled,
      setPermissionFlowSeen,
    ],
  );

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}

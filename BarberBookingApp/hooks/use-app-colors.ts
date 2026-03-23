import { AppTheme } from '@/constants/theme';
import { useSettings } from '@/context/SettingsContext';

export function useAppColors() {
  const { darkMode } = useSettings();

  const colors = darkMode
    ? {
        background: '#12131A',
        surface: '#1B1D28',
        primary: AppTheme.colors.primary,
        primaryMuted: '#26212D',
        text: '#ECEDEE',
        textMuted: '#A7AFBD',
        divider: '#2B2F3A',
        queueBg: '#141725',
        success: AppTheme.colors.success,
        danger: AppTheme.colors.danger,
        warning: AppTheme.colors.warning,
      }
    : AppTheme.colors;

  return { darkMode, colors };
}

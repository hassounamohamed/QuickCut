import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '@/constants/theme';
import { useAppColors } from '@/hooks/use-app-colors';

const { colors } = AppTheme;

type Role = 'user' | 'barber';

export default function PermissionWelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { darkMode, colors } = useAppColors();
  const params = useLocalSearchParams<{ role?: string }>();
  const role: Role = params.role === 'barber' ? 'barber' : 'user';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <View style={[styles.bgCircleA, { backgroundColor: darkMode ? '#2D2536' : '#FDEFD3' }]} />
      <View style={[styles.bgCircleB, { backgroundColor: darkMode ? '#232938' : '#E9EEF9' }]} />

      <View style={styles.content}>
        <View style={styles.illustrationWrap}>
          <View style={[styles.illustrationCore, { backgroundColor: colors.surface, borderColor: colors.divider }]}> 
            <Ionicons name="cut" size={52} color={colors.primary} />
          </View>
          <View style={[styles.floatBadge, styles.floatBadgeLeft, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Ionicons name="image-outline" size={20} color={colors.primary} />
          </View>
          <View style={[styles.floatBadge, styles.floatBadgeRight, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
          </View>
          <View style={[styles.floatBadge, styles.floatBadgeBottom, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{t('permissions.welcomeTitle')} 👋</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {t('permissions.welcomeSubtitle')}
        </Text>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary }, pressed && styles.pressed]}
          onPress={() => router.push(`/(permissions)/photo?role=${role}` as any)}
        >
          <Text style={styles.primaryBtnText}>{t('common.continue')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, overflow: 'hidden' },
  bgCircleA: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#FDEFD3',
    top: -80,
    right: -40,
  },
  bgCircleB: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#E9EEF9',
    bottom: -60,
    left: -30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  illustrationCore: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 5,
  },
  floatBadge: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3E4BE',
  },
  floatBadgeLeft: { left: 30, top: 18 },
  floatBadgeRight: { right: 30, top: 32 },
  floatBadgeBottom: { bottom: -8 },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5A6270',
    textAlign: 'center',
    marginBottom: 34,
    paddingHorizontal: 8,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#9B7B2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ translateY: 1 }],
  },
});

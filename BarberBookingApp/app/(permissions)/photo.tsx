import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '@/constants/theme';
import { useAppColors } from '@/hooks/use-app-colors';

const { colors } = AppTheme;

type Role = 'user' | 'barber';

export default function PhotoPermissionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useAppColors();
  const params = useLocalSearchParams<{ role?: string }>();
  const role: Role = params.role === 'barber' ? 'barber' : 'user';

  const goNext = () => {
    router.push(`/(permissions)/location?role=${role}` as any);
  };

  const handleAllow = async () => {
    try {
      const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!result.granted && result.canAskAgain === false) {
        Alert.alert(t('permissions.permissionBlockedTitle'), t('permissions.photoPermissionBlockedMessage'));
      }
      goNext();
    } catch {
      goNext();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <View style={styles.container}>
        <View style={[styles.iconWrap, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
          <Ionicons name="images-outline" size={56} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{t('permissions.photoTitle')}</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          {t('permissions.photoDescription')}
        </Text>

        <Pressable style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary }, pressed && styles.pressed]} onPress={handleAllow}>
          <Text style={styles.primaryBtnText}>{t('permissions.allowAccess')}</Text>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.ghostBtn, { backgroundColor: colors.surface, borderColor: colors.divider }, pressed && styles.pressed]} onPress={goNext}>
          <Text style={[styles.ghostBtnText, { color: colors.textMuted }]}>{t('common.skip')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 26,
    borderWidth: 1,
    borderColor: '#F3E4BE',
  },
  title: {
    fontSize: 29,
    fontWeight: '800',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5A6270',
    textAlign: 'center',
    marginBottom: 34,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ghostBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E8EF',
  },
  ghostBtnText: { color: '#606A7A', fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.92 },
});

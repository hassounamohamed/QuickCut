import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '@/constants/theme';
import { useSettings } from '@/context/SettingsContext';
import { useAppColors } from '@/hooks/use-app-colors';

const { colors } = AppTheme;

type Role = 'user' | 'barber';

export default function PermissionSuccessScreen() {
  const router = useRouter();
  const { colors } = useAppColors();
  const { setPermissionFlowSeen } = useSettings();
  const params = useLocalSearchParams<{ role?: string }>();
  const role: Role = params.role === 'barber' ? 'barber' : 'user';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <View style={styles.container}>
        <View style={[styles.checkWrap, { backgroundColor: colors.primaryMuted, borderColor: colors.divider }]}> 
          <Ionicons name="checkmark-circle" size={82} color="#2DBE74" />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{"You're all set ✅"}</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>Enjoy booking your next haircut easily.</Text>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary }, pressed && styles.pressed]}
          onPress={async () => {
            await setPermissionFlowSeen(true);
            router.replace(role === 'barber' ? '/(barber)/dashboard' : '/(tabs)/home');
          }}
        >
          <Text style={styles.primaryBtnText}>Go to Home</Text>
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
  checkWrap: {
    alignSelf: 'center',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#ECFFF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#CFF5DE',
  },
  title: {
    fontSize: 30,
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
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  pressed: {
    opacity: 0.92,
  },
});

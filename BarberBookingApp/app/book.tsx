import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTheme } from '@/constants/theme';

const { colors } = AppTheme;

export default function BookRedirectScreen() {
  const router = useRouter();
  const { barber_id } = useLocalSearchParams<{ barber_id?: string }>();

  useEffect(() => {
    // Redirect into client flow; keep barber_id in params for future booking prefill.
    router.replace({
      pathname: '/(tabs)/search',
      params: barber_id ? { barber_id } : undefined,
    });
  }, [barber_id, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Opening booking...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});

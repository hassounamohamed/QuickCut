import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClientUi } from '@/constants/client-ui';
import { useAppColors } from '@/hooks/use-app-colors';
import type { FavoriteBarber, FavoriteSlotGroup } from '@/services/client.api';
import { clientApi } from '@/services/client.api';

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useAppColors();

  const [items, setItems] = useState<FavoriteBarber[]>([]);
  const [slotGroups, setSlotGroups] = useState<FavoriteSlotGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [result, slots] = await Promise.all([
      clientApi.listFavorites(),
      clientApi.listFavoriteSlots().catch(() => []),
    ]);
    setItems(result);
    setSlotGroups(slots);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadData();
      } finally {
        setLoading(false);
      }
    })();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const onRemove = async (barberId: number) => {
    try {
      await clientApi.unfavoriteBarber(barberId);
      await loadData();
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : 'Could not remove favorite';
      Alert.alert('Error', message);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
       

        <Text style={[styles.pageTitle, { color: colors.text }]}>Favorites</Text>

        {slotGroups.length ? (
          <View
            style={[
              styles.slotsCard,
              { backgroundColor: colors.surface, borderColor: colors.divider },
            ]}
          >
            <Text style={[styles.slotsTitle, { color: colors.text }]}>Availability Snapshot</Text>
            {slotGroups.slice(0, 3).map((item, idx) => (
              <View key={`${item.barber_id}-${idx}`} style={styles.slotLine}>
                <Text style={[styles.slotShop, { color: colors.text }]}>{item.shop_name}</Text>
                <Text style={[styles.slotMeta, { color: colors.textMuted }]}>
                  {Array.isArray(item.slots) ? item.slots.length : 0} slots
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : items.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Text style={[styles.empty, { color: colors.textMuted }]}>No favorite barbers yet.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item, index) => {
              const barber = item.barber;
              return (
                <View
                  key={`${item.id ?? 'favorite'}-${item.barber_id}-${index}`}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}
                >
                  <Text style={[styles.name, { color: colors.text }]}>
                    {barber?.shop_name?.trim() || 'Unnamed Barber'}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textMuted }]}>
                    {barber?.address || 'No address'}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textMuted }]}>
                    Rating {Number(barber?.rating ?? 0).toFixed(1)}
                  </Text>

                  <View style={styles.actions}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)/search',
                          params: { barber_id: String(item.barber_id) },
                        })
                      }
                      style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                    >
                      <Text style={styles.primaryBtnText}>Book</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => onRemove(item.barber_id)}
                      style={[styles.outlineBtn, { borderColor: colors.danger }]}
                    >
                      <Text style={[styles.outlineBtnText, { color: colors.danger }]}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 12, paddingBottom: 28 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  greeting: { fontSize: 15, fontWeight: '700' },
  roleLabel: { fontSize: 12 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...ClientUi.shadow.card,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 2,
  },
  slotsCard: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.card,
    padding: ClientUi.spacing.card,
    gap: 8,
    ...ClientUi.shadow.card,
  },
  slotsTitle: { fontSize: 14, fontWeight: '800' },
  slotLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slotShop: { fontSize: 13, fontWeight: '700' },
  slotMeta: { fontSize: 12 },
  empty: { fontSize: 15, fontWeight: '700' },
  emptyCard: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.card,
    minHeight: 92,
    justifyContent: 'center',
    alignItems: 'center',
    ...ClientUi.shadow.card,
  },
  list: { gap: 10 },
  card: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.tile,
    padding: ClientUi.spacing.card,
    gap: 4,
    ...ClientUi.shadow.card,
  },
  name: { fontSize: 15, fontWeight: '800' },
  meta: { fontSize: 12 },
  actions: { marginTop: 8, flexDirection: 'row', gap: 8 },
  primaryBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  outlineBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  outlineBtnText: { fontSize: 12, fontWeight: '700' },
});

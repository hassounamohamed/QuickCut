import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClientUi } from '@/constants/client-ui';
import { useAppColors } from '@/hooks/use-app-colors';
import type { BarberCard, TimeSlot } from '@/services/client.api';
import { clientApi } from '@/services/client.api';

function toIsoDate(value: Date) {
  const yyyy = value.getFullYear();
  const mm = `${value.getMonth() + 1}`.padStart(2, '0');
  const dd = `${value.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toMinutes(value: string) {
  const [h, m] = value.split(':').map((item) => Number(item));
  return h * 60 + (m || 0);
}

function toHHmm(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildSlots(daySlots: TimeSlot[]) {
  const values = new Set<string>();
  for (const slot of daySlots) {
    const start = toMinutes(slot.start_time);
    const end = toMinutes(slot.end_time);
    for (let cursor = start; cursor < end; cursor += 30) {
      values.add(toHHmm(cursor));
    }
  }
  return Array.from(values).sort((a, b) => toMinutes(a) - toMinutes(b));
}

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useAppColors();
  const { barber_id } = useLocalSearchParams<{ barber_id?: string }>();

  const [barbers, setBarbers] = useState<BarberCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [favoriteBusyIds, setFavoriteBusyIds] = useState<Set<number>>(new Set());
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toIsoDate(new Date()));

  const selectedBarber = useMemo(
    () => barbers.find((barber) => barber.id === selectedBarberId) ?? null,
    [barbers, selectedBarberId],
  );

  const filteredBarbers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return barbers;
    return barbers.filter((item) => {
      const shop = item.shop_name?.toLowerCase() || '';
      const address = item.address?.toLowerCase() || '';
      return shop.includes(q) || address.includes(q);
    });
  }, [barbers, query]);

  const loadBarbers = useCallback(async () => {
    const result = await clientApi.listBarbers();
    setBarbers(result);
  }, []);

  const loadFavorites = useCallback(async () => {
    const result = await clientApi.listFavorites();
    setFavoriteIds(new Set(result.map((item) => item.barber_id)));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadBarbers(), loadFavorites()]);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadBarbers, loadFavorites]);

  useEffect(() => {
    if (!barbers.length || !barber_id) return;
    const id = Number(barber_id);
    if (Number.isNaN(id)) return;
    if (barbers.some((item) => item.id === id)) {
      setSelectedBarberId(id);
    }
  }, [barber_id, barbers]);

  useEffect(() => {
    if (!selectedBarberId) {
      setAvailability([]);
      return;
    }

    (async () => {
      try {
        setSlotsLoading(true);
        const result = await clientApi.getBarberAvailability(selectedBarberId);
        setAvailability(result);
      } catch {
        setAvailability([]);
      } finally {
        setSlotsLoading(false);
      }
    })();
  }, [selectedBarberId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadBarbers(), loadFavorites()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadBarbers, loadFavorites]);

  const toggleFavorite = async (barberId: number) => {
    if (favoriteBusyIds.has(barberId)) return;

    const isFavorite = favoriteIds.has(barberId);
    setFavoriteBusyIds((prev) => new Set(prev).add(barberId));

    try {
      if (isFavorite) {
        await clientApi.unfavoriteBarber(barberId);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(barberId);
          return next;
        });
      } else {
        await clientApi.favoriteBarber(barberId);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.add(barberId);
          return next;
        });
      }
    } catch {
      Alert.alert('Favorites', 'Could not update favorites right now.');
    } finally {
      setFavoriteBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(barberId);
        return next;
      });
    }
  };

  const slotsForDate = useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00`);
    const day = date.getDay();
    const daySlots = availability.filter((item) => item.day_of_week === day);
    return buildSlots(daySlots);
  }, [availability, selectedDate]);

  const onBook = async (slot: string) => {
    if (!selectedBarberId) return;
    try {
      setBooking(true);
      await clientApi.createBooking({
        barber_id: selectedBarberId,
        booking_date: selectedDate,
        booking_time: `${slot}:00`,
      });
      Alert.alert('Booked', 'Your reservation was created successfully.', [
        { text: 'OK', onPress: () => router.push('/(tabs)/appointments') },
      ]);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : 'Could not create reservation';
      Alert.alert('Booking Failed', message);
    } finally {
      setBooking(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}> 
              <Text style={[styles.avatarText, { color: colors.primary }]}>S</Text>
            </View>
            <View>
              <Text style={[styles.greeting, { color: colors.text }]}>Hello 👋</Text>
              <Text style={[styles.roleLabel, { color: colors.textMuted }]}>Find your next barber</Text>
            </View>
          </View>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            onPress={() => router.push('/(tabs)/notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
          </Pressable>
        </View>

        <Text style={[styles.pageTitle, { color: colors.text }]}>Search</Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by shop or address"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text, borderColor: colors.divider, backgroundColor: colors.surface }]}
        />

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : filteredBarbers.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No barber matches this search</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredBarbers.map((item) => {
              const selected = item.id === selectedBarberId;
              const isFavorite = favoriteIds.has(item.id);
              const isBusy = favoriteBusyIds.has(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedBarberId(item.id)}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: selected ? colors.primary : colors.divider,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{item.shop_name || `Barber #${item.id}`}</Text>
                    <Pressable
                      onPress={() => toggleFavorite(item.id)}
                      disabled={isBusy}
                      style={[
                        styles.favoriteChip,
                        {
                          borderColor: isFavorite ? colors.primary : colors.divider,
                          backgroundColor: isFavorite ? colors.primaryMuted : colors.background,
                          opacity: isBusy ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.favoriteChipText, { color: isFavorite ? colors.primary : colors.textMuted }]}>
                        {isBusy ? '...' : isFavorite ? 'Favorited' : 'Favorite'}
                      </Text>
                    </Pressable>
                  </View>
                  <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{item.address || 'No address provided'}</Text>
                  <View style={styles.rowMeta}>
                    <Text style={[styles.cardMeta, { color: colors.textMuted }]}>Rating {Number(item.rating || 0).toFixed(1)}</Text>
                    {selected ? <Text style={[styles.selectedTag, { color: colors.primary }]}>Selected</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {selectedBarber ? (
          <View style={[styles.bookingCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}> 
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Book with {selectedBarber.shop_name || `Barber #${selectedBarber.id}`}</Text>

            <Text style={[styles.label, { color: colors.textMuted }]}>Date (YYYY-MM-DD)</Text>
            <TextInput
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="2026-03-24"
              placeholderTextColor={colors.textMuted}
              style={[styles.dateInput, { color: colors.text, borderColor: colors.divider, backgroundColor: colors.background }]}
            />

            {slotsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : slotsForDate.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No availability slots for selected day.</Text>
            ) : (
              <View style={styles.slotWrap}>
                {slotsForDate.map((slot) => (
                  <Pressable
                    key={slot}
                    onPress={() => onBook(slot)}
                    disabled={booking}
                    style={[styles.slotBtn, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}
                  >
                    <Text style={[styles.slotText, { color: colors.primary }]}>{booking ? 'Booking...' : slot}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : null}
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
  searchInput: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  list: { gap: 10 },
  card: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.tile,
    padding: ClientUi.spacing.card,
    gap: 4,
    ...ClientUi.shadow.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  favoriteChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  favoriteChipText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { fontSize: 12 },
  rowMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedTag: { fontSize: 11, fontWeight: '800' },
  bookingCard: {
    marginTop: 2,
    borderWidth: 1,
    borderRadius: ClientUi.radius.card,
    padding: ClientUi.spacing.card,
    gap: 10,
    ...ClientUi.shadow.card,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  label: { fontSize: 12, fontWeight: '600' },
  dateInput: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.input,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  emptyText: { fontSize: 13 },
  slotWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  slotText: { fontSize: 13, fontWeight: '700' },
  emptyCard: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.card,
    minHeight: 90,
    justifyContent: 'center',
    alignItems: 'center',
    ...ClientUi.shadow.card,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
});

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

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
    const step = Math.max(15, Number(slot.slot_minutes || 30));
    for (let cursor = start; cursor < end; cursor += step) {
      values.add(toHHmm(cursor));
    }
  }
  return Array.from(values).sort((a, b) => toMinutes(a) - toMinutes(b));
}

function backendDayOfWeek(dateValue: Date) {
  // JS: Sunday=0...Saturday=6 -> Backend: Monday=0...Sunday=6
  return (dateValue.getDay() + 6) % 7;
}

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useAppColors();
  const { barber_id } = useLocalSearchParams<{ barber_id?: string }>();
  const scrollRef = useRef<ScrollView | null>(null);
  const profileSectionY = useRef<number>(0);
  const [pendingQrScroll, setPendingQrScroll] = useState(false);

  const [barbers, setBarbers] = useState<BarberCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [favoriteOrder, setFavoriteOrder] = useState<number[]>([]);
  const [favoriteBusyIds, setFavoriteBusyIds] = useState<Set<number>>(new Set());
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [occupiedTimes, setOccupiedTimes] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toIsoDate(new Date()));

  const selectedBarber = useMemo(
    () => barbers.find((barber) => barber.id === selectedBarberId) ?? null,
    [barbers, selectedBarberId],
  );

  const filteredBarbers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const searched = barbers.filter((item) => {
      const shop = item.shop_name?.toLowerCase() || '';
      const address = item.address?.toLowerCase() || '';
      return shop.includes(q) || address.includes(q);
    });

    if (q) {
      return searched;
    }

    const primaryFavoriteId = favoriteOrder[0];
    if (!primaryFavoriteId) {
      return barbers;
    }

    const primary = barbers.find((item) => item.id === primaryFavoriteId);
    if (!primary) {
      return barbers;
    }

    if (selectedBarberId && selectedBarberId !== primaryFavoriteId) {
      const selected = barbers.find((item) => item.id === selectedBarberId);
      if (selected) {
        return [primary, selected];
      }
    }

    return [primary];
  }, [barbers, favoriteOrder, query, selectedBarberId]);

  const loadBarbers = useCallback(async () => {
    const result = await clientApi.listBarbers();
    setBarbers(result);
  }, []);

  const loadFavorites = useCallback(async () => {
    const result = await clientApi.listFavorites();
    const ids = Array.from(new Set(result.map((item) => item.barber_id)));
    setFavoriteIds(new Set(ids));
    setFavoriteOrder(ids);
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
      setPendingQrScroll(true);
    }
  }, [barber_id, barbers]);

  useEffect(() => {
    if (barber_id || selectedBarberId || !barbers.length) return;
    const primaryFavoriteId = favoriteOrder[0];
    if (!primaryFavoriteId) return;
    if (barbers.some((item) => item.id === primaryFavoriteId)) {
      setSelectedBarberId(primaryFavoriteId);
    }
  }, [barber_id, barbers, favoriteOrder, selectedBarberId]);

  useEffect(() => {
    if (!pendingQrScroll || !selectedBarber) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, profileSectionY.current - 12), animated: true });
      setPendingQrScroll(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [pendingQrScroll, selectedBarber]);

  useEffect(() => {
    if (!selectedBarberId) {
      setAvailability([]);
      setOccupiedTimes([]);
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

  useEffect(() => {
    if (!selectedBarberId) {
      setOccupiedTimes([]);
      return;
    }

    (async () => {
      try {
        const result = await clientApi.getOccupiedTimes(selectedBarberId, selectedDate);
        setOccupiedTimes(result);
      } catch {
        setOccupiedTimes([]);
      }
    })();
  }, [selectedBarberId, selectedDate]);

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
        setFavoriteOrder((prev) => prev.filter((id) => id !== barberId));
      } else {
        await clientApi.favoriteBarber(barberId);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.add(barberId);
          return next;
        });
        setFavoriteOrder((prev) => (prev.includes(barberId) ? prev : [...prev, barberId]));
      }
    } catch {
      Alert.alert(t('search.favoritesTitle'), t('search.favoritesUpdateFailed'));
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
    const day = backendDayOfWeek(date);
    const daySlots = availability.filter((item) => item.day_of_week === day);
    const occupied = new Set(
      occupiedTimes.map((value) => value.slice(0, 5)),
    );
    return buildSlots(daySlots).filter((slot) => !occupied.has(slot));
  }, [availability, occupiedTimes, selectedDate]);

  const onBook = async (slot: string) => {
    if (!selectedBarberId) return;
    try {
      setBooking(true);
      await clientApi.createBooking({
        barber_id: selectedBarberId,
        booking_date: selectedDate,
        booking_time: `${slot}:00`,
      });
      Alert.alert(t('search.bookedTitle'), t('search.bookedMessage'), [
        { text: t('common.ok'), onPress: () => router.push('/(tabs)/appointments') },
      ]);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      const message =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail) && detail.length > 0
            ? String(detail[0]?.msg || detail[0])
            : t('search.createReservationFailed');
          Alert.alert(t('search.bookingFailedTitle'), message);
    } finally {
      setBooking(false);
    }
  };

  const openMap = async () => {
    if (!selectedBarber) return;

    const hasLatLng =
      typeof selectedBarber.latitude === 'number' &&
      !Number.isNaN(selectedBarber.latitude) &&
      typeof selectedBarber.longitude === 'number' &&
      !Number.isNaN(selectedBarber.longitude);

    const url = hasLatLng
      ? `https://www.google.com/maps/search/?api=1&query=${selectedBarber.latitude},${selectedBarber.longitude}`
      : selectedBarber.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBarber.address)}`
        : null;

    if (!url) {
      Alert.alert(t('search.locationTitle'), t('search.noLocationYet'));
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(t('search.locationTitle'), t('search.couldNotOpenMapDevice'));
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('search.locationTitle'), t('search.couldNotOpenMapNow'));
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        

        <Text style={[styles.pageTitle, { color: colors.text }]}>{t('search.title')}</Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text, borderColor: colors.divider, backgroundColor: colors.surface }]}
        />

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : filteredBarbers.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>{t('search.noMatches')}</Text>
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
                        {isBusy ? '...' : isFavorite ? t('search.favorited') : t('search.favorite')}
                      </Text>
                    </Pressable>
                  </View>
                  <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{item.address || t('search.noAddress')}</Text>
                  <View style={styles.rowMeta}>
                    <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{t('search.rating')} {Number(item.rating || 0).toFixed(1)}</Text>
                    {selected ? <Text style={[styles.selectedTag, { color: colors.primary }]}>{t('search.selected')}</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {selectedBarber ? (
          <View style={[styles.bookingCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}> 
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('search.bookWith')} {selectedBarber.shop_name || `Barber #${selectedBarber.id}`}
            </Text>

            <View
              onLayout={(event) => {
                profileSectionY.current = event.nativeEvent.layout.y;
              }}
              style={[styles.profileCard, { backgroundColor: colors.background, borderColor: colors.divider }]}
            > 
              <Text style={[styles.profileTitle, { color: colors.text }]}>{t('search.barberProfile')}</Text>
              <Text style={[styles.profileMeta, { color: colors.textMuted }]}>{t('search.rating')}: {Number(selectedBarber.rating || 0).toFixed(1)}</Text>
              <Text style={[styles.profileMeta, { color: colors.textMuted }]}>
                {t('search.address')}: {selectedBarber.address || t('search.noAddress')}
              </Text>
              <Pressable
                onPress={openMap}
                style={[styles.mapBtn, { borderColor: colors.primary, backgroundColor: colors.primaryMuted }]}
              >
                <Text style={[styles.mapBtnText, { color: colors.primary }]}>{t('search.openInGoogleMaps')}</Text>
              </Pressable>

              {Array.isArray(selectedBarber.photos) && selectedBarber.photos.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
                  {selectedBarber.photos.map((photo, index) => (
                    <Image
                      key={`photo-${photo.id}-${index}`}
                      source={{ uri: photo.photo_url }}
                      style={styles.profilePhoto}
                      contentFit="cover"
                    />
                  ))}
                </ScrollView>
              ) : (
                <Text style={[styles.profileMeta, { color: colors.textMuted }]}>{t('search.noPhotosYet')}</Text>
              )}
            </View>

            <Text style={[styles.label, { color: colors.textMuted }]}>{t('search.dateLabel')}</Text>
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
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('search.noSlotsForDay')}</Text>
            ) : (
              <View style={styles.slotWrap}>
                {slotsForDate.map((slot) => (
                  <Pressable
                    key={slot}
                    onPress={() => onBook(slot)}
                    disabled={booking}
                    style={[styles.slotBtn, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}
                  >
                    <Text style={[styles.slotText, { color: colors.primary }]}>{booking ? t('search.bookingInProgress') : slot}</Text>
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
  profileCard: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.tile,
    padding: 12,
    gap: 8,
  },
  profileTitle: { fontSize: 14, fontWeight: '800' },
  profileMeta: { fontSize: 12 },
  mapBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  mapBtnText: { fontSize: 12, fontWeight: '800' },
  photoRow: {
    gap: 8,
    paddingTop: 4,
  },
  profilePhoto: {
    width: 92,
    height: 92,
    borderRadius: 12,
  },
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

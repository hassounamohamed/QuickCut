import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClientUi } from '@/constants/client-ui';
import { useAuthContext } from '@/context/AuthContext';
import { useAppColors } from '@/hooks/use-app-colors';
import type { BarberCard, FavoriteSlotGroup, NotificationItem } from '@/services/client.api';
import { clientApi } from '@/services/client.api';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useAppColors();
  const { user } = useAuthContext();

  const [barbers, setBarbers] = useState<BarberCard[]>([]);
  const [favoriteSlots, setFavoriteSlots] = useState<FavoriteSlotGroup[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [activeBookings, setActiveBookings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const popularBarbers = [...barbers]
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 3);

  const dedupeBarbers = (items: BarberCard[]): BarberCard[] => {
    const byId = new Map<number, BarberCard>();
    for (const item of items) {
      if (!byId.has(item.id)) {
        byId.set(item.id, item);
      }
    }
    return Array.from(byId.values());
  };

  const dedupeFavoriteSlots = (items: FavoriteSlotGroup[]): FavoriteSlotGroup[] => {
    const byBarber = new Map<number, FavoriteSlotGroup>();
    for (const item of items) {
      if (!byBarber.has(item.barber_id)) {
        byBarber.set(item.barber_id, item);
      }
    }
    return Array.from(byBarber.values());
  };

  const loadData = useCallback(async () => {
    const [barberData, favoriteSlotData, notificationData, appointments] = await Promise.all([
      clientApi.listBarbers(),
      clientApi.listFavoriteSlots().catch(() => []),
      clientApi.listNotifications().catch(() => []),
      clientApi.myHistory().catch(() => []),
    ]);

    setBarbers(dedupeBarbers(barberData));
    setFavoriteSlots(dedupeFavoriteSlots(favoriteSlotData));
    setNotifications(notificationData);
    setAppointmentsCount(Array.isArray(appointments) ? appointments.length : 0);
    setActiveBookings(
      Array.isArray(appointments)
        ? appointments.filter((item) => item.status === 'pending' || item.status === 'accepted').length
        : 0,
    );
  }, []);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}> 
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(user?.username?.[0] ?? user?.email?.[0] ?? 'C').toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[styles.greeting, { color: colors.text }]}>
                {t('home.hello', { name: user?.username || t('auth.client') })}
              </Text>
              <Text style={[styles.roleLabel, { color: colors.textMuted }]}>{t('home.quickcutClient')}</Text>
            </View>
          </View>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            onPress={() => router.push('/(tabs)/notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            {unreadCount > 0 ? (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}> 
                <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </Pressable>
        </View>

        <Text style={[styles.pageTitle, { color: colors.text }]}>{t('home.clientDashboard')}</Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}> 
            <Ionicons name="storefront-outline" size={22} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{barbers.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('home.barbers')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}> 
            <Ionicons name="calendar-outline" size={22} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{appointmentsCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('home.appts')}</Text>
          </View>
        </View>

        <View style={styles.queueCard}>
          <View style={styles.queueHeaderRow}>
            <Text style={styles.queueTitle}>{t('home.bookingStatus')}</Text>
            <View style={styles.liveDot} />
          </View>
          <View style={styles.queueBody}>
            <View style={styles.queueCol}>
              <Text style={styles.queueSubLabel}>{t('home.unreadAlerts')}</Text>
              <Text style={styles.queueName}>{unreadCount}</Text>
            </View>
            <View style={styles.queueVertDivider} />
            <View style={styles.queueCol}>
              <Text style={styles.queueSubLabel}>{t('home.activeBookings')}</Text>
              <Text style={styles.queueName}>{activeBookings}</Text>
            </View>
          </View>
          <View style={styles.queueFooterRow}>
            <Ionicons name="heart-outline" size={14} color="#94A3B8" />
            <Text style={styles.queueFooterText}>{'  '}{t('home.favoritesCount')}: {favoriteSlots.length}</Text>
            <View style={styles.queueFooterDot} />
            <Ionicons name="time-outline" size={14} color="#94A3B8" />
            <Text style={styles.queueFooterText}>{'  '}{t('home.readyToBookNow')}</Text>
          </View>
        </View>

        {favoriteSlots.length ? (
          <View style={[styles.favoriteSlotsCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}> 
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.favoriteSlots')}</Text>
              <Pressable onPress={() => router.push('/(tabs)/favorites')}>
                <Text style={[styles.viewAll, { color: colors.primary }]}>{t('home.openFavorites')}</Text>
              </Pressable>
            </View>
            {favoriteSlots.slice(0, 2).map((group, index) => (
              <View key={`fav-${group.barber_id}-${index}`} style={styles.slotLine}>
                <Text style={[styles.slotShop, { color: colors.text }]}>{group.shop_name}</Text>
                <Text style={[styles.slotMeta, { color: colors.textMuted }]}>
                  Slots: {Array.isArray(group.slots) ? group.slots.length : 0}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.quickActions')}</Text>
        </View>

        <View style={styles.quickActionsGrid}>
          <Pressable
            style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            onPress={() => router.push('/(tabs)/search')}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#F6EFD8' }]}>
              <Ionicons name="search-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.quickTitle, { color: colors.text }]}>{t('home.findBarbers')}</Text>
            <Text style={[styles.quickText, { color: colors.textMuted }]}>{t('home.browseShops')}</Text>
          </Pressable>

          <Pressable
            style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            onPress={() => router.push('/(tabs)/appointments')}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#F6EFD8' }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.quickTitle, { color: colors.text }]}>{t('home.myAppointments')}</Text>
            <Text style={[styles.quickText, { color: colors.textMuted }]}>{t('home.trackBookings')}</Text>
          </Pressable>

          <Pressable
            style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            onPress={() => router.push('/(tabs)/favorites')}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#F6EFD8' }]}>
              <Ionicons name="heart-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.quickTitle, { color: colors.text }]}>{t('home.myFavorites')}</Text>
            <Text style={[styles.quickText, { color: colors.textMuted }]}>{t('home.savedBarbers')}</Text>
          </Pressable>

          <Pressable
            style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            onPress={() => router.push('/(tabs)/notifications')}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#F6EFD8' }]}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.quickTitle, { color: colors.text }]}>{t('home.alerts')}</Text>
            <Text style={[styles.quickText, { color: colors.textMuted }]}>{t('home.updatesAndReminders')}</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.popularBarbers')}</Text>
          <Pressable onPress={() => router.push('/(tabs)/search')}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>{t('home.viewAll')}</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : barbers.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Ionicons name="storefront-outline" size={34} color="#C8D3E0" />
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>{t('home.noBarbersAvailable')}</Text>
          </View>
        ) : (
          popularBarbers.map((barber, index) => (
            <Pressable
              key={`barber-${barber.id}-${index}`}
              style={[styles.barberCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={() =>
                router.push({ pathname: '/(tabs)/search', params: { barber_id: String(barber.id) } })
              }
            >
              <Text style={[styles.barberName, { color: colors.text }]}>{barber.shop_name || `Barber #${barber.id}`}</Text>
              <View style={styles.barberRow}>
                <Text style={[styles.barberMeta, { color: colors.textMuted }]}>
                  {t('home.rating')} {Number(barber.rating || 0).toFixed(1)}
                </Text>
                <Text style={[styles.quickLink, { color: colors.primary }]}>{t('home.bookNow')}</Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 34, gap: 14 },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 1,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  unreadBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 2,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 2 },
  statCard: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.tile,
    paddingVertical: 16,
    paddingHorizontal: 10,
    flex: 1,
    alignItems: 'center',
    gap: 4,
    ...ClientUi.shadow.card,
  },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  queueCard: {
    backgroundColor: '#1B1F3B',
    borderRadius: 18,
    padding: 18,
    marginBottom: 2,
  },
  queueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  queueTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 1.3 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFD700' },
  queueBody: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  queueCol: { flex: 1 },
  queueVertDivider: { width: 1, height: 44, backgroundColor: '#FFFFFF25', marginHorizontal: 16 },
  queueSubLabel: { color: '#94A3B8', fontSize: 11, marginBottom: 5 },
  queueName: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  queueFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF18',
    paddingTop: 12,
  },
  queueFooterDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#94A3B8', marginHorizontal: 10 },
  queueFooterText: { color: '#94A3B8', fontSize: 12 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  favoriteSlotsCard: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.card,
    padding: ClientUi.spacing.card,
    gap: 8,
    ...ClientUi.shadow.card,
  },
  slotLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotShop: { fontSize: 13, fontWeight: '700' },
  slotMeta: { fontSize: 12 },
  quickCard: {
    width: '48.3%',
    borderWidth: 1,
    borderRadius: ClientUi.radius.tile,
    padding: ClientUi.spacing.card,
    gap: 4,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    ...ClientUi.shadow.card,
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  quickText: { fontSize: 13, textAlign: 'center' },
  quickLink: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  sectionHeader: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  viewAll: { fontSize: 13, fontWeight: '600' },
  barberCard: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.tile,
    padding: ClientUi.spacing.card,
    gap: 4,
    ...ClientUi.shadow.card,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.card,
    minHeight: 110,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    ...ClientUi.shadow.card,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  barberName: { fontSize: 15, fontWeight: '700' },
  barberMeta: { fontSize: 12 },
  barberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

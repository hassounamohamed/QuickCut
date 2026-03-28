import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppTheme } from '@/constants/theme';
import { useAppColors } from '@/hooks/use-app-colors';
import { barberApi, DashboardData } from '@/services/barber.api';

const GOLD = AppTheme.colors.primary;
const BG = AppTheme.colors.background;
const DARK = AppTheme.colors.text;

function badgeStyle(status: string) {
  switch (status) {
    case 'accepted':
      return { bg: '#E3F9E5', text: '#2D6A4F' };
    case 'completed':
      return { bg: '#E5E7EB', text: '#4B5563' };
    case 'cancelled_by_barber':
    case 'cancelled_by_client':
      return { bg: '#FEE2E2', text: '#DC2626' };
    default:
      return { bg: '#FFF3E0', text: '#E65100' };
  }
}

function offsetDate(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

function displayLabel(dateStr: string): string {
  const today = offsetDate(0);
  if (dateStr === today) return 'TODAY';
  if (dateStr === offsetDate(-1)) return 'YESTERDAY';
  if (dateStr === offsetDate(1)) return 'TOMORROW';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function initialFromName(name?: string | null): string {
  const clean = name?.trim();
  return clean?.[0]?.toUpperCase() || 'C';
}

export default function AppointmentsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppColors();
  const GOLD = colors.primary;
  const BG = colors.background;
  const DARK = colors.text;
  const [dayOffset, setDayOffset] = useState(0);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const targetDate = offsetDate(dayOffset);

  const fetchData = useCallback(async () => {
    try {
      const result = await barberApi.getDashboard(targetDate);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [targetDate]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleAction = async (id: number, action: 'accept' | 'cancel' | 'complete') => {
    try {
      if (action === 'accept') await barberApi.acceptReservation(id);
      else if (action === 'cancel') await barberApi.cancelReservation(id);
      else await barberApi.completeReservation(id);
      fetchData();
    } catch {
      Alert.alert(t('barberAppointments.errorTitle'), t('barberAppointments.updateFailed'));
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: BG }]}>
      {/* Date navigation bar */}
      <View style={[styles.dateNav, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <TouchableOpacity style={styles.navBtn} onPress={() => setDayOffset((v) => v - 1)}>
          <Ionicons name="chevron-back" size={22} color={DARK} />
        </TouchableOpacity>
        <View style={styles.dateCenter}>
          <Text style={[styles.datePrimary, { color: DARK }]}>{t(`barberAppointments.dayLabel.${displayLabel(targetDate)}`)}</Text>
          <Text style={[styles.dateSub, { color: colors.textMuted }]}>{targetDate}</Text>
        </View>
        <TouchableOpacity style={styles.navBtn} onPress={() => setDayOffset((v) => v + 1)}>
          <Ionicons name="chevron-forward" size={22} color={DARK} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchData();
              }}
              tintColor={GOLD}
            />
          }
        >
          {/* Summary strip */}
          <View style={styles.summaryRow}>
            {[
              { label: t('barberAppointments.total'), value: data?.total_reservations ?? 0, color: DARK },
              { label: t('barberAppointments.pending'), value: data?.pending_reservations ?? 0, color: '#E65100' },
              { label: t('barberAppointments.accepted'), value: data?.accepted_reservations ?? 0, color: '#2D6A4F' },
            ].map(({ label, value, color }) => (
              <View key={label} style={[styles.summaryChip, { backgroundColor: colors.surface }]}> 
                <Text style={[styles.summaryNum, { color }]}>{value}</Text>
                <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>{label}</Text>
              </View>
            ))}
          </View>

          {!data?.schedule.length ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={52} color="#CBD5E0" />
              <Text style={styles.emptyTitle}>{t('barberAppointments.noAppointments')}</Text>
              <Text style={styles.emptySub}>{t('barberAppointments.nothingScheduled')}</Text>
            </View>
          ) : (
            data.schedule.map((item) => {
              const badge = badgeStyle(item.status);
              const clientName = item.client_name?.trim() || `Client ${item.client_id}`;
              return (
                <View key={item.reservation_id} style={[styles.card, { backgroundColor: colors.surface }]}> 
                  <View style={styles.cardAvatar}>
                    <Text style={styles.cardAvatarText}>{initialFromName(clientName)}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardName, { color: DARK }]}>{clientName}</Text>
                    <View style={styles.cardMeta}>
                      <Ionicons name="time-outline" size={13} color="#8E8E93" />
                      <Text style={[styles.cardTime, { color: colors.textMuted }]}> {item.booking_time.slice(0, 5)}</Text>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.text }]}>
                          {item.status === 'pending'
                            ? t('barberAppointments.waiting')
                            : item.status.replace(/_by_\w+/, '').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    {item.status === 'pending' && (
                      <>
                        <TouchableOpacity
                          style={styles.pillRed}
                          onPress={() => handleAction(item.reservation_id, 'cancel')}
                        >
                          <Ionicons name="close" size={15} color="#FF3B30" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.pillGreen}
                          onPress={() => handleAction(item.reservation_id, 'accept')}
                        >
                          <Ionicons name="checkmark" size={15} color="#34C759" />
                        </TouchableOpacity>
                      </>
                    )}
                    {item.status === 'accepted' && (
                      <TouchableOpacity
                        style={styles.pillGold}
                        onPress={() => handleAction(item.reservation_id, 'complete')}
                      >
                        <Text style={styles.pillGoldText}>{t('barberAppointments.done')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 36 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCenter: { alignItems: 'center' },
  datePrimary: { fontSize: 16, fontWeight: '700', color: DARK },
  dateSub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryNum: { fontSize: 20, fontWeight: '800' },
  summaryLbl: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#94A3B8', marginTop: 8 },
  emptySub: { fontSize: 13, color: '#CBD5E0' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: DARK,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardTime: { fontSize: 12, color: '#8E8E93', marginRight: 6 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: 8, marginLeft: 4 },
  pillRed: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#FF3B3060',
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillGreen: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#34C75960',
    backgroundColor: '#F0FFF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillGold: {
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 34,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillGoldText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});

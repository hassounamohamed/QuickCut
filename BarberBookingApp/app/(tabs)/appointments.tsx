import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import type { BarberCard, Booking } from '@/services/client.api';
import { clientApi } from '@/services/client.api';

type FilterType = 'all' | 'active' | 'done' | 'cancelled';

const cancellableStatuses = new Set(['pending', 'accepted']);

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimeLabel(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) return value;
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AppointmentsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppColors();

  const [items, setItems] = useState<Booking[]>([]);
  const [barbersById, setBarbersById] = useState<Record<number, BarberCard>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [reviewReservationId, setReviewReservationId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const loadData = useCallback(async () => {
    const [result, barbers] = await Promise.all([
      clientApi.myHistory(),
      clientApi.listBarbers().catch(() => []),
    ]);

    result.sort((a, b) => {
      const left = `${a.booking_date}T${a.booking_time}`;
      const right = `${b.booking_date}T${b.booking_time}`;
      return right.localeCompare(left);
    });

    const map: Record<number, BarberCard> = {};
    for (const barber of barbers) {
      map[barber.id] = barber;
    }

    setBarbersById(map);
    setItems(result);
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

  const visibleItems = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'active') return items.filter((item) => cancellableStatuses.has(item.status));
    if (filter === 'done') return items.filter((item) => item.status === 'completed');
    return items.filter((item) => item.status.includes('cancelled'));
  }, [items, filter]);

  const onCancel = (reservationId: number) => {
    Alert.alert(t('appointments.cancelTitle'), t('appointments.cancelMessage'), [
      { text: t('appointments.no'), style: 'cancel' },
      {
        text: t('appointments.yesCancel'),
        style: 'destructive',
        onPress: async () => {
          try {
            setCancellingId(reservationId);
            await clientApi.cancelBooking(reservationId);
            await loadData();
          } catch (error: any) {
            const detail = error?.response?.data?.detail;
            const message = typeof detail === 'string' ? detail : t('appointments.couldNotCancel');
            Alert.alert(t('appointments.errorTitle'), message);
          } finally {
            setCancellingId(null);
          }
        },
      },
    ]);
  };

  const statusColor = (status: string) => {
    if (status === 'completed') return colors.success;
    if (status === 'pending') return colors.warning;
    if (status === 'accepted') return colors.primary;
    return colors.danger;
  };

  const onSubmitReview = async () => {
    if (!reviewReservationId) return;
    try {
      setReviewLoading(true);
      await clientApi.addReview({
        reservation_id: reviewReservationId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      Alert.alert(t('appointments.thankYouTitle'), t('appointments.reviewSubmitted'));
      setReviewReservationId(null);
      setReviewComment('');
      setReviewRating(5);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : t('appointments.couldNotSubmitReview');
      Alert.alert(t('appointments.reviewFailedTitle'), message);
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={[styles.headerCard, { backgroundColor: colors.primaryMuted, borderColor: colors.divider }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('appointments.myAppointments')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{t('appointments.trackSubtitle')}</Text>
          <Text style={[styles.ratingHint, { color: colors.primary }]}>{t('appointments.rateHint')}</Text>
        </View>

        <View style={styles.filters}>
          {(['all', 'active', 'done', 'cancelled'] as FilterType[]).map((value) => {
            const active = filter === value;
            return (
              <Pressable
                key={value}
                onPress={() => setFilter(value)}
                style={[
                  styles.filterChip,
                  {
                    borderColor: active ? colors.primary : colors.divider,
                    backgroundColor: active ? colors.primaryMuted : colors.surface,
                  },
                ]}
              >
                <Text style={{ color: active ? colors.primary : colors.text, fontWeight: '700', fontSize: 12 }}>
                  {t(`appointments.filters.${value}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : visibleItems.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('appointments.noAppointments')}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleItems.map((item) => {
              const canCancel = cancellableStatuses.has(item.status);
              const isCancelling = cancellingId === item.id;
              const barberName =
                barbersById[item.barber_id]?.shop_name ||
                barbersById[item.barber_id]?.address ||
                t('appointments.yourBarber');

              return (
                <View
                  key={item.id}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}
                >
                  <View style={styles.cardTop}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{barberName}</Text>
                    <View style={[styles.statusPill, { backgroundColor: `${statusColor(item.status)}22` }]}>
                      <Text style={[styles.status, { color: statusColor(item.status) }]}>{t(`appointments.status.${item.status}`)}</Text>
                    </View>
                  </View>
                  <Text style={[styles.meta, { color: colors.textMuted }]}>{t('appointments.date')}: {formatDateLabel(item.booking_date)}</Text>
                  <Text style={[styles.meta, { color: colors.textMuted }]}>{t('appointments.time')}: {formatTimeLabel(item.booking_time)}</Text>

                  {canCancel ? (
                    <Pressable
                      onPress={() => onCancel(item.id)}
                      disabled={isCancelling}
                      style={[styles.cancelBtn, { borderColor: colors.danger }]}
                    >
                      <Text style={[styles.cancelText, { color: colors.danger }]}>
                        {isCancelling ? t('appointments.cancelling') : t('appointments.cancel')}
                      </Text>
                    </Pressable>
                  ) : null}

                  {item.status === 'completed' ? (
                    <Pressable
                      style={[styles.reviewBtn, { borderColor: colors.primary, backgroundColor: colors.primaryMuted }]}
                      onPress={() => setReviewReservationId(item.id)}
                    >
                      <Text style={[styles.reviewText, { color: colors.primary }]}>{t('appointments.leaveReview')}</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={reviewReservationId != null} transparent animationType="fade" onRequestClose={() => setReviewReservationId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}> 
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('appointments.rateYourAppointment')}</Text>
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>{t('appointments.stars')}</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((value) => {
                const active = value <= reviewRating;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setReviewRating(value)}
                    style={[
                      styles.starBtn,
                      {
                        borderColor: active ? colors.primary : colors.divider,
                        backgroundColor: active ? colors.primaryMuted : colors.background,
                      },
                    ]}
                  >
                    <Text style={[styles.starText, { color: active ? colors.primary : colors.textMuted }]}>★</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>{t('appointments.commentOptional')}</Text>
            <TextInput
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder={t('appointments.commentPlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={[styles.commentInput, { color: colors.text, borderColor: colors.divider, backgroundColor: colors.background }]}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { borderColor: colors.divider }]} onPress={() => setReviewReservationId(null)}>
                <Text style={[styles.modalBtnText, { color: colors.textMuted }]}>{t('appointments.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { borderColor: colors.primary, backgroundColor: colors.primaryMuted }]}
                onPress={onSubmitReview}
                disabled={reviewLoading}
              >
                <Text style={[styles.modalBtnText, { color: colors.primary }]}>{reviewLoading ? t('appointments.sending') : t('appointments.submit')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: ClientUi.spacing.screen, gap: 12, paddingBottom: 28 },
  headerCard: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.card,
    padding: ClientUi.spacing.card,
    gap: 4,
  },
  title: { fontSize: 32, fontWeight: '800' },
  headerSubtitle: { fontSize: 13 },
  ratingHint: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emptyText: { fontSize: 15, fontWeight: '700' },
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  status: { fontSize: 12, fontWeight: '700' },
  meta: { fontSize: 12 },
  cancelBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cancelText: { fontSize: 12, fontWeight: '700' },
  reviewBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reviewText: { fontSize: 12, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.card,
    padding: ClientUi.spacing.card,
    gap: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalLabel: { fontSize: 12, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', gap: 6 },
  starBtn: {
    borderWidth: 1,
    borderRadius: 10,
    width: 38,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starText: { fontSize: 18, fontWeight: '800' },
  commentInput: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.input,
    minHeight: 78,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  modalActions: { marginTop: 2, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  modalBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalBtnText: { fontSize: 12, fontWeight: '700' },
});

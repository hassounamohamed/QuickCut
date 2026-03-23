import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppTheme } from '@/constants/theme';
import { useAppColors } from '@/hooks/use-app-colors';
import { useAuthContext } from '@/context/AuthContext';
import { barberApi, DashboardData, LiveQueue, QrData } from '@/services/barber.api';

const GOLD = AppTheme.colors.primary;
const DARK_NAVY = AppTheme.colors.queueBg;

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

const QUICK_ACTIONS = [
  { icon: 'add-circle-outline', label: 'Add Time Slot', route: '/(barber)/schedule' },
  { icon: 'calendar', label: 'Manage Schedule', route: '/(barber)/schedule' },
  { icon: 'qr-code-outline', label: 'Share QR Code', route: null },
  { icon: 'star-outline', label: 'View Reviews', route: '/(barber)/reviews' },
] as const;

export default function BarberDashboard() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { colors } = useAppColors();
  const GOLD = colors.primary;
  const BG = colors.background;

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [queue, setQueue] = useState<LiveQueue | null>(null);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrActionLoading, setQrActionLoading] = useState(false);

  const writeQrToCache = useCallback(async () => {
    if (!qrData?.qr_png_base64 || !FileSystem.cacheDirectory) return null;

    const fileUri = `${FileSystem.cacheDirectory}barber-qr-${qrData.barber_id}.png`;
    await FileSystem.writeAsStringAsync(fileUri, qrData.qr_png_base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return fileUri;
  }, [qrData]);

  const handleShareQr = useCallback(async () => {
    if (!qrData) return;

    setQrActionLoading(true);
    try {
      const message = `Book your haircut here: ${qrData.booking_link}`;
      const fileUri = await writeQrToCache();
      await Share.share({ message, url: fileUri ?? qrData.booking_link });
    } catch {
      Alert.alert('Error', 'Could not share QR code');
    } finally {
      setQrActionLoading(false);
    }
  }, [qrData, writeQrToCache]);

  const handleDownloadQr = useCallback(async () => {
    if (!qrData?.qr_png_base64) {
      Alert.alert('QR Not Ready', 'QR image is not available yet. Please try again later.');
      return;
    }

    setQrActionLoading(true);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Allow media access to save QR image to gallery.');
        return;
      }

      const fileUri = await writeQrToCache();
      if (!fileUri) {
        Alert.alert('Error', 'Could not prepare image file');
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync('QuickCut', asset, false).catch(() => undefined);
      Alert.alert('Saved', 'QR code saved to your gallery.');
    } catch {
      Alert.alert('Error', 'Could not save QR code');
    } finally {
      setQrActionLoading(false);
    }
  }, [qrData, writeQrToCache]);

  const fetchData = useCallback(async () => {
    try {
      const data = await barberApi.getDashboard();
      setDashboard(data);
      const [qData, barbers] = await Promise.all([
        barberApi.getLiveQueue(data.barber_id),
        barberApi.listAllBarbers(),
      ]);
      setQueue(qData);
      const mine = barbers.find((b) => String(b.user_id) === user?.id);
      if (mine) setRating(mine.rating);
    } catch {
      // show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (reservationId: number, action: 'accept' | 'cancel') => {
    try {
      if (action === 'accept') await barberApi.acceptReservation(reservationId);
      else await barberApi.cancelReservation(reservationId);
      fetchData();
    } catch {
      Alert.alert('Error', 'Could not update reservation. Please try again.');
    }
  };

  const handleQr = async () => {
    if (!dashboard) return;
    setQrLoading(true);
    try {
      const data = await barberApi.getQrCode(dashboard.barber_id);
      setQrData(data);
      setQrModal(true);
    } catch {
      Alert.alert('Error', 'Could not generate QR code');
    } finally {
      setQrLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: BG }]}>
        <ActivityIndicator size="large" color={GOLD} />
      </SafeAreaView>
    );
  }

  const firstName = user?.username?.trim() || user?.email?.split('@')[0] || 'Barber';
  const nowServing = queue?.queue[0];
  const nextClient = queue?.queue[1];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: BG }]}>
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
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{firstName[0].toUpperCase()}</Text>
            </View>
            <View>
              <Text style={[styles.greeting, { color: colors.text }]}>Hello {firstName} 👋</Text>
              <Text style={[styles.roleLabel, { color: colors.textMuted }]}>Professional Barber</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]}> 
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/(barber)/profile')}
            >
              <Ionicons name="settings-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.pageTitle, { color: colors.text }]}>Barber Dashboard</Text>

        {/* ─── Stats row ─── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="calendar-outline" size={22} color={GOLD} />
            <Text style={styles.statValue}>{dashboard?.total_reservations ?? 0}</Text>
            <Text style={styles.statLabel}>APPTS</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="star-outline" size={22} color={GOLD} />
            <Text style={styles.statValue}>{rating > 0 ? rating.toFixed(1) : '—'}</Text>
            <Text style={styles.statLabel}>RATING</Text>
          </View>
        </View>

        {/* ─── Live Queue card ─── */}
        <View style={styles.queueCard}>
          <View style={styles.queueHeaderRow}>
            <Text style={styles.queueTitle}>LIVE QUEUE</Text>
            <View style={styles.liveDot} />
          </View>
          <View style={styles.queueBody}>
            <View style={styles.queueCol}>
              <Text style={styles.queueSubLabel}>Now Serving</Text>
              <Text style={styles.queueName}>
                {nowServing ? `Client #${nowServing.client_id}` : '—'}
              </Text>
            </View>
            <View style={styles.queueVertDivider} />
            <View style={styles.queueCol}>
              <Text style={styles.queueSubLabel}>Next Client</Text>
              <Text style={styles.queueName}>
                {nextClient ? `Client #${nextClient.client_id}` : '—'}
              </Text>
            </View>
          </View>
          <View style={styles.queueFooterRow}>
            <Ionicons name="people-outline" size={14} color="#94A3B8" />
            <Text style={styles.queueFooterText}>
              {'  '}Waiting: {queue?.waiting_count ?? 0} clients
            </Text>
            <View style={styles.queueFooterDot} />
            <Ionicons name="time-outline" size={14} color="#94A3B8" />
            <Text style={styles.queueFooterText}>
              {'  '}Est. {(queue?.waiting_count ?? 0) * 20} min
            </Text>
          </View>
        </View>

        {/* ─── Today's Appointments ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{"Today's Appointments"}</Text>
            <TouchableOpacity onPress={() => router.push('/(barber)/appointments')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {!dashboard?.schedule.length ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="calendar-outline" size={32} color="#CBD5E0" />
              <Text style={styles.emptyText}>No appointments today</Text>
            </View>
          ) : (
            dashboard.schedule.slice(0, 4).map((item) => {
              const badge = badgeStyle(item.status);
              return (
                <View key={item.reservation_id} style={[styles.apptCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.apptAvatar}>
                    <Text style={styles.apptAvatarText}>C</Text>
                  </View>
                  <View style={styles.apptInfo}>
                    <Text style={[styles.apptName, { color: colors.text }]}>Client #{item.client_id}</Text>
                    <View style={styles.apptMeta}>
                      <Ionicons name="time-outline" size={12} color="#8E8E93" />
                      <Text style={[styles.apptTime, { color: colors.textMuted }]}> {item.booking_time.slice(0, 5)}</Text>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.text }]}>
                          {item.status === 'pending' ? 'WAITING' : item.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {item.status === 'pending' && (
                    <View style={styles.apptActions}>
                      <TouchableOpacity
                        style={[styles.actionCircle, styles.cancelCircle]}
                        onPress={() => handleAction(item.reservation_id, 'cancel')}
                      >
                        <Ionicons name="close" size={16} color="#FF3B30" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionCircle, styles.acceptCircle]}
                        onPress={() => handleAction(item.reservation_id, 'accept')}
                      >
                        <Ionicons name="checkmark" size={16} color="#34C759" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* ─── Quick Actions ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(({ icon, label, route }) => (
              <TouchableOpacity
                key={label}
                style={[styles.actionCard, { backgroundColor: colors.surface }]}
                activeOpacity={0.7}
                onPress={() => {
                  if (icon === 'qr-code-outline') {
                    handleQr();
                  } else if (route) {
                    router.push(route as any);
                  }
                }}
              >
                <View style={styles.actionIconCircle}>
                  <Ionicons name={icon as any} size={26} color={GOLD} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ─── QR Modal ─── */}
      <Modal visible={qrModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Scan to Book</Text>
            {qrData?.qr_png_base64 ? (
              <Image
                source={{ uri: `data:image/png;base64,${qrData.qr_png_base64}` }}
                style={styles.qrImage}
                contentFit="contain"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code" size={80} color={GOLD} />
                <Text style={styles.qrLinkText} selectable>
                  {qrData?.booking_link}
                </Text>
              </View>
            )}
            <View style={styles.qrActionsRow}>
              <TouchableOpacity
                style={[styles.qrActionBtn, styles.qrActionSecondary]}
                onPress={handleShareQr}
                disabled={qrActionLoading}
              >
                <Ionicons name="share-social-outline" size={18} color={GOLD} />
                <Text style={styles.qrActionSecondaryText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.qrActionBtn, styles.qrActionPrimary]}
                onPress={handleDownloadQr}
                disabled={qrActionLoading}
              >
                <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                <Text style={styles.qrActionPrimaryText}>Download</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setQrModal(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR loading overlay */}
      {qrLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: DARK_NAVY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  greeting: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  roleLabel: { fontSize: 12, color: '#8E8E93', marginTop: 1 },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginTop: 14, marginBottom: 18 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginTop: 4 },
  statLabel: { fontSize: 10, color: '#8E8E93', fontWeight: '600', letterSpacing: 0.5 },

  // Queue card
  queueCard: { backgroundColor: DARK_NAVY, borderRadius: 18, padding: 18, marginBottom: 22 },
  queueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  queueTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 1.4 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFD700' },
  queueBody: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  queueCol: { flex: 1 },
  queueVertDivider: { width: 1, height: 44, backgroundColor: '#FFFFFF25', marginHorizontal: 16 },
  queueSubLabel: { color: '#94A3B8', fontSize: 11, marginBottom: 5 },
  queueName: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  queueFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF18',
    paddingTop: 12,
  },
  queueFooterDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#94A3B8', marginHorizontal: 10 },
  queueFooterText: { color: '#94A3B8', fontSize: 12 },

  // Sections
  section: { marginBottom: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
  viewAll: { fontSize: 13, color: GOLD, fontWeight: '600' },

  // Empty
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyText: { color: '#CBD5E0', fontSize: 14 },

  // Appointment cards
  apptCard: {
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
  apptAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DARK_NAVY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  apptAvatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  apptInfo: { flex: 1 },
  apptName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  apptMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  apptTime: { fontSize: 12, color: '#8E8E93', marginRight: 6 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  apptActions: { flexDirection: 'row', gap: 8, marginLeft: 8 },
  actionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  cancelCircle: { borderColor: '#FF3B3080', backgroundColor: '#FFF5F5' },
  acceptCircle: { borderColor: '#34C75980', backgroundColor: '#F0FFF4' },

  // Quick actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#1A1A2E', textAlign: 'center' },

  // QR Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000065',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    gap: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  qrImage: { width: 200, height: 200, borderRadius: 10 },
  qrPlaceholder: { alignItems: 'center', gap: 12 },
  qrLinkText: { fontSize: 12, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 8 },
  qrActionsRow: { width: '100%', flexDirection: 'row', gap: 10 },
  qrActionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  qrActionPrimary: { backgroundColor: GOLD },
  qrActionSecondary: { backgroundColor: '#FFF8E7', borderWidth: 1, borderColor: '#F1E3B8' },
  qrActionPrimaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  qrActionSecondaryText: { color: GOLD, fontWeight: '700', fontSize: 14 },
  modalCloseBtn: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 13,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000040',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

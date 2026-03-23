import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppTheme } from '@/constants/theme';
import { useAppColors } from '@/hooks/use-app-colors';
import { useAuthContext } from '@/context/AuthContext';
import { barberApi, AvailabilitySlot } from '@/services/barber.api';

const GOLD = AppTheme.colors.primary;
const DARK = AppTheme.colors.text;

const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function ScheduleScreen() {
  const { colors } = useAppColors();
  const GOLD = colors.primary;
  const BG = colors.background;
  const DARK = colors.text;
  const { user } = useAuthContext();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [barberId, setBarberId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // form
  const [selectedDay, setSelectedDay] = useState(0);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [adding, setAdding] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const barbers = await barberApi.listAllBarbers();
      let mine = barbers.find((b) => String(b.user_id) === user?.id);

      // New barber accounts may exist without a barber profile row yet.
      if (!mine && user?.id) {
        const created = await barberApi.createBarberProfile({
          user_id: Number(user.id),
          shop_name: null,
          address: null,
          latitude: null,
          longitude: null,
        });
        mine = created;
      }

      if (!mine) {
        setBarberId(null);
        setSlots([]);
        return;
      }

      setBarberId(mine.id);
      const data = await barberApi.listAvailability(mine.id);
      setSlots(data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail ?? 'Could not load working hours');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = async () => {
    if (!barberId) {
      Alert.alert('Setup Required', 'Barber profile not found. Please pull to refresh and try again.');
      return;
    }
    if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
      Alert.alert('Invalid time', 'Use HH:MM format — e.g. 09:00');
      return;
    }
    if (startTime >= endTime) {
      Alert.alert('Invalid range', 'Start time must be before end time');
      return;
    }
    try {
      setAdding(true);
      await barberApi.addAvailability({
        barber_id: barberId,
        day_of_week: selectedDay,
        start_time: startTime + ':00',
        end_time: endTime + ':00',
      });
      await loadData();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail ?? 'Could not add slot');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Remove Slot', 'Delete this availability slot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await barberApi.deleteAvailability(id);
            await loadData();
          } catch {
            Alert.alert('Error', 'Could not delete slot');
          }
        },
      },
    ]);
  };

  const grouped: Record<number, AvailabilitySlot[]> = {};
  slots.forEach((s) => {
    grouped[s.day_of_week] = [...(grouped[s.day_of_week] ?? []), s];
  });

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
              loadData();
            }}
            tintColor={GOLD}
          />
        }
      >
        <Text style={[styles.pageTitle, { color: DARK }]}>Working Hours</Text>

        {/* ─── Add-slot form ─── */}
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
          <Text style={[styles.formTitle, { color: DARK }]}>Add Availability Slot</Text>

          {/* Day picker */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayScroll}
            contentContainerStyle={{ paddingVertical: 4 }}
          >
            {DAYS_SHORT.map((d, i) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.dayChip,
                  { backgroundColor: colors.surface, borderColor: colors.divider },
                  selectedDay === i && styles.dayChipActive,
                ]}
                onPress={() => setSelectedDay(i)}
              >
                <Text style={[styles.dayChipText, selectedDay === i && styles.dayChipTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Time inputs */}
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={[styles.timeLabel, { color: colors.textMuted }]}>From</Text>
              <TextInput
                style={[styles.timeInput, { backgroundColor: colors.surface, borderColor: colors.divider, color: DARK }]}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
                placeholderTextColor="#CBD5E0"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
            <Ionicons
              name="arrow-forward"
              size={18}
              color="#CBD5E0"
              style={{ marginTop: 26 }}
            />
            <View style={styles.timeField}>
              <Text style={[styles.timeLabel, { color: colors.textMuted }]}>To</Text>
              <TextInput
                style={[styles.timeInput, { backgroundColor: colors.surface, borderColor: colors.divider, color: DARK }]}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="18:00"
                placeholderTextColor="#CBD5E0"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addBtn, adding && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={adding}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>{adding ? 'Adding…' : 'Add Slot'}</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Current schedule ─── */}
        <Text style={[styles.slotsSectionTitle, { color: DARK }]}>Current Schedule</Text>

        {loading ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 24 }} />
        ) : slots.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="time-outline" size={44} color="#CBD5E0" />
            <Text style={styles.emptyText}>No slots added yet</Text>
          </View>
        ) : (
          [0, 1, 2, 3, 4, 5, 6].map((day) => {
            const daySlots = grouped[day];
            if (!daySlots) return null;
            return (
              <View key={day} style={[styles.dayGroup, { backgroundColor: colors.surface }]}> 
                <Text style={[styles.dayGroupLabel, { color: colors.textMuted }]}>{DAYS_FULL[day]}</Text>
                {daySlots.map((slot, idx) => (
                  <View
                    key={slot.id}
                    style={[styles.slotRow, idx > 0 && styles.slotRowBorder]}
                  >
                    <Ionicons name="time-outline" size={16} color={GOLD} />
                    <Text style={[styles.slotTime, { color: DARK }]}>
                      {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDelete(slot.id)}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: DARK, marginBottom: 18 },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  formTitle: { fontSize: 15, fontWeight: '700', color: DARK, marginBottom: 14 },
  dayScroll: { marginBottom: 14 },
  dayChip: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F5F7FA',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  dayChipActive: { backgroundColor: GOLD, borderColor: GOLD },
  dayChipText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  dayChipTextActive: { color: '#FFFFFF' },

  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  timeField: { flex: 1 },
  timeLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginBottom: 6 },
  timeInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    padding: 12,
    fontSize: 17,
    fontWeight: '700',
    color: DARK,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    textAlign: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: GOLD,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  slotsSectionTitle: { fontSize: 17, fontWeight: '700', color: DARK, marginBottom: 12 },
  emptyBox: { alignItems: 'center', paddingTop: 32, gap: 10 },
  emptyText: { color: '#CBD5E0', fontSize: 14 },
  dayGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  dayGroupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  slotRowBorder: { borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  slotTime: { flex: 1, fontSize: 15, fontWeight: '600', color: DARK },
  deleteBtn: { padding: 4 },
});

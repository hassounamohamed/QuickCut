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
import { useAppColors } from '@/hooks/use-app-colors';
import type { NotificationItem } from '@/services/client.api';
import { clientApi } from '@/services/client.api';

function formatDate(value: string, unknownLabel: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return unknownLabel;
  return date.toLocaleString();
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppColors();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const result = await clientApi.listNotifications();
    result.sort((a, b) => b.created_at.localeCompare(a.created_at));
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

  const onMarkRead = async (item: NotificationItem) => {
    if (item.is_read || markingId === item.id) return;
    try {
      setMarkingId(item.id);
      await clientApi.markNotificationRead(item.id);
      setItems((prev) =>
        prev.map((candidate) =>
          candidate.id === item.id ? { ...candidate, is_read: true } : candidate,
        ),
      );
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={[styles.headerCard, { backgroundColor: colors.primaryMuted, borderColor: colors.divider }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('notificationsScreen.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{t('notificationsScreen.clientSubtitle')}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : items.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('notificationsScreen.empty')}</Text>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => onMarkRead(item)}
                style={[
                  styles.card,
                  {
                    backgroundColor: item.is_read ? colors.surface : colors.primaryMuted,
                    borderColor: item.is_read ? colors.divider : colors.primary,
                  },
                ]}
              >
                <View style={styles.cardTop}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                  {!item.is_read ? (
                    <View style={[styles.badge, { backgroundColor: colors.primary }]}> 
                      <Text style={styles.badgeText}>{markingId === item.id ? '...' : t('notificationsScreen.new')}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.cardBody, { color: colors.textMuted }]}>{item.body}</Text>
                <Text style={[styles.cardDate, { color: colors.textMuted }]}>
                  {formatDate(item.created_at, t('notificationsScreen.unknownDate'))}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
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
  emptyText: { fontSize: 14 },
  list: { gap: 10 },
  card: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.tile,
    padding: ClientUi.spacing.card,
    gap: 4,
    ...ClientUi.shadow.card,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', flex: 1 },
  cardBody: { fontSize: 13 },
  cardDate: { fontSize: 11, marginTop: 3 },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});

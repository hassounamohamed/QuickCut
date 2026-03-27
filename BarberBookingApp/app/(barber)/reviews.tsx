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
  View,
} from 'react-native';

import { AppTheme } from '@/constants/theme';
import { useAppColors } from '@/hooks/use-app-colors';
import { barberApi, Review } from '@/services/barber.api';

const GOLD = AppTheme.colors.primary;
const DARK = AppTheme.colors.text;

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= rating ? 'star' : 'star-outline'}
          size={14}
          color={s <= rating ? GOLD : '#CBD5E0'}
        />
      ))}
    </View>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function initialFromName(name?: string | null): string {
  const clean = name?.trim();
  return clean?.[0]?.toUpperCase() || 'C';
}

export default function ReviewsScreen() {
  const { colors } = useAppColors();
  const GOLD = colors.primary;
  const BG = colors.background;
  const DARK = colors.text;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const data = await barberApi.getReviews();
      setReviews(data);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : 'Could not load reviews.';
      Alert.alert('Reviews Error', message);
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

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
              loadReviews();
            }}
            tintColor={GOLD}
          />
        }
      >
        <Text style={[styles.title, { color: DARK }]}>Client Reviews</Text>

        {/* Summary banner */}
        {reviews.length > 0 && (
            <View style={[styles.summaryCard, { backgroundColor: colors.queueBg }]}>
            <View style={styles.summaryLeft}>
              <Text style={styles.avgBig}>{avgRating.toFixed(1)}</Text>
              <StarRow rating={Math.round(avgRating)} />
              <Text style={styles.reviewCount}>{reviews.length} reviews</Text>
            </View>
            <View style={styles.summaryRight}>
              {distribution.map(({ star, count }) => (
                <View key={star} style={styles.barRow}>
                  <Text style={styles.barLabel}>{star}</Text>
                  <Ionicons name="star" size={10} color={GOLD} />
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: reviews.length
                            ? `${(count / reviews.length) * 100}%`
                            : '0%',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} />
        ) : reviews.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={52} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptySub}>Client feedback will appear here</Text>
          </View>
        ) : (
          reviews.map((review) => {
            const clientName = review.client_name?.trim() || 'Client';
            return (
              <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.surface }]}> 
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>{initialFromName(clientName)}</Text>
                  </View>
                  <View style={styles.reviewMeta}>
                    <Text style={[styles.reviewAuthor, { color: DARK }]}>
                      {clientName}
                    </Text>
                    <Text style={[styles.reviewDate, { color: colors.textMuted }]}>{formatDate(review.created_at)}</Text>
                  </View>
                  <StarRow rating={review.rating} />
                </View>
                {review.comment ? (
                  <Text style={[styles.reviewComment, { color: colors.textMuted }]}>{review.comment}</Text>
                ) : null}
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
  title: { fontSize: 22, fontWeight: '800', color: DARK, marginBottom: 18 },

  summaryCard: {
    backgroundColor: DARK,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  summaryLeft: { alignItems: 'center', gap: 6, justifyContent: 'center' },
  avgBig: { fontSize: 48, fontWeight: '800', color: '#FFFFFF' },
  reviewCount: { fontSize: 12, color: '#94A3B8' },
  summaryRight: { flex: 1, gap: 6, justifyContent: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { fontSize: 11, color: '#94A3B8', width: 10, textAlign: 'right' },
  barTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#FFFFFF20',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: GOLD, borderRadius: 3 },
  barCount: { fontSize: 11, color: '#94A3B8', width: 16, textAlign: 'right' },

  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#94A3B8', marginTop: 8 },
  emptySub: { fontSize: 13, color: '#CBD5E0' },

  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  reviewMeta: { flex: 1 },
  reviewAuthor: { fontSize: 14, fontWeight: '700', color: DARK },
  reviewDate: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  reviewComment: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginTop: 4 },
});

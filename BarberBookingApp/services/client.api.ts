import api from '@/services/api';

export interface BarberCard {
  id: number;
  user_id: number;
  shop_name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  rating: number;
  photos: { id: number; photo_url: string }[];
}

export interface FavoriteBarber {
  id: number;
  barber_id: number;
  client_id: number;
  barber?: BarberCard | null;
}

type FollowedBarberApi = {
  barber_id: number;
  shop_name?: string | null;
  address?: string | null;
  rating?: number | null;
};

type FollowedBarberSlotApi = {
  barber_id: number;
  shop_name?: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_minutes?: number | null;
};

export interface FavoriteSlotGroup {
  barber_id: number;
  shop_name: string;
  slots: TimeSlot[];
}

export interface TimeSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
}

export interface Booking {
  id: number;
  barber_id: number;
  client_id: number;
  booking_date: string;
  booking_time: string;
  status: string;
}

export interface ReviewPayload {
  reservation_id: number;
  rating: number;
  comment?: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export const clientApi = {
  listBarbers: async () => {
    const { data } = await api.get<BarberCard[]>('/barbers');
    return data;
  },

  listFavorites: async () => {
    const { data } = await api.get<FavoriteBarber[] | FollowedBarberApi[]>('/favorites/me');
    if (!Array.isArray(data)) return [];

    return data.map((item: any, index) => {
      if (item?.barber || typeof item?.id === 'number') {
        return {
          ...item,
          barber: item?.barber ?? null,
        } as FavoriteBarber;
      }

      const barberId = Number(item?.barber_id);
      return {
        id: barberId || index + 1,
        barber_id: barberId,
        client_id: 0,
        barber: {
          id: barberId,
          user_id: 0,
          shop_name: item?.shop_name ?? null,
          address: item?.address ?? null,
          rating: Number(item?.rating ?? 0),
          photos: [],
        },
      };
    });
  },

  favoriteBarber: async (barberId: number) => {
    const { data } = await api.post(`/favorites/${barberId}`);
    return data;
  },

  unfavoriteBarber: async (barberId: number) => {
    const { data } = await api.delete(`/favorites/${barberId}`);
    return data;
  },

  listFavoriteSlots: async () => {
    const { data } = await api.get<FavoriteSlotGroup[] | FollowedBarberSlotApi[]>('/favorites/me/slots');
    if (!Array.isArray(data)) return [];

    const hasGroupedShape = data.some((item: any) => Array.isArray(item?.slots));
    if (hasGroupedShape) {
      return (data as FavoriteSlotGroup[]).map((item) => ({
        ...item,
        slots: Array.isArray(item?.slots) ? item.slots : [],
      }));
    }

    const grouped = new Map<number, FavoriteSlotGroup>();
    for (const row of data as FollowedBarberSlotApi[]) {
      const barberId = Number(row.barber_id);
      if (!grouped.has(barberId)) {
        grouped.set(barberId, {
          barber_id: barberId,
          shop_name: row.shop_name ?? `Barber ${barberId}`,
          slots: [],
        });
      }

      grouped.get(barberId)?.slots.push({
        day_of_week: row.day_of_week,
        start_time: row.start_time,
        end_time: row.end_time,
        slot_minutes: Math.max(15, Number(row.slot_minutes ?? 30)),
      });
    }

    return Array.from(grouped.values());
  },

  createBooking: async (payload: {
    barber_id: number;
    booking_date: string;
    booking_time: string;
  }) => {
    const { data } = await api.post<Booking>('/reservations', payload);
    return data;
  },

  cancelBooking: async (reservationId: number) => {
    const { data } = await api.patch<Booking>(`/reservations/${reservationId}/cancel`);
    return data;
  },

  myHistory: async () => {
    const { data } = await api.get<Booking[]>('/reservations/me/history');
    return data;
  },

  addReview: async (payload: ReviewPayload) => {
    const { data } = await api.post('/reviews', payload);
    return data;
  },

  listNotifications: async () => {
    const { data } = await api.get<NotificationItem[]>('/notifications/me');
    return Array.isArray(data) ? data : [];
  },

  registerDeviceToken: async (token: string) => {
    const { data } = await api.post('/notifications/device-token', { token });
    return data;
  },

  deregisterDeviceToken: async (token: string) => {
    const { data } = await api.request({
      method: 'DELETE',
      url: '/notifications/device-token',
      data: { token },
    });
    return data;
  },

  markNotificationRead: async (notificationId: number) => {
    const { data } = await api.patch<NotificationItem>(`/notifications/${notificationId}/read`);
    return data;
  },

  getBarberAvailability: async (barberId: number) => {
    const { data } = await api.get<
      {
        id: number;
        barber_id: number;
        day_of_week: number;
        start_time: string;
        end_time: string;
        slot_minutes: number;
      }[]
    >(`/barber-availability/barber/${barberId}`);
    return data;
  },

  getOccupiedTimes: async (barberId: number, bookingDate: string) => {
    const { data } = await api.get<{ barber_id: number; date: string; occupied_times: string[] }>(
      `/reservations/barber/${barberId}/occupied-times`,
      { params: { target_date: bookingDate } },
    );
    return Array.isArray(data?.occupied_times) ? data.occupied_times : [];
  },
};

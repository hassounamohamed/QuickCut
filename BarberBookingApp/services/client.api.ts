import api from '@/services/api';

export interface BarberCard {
  id: number;
  user_id: number;
  shop_name: string;
  address: string;
  rating: number;
  photos: { id: number; photo_url: string }[];
}

export interface FavoriteBarber {
  id: number;
  barber_id: number;
  client_id: number;
  barber?: BarberCard | null;
}

export interface FavoriteSlotGroup {
  barber_id: number;
  shop_name: string;
  slots: TimeSlot[];
}

export interface TimeSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
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
    const { data } = await api.get<FavoriteBarber[]>('/favorites/me');
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      ...item,
      barber: item?.barber ?? null,
    }));
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
    const { data } = await api.get<FavoriteSlotGroup[]>('/favorites/me/slots');
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      ...item,
      slots: Array.isArray(item?.slots) ? item.slots : [],
    }));
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
      { id: number; barber_id: number; day_of_week: number; start_time: string; end_time: string }[]
    >(`/barber-availability/barber/${barberId}`);
    return data;
  },
};

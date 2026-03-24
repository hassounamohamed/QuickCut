import api from './api';

export interface ScheduleItem {
  reservation_id: number;
  client_id: number;
  booking_time: string;
  status: string;
}

export interface DashboardData {
  barber_id: number;
  date: string;
  total_reservations: number;
  accepted_reservations: number;
  pending_reservations: number;
  waiting_count: number;
  schedule: ScheduleItem[];
}

export interface LiveQueue {
  barber_id: number;
  date: string;
  waiting_count: number;
  queue: Array<{
    reservation_id: number;
    client_id: number;
    booking_time: string;
    status: string;
  }>;
}

export interface AvailabilitySlot {
  id: number;
  barber_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface Review {
  id: number;
  client_id: number;
  barber_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface BarberProfile {
  id: number;
  user_id: number;
  shop_name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  photos: Array<{ id: number; barber_id: number; photo_url: string }>;
}

export interface QrData {
  barber_id: number;
  booking_link: string;
  qr_png_base64: string | null;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export const barberApi = {
  createBarberProfile: (payload: {
    user_id: number;
    shop_name?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }): Promise<BarberProfile> => api.post<BarberProfile>('/barbers', payload).then((r) => r.data),

  getDashboard: (date?: string): Promise<DashboardData> =>
    api
      .get<DashboardData>('/reservations/barber/me/dashboard', {
        params: { target_date: date ?? todayStr() },
      })
      .then((r) => r.data),

  getLiveQueue: (barberId: number, date?: string): Promise<LiveQueue> =>
    api
      .get<LiveQueue>(`/reservations/barber/${barberId}/queue`, {
        params: { target_date: date ?? todayStr() },
      })
      .then((r) => r.data),

  acceptReservation: (id: number) =>
    api.patch(`/reservations/${id}/barber/accept`).then((r) => r.data),

  cancelReservation: (id: number) =>
    api.patch(`/reservations/${id}/barber/cancel`).then((r) => r.data),

  completeReservation: (id: number) =>
    api.patch(`/reservations/${id}/barber/complete`).then((r) => r.data),

  listAvailability: (barberId: number): Promise<AvailabilitySlot[]> =>
    api.get<AvailabilitySlot[]>(`/barber-availability/barber/${barberId}`).then((r) => r.data),

  addAvailability: (payload: {
    barber_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }): Promise<AvailabilitySlot> =>
    api.post<AvailabilitySlot>('/barber-availability', payload).then((r) => r.data),

  deleteAvailability: (id: number) =>
    api.delete(`/barber-availability/${id}`).then((r) => r.data),

  getReviews: (): Promise<Review[]> =>
    api.get<Review[]>('/reviews/barber/me').then((r) => r.data),

  listAllBarbers: (): Promise<BarberProfile[]> =>
    api.get<BarberProfile[]>('/barbers').then((r) => r.data),

  updateProfile: (payload: {
    shop_name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<BarberProfile> =>
    api.patch<BarberProfile>('/barbers/me', payload).then((r) => r.data),

  addPhoto: (photo_url: string) =>
    api.post('/barbers/me/photos', { photo_url }).then((r) => r.data),

  addPhotoFile: (payload: { uri: string; mimeType?: string | null; name?: string | null }) => {
    const formData = new FormData();
    formData.append('file', {
      uri: payload.uri,
      type: payload.mimeType ?? 'image/jpeg',
      name: payload.name ?? 'photo.jpg',
    } as any);

    return api.post('/barbers/me/photos/upload', formData).then((r) => r.data);
  },

  deletePhoto: (photoId: number) =>
    api.delete(`/barbers/me/photos/${photoId}`).then((r) => r.data),

  getQrCode: (barberId: number): Promise<QrData> =>
    api.get<QrData>(`/barbers/${barberId}/qr`).then((r) => r.data),
};

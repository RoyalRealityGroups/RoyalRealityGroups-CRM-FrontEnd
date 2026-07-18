import apiClient from './axios.config';
import type { Booking, BookingFormData, BookingStatusHistory } from '../types/realestate.types';

export const bookingApi = {
  getBookings: async (params?: any) => {
    const response = await apiClient.get('/api/booking/bookings/', { params });
    return response.data;
  },

  getBooking: async (id: string): Promise<Booking> => {
    const response = await apiClient.get(`/api/booking/bookings/${id}/`);
    return response.data;
  },

  createBooking: async (data: BookingFormData): Promise<Booking> => {
    const response = await apiClient.post('/api/booking/bookings/', data);
    return response.data;
  },

  updateBooking: async (id: string, data: BookingFormData): Promise<Booking> => {
    const response = await apiClient.put(`/api/booking/bookings/${id}/`, data);
    return response.data;
  },

  deleteBooking: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/booking/bookings/${id}/`);
  },

  updateStatus: async (id: string, status: string, remarks?: string, cancellationReason?: string): Promise<Booking> => {
    const response = await apiClient.patch(`/api/booking/bookings/${id}/update_status/`, {
      status,
      remarks,
      cancellation_reason: cancellationReason
    });
    return response.data;
  },

  getStatusHistory: async (id: string): Promise<BookingStatusHistory[]> => {
    const response = await apiClient.get(`/api/booking/bookings/${id}/status_history/`);
    return response.data;
  },

  getChoices: async () => {
    const response = await apiClient.get('/api/booking/bookings/choices/');
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/api/booking/bookings/stats/');
    return response.data;
  },
};

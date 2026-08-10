import apiClient from './axios.config';

export interface NotificationItem {
  id: number;
  subject: string;
  body: string;
  type: string;
  ref: string;
  message_priority: number;
  notification_type: number;
  created_on: string;
}

export interface PaginatedNotifications {
  count: number;
  next: string | null;
  previous: string | null;
  results: NotificationItem[];
}

export const notificationApi = {
  getNotifications: async (page: number = 1, pageSize: number = 50): Promise<NotificationItem[]> => {
    const response = await apiClient.get(`/api/system/Notification/?page=${page}&page_size=${pageSize}`);
    return response.data?.results ?? response.data ?? [];
  },

  getNotificationsPaginated: async (page: number = 1, pageSize: number = 20): Promise<PaginatedNotifications> => {
    const response = await apiClient.get(`/api/system/Notification/?page=${page}&page_size=${pageSize}`);
    return response.data;
  },

  markAsRead: async (id: string | number): Promise<void> => {
    await apiClient.patch(`/api/system/Notification/Clear/${id}/`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/api/system/Notification/ClearAll/');
  },
};

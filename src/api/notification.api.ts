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

export const notificationApi = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const response = await apiClient.get('/api/system/Notification/');
    return response.data?.results ?? response.data ?? [];
  },

  markAsRead: async (id: string | number): Promise<void> => {
    await apiClient.patch(`/api/system/Notification/Clear/${id}/`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/api/system/Notification/ClearAll/');
  },
};

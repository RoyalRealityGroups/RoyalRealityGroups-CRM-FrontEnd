import apiClient from './axios.config';

export const activityApi = {
  /**
   * Get user activity logs
   */
  getUserActivityLogs: async (viewAll?: boolean, page?: number): Promise<any> => {
    const params: any = viewAll ? { view_all: true } : {};
    if (page) {
      params.page = page;
    }
    const response = await apiClient.get('/api/system/activitylog/user/', { params });
    return response.data;
  },
};

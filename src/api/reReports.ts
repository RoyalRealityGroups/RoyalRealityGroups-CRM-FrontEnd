import apiClient from './axios.config';

export const reReportsApi = {
  getLeadsBySource: async (params?: { period?: string; project?: string }) => {
    const response = await apiClient.get('/api/re-reports/leads/by-source/', { params });
    return response.data;
  },

  getLeadsByEmployee: async (params?: { period?: string; project?: string }) => {
    const response = await apiClient.get('/api/re-reports/leads/by-employee/', { params });
    return response.data;
  },

  getLeadsByProject: async (params?: { period?: string }) => {
    const response = await apiClient.get('/api/re-reports/leads/by-project/', { params });
    return response.data;
  },

  getLeadsByStatus: async (params?: { period?: string }) => {
    const response = await apiClient.get('/api/re-reports/leads/by-status/', { params });
    return response.data;
  },

  getSiteVisitReport: async (params?: { period?: string; project?: string; employee?: string }) => {
    const response = await apiClient.get('/api/re-reports/site-visits/', { params });
    return response.data;
  },

  getBookingReport: async (params?: { period?: string; project?: string }) => {
    const response = await apiClient.get('/api/re-reports/bookings/', { params });
    return response.data;
  },

  getRevenueReport: async (params?: { period?: string; project?: string }) => {
    const response = await apiClient.get('/api/re-reports/revenue/', { params });
    return response.data;
  },

  getEmployeePerformance: async (params?: { period?: string }) => {
    const response = await apiClient.get('/api/re-reports/employee-performance/', { params });
    return response.data;
  },

  getDashboardSummary: async () => {
    const response = await apiClient.get('/api/re-reports/dashboard-summary/');
    return response.data;
  },

  // Export URLs
  getExportUrl: (reportType: string, params: Record<string, string>) => {
    const queryParams = new URLSearchParams({ ...params, export: 'excel' }).toString();
    const token = localStorage.getItem('access_token');
    return `/api/re-reports/${reportType}/?${queryParams}&token=${token}`;
  }
};

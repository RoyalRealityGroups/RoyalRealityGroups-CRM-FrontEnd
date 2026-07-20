import apiClient from './axios.config';

export const reReportsApi = {
  // Lead Reports
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

  // Site Visit Reports
  getSiteVisitReport: async (params?: { period?: string; project?: string; employee?: string }) => {
    const response = await apiClient.get('/api/re-reports/site-visits/', { params });
    return response.data;
  },

  // Sales Reports
  getBookingReport: async (params?: { period?: string; project?: string }) => {
    const response = await apiClient.get('/api/re-reports/bookings/', { params });
    return response.data;
  },
  getRegistrationReport: async (params?: { period?: string; project?: string }) => {
    const response = await apiClient.get('/api/re-reports/registrations/', { params });
    return response.data;
  },
  getRevenueReport: async (params?: { period?: string }) => {
    const response = await apiClient.get('/api/re-reports/revenue/', { params });
    return response.data;
  },

  // Employee Performance
  getEmployeePerformance: async (params?: { period?: string }) => {
    const response = await apiClient.get('/api/re-reports/employee-performance/', { params });
    return response.data;
  },

  // Dashboard
  getDashboardSummary: async () => {
    const response = await apiClient.get('/api/re-reports/dashboard-summary/');
    return response.data;
  },

  // Export URLs (Excel / PDF)
  getExportUrl: (reportType: string, params: Record<string, string>, format: 'excel' | 'pdf' = 'excel') => {
    const queryParams = new URLSearchParams({ ...params, export: format }).toString();
    return `/api/re-reports/${reportType}/?${queryParams}`;
  },
};

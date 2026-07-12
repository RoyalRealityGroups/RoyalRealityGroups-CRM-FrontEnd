/**
 * Dispatch Planning Report API
 * API service for dispatch planning report with filtering and export
 */

import apiClient from './axios.config';
import type {
  DispatchPlanningReportParams,
  DispatchPlanningReportResponse,
  ExportDispatchReportRequest,
} from '../types/dispatchReport.types';

export const dispatchReportApi = {
  /**
   * Get dispatch planning report with filters
   */
  getReport: async (params: DispatchPlanningReportParams): Promise<DispatchPlanningReportResponse> => {
    const response = await apiClient.get('/api/dispatch/reports/planning/', { params });
    return response.data;
  },

  /**
   * Export dispatch planning report
   */
  exportReport: async (request: ExportDispatchReportRequest): Promise<Blob> => {
    const response = await apiClient.post(
      '/api/dispatch/reports/planning/export/',
      request,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  /**
   * Download exported report
   */
  downloadReport: (blob: Blob, format: 'excel' | 'csv' | 'pdf') => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const extension = format === 'excel' ? 'xlsx' : format;
    link.download = `dispatch_planning_report_${timestamp}.${extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

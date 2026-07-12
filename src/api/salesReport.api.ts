/**
 * Sales Order Report API Service
 * Handles fetching and exporting sales order reports with advanced filtering
 */

import apiClient from './axios.config';
import type {
  SalesOrderReportParams,
  SalesOrderReportResponse,
  SalesOrderReportItem,
  SalesOrderReportSummary,
  ExportReportRequest,
} from '../types/salesReport.types';

const REPORT_BASE = '/api/sales/reports/orders';

export const salesReportApi = {
  /**
   * Get sales order report with filters, pagination, and sorting
   */
  getReport: async (params?: SalesOrderReportParams): Promise<SalesOrderReportResponse> => {
    const response = await apiClient.get(`${REPORT_BASE}/`, { params });
    return response.data;
  },

  /**
   * Export sales order report to Excel, CSV, or PDF
   */
  exportReport: async (request: ExportReportRequest): Promise<Blob> => {
    const response = await apiClient.post(`${REPORT_BASE}/export/`, request, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Download exported report file
   */
  downloadReport: (blob: Blob, format: 'excel' | 'csv' | 'pdf'): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const extension = format === 'excel' ? 'xlsx' : format;
    const timestamp = new Date().getTime();
    link.setAttribute('download', `sales_report_${timestamp}.${extension}`);
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    // Clean up the URL object
    window.URL.revokeObjectURL(url);
  },
};

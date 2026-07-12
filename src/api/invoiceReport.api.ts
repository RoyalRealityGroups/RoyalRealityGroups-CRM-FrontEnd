/**
 * Invoice Report API Service
 * Handles fetching and exporting invoice reports with advanced filtering
 */

import apiClient from './axios.config';
import type {
  InvoiceReportParams,
  InvoiceReportResponse,
  ExportInvoiceReportRequest,
} from '../types/invoiceReport.types';

const REPORT_BASE = '/api/invoice/reports/invoices';

export const invoiceReportApi = {
  /**
   * Get invoice report with filters, pagination, and sorting
   */
  getReport: async (params?: InvoiceReportParams): Promise<InvoiceReportResponse> => {
    const response = await apiClient.get(`${REPORT_BASE}/`, { params });
    return response.data;
  },

  /**
   * Export invoice report to Excel, CSV, or PDF
   */
  exportReport: async (request: ExportInvoiceReportRequest): Promise<Blob> => {
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
    link.setAttribute('download', `invoice_report_${timestamp}.${extension}`);
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    // Clean up the URL object
    window.URL.revokeObjectURL(url);
  },
};

/**
 * Proof of Delivery Report API Service
 *
 * All operations use the generic export endpoint:
 *   POST /api/reports/generic_export/
 *
 * - List (table data): file_format=5 (JSON) returns { count, results } with resource column names
 * - Export (file):     file_format=0 (CSV) / 2 (XLSX) triggers async generation
 * - Status check:      POST /api/reports/generic_export/status/<request_id>/
 * - Download:          POST /api/reports/generic_export/download/<request_id>/
 */

import apiClient from './axios.config';
import type {
  PODReportParams,
  PODReportResponse,
  PODReportItem,
} from '../types/podReport.types';

const GENERIC_EXPORT = '/api/reports/generic_export';

/**
 * Maps resource column names (from ProofOfDeliveryResource) to frontend field names.
 */
const COLUMN_TO_FIELD: Record<string, keyof PODReportItem> = {
  'POD Number': 'pod_number',
  'POD Date': 'pod_date',
  'Invoice Number': 'invoice_number',
  'Invoice Date': 'invoice_date',
  'Order Number': 'order_number',
  'Order Date': 'order_date',
  'Customer Type': 'customer_type',
  'Customer Name': 'customer_name',
  'Status': 'status',
  'Receiver Name': 'receiver_name',
  'Receiver Phone': 'receiver_phone',
  'Delivered By': 'delivered_by',
  'Delivered Date': 'delivered_date',
  'Invoice Amount': 'invoice_amount',
  'Authorization Status': 'authorization_status',
  'Agent Name': 'agent_name',
  'Remarks': 'remarks',
};

/**
 * Transform a single row from resource column names to frontend field names.
 */
function mapRow(row: Record<string, any>, index: number): PODReportItem {
  const mapped: Record<string, any> = { id: row.id || `row-${index}` };
  for (const [colName, fieldName] of Object.entries(COLUMN_TO_FIELD)) {
    if (colName in row) {
      mapped[fieldName] = row[colName];
    }
  }
  // status_display derived from status
  const statusMap: Record<string, string> = {
    PENDING: 'Pending',
    SUCCESS: 'Delivered',
    FAILED: 'Failed Delivery',
    PARTIAL: 'Partial Delivery',
  };
  mapped.status_display = statusMap[mapped.status] || mapped.status || '';
  return mapped as PODReportItem;
}

export const podReportApi = {
  /**
   * Get POD report list with filters, pagination, and sorting.
   * Uses generic export with file_format=5 (JSON) which returns paginated data.
   */
  getReport: async (params: PODReportParams): Promise<PODReportResponse> => {
    const { page, page_size, ...filterParams } = params;
    const queryParams: Record<string, any> = {
      ...filterParams,
      page,
      page_size,
    };

    // Remove undefined values
    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key] === undefined) delete queryParams[key];
    });

    const response = await apiClient.post(
      `${GENERIC_EXPORT}/`,
      { model_name: 'ProofOfDelivery', file_format: 5 },
      { params: queryParams },
    );

    const raw = response.data;
    const results: PODReportItem[] = (raw.results || []).map(mapRow);

    return {
      count: raw.count || 0,
      results,
    };
  },

  /**
   * Export POD report via the generic export engine (CSV/XLSX).
   * Filters are passed as query params; body contains model_name + file_format.
   *
   * file_format: 0=CSV, 1=XLS, 2=XLSX, 3=TSV, 4=ODS, 5=JSON
   */
  exportReport: async (
    fileFormat: number,
    filterParams?: Record<string, any>,
  ): Promise<{ request_id: string; report_id: string; message: string }> => {
    const response = await apiClient.post(
      `${GENERIC_EXPORT}/`,
      { model_name: 'ProofOfDelivery', file_format: fileFormat },
      { params: filterParams },
    );
    return response.data;
  },

  /**
   * Poll export status until complete
   */
  checkExportStatus: async (requestId: string): Promise<boolean> => {
    const response = await apiClient.post(`${GENERIC_EXPORT}/status/${requestId}/`);
    return response.data.status === true;
  },

  /**
   * Download the generated export file
   */
  downloadExport: async (requestId: string): Promise<void> => {
    const response = await apiClient.post(
      `${GENERIC_EXPORT}/download/${requestId}/`,
      {},
      { responseType: 'blob' },
    );

    const contentDisposition = response.headers['content-disposition'];
    const contentType = String(response.headers['content-type'] || '');
    const isCSV = contentType.includes('text/csv') || contentType.includes('text/plain');
    const ext = isCSV ? 'csv' : 'xlsx';
    const timestamp = new Date().getTime();
    let filename = `pod_report_${timestamp}.${ext}`;

    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match?.[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    }

    const blob = new Blob([response.data], {
      type: isCSV
        ? 'text/csv;charset=utf-8;'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

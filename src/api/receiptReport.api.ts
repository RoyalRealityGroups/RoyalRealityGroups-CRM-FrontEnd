/**
 * Receipt Report API Service
 *
 * All operations use POST /api/reports/generic_export/
 *
 * - List (table data): file_format=5 (JSON) returns { count, results }
 * - Export (file):     file_format=0 (CSV) / 2 (XLSX) triggers async generation
 * - Status check:      POST /api/reports/generic_export/status/<request_id>/
 * - Download:          POST /api/reports/generic_export/download/<request_id>/
 */

import apiClient from './axios.config';
import type {
  ReceiptReportParams,
  ReceiptReportResponse,
  ReceiptReportItem,
} from '../types/receiptReport.types';

const GENERIC_EXPORT = '/api/reports/generic_export';

/**
 * Maps resource column names (from ReceiptResource) to frontend field names.
 */
const COLUMN_TO_FIELD: Record<string, keyof ReceiptReportItem> = {
  'Receipt Number': 'receipt_number',
  'Receipt Date': 'receipt_date',
  'Payment Date': 'payment_date',
  'Customer Type': 'customer_type',
  'Customer Name': 'customer_name',
  'Payment Mode': 'payment_mode',
  'Total Amount': 'total_amount',
  'Reference Number': 'reference_number',
  'Bank Name': 'bank_name',
  'Company': 'company_name',
  'Location': 'location_name',
  'Authorization Status': 'authorization_status',
  'Agent Name': 'agent_name',
  'Remarks': 'remarks',
};

/**
 * Transform a single row from resource column names to frontend field names.
 */
function mapRow(row: Record<string, any>, index: number): ReceiptReportItem {
  const mapped: Record<string, any> = { id: row.id || `row-${index}` };
  for (const [colName, fieldName] of Object.entries(COLUMN_TO_FIELD)) {
    if (colName in row) {
      mapped[fieldName] = row[colName];
    }
  }
  return mapped as ReceiptReportItem;
}

export const receiptReportApi = {
  /**
   * Get receipt report list with filters, pagination, and sorting.
   * Uses generic export with file_format=5 (JSON).
   */
  getReport: async (params: ReceiptReportParams): Promise<ReceiptReportResponse> => {
    const { page, page_size, ...filterParams } = params;
    const queryParams: Record<string, any> = { ...filterParams, page, page_size };

    // Remove undefined values
    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key] === undefined) delete queryParams[key];
    });

    const response = await apiClient.post(
      `${GENERIC_EXPORT}/`,
      { model_name: 'Receipt', file_format: 5 },
      { params: queryParams },
    );

    const raw = response.data;
    const results: ReceiptReportItem[] = (raw.results || []).map(mapRow);

    return {
      count: raw.count || 0,
      results,
    };
  },

  /**
   * Export receipt report (CSV/XLSX) via the generic export engine.
   * file_format: 0=CSV, 1=XLS, 2=XLSX, 3=TSV, 4=ODS
   */
  exportReport: async (
    fileFormat: number,
    filterParams?: Record<string, any>,
  ): Promise<{ request_id: string; report_id: string; message: string }> => {
    const response = await apiClient.post(
      `${GENERIC_EXPORT}/`,
      { model_name: 'Receipt', file_format: fileFormat },
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
    let filename = `receipts_report_${timestamp}.${ext}`;

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

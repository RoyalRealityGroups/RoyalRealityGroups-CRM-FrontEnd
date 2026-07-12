/**
 * Proof of Delivery Report Types
 */

export interface PODReportParams {
  // Date Filters
  from_date?: string; // YYYY-MM-DD
  to_date?: string; // YYYY-MM-DD

  // Business Filters
  customer_type?: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
  invoice_number?: string;
  pod_number?: string;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';

  // Search & Sorting
  search?: string;
  ordering?: string;

  // Pagination
  page?: number;
  page_size?: number;
  authorization_status?: '1' | '2' | '3';
  agent?: string;


}

export interface PODReportItem {
  id: string;
  code: string;
  pod_number: string;
  pod_date: string;
  invoice_number: string;
  invoice_date: string;
  invoice_amount: number | string;
  order_number: string;
  order_date: string;
  customer_type: string;
  customer_name: string;
  status: string;
  status_display: string;
  authorization_status: string;
  agent_name: string;
  receiver_name: string;
  receiver_phone: string;
  delivered_by: string;
  delivered_date: string | null;
  remarks: string;
  created_on: string;
}

export interface PODReportResponse {
  count: number;
  results: PODReportItem[];
}

// Filter Options
export interface CustomerTypeOption {
  value: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
  label: string;
}

export interface PODStatusOption {
  value: 'PENDING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  label: string;
}

export interface DatePresetOption {
  value: 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';
  label: string;
}

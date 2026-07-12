/**
 * Invoice Report Types
 * Type definitions for the invoice report feature
 */

export interface InvoiceReportParams {
  // Invoice Date Filters
  from_date?: string; // YYYY-MM-DD
  to_date?: string; // YYYY-MM-DD
  date_preset?: 'today' | 'this_week' | 'this_month' | 'this_year';
  
  // Due Date Filters
  due_from_date?: string; // YYYY-MM-DD
  due_to_date?: string; // YYYY-MM-DD
  
  // Source Filters
  source_type?: 'DISPATCH' | 'ORDER';
  dispatch_number?: string;
  sales_order_number?: string;
  
  // Customer Filters
  customer_type?: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
  customer_id?: string;
  
  // Location Filters
  country?: string;
  state?: string;
  district?: string;
  mandal?: string;
  city?: string;
  area?: string;
  
  // Status Filters
  invoice_status?: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
  pod_status?: 'PENDING' | 'COMPLETED';
  
  // Search & Sorting
  search?: string;
  ordering?: string; // e.g., 'invoice_date', '-grand_total'
  
  // Pagination
  page?: number;
  page_size?: number;

  authorization_status?: '1' | '2' | '3';
  agent?: string;
}

export interface InvoiceReportItem {
  // Invoice Information
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  
  // Source Information
  source_type: string;
  source_type_display: string;
  dispatch_number: string | null;
  sales_order_number: string;
  
  // Customer Information
  customer_name: string;
  customer_type: string;
  customer_type_code: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
  
  // Financial Information
  subtotal: number | string;
  discount_amount: number | string;
  taxable_amount: number | string;
  tax_amount: number | string;
  freight_charges: number | string;
  other_charges: number | string;
  round_off: number | string;
  grand_total: number | string;
  
  // Payment Information
  paid_amount: number | string;
  balance_amount: number | string;
  
  // Status Information
  status: string;
  status_code: string;
  pod_status: string;
  pod_status_code: string;
  
  // Authorization Information
  authorization_status: number | null;
  authorization_status_code: string | null;
  authorization_level: number | null;
  current_authorized_level: number | null;
  
  // Location Information
  country: string | null;
  state: string;
  state_id: string;
  district: string | null;
  mandal: string | null;
  city: string;
  city_id: string;
  area: string | null;
  area_id: string | null;
  
  // Company Information
  company_name: string;
  location_name: string | null;
  agent_name: string | null;
  
  // Timestamps
  created_on: string;
  modified_on: string;
}

export interface InvoiceReportSummary {
  total_invoices: number;
  total_amount: number;
  total_tax: number;
  total_paid: number;
  total_balance: number;
  status_breakdown?: Record<string, number>;
  customer_type_breakdown?: Record<string, number>;
  source_type_breakdown?: Record<string, number>;
}

export interface InvoiceReportResponse {
  count: number;
  next: string | null;
  previous: string | null;
  summary: InvoiceReportSummary;
  results: InvoiceReportItem[];
}

export interface ExportInvoiceReportRequest {
  format: 'excel' | 'csv' | 'pdf';
  filters: Partial<InvoiceReportParams>;
}

// Filter Options
export interface CustomerTypeOption {
  value: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
  label: string;
}

export interface SourceTypeOption {
  value: 'DISPATCH' | 'ORDER';
  label: string;
}

export interface InvoiceStatusOption {
  value: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
  label: string;
}

export interface PodStatusOption {
  value: 'PENDING' | 'COMPLETED';
  label: string;
}

export interface AuthorizationStatusOption {
  value: '1' | '2' | '3';
  label: string;
}

export interface DatePresetOption {
  value: 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';
  label: string;
}

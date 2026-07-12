/**
 * Receipt Report Types
 * Type definitions for the receipts report feature
 */

export interface ReceiptReportParams {
  // Date Filters
  from_date?: string; // YYYY-MM-DD
  to_date?: string; // YYYY-MM-DD

  // Company & Location Filters
  company?: string;
  location?: string;

  // Receipt Filters
  receipt_number?: string;
  payment_mode?: 'CASH' | 'CHEQUE' | 'NEFT' | 'RTGS' | 'UPI' | 'CARD' | 'CREDIT';

  // Customer Filters
  customer_type?: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
  customer_id?: string;

  // Invoice Filter
  invoice_number?: string;

  // Authorization Filters
  authorization_status?: '0' | '1' | '2' | '3';
  agent?: string;

  // Search & Sorting
  search?: string;
  ordering?: string;

  // Pagination
  page?: number;
  page_size?: number;
}

export interface ReceiptReportItem {
  id: string;

  // Receipt Information
  receipt_number: string;
  receipt_date: string;
  payment_date: string;

  // Customer Information
  customer_name: string;
  customer_type: string;

  // Payment Information
  payment_mode: string;
  total_amount: number | string;
  reference_number: string;
  bank_name: string;

  // Status Information
  authorization_status: string;
  agent_name: string;

  // Company & Location
  company_name: string;
  location_name: string;

  // Other
  remarks: string;
}

export interface ReceiptReportResponse {
  count: number;
  results: ReceiptReportItem[];
}

// Filter Options
export interface CustomerTypeOption {
  value: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
  label: string;
}

export interface PaymentModeOption {
  value: 'CASH' | 'CHEQUE' | 'NEFT' | 'RTGS' | 'UPI' | 'CARD' | 'CREDIT';
  label: string;
}

export interface AuthorizationStatusOption {
  value: '0' | '1' | '2' | '3';
  label: string;
}

export interface DatePresetOption {
  value: 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';
  label: string;
}

export interface CompanyOption {
  id: string;
  name: string;
}

export interface LocationOption {
  id: string;
  name: string;
}

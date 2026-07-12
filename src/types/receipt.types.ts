export interface ReceiptAllocation {
  id?: string;
  invoice: string;
  invoice_number?: string;
  invoice_date?: string;
  invoice_amount?: number;
  invoice_balance?: number;
  allocated_amount: number;
}

export interface ReceiptAttachment {
  id?: string;
  attachment_type: 'CHEQUE' | 'BANK_STATEMENT' | 'OTHER';
  file: File | string;
  file_name?: string;
  file_size?: number;
  remarks?: string;
}

export interface Receipt {
  id?: string;
  code?: string;
  receipt_number?: string;
  receipt_date: string;
  payment_date: string;
  payment_mode: 'CASH' | 'CHEQUE' | 'NEFT' | 'RTGS' | 'UPI' | 'CARD';
  payment_mode_display?: string;
  reference_number?: string;
  bank_name?: string;
  company: string;
  company_name?: string;
  location: string;
  location_name?: string;
  location_code?: string;
  customer_type: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
  retailer?: string | null;
  distributor?: string | null;
  superstockist?: string | null;
  customer_name?: string;
  total_amount: number;
  allocated_amount?: number;
  adjustment_amount?: number;
  remarks?: string;
  authorized_status?: number;
  authorized_status_name?: string;
  authorized_level?: number;
  pending_approver_names?: string;
  allocations: ReceiptAllocation[];
  attachments?: ReceiptAttachment[];
  created_on?: string;
  modified_on?: string;
}

export interface PendingInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  grand_total: number;
  paid_amount: number;
  balance_amount: number;
}

export interface CustomerLedgerEntry {
  id: string;
  code?: string;
  posting_date: string;
  document_date: string;
  document_type: 'INVOICE' | 'RECEIPT';
  document_number: string;
  event_type: 'INVOICE_POSTED' | 'RECEIPT_POSTED';
  customer_type: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
  customer_name?: string | null;
  debit_amount: number;
  credit_amount: number;
  company_name?: string;
  location_name?: string;
  entry_status: 'ACTIVE' | 'INACTIVE';
  remarks?: string;
  meta_data?: Record<string, any>;
  created_on?: string;
}

export interface CustomerLedgerListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CustomerLedgerEntry[];
}

export interface CustomerLedgerSummary {
  customer_type: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
  customer_id: string;
  posting_date_from?: string;
  posting_date_to?: string;
  opening_balance: number;
  period_debit: number;
  period_credit: number;
  closing_balance: number;
  entries_count: number;
}

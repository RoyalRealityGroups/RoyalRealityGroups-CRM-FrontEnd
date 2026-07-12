export interface Invoice {
  id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  source_type: 'DISPATCH' | 'ORDER';
  sales_order: string;
  dispatch_plan?: string;
  order_number?: string;
  order_date?: string;
  dispatch_number?: string;
  company: string;
  company_name?: string;
  location: string;
  location_name?: string;
  location_code?: string;
  customer_name?: string;
  customer_type?: string;
  customer_id?: string;
  tax_type?: string;
  billing_address?: string;
  billing_state?: string;
  billing_city?: string;
  shipping_address?: string;
  shipping_state?: string;
  shipping_city?: string;
  status: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  tax_amount: number;
  freight_charges: number;
  other_charges: number;
  round_off: number;
  grand_total: number;
  paid_amount: number;
  balance_amount: number;
  remarks?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  created_by_type?: string;
  created_by_identifier?: string;
  created_by_name?: string;
  created_on?: string;
  modified_on?: string;
  authorized_status?: 1 | 2 | 3;
  authorized_level?: number;
  pending_approver_names?: string;
}

export interface InvoiceItem {
  id?: string;
  invoice?: string;
  sales_order_item: string;
  item_name?: string;
  item_code?: string;
  category_name?: string;
  hsn_code?: string;
  unit_name?: string;
  quantity: number;
  rate: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  cess_rate: number;
  cess_amount: number;
  tax_amount: number;
  line_total: number;
}

export interface Payment {
  id?: string;
  invoice?: string;
  payment_date: string;
  payment_mode: 'CASH' | 'CHEQUE' | 'NEFT' | 'RTGS' | 'UPI' | 'CARD';
  amount: number;
  reference_number?: string;
  bank_name?: string;
  remarks?: string;
}

export interface DispatchPlanForInvoice {
  id: string;
  dispatch_number: string;
  dispatch_date: string;
  order_number: string;
  order_date: string;
  customer_name: string;
  status: string;
  total_quantity: number;
  total_amount: number;
  total_value: number;
  invoiced: boolean;
}

export interface SalesOrderForInvoice {
  id: string;
  order_number: string;
  order_date: string;
  customer_type: string;
  customer_name: string;
  status: string;
  total_quantity: number;
  grand_total: number;
  invoiced: boolean;
  tax_type?: string;
  items?: any[];
  billing_address?: string;
  shipping_address?: string;
  credit_days?: number;
  credit_limit?: number;
  dispatch_number?: any[] | any;
  dispatch_date?: string;
}

export interface PendingInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string; // Format: DD-MM-YYYY
  grand_total: number;
  balance_amount: number;
  days: number;
}

export interface PendingInvoicesResponse {
  count: number;
  results: PendingInvoice[];
}

/**
 * Sales Order Report Types
 * Type definitions for the sales order report feature
 */

export interface SalesOrderReportParams {
  // Date Filters
  from_date?: string; // YYYY-MM-DD
  to_date?: string; // YYYY-MM-DD
  date_preset?: 'today' | 'this_week' | 'this_month' | 'this_year';
  
  // Customer Filters
  customer_type?: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
  customer_id?: string;
  
  // Authorization Filters
  authorization_status?: '1' | '2' | '3'; // 1=Pending, 2=Approved, 3=Rejected
  agent?: string;
  
  // Location Filters
  country?: string;
  state?: string;
  district?: string;
  mandal?: string;
  city?: string;
  area?: string;
  
  // Order & Product Filters
  order_status?: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PARTIALLY_DISPATCHED' | 'DISPATCHED' | 
                 'PARTIALLY_INVOICED' | 'INVOICED' | 'DELIVERED' | 'CANCELLED';
  product_id?: string;
  
  // Search & Sorting
  search?: string;
  ordering?: string; // e.g., 'order_date', '-grand_total'
  
  // Pagination
  page?: number;
  page_size?: number;
}

export interface SalesOrderReportItem {
  // Unique identifier (order_id + product_id)
  id: string;
  
  // Order Information
  order_id: string;
  order_number: string;
  order_date: string;
  
  // Customer Information
  customer_name: string;
  customer_type: string;
  customer_type_code: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
  
  // Product Information (ONE product per row)
  product_id: string;
  product_code: string;
  product_name: string;
  quantity: number | string;
  rate: number | string;
  amount: number | string;
  
  // Order Financial Information
  order_total: number | string;
  order_tax: number | string;
  order_discount: number | string;
  
  // Status Information
  status: string;
  status_code: string;
  authorization_status: string;
  authorization_status_code: number;
  
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
  agent_name: string | null;
}

export interface SalesOrderReportSummary {
  total_orders: number;
  total_products: number;
  total_amount: number;
  total_tax: number;
}

export interface SalesOrderReportResponse {
  count: number;
  next: string | null;
  previous: string | null;
  summary: SalesOrderReportSummary;
  results: SalesOrderReportItem[];
}

export interface ExportReportRequest {
  format: 'excel' | 'csv' | 'pdf';
  filters: Partial<SalesOrderReportParams>;
}

// Filter Options
export interface CustomerTypeOption {
  value: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
  label: string;
}

export interface AuthorizationStatusOption {
  value: '1' | '2' | '3';
  label: string;
}

export interface OrderStatusOption {
  value: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PARTIALLY_DISPATCHED' | 'DISPATCHED' | 
        'PARTIALLY_INVOICED' | 'INVOICED' | 'DELIVERED' | 'CANCELLED';
  label: string;
}

export interface DatePresetOption {
  value: 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';
  label: string;
}

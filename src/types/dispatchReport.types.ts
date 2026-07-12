/**
 * Dispatch Planning Report Types
 * Type definitions for the dispatch planning report feature
 */

export interface DispatchPlanningReportParams {
  // Date Filters
  from_date?: string; // YYYY-MM-DD
  to_date?: string; // YYYY-MM-DD
  date_preset?: 'today' | 'this_week' | 'this_month' | 'this_year';
  
  // Location & Route Filters
  location?: string;
  route?: string;
  
  // Customer Location Filters
  state?: string;
  city?: string;
  area?: string;

  authorization_status?: '1' | '2' | '3';
  agent?: string;
  
  // Customer Filters
  customer_type?: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
  customer_id?: string;
  
  // Order Filter
  sales_order_number?: string;
  
  // Status Filter
  dispatch_status?: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  
  // Search & Sorting
  search?: string;
  ordering?: string;
  
  // Pagination
  page?: number;
  page_size?: number;
}

export interface DispatchPlanningReportItem {
  // Unique identifier
  id: string;
  
  // Dispatch Plan Information
  dispatch_plan_id: string;
  dispatch_number: string;
  dispatch_date: string;
  planned_dispatch_date: string;
  
  // Sales Order Information
  sales_order_id: string;
  sales_order_number: string;
  sales_order_date: string;
  
  // Customer Information
  customer_name: string;
  customer_type: string;
  customer_type_code: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
  
  // Product Information (ONE product per row)
  product_id: string;
  product_code: string;
  product_name: string;
  quantity_ordered: number | string;
  quantity_dispatched: number | string;
  
  // Location Information
  location_name: string | null;
  location_code: string | null;
  
  // Route Information
  route_name: string | null;
  route_code: string | null;
  
  // Customer Location
  state: string;
  state_id: string;
  city: string;
  city_id: string;
  area: string | null;
  area_id: string | null;
  
  // Status Information
  dispatch_status: string;
  dispatch_status_code: string;
  item_status: string;
  item_status_code: string;
  
  // Vehicle Information
  vehicle_number: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  agent_name: string | null;
  
  // Delivery Information
  delivery_sequence: number;
  estimated_delivery_time: string | null;
  actual_delivery_time: string | null;
}

export interface DispatchPlanningReportSummary {
  total_dispatch_plans: number;
  total_orders: number;
  total_products: number;
  total_quantity: number;
}

export interface DispatchPlanningReportResponse {
  count: number;
  next: string | null;
  previous: string | null;
  summary: DispatchPlanningReportSummary;
  results: DispatchPlanningReportItem[];
}

export interface ExportDispatchReportRequest {
  format: 'excel' | 'csv' | 'pdf';
  filters: Partial<DispatchPlanningReportParams>;
}

// Filter Options
export interface CustomerTypeOption {
  value: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
  label: string;
}

export interface DispatchStatusOption {
  value: string;
  label: string;
}

export interface DatePresetOption {
  value: 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';
  label: string;
}

// Sales Order Module Type Definitions

import type { PaginatedResponse } from './masters.types';

// ============================================================================
// ENUMS & TYPES
// ============================================================================

export type CustomerType = 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST';
export type SalesOrderStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PARTIALLY_DISPATCHED' | 'DISPATCHED' | 'PARTIALLY_INVOICED' | 'INVOICED' | 'DELIVERED' | 'CANCELLED';
export type DiscountType = 'PERCENTAGE' | 'AMOUNT';
export type PriceSource = 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST' | 'AREA' | 'CITY' | 'STATE' | 'BASE' | 'NOT_FOUND';
export type OrderTaxType = 'EXCLUSIVE' | 'INCLUSIVE';

// State comparison info
export interface StateInfo {
  company: {
    name: string | null;
    gst_state: string | null;
    physical_state: string | null;
  };
  customer: {
    name: string | null;
    gst_state: string | null;
    physical_state: string | null;
  };
  is_same_state: boolean;
  comparison_method: string | null;
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface SalesOrderItem {
  id?: string;
  category?: string;
  category_name?: string;
  item: string;
  item_code?: string;
  item_name?: string;
  hsn_code?: string;
  uom_name?: string;
  uom_factor?: number;
  quantity: number;
  free_quantity: number;
  pb_rate: number;
  pb_rate_source: PriceSource;
  rate: number;
  discount_type: DiscountType;
  discount_value: number;
  discount_amount: number;
  taxable_amount: number;
  tax_percentage: number;
  tax_amount: number;
  // Tax breakdown fields
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  cess_rate: number;
  cess_amount: number;
  line_total: number;
  company?: string;
  company_name?: string;
  item_image?: string;
  scheme_discount_amount?: number;
  is_scheme_free_item?: boolean;
  invoiced_quantity?: number;
  created_on?: string;
  modified_on?: string;
}

export interface SalesOrderAppliedScheme {
  id: string;
  scheme: string;
  scheme_code: string;
  scheme_name: string;
  scheme_type?: string;
  scheme_type_display?: string;
  priority?: number;
  discount_amount: number;
  free_items: Array<{
    item_id?: string;
    item_name?: string;
    quantity?: number;
  }>;
  applied_at?: string;
}

export interface AvailableScheme {
  id: string;
  code: string;
  name: string;
  priority: number;
  scheme_type: string;
  scheme_type_display: string;
  preview_discount_amount: number;
  preview_total_discount: number;
  preview_free_items: Array<{
    item_id?: string;
    item_name?: string;
    quantity?: number;
  }>;
  preview_benefit_details: Array<Record<string, any>>;
}

export interface AvailableSchemesResponse {
  applicable_schemes: AvailableScheme[];
  count: number;
}

export interface SalesOrder {
  id?: string;
  order_number: string;
  order_date: string;
  company?: string | null;
  company_name?: string;
  tax_type: OrderTaxType;
  tax_type_display?: string;
  customer_type: CustomerType;
  retailer?: string | null;
  distributor?: string | null;
  superstockist?: string | null;
  customer_name?: string;
  credit_days: number;
  state_info?: StateInfo;
  
  billing_state: string;
  billing_city: string;
  billing_area?: string | null;
  billing_address: string;
  billing_state_name?: string;
  billing_city_name?: string;
  billing_area_name?: string;
  
  shipping_state: string;
  shipping_city: string;
  shipping_area?: string | null;
  shipping_address: string;
  same_as_billing: boolean;
  shipping_state_name?: string;
  shipping_city_name?: string;
  shipping_area_name?: string;
  
  status: SalesOrderStatus;
  
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  tax_amount: number;
  freight_charges: number;
  other_charges: number;
  round_off: number;
  grand_total: number;
  
  remarks?: string;
  internal_notes?: string;
  attachment?: File | string | null;
  customer?: string;
  base_amount?: number;
  created_by_name?: string;
  created_at?: string;
  
  approved_by?: string | null;
  approved_by_name?: string;
  approved_at?: string | null;
  rejection_reason?: string;
  
  items: SalesOrderItem[];
  applied_schemes?: SalesOrderAppliedScheme[];
  
  created_on?: string;
  modified_on?: string;
  created_by_type?: string;
  created_by_identifier?: string;
}

export interface SalesOrderListItem {
  id: string;
  order_number: string;
  order_date: string;
  customer_type: CustomerType;
  customer_type_display: string;
  customer_name: string;
  status: SalesOrderStatus;
  status_display: string;
  items_count: number;
  grand_total: number;
  created_by_name: string;
  created_on: string;
  authorized_status?: 1 | 2 | 3;
  authorized_level?: number;
  pending_approver_names?: string;
}

export interface SalesOrderFormData {
  order_date: string;
  company?: string | null;
  tax_type: OrderTaxType;
  customer_type: CustomerType;
  retailer?: string | null;
  distributor?: string | null;
  superstockist?: string | null;
  credit_days: number;
  
  billing_state: string;
  billing_city: string;
  billing_area?: string | null;
  billing_address: string;
  
  shipping_state: string;
  shipping_city: string;
  shipping_area?: string | null;
  shipping_address: string;
  same_as_billing: boolean;
  
  freight_charges: number;
  other_charges: number;
  round_off: number;
  
  remarks?: string;
  internal_notes?: string;
  attachment?: File | null;
  
  items: SalesOrderItem[];
}

export interface SalesOrderHistory {
  id: string;
  order: string;
  order_number: string;
  action: string;
  action_display: string;
  old_status?: string;
  new_status?: string;
  changes?: Record<string, any>;
  remarks?: string;
  changed_by?: string | null;
  changed_by_name?: string;
  changed_at: string;
}

export interface ItemPriceResponse {
  pb_rate: number | null;
  source: PriceSource;
  source_id: string | null;
  cascade_path: string[];
  found: boolean;
}

export interface SalesOrderListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  order_number?: string;
  customer_type?: CustomerType;
  retailer?: string;
  distributor?: string;
  superstockist?: string;
  status?: SalesOrderStatus;
  order_date_from?: string;
  order_date_to?: string;
  min_amount?: number;
  max_amount?: number;
}

export type SalesOrderListResponse = PaginatedResponse<SalesOrderListItem>;

export interface ApproveOrderResponse {
  success: boolean;
  message?: string;
  order?: SalesOrder;
}

export interface RejectOrderRequest {
  reason: string;
}

export interface RejectOrderResponse {
  success: boolean;
  message?: string;
  order?: SalesOrder;
}

// ============================================================================
// PENDING SALES ORDERS & CREDIT SUMMARY
// ============================================================================

export interface PendingSalesOrder {
  id: string;
  order_number: string;
  order_date: string;
  grand_total: number;
  uninvoiced_amount: number;
  status: SalesOrderStatus;
  days: number;
}

export interface CreditSummary {
  credit_limit: number;
  existing_order_value: number;
  pending_invoice_balance: number;
  available_credit: number;
}

export interface PendingSalesOrdersResponse {
  count: number;
  results: PendingSalesOrder[];
  credit_summary: CreditSummary;
}

export interface FrequentSalesItem {
  item: string;
  item_code: string;
  item_name: string;
  hsn_code?: string;
  uom_name?: string;
  category?: string | null;
  category_name?: string;
  company?: string;
  company_name?: string;
  item_image?: string;
  total_ordered_qty: number;
  order_count: number;
  last_order_date?: string | null;
}

export interface FrequentSalesItemsResponse {
  count: number;
  months: number;
  results: FrequentSalesItem[];
}

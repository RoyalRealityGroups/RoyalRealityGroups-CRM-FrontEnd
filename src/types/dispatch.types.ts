export interface DispatchPlan {
  id?: string;
  dispatch_number: string;
  dispatch_date: string;
  planned_dispatch_date: string;
  company?: string;
  company_name?: string;
  location?: string;
  location_name?: string;
  vehicle_number?: string;
  vehicle_type?: string;
  vehicle_capacity?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_license?: string;
  route?: string;
  route_name?: string;
  lr_no?: string;
  stock_insurance?: boolean;
  status: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  total_orders?: number;
  total_weight?: number;
  total_volume?: number;
  total_value?: number;
  estimated_start_time?: string;
  estimated_end_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  remarks?: string;
  items?: DispatchItem[];
  created_on?: string;
  modified_on?: string;
  created_by_type?: string;
  created_by_identifier?: string;
  created_by_name?: string;
  authorized_status?: 1 | 2 | 3;
  authorized_level?: number;
  pending_approver_names?: string;
}

export interface DispatchItem {
  id?: string;
  dispatch_plan?: string;
  sales_order: string;
  sales_order_item?: string;
  sales_order_number?: string;
  customer_name?: string;
  customer_type?: string;
  shipping_address?: string;
  shipping_state_name?: string;
  shipping_city_name?: string;
  order_value?: number;
  company_name?: string;
  order_date?: string;
  item_name?: string;
  item_code?: string;
  quantity_ordered: number;
  quantity_dispatched: number;
  remaining_quantity?: number;
  dispatch_percentage?: number;
  delivery_sequence?: number;
  loading_sequence?: number;
  unloading_sequence?: number;
  status?: 'PENDING' | 'LOADED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  delivery_notes?: string;
  delivered_by?: string;
  received_by?: string;
  order_items?: DispatchOrderItem[];
}

export interface DispatchOrderItem {
  id?: string;
  sales_order_item: string;
  item_name?: string;
  item_code?: string;
  company_name?: string;
  quantity_ordered: number;
  quantity_dispatched: number;
  invoiced_quantity?: number;
}

export interface SalesOrderItem {
  id: string;
  item_name: string;
  item_code: string;
  company_name?: string;
  remaining_quantity: number;
  unit_price: number;
}

export interface SalesOrderForDispatch {
  id: string;
  order_number: string;
  order_date: string;
  customer_type: string;
  customer_id?: string;
  customer_name: string;
  shipping_area?: string;
  shipping_address: string;
  shipping_state_name: string;
  shipping_city_name: string;
  shipping_area_name?: string;
  grand_total: number;
  total_quantity: number;
  dispatched_quantity: number;
  remaining_quantity: number;
  items?: SalesOrderItem[];
}

export interface DispatchPlanFormData {
  dispatch_date: string;
  planned_dispatch_date: string;
  location?: string;
  vehicle_number?: string;
  vehicle_type?: string;
  vehicle_capacity?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_license?: string;
  route?: string;
  lr_no?: string;
  stock_insurance?: boolean;
  status: string;
  remarks?: string;
  items: DispatchItemFormData[];
}

export interface DispatchItemFormData {
  id?: string;
  sales_order: string;
  sales_order_item?: string;
  quantity_ordered: number;
  quantity_dispatched: number;
  delivery_sequence?: number;
  loading_sequence?: number;
  unloading_sequence?: number;
  estimated_delivery_time?: string;
  delivery_notes?: string;
}

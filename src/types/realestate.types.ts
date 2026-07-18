// Real Estate Module Type Definitions

export interface PlotInventory {
  id: string;
  code: string;
  project: string;
  project_name?: string;
  plot_number: string;
  area_sqyd?: number;
  area_sqft?: number;
  facing?: string;
  road_width?: string;
  price_per_sqyd?: number;
  total_price?: number;
  status: 'AVAILABLE' | 'BLOCKED' | 'BOOKED' | 'REGISTERED' | string;
  remarks?: string;
  created_on?: string;
}

export interface PlotInventoryFormData {
  project: string;
  plot_number: string;
  area_sqyd?: number;
  area_sqft?: number;
  facing?: string;
  road_width?: string;
  price_per_sqyd?: number;
  total_price?: number;
  status?: string;
  remarks?: string;
}

export interface FlatInventory {
  id: string;
  code: string;
  project: string;
  project_name?: string;
  tower?: string;
  floor?: number;
  unit_number: string;
  flat_type?: string;
  area_sqft?: number;
  carpet_area_sqft?: number;
  facing?: string;
  price?: number;
  status: 'AVAILABLE' | 'BLOCKED' | 'BOOKED' | 'REGISTERED' | string;
  remarks?: string;
  created_on?: string;
}

export interface FlatInventoryFormData {
  project: string;
  tower?: string;
  floor?: number;
  unit_number: string;
  flat_type?: string;
  area_sqft?: number;
  carpet_area_sqft?: number;
  facing?: string;
  price?: number;
  status?: string;
  remarks?: string;
}

export interface Booking {
  id: string;
  code: string;
  lead?: string | { id: string; name: string; code: string; mobile: string };
  customer_name: string;
  customer_mobile?: string;
  customer_email?: string;
  project: string | { id: string; name: string };
  project_name?: string;
  unit_type: 'PLOT' | 'FLAT';
  plot?: string | PlotInventory;
  flat?: string | FlatInventory;
  unit_number?: string;
  agreed_price?: number;
  booking_amount: number;
  booking_date: string;
  sales_executive?: string | { id: string; username: string; first_name?: string; last_name?: string };
  sales_executive_name?: string;
  status: 'BOOKED' | 'AGREEMENT' | 'REGISTERED' | 'CANCELLED' | string;
  cancellation_reason?: string;
  cancelled_date?: string;
  remarks?: string;
  created_on?: string;
}

export interface BookingFormData {
  lead?: string;
  customer_name: string;
  customer_mobile?: string;
  customer_email?: string;
  project: string;
  unit_type: 'PLOT' | 'FLAT';
  plot?: string;
  flat?: string;
  agreed_price?: number;
  booking_amount: number;
  booking_date: string;
  sales_executive?: string;
  status?: string;
  remarks?: string;
}

export interface BookingStatusHistory {
  id: number;
  booking: string;
  from_status?: string;
  to_status: string;
  changed_by: { id: string; username: string };
  remarks?: string;
  changed_on: string;
}

export interface SiteVisit {
  id: string;
  code: string;
  lead?: string | { id: string; name: string; code: string; mobile: string };
  customer_name: string;
  customer_mobile?: string;
  project?: string | { id: string; name: string };
  project_name?: string;
  visit_date: string;
  visit_time?: string;
  assigned_employee?: string | { id: string; username: string; first_name?: string; last_name?: string };
  assigned_employee_name?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | string;
  customer_feedback?: string;
  remarks?: string;
  photos?: SiteVisitPhoto[];
  created_on?: string;
}

export interface SiteVisitFormData {
  lead?: string;
  customer_name: string;
  customer_mobile?: string;
  project?: string;
  visit_date: string;
  visit_time?: string;
  assigned_employee?: string;
  status?: string;
  customer_feedback?: string;
  remarks?: string;
}

export interface SiteVisitPhoto {
  id: number;
  site_visit: string;
  photo: string;
  caption?: string;
  uploaded_on: string;
}

export interface Document {
  id: string;
  code: string;
  title: string;
  document_type: string;
  description?: string;
  file: string;
  original_filename?: string;
  file_size?: number;
  linked_to: 'PROJECT' | 'LEAD' | 'BOOKING';
  project?: string;
  lead?: string;
  booking?: string;
  is_public: boolean;
  file_url?: string;
  file_extension?: string;
  created_on?: string;
}

export interface DocumentFormData {
  title: string;
  document_type: string;
  description?: string;
  file: File;
  linked_to: 'PROJECT' | 'LEAD' | 'BOOKING';
  project?: string;
  lead?: string;
  booking?: string;
  is_public?: boolean;
}

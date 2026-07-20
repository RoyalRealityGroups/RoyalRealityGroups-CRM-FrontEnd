export type InventoryStatus = 'AVAILABLE' | 'BLOCKED' | 'BOOKED' | 'REGISTERED';

export const STATUS_COLORS: Record<InventoryStatus, 'default' | 'primary' | 'success' | 'warning' | 'info'> = {
  AVAILABLE: 'success',
  BLOCKED: 'warning',
  BOOKED: 'primary',
  REGISTERED: 'info',
};

export const STATUS_LABELS: Record<InventoryStatus, string> = {
  AVAILABLE: 'Available',
  BLOCKED: 'Blocked',
  BOOKED: 'Booked',
  REGISTERED: 'Registered',
};

// ============================================================================
// PLOT INVENTORY
// ============================================================================

export interface Plot {
  id: string;
  code?: string;
  project: string;
  project_name?: string;
  plot_number: string;
  area_sqyd?: number | null;
  area_sqft?: number | null;
  facing?: string;
  facing_display?: string;
  road_width?: string;
  price_per_sqyd?: number | null;
  total_price?: number | null;
  status: InventoryStatus;
  status_display?: string;
  remarks?: string;
  created_on: string;
  modified_on: string;
}

export interface PlotFormData {
  project: string;
  plot_number: string;
  area_sqyd?: number | string;
  area_sqft?: number | string;
  facing?: string;
  road_width?: string;
  price_per_sqyd?: number | string;
  total_price?: number | string;
  status: InventoryStatus;
  remarks?: string;
}

// ============================================================================
// FLAT INVENTORY
// ============================================================================

export interface Flat {
  id: string;
  code?: string;
  project: string;
  project_name?: string;
  tower: string;
  floor: number;
  unit_number: string;
  flat_type?: string;
  area_sqft?: number | null;
  carpet_area_sqft?: number | null;
  facing?: string;
  facing_display?: string;
  price?: number | null;
  status: InventoryStatus;
  status_display?: string;
  remarks?: string;
  created_on: string;
  modified_on: string;
}

export interface FlatFormData {
  project: string;
  tower: string;
  floor: number | string;
  unit_number: string;
  flat_type?: string;
  area_sqft?: number | string;
  carpet_area_sqft?: number | string;
  facing?: string;
  price?: number | string;
  status: InventoryStatus;
  remarks?: string;
}

// ============================================================================
// SHARED
// ============================================================================

export interface InventoryListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: InventoryStatus | '';
  project?: string;
  tower?: string;
  facing?: string;
}

export interface InventoryListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface InventoryChoices {
  statuses: { value: InventoryStatus; label: string }[];
  facings: { value: string; label: string }[];
}

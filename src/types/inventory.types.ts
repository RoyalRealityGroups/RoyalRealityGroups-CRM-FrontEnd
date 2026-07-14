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

export interface Plot {
  id: string;
  plot_number: string;
  project: string;
  project_name?: string;
  area: number;
  price: number;
  status: InventoryStatus;
  facing?: string;
  notes?: string;
  created_on: string;
  modified_on: string;
}

export interface PlotFormData {
  plot_number: string;
  project: string;
  area: number | string;
  price: number | string;
  status: InventoryStatus;
  facing?: string;
  notes?: string;
}

export interface Flat {
  id: string;
  project: string;
  project_name?: string;
  tower: string;
  floor: number;
  unit_number: string;
  area: number;
  facing?: string;
  price: number;
  status: InventoryStatus;
  notes?: string;
  created_on: string;
  modified_on: string;
}

export interface FlatFormData {
  project: string;
  tower: string;
  floor: number | string;
  unit_number: string;
  area: number | string;
  facing?: string;
  price: number | string;
  status: InventoryStatus;
  notes?: string;
}

export interface InventoryListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: InventoryStatus | '';
  project?: string;
  tower?: string;
  floor?: number;
}

export interface InventoryListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface InventoryChoices {
  statuses: { value: InventoryStatus; label: string }[];
}
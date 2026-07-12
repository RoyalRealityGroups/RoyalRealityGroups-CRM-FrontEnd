// Common Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DropdownOption {
  id: string | number;
  name: string;
  code?: string;
}

export interface BaseModel {
  id: string;
  code?: string;
  created_on?: string;
  modified_on?: string;
  is_deleted?: boolean;
}

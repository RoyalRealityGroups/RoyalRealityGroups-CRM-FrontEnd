// Project Master Types — SRS Module 6

export interface Project {
  id: string;
  code: string;
  name: string;
  developer_name?: string;
  project_type: 'PLOT' | 'FLAT' | 'VILLA' | 'MIXED' | string;
  project_type_display?: string;
  location?: string | null;
  location_name?: string | null;
  address?: string;
  approval_type: 'GVMC' | 'VMRDA' | 'DTCP' | 'HMDA' | 'PANCHAYAT' | 'PENDING' | 'NA' | string;
  approval_type_display?: string;
  rera_number?: string;
  total_area?: string;
  launch_date?: string | null;
  possession_date?: string | null;
  description?: string;
  image_url?: string | null;
  brochure_url?: string | null;
  layout_plan_url?: string | null;
  floor_plan_url?: string | null;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'SOLD_OUT' | string;
  status_display?: string;
  is_active: boolean;
  is_deleted?: boolean;
  created_by?: string;
  created_by_name?: string;
  modified_by?: string;
  modified_by_name?: string;
  created_on?: string;
  modified_on?: string;
}

export interface ProjectFormData {
  name: string;
  developer_name?: string;
  project_type: string;
  location?: string | null;
  address?: string;
  approval_type: string;
  rera_number?: string;
  total_area?: string;
  launch_date?: string | null;
  possession_date?: string | null;
  description?: string;
  image_url?: string | null;
  brochure_url?: string | null;
  layout_plan_url?: string | null;
  floor_plan_url?: string | null;
  status: string;
  is_active: boolean;
}

export interface ProjectMini {
  id: string;
  code: string;
  name: string;
  status: string;
  status_display?: string;
  project_type: string;
  project_type_display?: string;
  is_active: boolean;
}

export interface ProjectListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  project_type?: string;
  approval_type?: string;
  is_active?: boolean;
  ordering?: string;
}

export interface ProjectChoices {
  project_statuses: { value: string; label: string }[];
  project_types: { value: string; label: string }[];
  approval_types: { value: string; label: string }[];
}
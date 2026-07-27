// Project Master Types — SRS Module 6

export interface ProjectImage {
  id: string;
  project: string;
  image: string;
  image_type: 'GALLERY' | 'FLOOR_PLAN' | 'ELEVATION';
  image_type_display?: string;
  title?: string;
  description?: string;
  order: number;
  created_on?: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  developer_name?: string;
  project_type: 'PLOT' | 'FLAT' | 'VILLA' | 'MIXED' | string;
  project_type_display?: string;
  location?: string | null;
  approval_type: 'GVMC' | 'VMRDA' | 'DTCP' | 'HMDA' | 'PANCHAYAT' | 'PENDING' | 'NA' | string;
  approval_type_display?: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'SOLD_OUT' | string;
  status_display?: string;
  /** Project image / thumbnail (ImageField → URL string from DRF) */
  sub?: string | null;
  
  // New enhanced fields
  overview?: string | null;
  description?: string | null;
  amenities?: string | null;
  specifications?: string | null;
  floor_plans_text?: string | null;
  elevation_image?: string | null;
  thumbnail?: string | null;
  preview_image?: string | null;
  floor_plans?: string[];
  gallery?: string[];
  brochure?: string | null;
  images?: ProjectImage[];
  
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
  project_type?: string;
  location?: string | null;
  approval_type?: string;
  status?: string;
  is_active?: boolean;
  sub?: string | File | null;
  
  // New enhanced fields
  overview?: string | null;
  description?: string | null;
  amenities?: string | null;
  specifications?: string | null;
  floor_plans_text?: string | null;
  elevation_image?: string | File | null;
  thumbnail?: string | File | null;
  floor_plans?: string[];
  gallery?: string[];
  brochure?: string | File | null;
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
  // For preview cards
  thumbnail?: string | null;
  elevation_image?: string | null;
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
  from_date?: string;
  to_date?: string;
}

export interface ProjectChoices {
  project_statuses: { value: string; label: string }[];
  project_types: { value: string; label: string }[];
  approval_types: { value: string; label: string }[];
}

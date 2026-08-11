// ─────────────────────────────────────────────────────────────────────────────
// Availability List — TypeScript types
// Mirrors Availability/models.py + serializers.py
// ─────────────────────────────────────────────────────────────────────────────

// ── Status ────────────────────────────────────────────────────────────────────

export type UnitStatus = 'AVAILABLE' | 'BLOCKED' | 'BOOKED' | 'REGISTERED';

export const UNIT_STATUS_COLORS: Record<UnitStatus, string> = {
  AVAILABLE:  '#10B981',   // emerald green
  BLOCKED:    '#F59E0B',   // amber / hold
  BOOKED:     '#3B82F6',   // blue
  REGISTERED: '#8B5CF6',   // purple
};

export const UNIT_STATUS_BG: Record<UnitStatus, string> = {
  AVAILABLE:  '#ECFDF5',
  BLOCKED:    '#FFFBEB',
  BOOKED:     '#EFF6FF',
  REGISTERED: '#F5F3FF',
};

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  AVAILABLE:  'Available',
  BLOCKED:    'Blocked / Hold',
  BOOKED:     'Booked',
  REGISTERED: 'Registered',
};

export const UNIT_STATUS_MUI: Record<UnitStatus, 'success' | 'warning' | 'primary' | 'secondary'> = {
  AVAILABLE:  'success',
  BLOCKED:    'warning',
  BOOKED:     'primary',
  REGISTERED: 'secondary',
};

// ── Choice shapes (from /api/availability/projects/choices/) ──────────────────

export interface ChoiceItem {
  value: string;
  label: string;
}

export interface AvailabilityChoices {
  project_types:    ChoiceItem[];
  project_statuses: ChoiceItem[];
  approval_types:   ChoiceItem[];
  unit_statuses:    ChoiceItem[];
  unit_types:       ChoiceItem[];
  facings:          ChoiceItem[];
}

// ── Unit ──────────────────────────────────────────────────────────────────────

export interface AvailabilityUnit {
  id:                string;
  block:             string;
  block_name?:       string;
  project_id?:       string;
  project_name?:     string;
  unit_number:       string;
  unit_type?:        string;
  unit_type_display?: string;
  floor?:            number | null;
  area_sqft?:        number | null;
  area_sqyd?:        number | null;
  carpet_area_sqft?: number | null;
  facing?:           string;
  facing_display?:   string;
  price?:            number | null;
  status:            UnitStatus;
  status_display?:   string;
  remarks?:          string;
  created_on?:       string;
  modified_on?:      string;
}

export interface AvailabilityUnitFormData {
  block:             string;
  unit_number:       string;
  unit_type?:        string;
  floor?:            number | string;
  area_sqft?:        number | string;
  area_sqyd?:        number | string;
  carpet_area_sqft?: number | string;
  facing?:           string;
  price?:            number | string;
  status:            UnitStatus;
  remarks?:          string;
}

// ── Block ─────────────────────────────────────────────────────────────────────

export interface AvailabilityBlock {
  id:               string;
  project:          string;
  project_name?:    string;
  name:             string;
  description?:     string;
  total_floors?:    number | null;
  order:            number;
  total_units:      number;
  available_units:  number;
  booked_units:     number;
  blocked_units:    number;
  registered_units: number;
  units?:           AvailabilityUnit[];
  created_on?:      string;
  modified_on?:     string;
}

export interface AvailabilityBlockFormData {
  project:      string;
  name:         string;
  description?: string;
  total_floors?: number | string;
  order?:       number;
}

// ── Project Image ─────────────────────────────────────────────────────────────

export interface AvailabilityProjectImage {
  id:                 string;
  project:            string;
  image:              string;
  image_url?:         string;
  image_type:         string;
  image_type_display?: string;
  title?:             string;
  order:              number;
  created_on?:        string;
}

// ── Project (full detail) ─────────────────────────────────────────────────────

export interface AvailabilityProject {
  id:                    string;
  code?:                 string;
  name:                  string;
  developer_name?:       string;
  project_type:          string;
  project_type_display?: string;
  location?:             string;
  city?:                 string;
  total_area?:           string;
  price_range_min?:      number | null;
  price_range_max?:      number | null;
  approval_type?:        string;
  approval_type_display?: string;
  approval_number?:      string;
  status:                string;
  status_display?:       string;
  possession_date?:      string | null;
  contact_person?:       string;
  contact_phone?:        string;
  description?:          string;
  amenities?:            string;
  rera_number?:          string;
  is_active:             boolean;
  thumbnail?:            string | null;
  thumbnail_url?:        string | null;
  brochure?:             string | null;
  brochure_url?:         string | null;
  blocks:                AvailabilityBlock[];
  images:                AvailabilityProjectImage[];
  total_units:           number;
  available_units:       number;
  booked_units:          number;
  blocked_units:         number;
  registered_units:      number;
  created_on?:           string;
  modified_on?:          string;
}

// ── Project list item (lightweight) ──────────────────────────────────────────

export interface AvailabilityProjectListItem {
  id:                    string;
  code?:                 string;
  name:                  string;
  developer_name?:       string;
  project_type:          string;
  project_type_display?: string;
  location?:             string;
  city?:                 string;
  status:                string;
  status_display?:       string;
  is_active:             boolean;
  thumbnail_url?:        string | null;
  total_units:           number;
  available_units:       number;
  booked_units:          number;
  blocked_units:         number;
  registered_units:      number;
  block_count:           number;
  created_on?:           string;
}

// ── Form data for the multi-step wizard ──────────────────────────────────────

export interface AvailabilityProjectFormData {
  name:              string;
  developer_name:    string;
  project_type:      string;
  location:          string;
  city:              string;
  total_area:        string;
  price_range_min:   string;
  price_range_max:   string;
  approval_type:     string;
  approval_number:   string;
  status:            string;
  possession_date:   string;
  contact_person:    string;
  contact_phone:     string;
  description:       string;
  amenities:         string;
  rera_number:       string;
  thumbnail?:        File | null;
  brochure?:         File | null;
  // Read-only URL fields for showing existing files in edit mode
  existingThumbnailUrl?: string | null;
  existingBrochureUrl?:  string | null;
}

// A block entry in the wizard (before saving)
export interface WizardBlock {
  tempId:       string;   // client-only temp id
  name:         string;
  description:  string;
  total_floors: string;
  order:        number;
  // units defined per block
  units: WizardUnit[];
}

export interface WizardUnit {
  tempId:            string;
  unit_number:       string;
  unit_type:         string;
  floor:             string;
  area_sqft:         string;
  area_sqyd:         string;
  carpet_area_sqft:  string;
  facing:            string;
  price:             string;
  status:            UnitStatus;
  remarks:           string;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface ProjectStats {
  project_id:   string;
  project_name: string;
  total:        number;
  available:    number;
  blocked:      number;
  booked:       number;
  registered:   number;
  blocks: {
    id:         string;
    name:       string;
    total:      number;
    available:  number;
    blocked:    number;
    booked:     number;
    registered: number;
  }[];
}

export interface BlockStats {
  block_id:   string;
  block_name: string;
  total:      number;
  available:  number;
  blocked:    number;
  booked:     number;
  registered: number;
}

// ── API list response ─────────────────────────────────────────────────────────

export interface AvailabilityListResponse<T> {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  T[];
}

export interface AvailabilityListParams {
  page?:         number;
  page_size?:    number;
  search?:       string;
  status?:       string;
  project_type?: string;
  is_active?:    boolean;
}

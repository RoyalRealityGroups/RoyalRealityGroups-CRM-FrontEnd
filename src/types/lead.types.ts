// Lead Module Type Definitions

export interface Lead {
  id: string;
  code: string;
  name: string;
  mobile: string;
  alternate_number?: string;
  email?: string;
  budget?: string;
  preferred_area?: string;
  property_requirement?: string;
  lead_source: string;
  status: string;
  assigned_employee?: {
    id: string;
    name: string;
    code: string;
  };
  remarks?: string;
  cross_lead_override: boolean;
  cross_lead_override_reason?: string;
  created_on: string;
  modified_on: string;
}

export interface LeadFormData {
  name: string;
  mobile: string;
  alternate_number?: string;
  email?: string;
  budget?: string;
  preferred_area?: string;
  property_requirement?: string;
  lead_source: string;
  status?: string;
  assigned_employee_id?: string;
  remarks?: string;
  cross_lead_override?: boolean;
  cross_lead_override_reason?: string;
}

export interface LeadStatusHistory {
  id: string;
  lead: string;
  from_status?: string;
  to_status: string;
  changed_by: {
    id: string;
    name: string;
  };
  remarks?: string;
  created_on: string;
}

export interface LeadFollowUp {
  id: string;
  lead: {
    id: string;
    name: string;
    code: string;
    mobile: string;
    email?: string;
    status: string;
    assigned_employee?: string;
  };
  follow_up_date: string;
  follow_up_time?: string;
  follow_up_type: string;
  discussion_notes?: string;
  next_follow_up_date?: string;
  created_by: {
    id: string;
    name: string;
  };
  created_on: string;
}

export interface LeadFollowUpFormData {
  lead_id: string;
  follow_up_date: string;
  follow_up_time?: string;
  follow_up_type: string;
  discussion_notes?: string;
  next_follow_up_date?: string;
}

export interface CrossCheckRequest {
  mobile?: string;
  alternate_number?: string;
  email?: string;
}

export interface CrossCheckResult {
  has_duplicates: boolean;
  duplicates: {
    lead: {
      id: string;
      code: string;
      name: string;
      status: string;
      last_follow_up_date?: string | null;
      assigned_employee?: {
        name: string;
      };
    };
    match_field: string;
    match_value: string;
  }[];
  message?: string;
  matchedFields?: string[];
}

export interface LeadChoices {
  lead_sources: { value: string; label: string }[];
  lead_statuses: { value: string; label: string }[];
  follow_up_types: { value: string; label: string }[];
}

export interface LeadListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  lead_source?: string;
  assigned_employee_id?: string;
  ordering?: string;
  from_date?: string;
  to_date?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type LeadListResponse = PaginatedResponse<Lead>;
export type LeadFollowUpListResponse = PaginatedResponse<LeadFollowUp>;

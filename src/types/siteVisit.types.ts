export type SiteVisitStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface SiteVisitPhoto {
  id: string;
  photo: string;
  caption?: string;
  uploaded_on: string;
}

export interface SiteVisit {
  id: string;
  code?: string;
  lead?: string | null;
  lead_name?: string | null;
  customer_name: string;
  project?: string | { id: string; name: string } | null;
  project_name?: string;
  visit_date: string;
  assigned_employee: string | { id: string; name: string; code?: string };
  assigned_employee_name?: string;
  status: SiteVisitStatus;
  status_display?: string;
  // Completion details
  customer_feedback?: string;
  remarks?: string;
  photos?: SiteVisitPhoto[];
  // Audit
  created_on: string;
  modified_on: string;
}

export interface SiteVisitFormData {
  customer_name: string;
  project: string;
  project_name?: string;
  visit_date: string;
  assigned_employee: string;
  status: SiteVisitStatus;
  lead?: string | null;
  // Completion details
  customer_feedback?: string;
  remarks?: string;
  photos?: SiteVisitPhoto[];
}

export interface SiteVisitListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: SiteVisitStatus | '';
  assigned_employee?: string;
  lead?: string;
  from_date?: string;
  to_date?: string;
}

export interface SiteVisitListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SiteVisit[];
}

export interface SiteVisitChoices {
  statuses: { value: SiteVisitStatus; label: string }[];
}

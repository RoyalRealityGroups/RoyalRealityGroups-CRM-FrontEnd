export type SiteVisitStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface SiteVisitPhoto {
  id: string;
  photo: string;
  caption?: string;
  uploaded_on: string;
}

export interface SiteVisit {
  id: string;
  customer_name: string;
  project?: string | { id: string; name: string };
  project_name?: string;
  visit_date: string;
  assigned_employee: string | { id: string; name: string; code?: string };
  assigned_employee_name?: string;
  status: SiteVisitStatus;
  customer_feedback?: string;
  remarks?: string;
  photos?: SiteVisitPhoto[];
  created_on: string;
  modified_on: string;
  created_by?: { id: string; name: string };
}

export interface SiteVisitFormData {
  customer_name: string;
  // ponytail: backend rejects `project_name` — the FK UUID is required.
  // Keeping `project_name` optional for backwards compat with stored drafts.
  project: string;
  project_name?: string;
  visit_date: string;
  assigned_employee: string;
  status: SiteVisitStatus;
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
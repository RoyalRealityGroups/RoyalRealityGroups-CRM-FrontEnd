export type SiteVisitStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

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
  photos?: string[];
  created_on: string;
  modified_on: string;
  created_by?: { id: string; name: string };
}

export interface SiteVisitFormData {
  customer_name: string;
  project: string; // FK UUID to Masters.Project
  visit_date: string;
  assigned_employee: string;
  status: SiteVisitStatus;
  customer_feedback?: string;
  remarks?: string;
  photos?: string[];
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
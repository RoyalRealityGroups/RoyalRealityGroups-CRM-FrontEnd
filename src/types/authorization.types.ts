export interface AuthorizationDefinition {
  id: string;
  code: string;
  authorization_name?: string;
  effective_from?: string;
  company?: { id: string; name: string };
  company_id?: string;
  companies?: { id: string; name: string }[];
  has_all_companies?: boolean;
  location?: { id: string; name: string };
  location_id?: string;
  locations?: { id: string; name: string }[];
  has_all_locations?: boolean;
  status?: boolean;
  auto_approve_creator_level?: boolean;
  screen: number;
  screen_name?: string;
  level: number;
  send_email: boolean;
  send_sms: boolean;
  send_notification: boolean;
  level_authorizations?: Authorization[];
  created_on: string;
  modified_on: string;
  is_deleted: boolean;
}

export interface Authorization {
  id?: string;
  code?: string;
  authorization_definition_id?: string;
  type: 1 | 2;
  user_identifier?: string;
  user_type?: string;
  user?: { id: string; username: string; fullname: string; email: string; first_name: string; last_name: string; phone: string };
  group?: { id: number; name: string };
  group_id?: number;
  group_name?: string;
  screen?: number;
  screen_name?: string;
  level: number;
  send_email: boolean;
  send_sms: boolean;
  send_notification: boolean;
  created_on?: string;
  modified_on?: string;
  is_deleted?: boolean;
}

export interface AuthorizationHistory {
  id: string;
  code: string;
  screen: number;
  screen_name?: string;
  instance_id: string;
  authorized_level: number;
  authorized_status: 1 | 2 | 3;
  description: string;
  authorized_by_identifier: string;
  authorized_by_type: string;
  authorized_on: string;
  created_on: string;
}

export interface AuthorizationStatusCounts {
  Pending: number;
  Approved: number;
  Rejected: number;
  Skipped: number;
  has_auth_rights?: boolean;
  pending_count?: number;
}

export interface PendingApproversResponse {
  level: number | null;
  approvers: Array<{ type: 'USER' | 'GROUP'; name: string }>;
}

export interface ContentType {
  id: number;
  name: string;
  contenttype: {
    id: number;
    app_label: string;
    model: string;
  };
}

export interface AuthorizationListParams {
  page?: number;
  page_size?: number;
  search?: string;
  screen?: number;
  type?: 1 | 2;
  level?: number;
}

export interface AuthorizationDefinitionListParams {
  page?: number;
  page_size?: number;
  search?: string;
  screen?: number;
}

export interface ApprovalRequest {
  instance_id: string;
  authorized_status: 1 | 2 | 3;
  description?: string;
}

export interface BulkApprovalRequest {
  instances: ApprovalRequest[];
}

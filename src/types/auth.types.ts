// Authentication Types
export interface LoginCredentials {
  username: string;
  password: string;
  remember_me?: boolean;
  user_type: string;
  device_uuid: string;
  device_type: number;
  device_name?: string;
  device_fcmtoken?: string;
  device_apntoken?: string;
}

export interface ForgotPasswordData {
  username: string;
}

export interface ChangePasswordData {
  old_password: string;
  password: string;
  confirm_password: string;
}

export interface LoginResponse {
  tokens: {
    access: string;
    refresh: string;
  };
  username: string;
  email: string;
  phone: string;
  full_name: string;
  group_name: string;
  user_type: string;
  is_default_password: boolean;
  is_superuser: boolean;
  permissions: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  profilepicture?: string | null;
  group_name?: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  groups?: Group[];
  permissions?: string[];
  channel_partner_type?: 'STAFF' | 'SUPERSTOCKIST' | 'DISTRIBUTOR' | 'RETAILER';
  superstockist?: string | null;
  distributor?: string | null;
  retailer?: string | null;
  superstockist_name?: { id: string; name: string } | null;
  distributor_name?: { id: string; name: string } | null;
  retailer_name?: { id: string; name: string } | null;
}

export interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type?: number;
}

export interface GroupDetails {
  group: number;
  reporting_to?: number;
  reporting_to_name?: string;
}

export interface Group {
  id: number;
  name: string;
  permissions?: Permission[];
  groupdetails?: GroupDetails;
  users?: Array<{
    id: string;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  }>;
}

export interface GroupFormData {
  name: string;
  permission_ids?: number[];
  reporting_to_id?: number;
}

export interface GroupListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export interface GroupListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Group[];
}

export interface TokenRefreshRequest {
  refresh: string;
}

export interface TokenRefreshResponse {
  access: string;
}

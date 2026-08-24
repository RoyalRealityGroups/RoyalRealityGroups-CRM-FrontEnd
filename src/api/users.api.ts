import apiClient from './axios.config';

// Menu item types for permissions (now uses Menuitem instead of Screen)
export interface MenuItem {
  id: number;
  code: string;
  name: string;
  icon?: string;
  link?: string;
  sequence?: number;
  order?: number;
}

// Alias for backward compatibility
export type ScreenItem = MenuItem;

export interface MenuPermissionInput {
  menuitem_id: number;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}

// Alias for backward compatibility
export type ScreenPermissionInput = MenuPermissionInput;

export interface MenuPermissionDetail extends MenuPermissionInput {
  menuitem_code: string;
  menuitem_name: string;
  is_view_only: boolean;
}

// Alias for backward compatibility  
export type ScreenPermissionDetail = MenuPermissionDetail;

export interface UserFormData {
  username?: string;
  email?: string;
  phone?: string;
  first_name: string;
  last_name?: string;
  password?: string;
  gender?: number | string;
  device_access?: number;
  is_active?: boolean;
  profilepicture?: File | null;
  remove_profilepicture?: boolean;
  designation?: string;
  joining_date?: string;
  reporting_manager?: string | null;
  user_status?: string;
  must_reset_password?: boolean;
  lead_data_scope?: 'OWN' | 'TEAM' | 'ALL';
  followup_data_scope?: 'OWN' | 'TEAM' | 'ALL';
  sitevisit_data_scope?: 'OWN' | 'TEAM' | 'ALL';
  booking_data_scope?: 'OWN' | 'TEAM' | 'ALL';
  // Menu permissions — sent to backend as screen_permissions_input
  screen_permissions_input?: MenuPermissionInput[];
}

export interface UserDetail {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  first_name: string;
  last_name: string;
  fullname: string;
  gender?: number;
  gender_name?: string;
  device_access?: number;
  device_access_name?: string;
  is_active: boolean;
  is_staff?: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  profilepicture?: string | null;
  created_at: string;
  updated_at?: string;
  designation?: string;
  joining_date?: string;
  reporting_manager?: string;
  reporting_manager_name?: string;
  user_status?: string;
  must_reset_password?: boolean;
  leads_assigned?: number;
  site_visits?: number;
  bookings?: number;
  registrations?: number;
  team_count?: number;
  lead_data_scope?: 'OWN' | 'TEAM' | 'ALL';
  followup_data_scope?: 'OWN' | 'TEAM' | 'ALL';
  sitevisit_data_scope?: 'OWN' | 'TEAM' | 'ALL';
  booking_data_scope?: 'OWN' | 'TEAM' | 'ALL';
  screen_permissions?: ScreenPermissionDetail[];
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export interface UserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserDetail[];
}

export interface UserDeleteResponse {
  message?: string;
  status?: string;
  transaction_references?: string[];
  tagged_references?: string[];
}

const BASE_URL = '/api/usermanagement';

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  message: string
  pagination?: {
    page: number
    page_size: number
    total_pages: number
    total_count: number
  }
}
export interface Permission {
  id: string
  module: string
  feature: string
  action: string
  code: string
  description: string
  is_active: boolean
}
export interface Role {
  id: string
  name: string
  code: string
  description: string
  is_system_role: boolean
  parent_role?: string
  parent_role_name?: string
  permissions: Permission[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SingleResponse<T> {
  success: boolean
  data: T
  message: string
  errors?: any[]
}
export interface RolePermissions {
  role_id: string
  role_name: string
  permissions: Permission[]
  is_system_role: boolean
}

export const rolesApi = {
  // List roles
  list: async (params?: {
    page?: number
    page_size?: number
    search?: string
    is_system_role?: boolean
  }) => {
    const response = await apiClient.get<PaginatedResponse<Role>>('/api/users/groups/', { params })
    return response.data
  },

  // Get role by ID
  get: async (id: string) => {
    const response = await apiClient.get<SingleResponse<Role>>(`/api/users/groups/${id}/`)
    return response.data
  },

  // Create role
  create: async (data: {
    name: string
    code: string
    description?: string
    parent_role?: string
    permission_ids?: string[]
  }) => {
    const response = await apiClient.post<SingleResponse<Role>>('/api/users/groups/', data)
    return response.data
  },

  // Update role
  update: async (id: string, data: Partial<Role>) => {
    const response = await apiClient.patch<SingleResponse<Role>>(`/api/users/groups/${id}/`, data)
    return response.data
  },

  // Delete role
  delete: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/users/groups/${id}/`)
    return response.data
  },

  // Get role permissions
  getPermissions: async (roleId: string) => {
    const response = await apiClient.get<SingleResponse<RolePermissions>>(`/api/users/groups/${roleId}/permissions/`)
    return response.data
  },

  // Update role permissions (add/remove)
  updatePermissions: async (roleId: string, permissionIds: string[], granted: boolean = true) => {
    const response = await apiClient.post<SingleResponse<RolePermissions>>(`/api/users/groups/${roleId}/permissions/`, {
      permission_ids: permissionIds,
      granted,
    })
    return response.data
  },

  // Set role permissions (replace all)
  setPermissions: async (roleId: string, permissionIds: string[]) => {
    const response = await apiClient.post<SingleResponse<any>>(`/api/users/groups/${roleId}/set_permissions/`, {
      permission_ids: permissionIds,
    })
    return response.data
  },
}
export const usersApi = {

  // List users with pagination and filters
  list: async (params?: UserListParams): Promise<UserListResponse> => {
    const response = await apiClient.get<UserListResponse>(`${BASE_URL}/list/`, { params });
    return response.data;
  },

  // Get single user by ID
  get: async (id: string): Promise<UserDetail> => {
    const response = await apiClient.get<UserDetail>(`${BASE_URL}/${id}/`);
    return response.data;
  },

  // Create new user
  create: async (data: UserFormData): Promise<UserDetail> => {
    const { profilepicture, screen_permissions_input, ...jsonData } = data;
    if (profilepicture) {
      const formData = new FormData();
      Object.entries(jsonData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        } else {
          formData.append(key, String(value));
        }
      });
      formData.append('profilepicture', profilepicture);
      if (screen_permissions_input) {
        formData.append('screen_permissions_input', JSON.stringify(screen_permissions_input));
      }
      const response = await apiClient.post<UserDetail>(`${BASE_URL}/create/`, formData);
      return response.data;
    }
    const response = await apiClient.post<UserDetail>(`${BASE_URL}/create/`, {
      ...jsonData,
      ...(screen_permissions_input ? { screen_permissions_input } : {}),
    });
    return response.data;
  },

  // Update existing user
  update: async (id: string, data: Partial<UserFormData>): Promise<UserDetail> => {
    const { profilepicture, screen_permissions_input, ...jsonData } = data;
    if (profilepicture) {
      const formData = new FormData();
      Object.entries(jsonData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        } else {
          formData.append(key, String(value));
        }
      });
      formData.append('profilepicture', profilepicture);
      if (screen_permissions_input) {
        formData.append('screen_permissions_input', JSON.stringify(screen_permissions_input));
      }
      const response = await apiClient.patch<UserDetail>(`${BASE_URL}/${id}/`, formData);
      return response.data;
    }
    const response = await apiClient.patch<UserDetail>(`${BASE_URL}/${id}/`, {
      ...jsonData,
      ...(screen_permissions_input ? { screen_permissions_input } : {}),
    });
    return response.data;
  },

  // Upload profile picture only
  uploadProfilePicture: async (id: string, file: File): Promise<UserDetail> => {
    const formData = new FormData();
    formData.append('profilepicture', file);
    const response = await apiClient.patch<UserDetail>(`${BASE_URL}/${id}/`, formData);
    return response.data;
  },

  // Remove profile picture
  removeProfilePicture: async (id: string): Promise<UserDetail> => {
    const response = await apiClient.patch<UserDetail>(`${BASE_URL}/${id}/`, { profilepicture: null });
    return response.data;
  },

  // Delete user (soft delete - set is_active to false)
  delete: async (id: string): Promise<UserDeleteResponse> => {
    const response = await apiClient.delete<UserDeleteResponse>(`${BASE_URL}/${id}/`);
    return response.data || {};
  },

  // Force logout a user — invalidates all their JWT sessions
  forceLogout: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`${BASE_URL}/force-logout/${id}/`);
    return response.data;
  },

  // Get mini list (for dropdowns)
  mini: async (): Promise<Array<{ id: string; fullname: string }>> => {
    const response = await apiClient.get(`${BASE_URL}/mini/users/`);
    return response.data;
  },

  // Get all available screens for permission picker
  getScreens: async (): Promise<ScreenItem[]> => {
    try {
      const response = await apiClient.get(`${BASE_URL}/screens/`);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.results)) return data.results;
    } catch {
      // Fall back to hardcoded list if DB not seeded yet
    }
    // Hardcoded fallback — matches seed_rrgms_screens
    return [
      { id: 1,  code: 'LEAD',            name: 'Lead Management',              order: 1 },
      { id: 2,  code: 'CROSS_LEAD',      name: 'Cross Lead Check',             order: 2 },
      { id: 3,  code: 'FOLLOWUP',        name: 'Follow-Up Management',         order: 3 },
      { id: 4,  code: 'SITE_VISIT',      name: 'Site Visit Management',        order: 4 },
      { id: 5,  code: 'PROJECT',         name: 'Project Management',           order: 5 },
      { id: 6,  code: 'INVENTORY',       name: 'Availability List',            order: 6 },
      { id: 7,  code: 'BOOKING',         name: 'Booking Management',           order: 7 },
      { id: 8,  code: 'DOCUMENT',        name: 'Document Management',          order: 8 },
      { id: 9,  code: 'EMPLOYEE',        name: 'Employee Management',          order: 9 },
      { id: 10, code: 'REPORTS',         name: 'Reports',                      order: 10 },
      { id: 11, code: 'DASHBOARD',       name: 'Dashboards',                   order: 11 },
      { id: 12, code: 'USER_PERMISSION', name: 'User & Permission Management', order: 12 },
    ];
  },

  // Get a specific user's screen permissions
  getUserPermissions: async (userId: string): Promise<ScreenPermissionDetail[]> => {
    const response = await apiClient.get(`${BASE_URL}/permissions/${userId}/`);
    return response.data;
  },
};

// Channel Partner types
export interface ChannelPartner {
  id: string;
  code: string;
  name: string;
}

export interface CompanyOption {
  id: string;
  code: string;
  name: string;
}

export interface LocationOption {
  id: string;
  code: string;
  name: string;
}

// Channel Partner APIs
export const channelPartnerApi = {
  // Get superstockists list
  getSuperstockists: async (): Promise<ChannelPartner[]> => {
    const response = await apiClient.get<ChannelPartner[]>(`${BASE_URL}/channel-partners/superstockists/`);
    return response.data;
  },

  // Get distributors list
  getDistributors: async (): Promise<ChannelPartner[]> => {
    const response = await apiClient.get<ChannelPartner[]>(`${BASE_URL}/channel-partners/distributors/`);
    return response.data;
  },

  // Get retailers list
  getRetailers: async (): Promise<ChannelPartner[]> => {
    const response = await apiClient.get<ChannelPartner[]>(`${BASE_URL}/channel-partners/retailers/`);
    return response.data;
  },
};

// User Management APIs
export const userApi = {
  getUsers: async () => {
    const response = await apiClient.get(`${BASE_URL}/users/`);
    return response.data;
  },
  getUser: async (id: number) => {
    const response = await apiClient.get(`${BASE_URL}/users/${id}/`);
    return response.data;
  },
  createUser: async (data: any) => {
    return apiClient.post(`${BASE_URL}/usermanagement/create/`, data);
  },
  updateUser: async (id: number, data: any) => {
    return apiClient.patch(`${BASE_URL}/users/${id}/`, data);
  },
  deleteUser: async (id: number) => {
    return apiClient.delete(`${BASE_URL}/users/${id}/`);
  },
  getGroups: async () => {
    const response = await apiClient.get(`${BASE_URL}/groups/`);
    return response.data;
  },
};

export const groupsApi = {
  getGroups: async () => {
    const response = await apiClient.get(`${BASE_URL}/groups/`);
    return response.data;
  },
};

// Company & Location dropdown APIs
export const companyLocationApi = {
  // Get companies list
  getCompanies: async (search?: string): Promise<CompanyOption[]> => {
    const response = await apiClient.get<CompanyOption[]>(`${BASE_URL}/dropdowns/companies/`, {
      params: { search }
    });
    return response.data;
  },

  // Get locations list (filtered by company)
  getLocations: async (companyIds?: string[], search?: string): Promise<LocationOption[]> => {
    const params: any = {};
    if (search) params.search = search;
    if (companyIds && companyIds.length > 0) {
      companyIds.forEach(id => {
        if (!params['company_ids[]']) params['company_ids[]'] = [];
        params['company_ids[]'].push(id);
      });
    }
    const response = await apiClient.get<LocationOption[]>(`${BASE_URL}/dropdowns/locations/`, { params });
    return response.data;
  },
};

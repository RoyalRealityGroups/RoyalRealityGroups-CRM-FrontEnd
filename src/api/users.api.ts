import apiClient from './axios.config';

export interface UserFormData {
  username?: string;
  email?: string;
  phone?: string;
  first_name: string;
  password?: string;
  gender?: number;
  device_access?: number;
  is_active?: boolean;
  is_staff?: boolean;
  group_ids: number[];
  profilepicture?: File | null;
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
  is_staff: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  profilepicture?: string | null;
  groups?: Array<{ id: number; name: string }>;
  created_at: string;
  updated_at: string;
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
    const { profilepicture, ...jsonData } = data;
    if (profilepicture) {
      const formData = new FormData();
      Object.entries(jsonData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, String(v)));
        } else {
          formData.append(key, String(value));
        }
      });
      formData.append('profilepicture', profilepicture);
      const response = await apiClient.post<UserDetail>(`${BASE_URL}/create/`, formData);
      return response.data;
    }
    const response = await apiClient.post<UserDetail>(`${BASE_URL}/create/`, jsonData);
    return response.data;
  },

  // Update existing user
  update: async (id: string, data: Partial<UserFormData>): Promise<UserDetail> => {
    const { profilepicture, ...jsonData } = data;
    if (profilepicture) {
      const formData = new FormData();
      Object.entries(jsonData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          if (value.length === 0) return; // Don't send empty arrays on update
          value.forEach((v) => formData.append(key, String(v)));
        } else if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        } else {
          formData.append(key, String(value));
        }
      });
      formData.append('profilepicture', profilepicture);
      const response = await apiClient.patch<UserDetail>(`${BASE_URL}/${id}/`, formData);
      return response.data;
    }
    const response = await apiClient.patch<UserDetail>(`${BASE_URL}/${id}/`, jsonData);
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

  // Get mini list (for dropdowns)
  mini: async (): Promise<Array<{ id: string; fullname: string }>> => {
    const response = await apiClient.get(`${BASE_URL}/mini/users/`);
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

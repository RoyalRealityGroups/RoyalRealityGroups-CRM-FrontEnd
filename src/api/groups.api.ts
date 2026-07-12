import apiClient from './axios.config';
import type { Group, GroupFormData, GroupListParams, GroupListResponse, Permission } from '../types/auth.types';

const BASE_URL = '/api/users/groups';

export const groupsApi = {
  // List groups with pagination and filters
  list: async (params?: GroupListParams): Promise<GroupListResponse> => {
    const response = await apiClient.get<GroupListResponse>(BASE_URL + '/', { params });
    return response.data;
  },

  // Get single group by ID
  get: async (id: number): Promise<Group> => {
    const response = await apiClient.get<Group>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Create new group
  create: async (data: GroupFormData): Promise<Group> => {
    const response = await apiClient.post<Group>(BASE_URL + '/', data);
    return response.data;
  },

  // Update existing group
  update: async (id: number, data: Partial<GroupFormData>): Promise<Group> => {
    const response = await apiClient.patch<Group>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  // Delete group
  delete: async (id: number): Promise<{ message?: string }> => {
    const response = await apiClient.delete<{ message?: string }>(`${BASE_URL}/${id}`);
    return response.data || {};
  },

  // Get all permissions
  getPermissions: async (): Promise<Permission[]> => {
    const collected: Permission[] = [];
    let page = 1;
    const pageSize = 500;
    let totalCount: number | null = null;
    let shouldContinue = true;

    while (shouldContinue) {
      const response = await apiClient.get<{ count?: number; next?: string | null; results?: Permission[] } | Permission[]>(
        '/api/usermanagement/userpermissions/',
        { params: { page_size: pageSize, page } }
      );

      // Handle non-paginated response
      if (Array.isArray(response.data)) {
        return response.data;
      }

      const pageResults = response.data.results || [];
      totalCount = typeof response.data.count === 'number' ? response.data.count : totalCount;
      collected.push(...pageResults);

      // Backend pagination response does not include `next`.
      // Continue until we collect all rows or run out of results.
      if (pageResults.length === 0) {
        shouldContinue = false;
      } else if (totalCount !== null) {
        shouldContinue = collected.length < totalCount;
      } else {
        shouldContinue = pageResults.length === pageSize;
      }

      page += 1;
    }

    return collected;
  },

  // Get all apps with their content types and permissions
  getAppPermissions: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/users/apps/permissions/');
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get mini list (for dropdowns)
  mini: async (): Promise<Group[]> => {
    const response = await apiClient.get<Group[]>(`${BASE_URL}/mini/`);
    return response.data;
  },
};

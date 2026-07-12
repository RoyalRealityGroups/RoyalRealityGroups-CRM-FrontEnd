import apiClient from './axios.config';
import type {
  Authorization,
  AuthorizationDefinition,
  AuthorizationHistory,
  AuthorizationListParams,
  AuthorizationDefinitionListParams,
  ContentType,
  AuthorizationStatusCounts,
  ApprovalRequest,
  BulkApprovalRequest,
  PendingApproversResponse,
} from '../types/authorization.types';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const authorizationApi = {
  listDefinitions: async (params?: AuthorizationDefinitionListParams) => {
    const response = await apiClient.get<PaginatedResponse<AuthorizationDefinition>>(
      '/api/users/authorization_defnitions/',
      { params }
    );
    return response.data;
  },

  getDefinition: async (id: string) => {
    const response = await apiClient.get<AuthorizationDefinition>(
      `/api/users/authorization_defnitions/${id}`
    );
    return response.data;
  },

  createDefinition: async (data: Partial<AuthorizationDefinition>) => {
    const response = await apiClient.post<AuthorizationDefinition>(
      '/api/users/authorization_defnitions/create/',
      data
    );
    return response.data;
  },

  updateDefinition: async (id: string, data: Partial<AuthorizationDefinition>) => {
    const response = await apiClient.put<AuthorizationDefinition>(
      `/api/users/authorization_defnitions/${id}`,
      data
    );
    return response.data;
  },

  deleteDefinition: async (id: string) => {
    await apiClient.delete(`/api/users/authorization_defnitions/${id}`);
  },

  list: async (params?: AuthorizationListParams) => {
    const response = await apiClient.get<PaginatedResponse<Authorization>>(
      '/api/users/authorizations/',
      { params }
    );
    return response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get<Authorization>(
      `/api/users/authorizations/${id}/`
    );
    return response.data;
  },

  create: async (data: Partial<Authorization>) => {
    const response = await apiClient.post<Authorization>(
      '/api/users/authorizations/create/',
      data
    );
    return response.data;
  },

  update: async (id: string, data: Partial<Authorization>) => {
    const response = await apiClient.put<Authorization>(
      `/api/users/authorizations/${id}/`,
      data
    );
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/api/users/authorizations/${id}/`);
  },

  getHistory: async (modelPath: string, instanceId: string) => {
    const response = await apiClient.get<AuthorizationHistory[]>(
      `/api/users/authorization_history/${modelPath}/${instanceId}/`
    );
    return response.data;
  },

  approve: async (appLabel: string, modelName: string, request: ApprovalRequest) => {
    const response = await apiClient.post(
      `/api/users/authorization/${appLabel}/${modelName}/`,
      { ...request, authorized_status: 2 }
    );
    return response.data;
  },

  reject: async (appLabel: string, modelName: string, request: ApprovalRequest) => {
    const response = await apiClient.post(
      `/api/users/authorization/${appLabel}/${modelName}/`,
      { ...request, authorized_status: 3 }
    );
    return response.data;
  },

  bulkApprove: async (appLabel: string, modelName: string, requests: BulkApprovalRequest) => {
    const response = await apiClient.post(
      `/api/users/bulk-authorization/${appLabel}/${modelName}/`,
      requests
    );
    return response.data;
  },

  getStatusCounts: async (appLabel: string, modelName: string) => {
    const response = await apiClient.get<AuthorizationStatusCounts>(
      `/api/users/get_authorization_status/${appLabel}/${modelName}/`
    );
    return response.data;
  },

  getContentTypes: async () => {
    const response = await apiClient.get<PaginatedResponse<ContentType>>(
      '/api/users/authorization_contenttypes/'
    );
    return response.data.results;
  },

  getLocationsByCompany: async (companyId: string) => {
    const response = await apiClient.get<Array<{ id: string; name: string }>>(
      `/api/users/locations-by-company/${companyId}/`
    );
    return response.data;
  },

  getUsersByCompanyLocation: async (companyId: string, locationId: string) => {
    const response = await apiClient.get<Array<{ id: string; username: string; first_name: string; last_name: string; email: string }>>(
      '/api/users/users-by-company-location/',
      { params: { company: companyId, location: locationId } }
    );
    return response.data;
  },

  canAuthorize: async (appLabel: string, modelName: string, instanceId: string) => {
    const response = await apiClient.get<{ can_authorize: boolean }>(
      `/api/users/can_authorize/${appLabel}/${modelName}/${instanceId}/`
    );
    return response.data;
  },

  getPendingAuthorizations: async (appLabel: string, modelName: string, params?: Record<string, any>) => {
    const response = await apiClient.get<PaginatedResponse<any>>(
      `/api/users/pending_authorizations/${appLabel}/${modelName}/`,
      { params }
    );
    return response.data;
  },
  getPendingApprovers: async (appLabel: string, modelName: string, instanceId: string) => {
    const response = await apiClient.get<PendingApproversResponse>(
      `/api/users/pending_approvers/${appLabel}/${modelName}/${instanceId}/`
    );
    return response.data;
  },
};

import apiClient from './axios.config';
import type {
  AlertTrigger,
  AlertTriggerPayload,
  AlertTriggerListParams,
  EventsMetadataResponse,
  TemplateMini,
} from '../types/alertTrigger.types';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const alertTriggerApi = {
  /**
   * List all alert triggers with pagination, search, and filters.
   */
  list: async (params?: AlertTriggerListParams): Promise<PaginatedResponse<AlertTrigger>> => {
    const response = await apiClient.get('/api/system/alertconfigs/', { params });
    return response.data;
  },

  /**
   * Get a single alert trigger by ID.
   */
  get: async (id: number): Promise<AlertTrigger> => {
    const response = await apiClient.get(`/api/system/alertconfigs/${id}`);
    return response.data;
  },

  /**
   * Create a new alert trigger.
   */
  create: async (payload: AlertTriggerPayload): Promise<AlertTrigger> => {
    const response = await apiClient.post('/api/system/alertconfigs/create/', payload);
    return response.data;
  },

  /**
   * Update an existing alert trigger.
   */
  update: async (id: number, payload: Partial<AlertTriggerPayload>): Promise<AlertTrigger> => {
    const response = await apiClient.put(`/api/system/alertconfigs/${id}`, payload);
    return response.data;
  },

  /**
   * Delete (soft-delete) an alert trigger.
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/system/alertconfigs/${id}`);
  },

  /**
   * Toggle is_active status.
   */
  toggleStatus: async (id: number, is_active: boolean): Promise<{ id: number; is_active: boolean }> => {
    const response = await apiClient.patch(`/api/system/alertconfigs/${id}/status/`, { is_active });
    return response.data;
  },

  /**
   * Get events metadata — modules, events, channels, recipient types, etc.
   */
  getEventsMetadata: async (): Promise<EventsMetadataResponse> => {
    const response = await apiClient.get('/api/system/alertconfigs/events/');
    return response.data;
  },

  /**
   * Get available templates (mini list for dropdowns).
   */
  getTemplates: async (search?: string): Promise<TemplateMini[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    const response = await apiClient.get('/api/system/template/mini/', { params });
    const data = response.data;
    return data?.results ?? data ?? [];
  },
};

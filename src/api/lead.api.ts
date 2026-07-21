import apiClient from './axios.config';
import type {
  Lead,
  LeadFormData,
  LeadFollowUp,
  LeadFollowUpFormData,
  LeadChoices,
  CrossCheckRequest,
  CrossCheckResult,
  LeadListParams,
  LeadListResponse,
  LeadFollowUpListResponse,
} from '../types/lead.types';

export const leadApi = {
  // Lead CRUD
  getLeads: async (params?: LeadListParams): Promise<LeadListResponse> => {
    const response = await apiClient.get('/api/lead/leads/', { params });
    return response.data;
  },

  getLead: async (id: string): Promise<Lead> => {
    const response = await apiClient.get(`/api/lead/leads/${id}/`);
    return response.data;
  },

  createLead: async (data: LeadFormData): Promise<Lead> => {
    const response = await apiClient.post('/api/lead/leads/', data);
    return response.data;
  },

  updateLead: async (id: string, data: LeadFormData): Promise<Lead> => {
    const response = await apiClient.put(`/api/lead/leads/${id}/`, data);
    return response.data;
  },

  deleteLead: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/lead/leads/${id}/`);
  },

  // Cross Lead Check
  crossCheck: async (data: CrossCheckRequest): Promise<CrossCheckResult> => {
    const response = await apiClient.post('/api/lead/leads/cross_check/', data);
    return response.data;
  },

  // Get choices (lead sources, statuses, follow-up types)
  getChoices: async (): Promise<LeadChoices> => {
    const response = await apiClient.get('/api/lead/leads/choices/');
    return response.data;
  },

  // Status history
  getStatusHistory: async (leadId: string) => {
    const response = await apiClient.get(`/api/lead/leads/${leadId}/status_history/`);
    return response.data;
  },

  updateLeadStatus: async (leadId: string, status: string, remarks?: string) => {
    const response = await apiClient.post(`/api/lead/leads/${leadId}/update_status/`, {
      status,
      remarks,
    });
    return response.data;
  },

  // Follow-ups
  getFollowUps: async (params?: { page?: number; page_size?: number; lead_id?: string; search?: string; from_date?: string; to_date?: string }): Promise<LeadFollowUpListResponse> => {
    const response = await apiClient.get('/api/lead/followups/', { params });
    return response.data;
  },

  getFollowUp: async (id: string): Promise<LeadFollowUp> => {
    const response = await apiClient.get(`/api/lead/followups/${id}/`);
    return response.data;
  },

  createFollowUp: async (data: LeadFollowUpFormData): Promise<LeadFollowUp> => {
    const response = await apiClient.post('/api/lead/followups/', data);
    return response.data;
  },

  updateFollowUp: async (id: string, data: LeadFollowUpFormData): Promise<LeadFollowUp> => {
    const response = await apiClient.put(`/api/lead/followups/${id}/`, data);
    return response.data;
  },

  deleteFollowUp: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/lead/followups/${id}/`);
  },

  // Follow-up convenience endpoints
  getDueTodayFollowUps: async (): Promise<LeadFollowUpListResponse> => {
    const response = await apiClient.get('/api/lead/followups/due_today/');
    return response.data;
  },

  getOverdueFollowUps: async (): Promise<LeadFollowUpListResponse> => {
    const response = await apiClient.get('/api/lead/followups/overdue/');
    return response.data;
  },

  // Get users for assignment dropdown
  getUsers: async () => {
    const response = await apiClient.get('/api/usermanagement/mini/users/User/', {
      params: { page_size: 1000, is_active: true },
    });
    const data = response.data.results || response.data;
    return (data || []).map((u: any) => ({
      id: u.id,
      name: u.fullname?.trim() || u.username || u.first_name || 'Unknown',
    }));
  },
};

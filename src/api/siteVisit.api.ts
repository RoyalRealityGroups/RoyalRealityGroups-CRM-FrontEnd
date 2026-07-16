import apiClient from './axios.config';
import type {
  SiteVisit,
  SiteVisitFormData,
  SiteVisitListParams,
  SiteVisitListResponse,
} from '../types/siteVisit.types';

const BASE = '/api/sitevisit/site-visits/';

export const siteVisitApi = {
  getSiteVisits: async (params?: SiteVisitListParams): Promise<SiteVisitListResponse> => {
    const response = await apiClient.get(BASE, { params });
    return response.data;
  },

  getSiteVisit: async (id: string): Promise<SiteVisit> => {
    const response = await apiClient.get(`${BASE}${id}/`);
    return response.data;
  },

  createSiteVisit: async (data: SiteVisitFormData | FormData): Promise<SiteVisit> => {
    const response = await apiClient.post(BASE, data);  // ponytail: axios sets multipart header automatically when body is FormData
    return response.data;
  },

  updateSiteVisit: async (id: string, data: SiteVisitFormData | FormData): Promise<SiteVisit> => {
    const response = await apiClient.put(`${BASE}${id}/`, data);
    return response.data;
  },

  deleteSiteVisit: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}${id}/`);
  },

  getChoices: async () => {
    const response = await apiClient.get(`${BASE}choices/`);
    return response.data;
  },

  uploadPhoto: async (id: string, file: File): Promise<{ url: string; photos: string[] }> => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await apiClient.post(`${BASE}${id}/upload-photo/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  removePhoto: async (id: string, url: string): Promise<{ photos: string[] }> => {
    const response = await apiClient.post(`${BASE}${id}/remove-photo/`, { url });
    return response.data;
  },
};
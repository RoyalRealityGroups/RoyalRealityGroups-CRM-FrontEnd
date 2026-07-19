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

  uploadPhotos: async (id: string, files: File[]): Promise<{ photos: unknown[]; count: number }> => {
    const formData = new FormData();
    for (const f of files) formData.append('photos', f);
    const response = await apiClient.post(`${BASE}${id}/upload_photos/`, formData);
    return response.data;
  },
};
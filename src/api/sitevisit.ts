import apiClient from './axios.config';
import type { SiteVisit, SiteVisitFormData, SiteVisitPhoto } from '../types/realestate.types';

export const siteVisitApi = {
  getSiteVisits: async (params?: any) => {
    const response = await apiClient.get('/api/lead/site-visits/', { params });
    return response.data;
  },

  getSiteVisit: async (id: string): Promise<SiteVisit> => {
    const response = await apiClient.get(`/api/lead/site-visits/${id}/`);
    return response.data;
  },

  createSiteVisit: async (data: SiteVisitFormData): Promise<SiteVisit> => {
    const response = await apiClient.post('/api/lead/site-visits/', data);
    return response.data;
  },

  updateSiteVisit: async (id: string, data: SiteVisitFormData): Promise<SiteVisit> => {
    const response = await apiClient.put(`/api/lead/site-visits/${id}/`, data);
    return response.data;
  },

  deleteSiteVisit: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/lead/site-visits/${id}/`);
  },

  updateStatus: async (id: string, status: string, feedback?: string, remarks?: string): Promise<SiteVisit> => {
    const response = await apiClient.patch(`/api/lead/site-visits/${id}/update_status/`, {
      status,
      customer_feedback: feedback,
      remarks
    });
    return response.data;
  },

  uploadPhotos: async (id: string, photos: File[], caption?: string): Promise<{ photos: SiteVisitPhoto[]; count: number }> => {
    const formData = new FormData();
    photos.forEach(photo => {
      formData.append('photos', photo);
    });
    if (caption) {
      formData.append('caption', caption);
    }
    const response = await apiClient.post(`/api/lead/site-visits/${id}/upload_photos/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getChoices: async () => {
    const response = await apiClient.get('/api/lead/site-visits/choices/');
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/api/lead/site-visits/stats/');
    return response.data;
  },
};

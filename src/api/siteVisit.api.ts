import apiClient from './axios.config';
import type {
  SiteVisit,
  SiteVisitFormData,
  SiteVisitListParams,
  SiteVisitListResponse,
  SiteVisitChoices,
} from '../types/siteVisit.types';

const BASE = '/api/sitevisit/site-visits/';

export const siteVisitApi = {
  /** List site visits with server-side pagination, search and filters */
  getSiteVisits: async (params?: SiteVisitListParams): Promise<SiteVisitListResponse> => {
    const response = await apiClient.get(BASE, { params });
    return response.data;
  },

  /** Get a single site visit by ID */
  getSiteVisit: async (id: string): Promise<SiteVisit> => {
    const response = await apiClient.get(`${BASE}${id}/`);
    return response.data;
  },

  /** Schedule a new site visit */
  createSiteVisit: async (data: SiteVisitFormData | FormData): Promise<SiteVisit> => {
    const response = await apiClient.post(BASE, data);
    return response.data;
  },

  /** Update an existing site visit */
  updateSiteVisit: async (id: string, data: SiteVisitFormData | FormData): Promise<SiteVisit> => {
    const response = await apiClient.put(`${BASE}${id}/`, data);
    return response.data;
  },

  /** Delete a site visit */
  deleteSiteVisit: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}${id}/`);
  },

  /** Update status with optional completion details */
  updateStatus: async (
    id: string,
    status: string,
    feedback?: string,
    remarks?: string
  ): Promise<SiteVisit> => {
    const response = await apiClient.patch(`${BASE}${id}/update_status/`, {
      status,
      customer_feedback: feedback,
      remarks,
    });
    return response.data;
  },

  /** Upload photos to a site visit */
  uploadPhotos: async (id: string, files: File[], caption?: string): Promise<{ photos: unknown[]; count: number }> => {
    const formData = new FormData();
    for (const f of files) formData.append('photos', f);
    if (caption) formData.append('caption', caption);
    const response = await apiClient.post(`${BASE}${id}/upload_photos/`, formData);
    return response.data;
  },

  /** Delete a photo from a site visit */
  deletePhoto: async (id: string, photoId: string): Promise<void> => {
    await apiClient.post(`${BASE}${id}/delete_photo/`, { photo_id: photoId });
  },

  /** Get dropdown choices (statuses) */
  getChoices: async (): Promise<SiteVisitChoices> => {
    const response = await apiClient.get(`${BASE}choices/`);
    return response.data;
  },

  /** Get site visit stats for dashboard */
  getStats: async () => {
    const response = await apiClient.get(`${BASE}stats/`);
    return response.data;
  },
};

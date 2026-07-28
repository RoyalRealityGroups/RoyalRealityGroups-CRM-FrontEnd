import apiClient from './axios.config';
import type {
  SiteVisit,
  SiteVisitFormData,
  SiteVisitListParams,
  SiteVisitListResponse,
  SiteVisitChoices,
  SiteVisitCalendarResponse,
  CalendarTodo,
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

  /** Get site visits for calendar view (monthly) */
  getCalendar: async (params: {
    month: number;
    year: number;
    assigned_employee?: string;
    project?: string;
    status?: string;
  }): Promise<SiteVisitCalendarResponse> => {
    const response = await apiClient.get(`${BASE}calendar/`, { params });
    return response.data;
  },

  // --- Calendar To-Do API ---
  /** Get todos for a month */
  getTodos: async (month: number, year: number): Promise<CalendarTodo[]> => {
    const response = await apiClient.get('/api/sitevisit/todos/', { params: { month, year } });
    return response.data;
  },

  /** Create a new todo */
  createTodo: async (date: string, title: string): Promise<CalendarTodo> => {
    const response = await apiClient.post('/api/sitevisit/todos/', { date, title });
    return response.data;
  },

  /** Toggle todo completion or update title */
  updateTodo: async (id: number, data: { is_completed?: boolean; title?: string }): Promise<CalendarTodo> => {
    const response = await apiClient.patch(`/api/sitevisit/todos/${id}/`, data);
    return response.data;
  },

  /** Delete a todo */
  deleteTodo: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/sitevisit/todos/${id}/`);
  },
};

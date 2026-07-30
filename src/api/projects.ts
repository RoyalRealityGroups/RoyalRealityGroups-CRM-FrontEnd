import apiClient from './axios.config';
import type {
  Project,
  ProjectFormData,
  ProjectMini,
  ProjectListParams,
  ProjectChoices,
  ProjectImage,
} from '../types/project.types';

export type { Project, ProjectFormData, ProjectMini, ProjectListParams, ProjectChoices, ProjectImage };

const BASE = '/api/projects';

export const projectsApi = {
  list: async (params?: ProjectListParams) => {
    const response = await apiClient.get(`${BASE}/`, { params });
    return response.data;
  },

  get: async (id: string): Promise<Project> => {
    const response = await apiClient.get(`${BASE}/${id}/`);
    return response.data;
  },

  create: async (data: ProjectFormData): Promise<Project> => {
    const hasFiles = data.elevation_image instanceof File ||
                     data.thumbnail instanceof File ||
                     data.brochure instanceof File ||
                     data.sub instanceof File;
    if (hasFiles) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (value instanceof File) formData.append(key, value);
        else if (Array.isArray(value)) formData.append(key, JSON.stringify(value));
        else formData.append(key, String(value));
      });
      const response = await apiClient.post(`${BASE}/`, formData);
      return response.data;
    }
    const response = await apiClient.post(`${BASE}/`, data);
    return response.data;
  },

  update: async (id: string, data: ProjectFormData): Promise<Project> => {
    const hasFiles = data.elevation_image instanceof File ||
                     data.thumbnail instanceof File ||
                     data.brochure instanceof File ||
                     data.sub instanceof File;
    if (hasFiles) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (value instanceof File) formData.append(key, value);
        else if (Array.isArray(value)) formData.append(key, JSON.stringify(value));
        else formData.append(key, String(value));
      });
      const response = await apiClient.put(`${BASE}/${id}/`, formData);
      return response.data;
    }
    const response = await apiClient.put(`${BASE}/${id}/`, data);
    return response.data;
  },

  patch: async (id: string, data: Partial<ProjectFormData>): Promise<Project> => {
    const response = await apiClient.patch(`${BASE}/${id}/`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}/`);
  },

  mini: async (): Promise<ProjectMini[]> => {
    const response = await apiClient.get(`${BASE}/mini/`);
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  },

  choices: async (): Promise<ProjectChoices> => {
    const response = await apiClient.get(`${BASE}/choices/`);
    return response.data;
  },

  getImages: async (projectId: string, imageType?: string): Promise<ProjectImage[]> => {
    const params = imageType ? { image_type: imageType } : {};
    const response = await apiClient.get(`${BASE}/${projectId}/images/`, { params });
    return response.data;
  },

  uploadImages: async (projectId: string, images: File[], imageType: string = 'GALLERY'): Promise<{ created: ProjectImage[]; count: number }> => {
    const formData = new FormData();
    formData.append('image_type', imageType);
    images.forEach((img) => formData.append('images', img));
    const response = await apiClient.post(`${BASE}/${projectId}/images/upload/`, formData);
    return response.data;
  },

  deleteImage: async (imageId: string): Promise<void> => {
    await apiClient.delete(`${BASE}/images/${imageId}/`);
  },
};

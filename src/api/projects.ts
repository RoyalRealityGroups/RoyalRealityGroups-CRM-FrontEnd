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

export const projectsApi = {
  // List (paginated)
  list: async (params?: ProjectListParams) => {
    const response = await apiClient.get('/api/masters/projects/', { params });
    return response.data;
  },

  // Single
  get: async (id: string): Promise<Project> => {
    const response = await apiClient.get(`/api/masters/projects/${id}/`);
    return response.data;
  },

  // Create
  create: async (data: ProjectFormData): Promise<Project> => {
    // Check if there are file uploads
    const hasFiles = data.elevation_image instanceof File || 
                     data.thumbnail instanceof File || 
                     data.brochure instanceof File ||
                     data.sub instanceof File;
    
    if (hasFiles) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (value instanceof File) {
          formData.append(key, value);
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
      const response = await apiClient.post('/api/masters/projects/', formData);
      return response.data;
    }
    
    const response = await apiClient.post('/api/masters/projects/', data);
    return response.data;
  },

  // Update (full)
  update: async (id: string, data: ProjectFormData): Promise<Project> => {
    // Check if there are file uploads
    const hasFiles = data.elevation_image instanceof File || 
                     data.thumbnail instanceof File || 
                     data.brochure instanceof File ||
                     data.sub instanceof File;
    
    if (hasFiles) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (value instanceof File) {
          formData.append(key, value);
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
      const response = await apiClient.put(`/api/masters/projects/${id}/`, formData);
      return response.data;
    }
    
    const response = await apiClient.put(`/api/masters/projects/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<ProjectFormData>): Promise<Project> => {
    const response = await apiClient.patch(`/api/masters/projects/${id}/`, data);
    return response.data;
  },

  // Delete
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/masters/projects/${id}/`);
  },

  // Mini dropdown list
  mini: async (): Promise<ProjectMini[]> => {
    const response = await apiClient.get('/api/masters/projects/mini/');
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  },

  // Form choices
  choices: async (): Promise<ProjectChoices> => {
    const response = await apiClient.get('/api/masters/projects/choices/');
    return response.data;
  },
  
  // Project Images APIs
  getImages: async (projectId: string, imageType?: string): Promise<ProjectImage[]> => {
    const params = imageType ? { image_type: imageType } : {};
    const response = await apiClient.get(`/api/masters/projects/${projectId}/images/`, { params });
    return response.data;
  },
  
  uploadImages: async (projectId: string, images: File[], imageType: string = 'GALLERY'): Promise<{ created: ProjectImage[]; count: number }> => {
    const formData = new FormData();
    formData.append('image_type', imageType);
    images.forEach((img) => formData.append('images', img));
    const response = await apiClient.post(`/api/masters/projects/${projectId}/images/upload/`, formData);
    return response.data;
  },
  
  deleteImage: async (imageId: string): Promise<void> => {
    await apiClient.delete(`/api/masters/projects/images/${imageId}/`);
  },
};
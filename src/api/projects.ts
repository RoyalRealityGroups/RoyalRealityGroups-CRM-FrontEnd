import apiClient from './axios.config';
import type {
  Project,
  ProjectFormData,
  ProjectMini,
  ProjectListParams,
  ProjectChoices,
} from '../types/project.types';

export type { Project, ProjectFormData, ProjectMini, ProjectListParams, ProjectChoices };

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
    const response = await apiClient.post('/api/masters/projects/', data);
    return response.data;
  },

  // Update (full)
  update: async (id: string, data: ProjectFormData): Promise<Project> => {
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
};
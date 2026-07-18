import apiClient from './axios.config';
import type { Document } from '../types/realestate.types';

export const documentApi = {
  getDocuments: async (params?: any) => {
    const response = await apiClient.get('/api/documents/documents/', { params });
    return response.data;
  },

  getDocument: async (id: string): Promise<Document> => {
    const response = await apiClient.get(`/api/documents/documents/${id}/`);
    return response.data;
  },

  createDocument: async (data: {
    title: string;
    document_type: string;
    description?: string;
    file: File;
    linked_to: 'PROJECT' | 'LEAD' | 'BOOKING';
    project?: string;
    lead?: string;
    booking?: string;
    is_public?: boolean;
  }): Promise<Document> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('document_type', data.document_type);
    formData.append('linked_to', data.linked_to);
    formData.append('file', data.file);
    if (data.description) formData.append('description', data.description);
    if (data.project) formData.append('project', data.project);
    if (data.lead) formData.append('lead', data.lead);
    if (data.booking) formData.append('booking', data.booking);
    if (data.is_public !== undefined) formData.append('is_public', String(data.is_public));

    const response = await apiClient.post('/api/documents/documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteDocument: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/documents/documents/${id}/`);
  },

  getChoices: async () => {
    const response = await apiClient.get('/api/documents/documents/choices/');
    return response.data;
  },
};

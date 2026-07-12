import apiClient from './axios.config';
import type { DispatchPlan, DispatchItem, SalesOrderForDispatch } from '../types/dispatch.types';

export const dispatchApi = {
  // Dispatch Plans
  getAll: (params?: any) => 
    apiClient.get('/api/dispatch/plans/', { params }).then(res => res.data),
  
  getById: (id: string) => 
    apiClient.get(`/api/dispatch/plans/${id}/`).then(res => res.data),
  
  create: (data: FormData | any) => 
    apiClient.post('/api/dispatch/plans/', data).then(res => res.data),
  
  update: (id: string, data: FormData | any) => 
    apiClient.put(`/api/dispatch/plans/${id}/`, data).then(res => res.data),
  
  delete: (id: string) => 
    apiClient.delete(`/api/dispatch/plans/${id}/`).then(res => res.data),
  
  // Available Orders
  getAvailableOrders: (params?: any) => 
    apiClient.post('/api/dispatch/available-orders/', params).then(res => res.data),
  
  // Status Count
  getStatusCount: async (): Promise<{ [key: string]: number }> => {
    const response = await apiClient.get('/api/dispatch/dispatchplan/status-count/');
    return response.data;
  },
  
  // Attachments
  uploadAttachment: (planId: string, file: File, attachmentType: string) => {
    const form = new FormData();
    form.append(attachmentType.toLowerCase(), file);
    return apiClient.post(`/api/dispatch/${planId}/attachments/`, form).then(res => res.data);
  },

  // Utilities
  generateDispatchNumber: (locationId: string) => 
    apiClient.get('/api/dispatch/generate-number/', { params: { location: locationId } }).then(res => res.data),
};
import apiClient from './axios.config';
import type { ProofOfDelivery } from '../types/pod.types';

const POD_BASE = '/api/delivery/proofs';

export const podApi = {
  getAll: (params?: any) =>
    apiClient.get(POD_BASE + '/', { params }).then(res => res.data),

  getById: (id: string) =>
    apiClient.get(`${POD_BASE}/${id}/`).then(res => res.data),

  create: (data: FormData) => {
    return apiClient.post(POD_BASE + '/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  },

  update: (id: string, data: FormData) => {
    return apiClient.patch(`${POD_BASE}/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  },

  deleteFile: (podId: string, fileId: string) =>
    apiClient.delete(`${POD_BASE}/${podId}/files/${fileId}/`).then(res => res.data),

  getStatusCount: async (): Promise<{ [key: string]: number }> => {
    const response = await apiClient.get(`${POD_BASE}/status-count/`);
    return response.data;
  },

  generatePODNumber: () =>
    apiClient.get(`${POD_BASE}/generate-pod-number/`).then(res => res.data),
};

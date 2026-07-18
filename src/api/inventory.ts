import apiClient from './axios.config';
import type {
  PlotInventory,
  PlotInventoryFormData,
  FlatInventory,
  FlatInventoryFormData
} from '../types/realestate.types';

export const inventoryApi = {
  // Plots
  getPlots: async (params?: any) => {
    const response = await apiClient.get('/api/inventory/plots/', { params });
    return response.data;
  },

  getPlot: async (id: string): Promise<PlotInventory> => {
    const response = await apiClient.get(`/api/inventory/plots/${id}/`);
    return response.data;
  },

  createPlot: async (data: PlotInventoryFormData): Promise<PlotInventory> => {
    const response = await apiClient.post('/api/inventory/plots/', data);
    return response.data;
  },

  updatePlot: async (id: string, data: PlotInventoryFormData): Promise<PlotInventory> => {
    const response = await apiClient.put(`/api/inventory/plots/${id}/`, data);
    return response.data;
  },

  deletePlot: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/inventory/plots/${id}/`);
  },

  updatePlotStatus: async (id: string, status: string): Promise<PlotInventory> => {
    const response = await apiClient.patch(`/api/inventory/plots/${id}/update_status/`, { status });
    return response.data;
  },

  getPlotChoices: async () => {
    const response = await apiClient.get('/api/inventory/plots/choices/');
    return response.data;
  },

  getPlotStats: async (params?: { project?: string }) => {
    const response = await apiClient.get('/api/inventory/plots/stats/', { params });
    return response.data;
  },

  // Flats
  getFlats: async (params?: any) => {
    const response = await apiClient.get('/api/inventory/flats/', { params });
    return response.data;
  },

  getFlat: async (id: string): Promise<FlatInventory> => {
    const response = await apiClient.get(`/api/inventory/flats/${id}/`);
    return response.data;
  },

  createFlat: async (data: FlatInventoryFormData): Promise<FlatInventory> => {
    const response = await apiClient.post('/api/inventory/flats/', data);
    return response.data;
  },

  updateFlat: async (id: string, data: FlatInventoryFormData): Promise<FlatInventory> => {
    const response = await apiClient.put(`/api/inventory/flats/${id}/`, data);
    return response.data;
  },

  deleteFlat: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/inventory/flats/${id}/`);
  },

  updateFlatStatus: async (id: string, status: string): Promise<FlatInventory> => {
    const response = await apiClient.patch(`/api/inventory/flats/${id}/update_status/`, { status });
    return response.data;
  },

  getFlatChoices: async () => {
    const response = await apiClient.get('/api/inventory/flats/choices/');
    return response.data;
  },

  getFlatStats: async (params?: { project?: string }) => {
    const response = await apiClient.get('/api/inventory/flats/stats/', { params });
    return response.data;
  },
};

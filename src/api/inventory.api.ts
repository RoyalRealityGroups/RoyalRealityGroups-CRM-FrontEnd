import apiClient from './axios.config';
import type {
  Plot,
  Flat,
  PlotFormData,
  FlatFormData,
  InventoryListParams,
  InventoryListResponse,
  InventoryChoices,
} from '../types/inventory.types';

const PLOTS = '/api/inventory/plots/';
const FLATS = '/api/inventory/flats/';

export const inventoryApi = {
  // Plots
  getPlots: async (params?: InventoryListParams): Promise<InventoryListResponse<Plot>> => {
    const response = await apiClient.get(PLOTS, { params });
    return response.data;
  },
  getPlot: async (id: string): Promise<Plot> => {
    const response = await apiClient.get(`${PLOTS}${id}/`);
    return response.data;
  },
  createPlot: async (data: PlotFormData): Promise<Plot> => {
    const response = await apiClient.post(PLOTS, data);
    return response.data;
  },
  updatePlot: async (id: string, data: PlotFormData): Promise<Plot> => {
    const response = await apiClient.put(`${PLOTS}${id}/`, data);
    return response.data;
  },
  deletePlot: async (id: string): Promise<void> => {
    await apiClient.delete(`${PLOTS}${id}/`);
  },

  // Flats
  getFlats: async (params?: InventoryListParams): Promise<InventoryListResponse<Flat>> => {
    const response = await apiClient.get(FLATS, { params });
    return response.data;
  },
  getFlat: async (id: string): Promise<Flat> => {
    const response = await apiClient.get(`${FLATS}${id}/`);
    return response.data;
  },
  createFlat: async (data: FlatFormData): Promise<Flat> => {
    const response = await apiClient.post(FLATS, data);
    return response.data;
  },
  updateFlat: async (id: string, data: FlatFormData): Promise<Flat> => {
    const response = await apiClient.put(`${FLATS}${id}/`, data);
    return response.data;
  },
  deleteFlat: async (id: string): Promise<void> => {
    await apiClient.delete(`${FLATS}${id}/`);
  },

  // Choices
  getPlotChoices: async (): Promise<InventoryChoices> => {
    const response = await apiClient.get(`${PLOTS}choices/`);
    return response.data;
  },
  getFlatChoices: async (): Promise<InventoryChoices> => {
    const response = await apiClient.get(`${FLATS}choices/`);
    return response.data;
  },

  // Projects (reused from Masters app)
  getProjects: async () => {
    const response = await apiClient.get('/api/masters/projects/', {
      params: { page_size: 1000, is_active: true },
    });
    return response.data.results || response.data;
  },
};
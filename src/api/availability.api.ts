import apiClient from './axios.config';
import type {
  AvailabilityProject,
  AvailabilityProjectListItem,
  AvailabilityProjectFormData,
  AvailabilityBlock,
  AvailabilityBlockFormData,
  AvailabilityUnit,
  AvailabilityUnitFormData,
  AvailabilityChoices,
  AvailabilityListResponse,
  AvailabilityListParams,
  ProjectStats,
  BlockStats,
  WizardUnit,
} from '../types/availability.types';

const BASE = '/api/availability';

// ── helpers ───────────────────────────────────────────────────────────────────

function buildFormData(data: AvailabilityProjectFormData): FormData {
  const fd = new FormData();
  // These are frontend-only display fields — never send to backend
  const skipFields = ['existingThumbnailUrl', 'existingBrochureUrl'];
  (Object.keys(data) as (keyof AvailabilityProjectFormData)[]).forEach((key) => {
    if (skipFields.includes(key)) return;
    const val = data[key];
    if (val === null || val === undefined || val === '') return;
    if (val instanceof File) {
      fd.append(key, val);
    } else {
      fd.append(key, String(val));
    }
  });
  return fd;
}

// ── Projects ──────────────────────────────────────────────────────────────────

export const availabilityApi = {
  // list — returns lightweight ProjectListItem[]
  getProjects: async (
    params?: AvailabilityListParams,
  ): Promise<AvailabilityListResponse<AvailabilityProjectListItem>> => {
    const res = await apiClient.get(`${BASE}/projects/`, { params });
    return res.data;
  },

  // full detail with blocks + images
  getProject: async (id: string): Promise<AvailabilityProject> => {
    const res = await apiClient.get(`${BASE}/projects/${id}/`);
    return res.data;
  },

  // create — uses FormData to handle thumbnail / brochure upload
  createProject: async (data: AvailabilityProjectFormData): Promise<AvailabilityProject> => {
    const res = await apiClient.post(`${BASE}/projects/`, buildFormData(data));
    return res.data;
  },

  // update — full replace
  updateProject: async (
    id: string,
    data: AvailabilityProjectFormData,
  ): Promise<AvailabilityProject> => {
    const res = await apiClient.patch(`${BASE}/projects/${id}/`, buildFormData(data));
    return res.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/projects/${id}/`);
  },

  // per-project unit stats + per-block breakdown
  getProjectStats: async (id: string): Promise<ProjectStats> => {
    const res = await apiClient.get(`${BASE}/projects/${id}/stats/`);
    return res.data;
  },

  // all dropdowns
  getChoices: async (): Promise<AvailabilityChoices> => {
    const res = await apiClient.get(`${BASE}/projects/choices/`);
    return res.data;
  },

  // bulk image upload
  uploadImages: async (
    projectId: string,
    files: File[],
    imageType = 'GALLERY',
  ): Promise<any[]> => {
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    fd.append('image_type', imageType);
    const res = await apiClient.post(`${BASE}/projects/${projectId}/images/upload/`, fd);
    return res.data;
  },

  deleteImage: async (imageId: string): Promise<void> => {
    await apiClient.delete(`${BASE}/images/${imageId}/`);
  },

  // ── Blocks ─────────────────────────────────────────────────────────────────

  getBlocks: async (projectId: string): Promise<AvailabilityBlock[]> => {
    const res = await apiClient.get(`${BASE}/blocks/`, {
      params: { project: projectId, page_size: 500 },
    });
    // router returns paginated or plain array depending on pagination config
    return res.data?.results ?? res.data;
  },

  getBlock: async (blockId: string): Promise<AvailabilityBlock> => {
    const res = await apiClient.get(`${BASE}/blocks/${blockId}/`);
    return res.data;
  },

  createBlock: async (data: AvailabilityBlockFormData): Promise<AvailabilityBlock> => {
    const res = await apiClient.post(`${BASE}/blocks/`, data);
    return res.data;
  },

  updateBlock: async (
    blockId: string,
    data: Partial<AvailabilityBlockFormData>,
  ): Promise<AvailabilityBlock> => {
    const res = await apiClient.patch(`${BASE}/blocks/${blockId}/`, data);
    return res.data;
  },

  deleteBlock: async (blockId: string): Promise<void> => {
    await apiClient.delete(`${BASE}/blocks/${blockId}/`);
  },

  // all units for a block (full list, no pagination)
  getBlockUnits: async (blockId: string): Promise<AvailabilityUnit[]> => {
    const res = await apiClient.get(`${BASE}/blocks/${blockId}/units/`);
    return res.data;
  },

  // per-block stats
  getBlockStats: async (blockId: string): Promise<BlockStats> => {
    const res = await apiClient.get(`${BASE}/blocks/${blockId}/stats/`);
    return res.data;
  },

  // atomic replace-all units for a block
  bulkCreateUnits: async (
    blockId: string,
    units: Omit<WizardUnit, 'tempId'>[],
  ): Promise<{ created: number; units: AvailabilityUnit[] }> => {
    const payload = units.map((u) => ({
      block: blockId,
      unit_number: u.unit_number,
      unit_type:   u.unit_type   || undefined,
      floor:       u.floor       ? Number(u.floor)             : undefined,
      area_sqft:   u.area_sqft   ? Number(u.area_sqft)         : undefined,
      area_sqyd:   u.area_sqyd   ? Number(u.area_sqyd)         : undefined,
      carpet_area_sqft: u.carpet_area_sqft ? Number(u.carpet_area_sqft) : undefined,
      facing:      u.facing      || undefined,
      price:       u.price       ? Number(u.price)             : undefined,
      status:      u.status,
      remarks:     u.remarks     || undefined,
    }));
    const res = await apiClient.post(`${BASE}/blocks/${blockId}/bulk_units/`, { units: payload });
    return res.data;
  },

  // ── Units ──────────────────────────────────────────────────────────────────

  getUnit: async (unitId: string): Promise<AvailabilityUnit> => {
    const res = await apiClient.get(`${BASE}/units/${unitId}/`);
    return res.data;
  },

  createUnit: async (data: AvailabilityUnitFormData): Promise<AvailabilityUnit> => {
    const res = await apiClient.post(`${BASE}/units/`, data);
    return res.data;
  },

  updateUnit: async (
    unitId: string,
    data: Partial<AvailabilityUnitFormData>,
  ): Promise<AvailabilityUnit> => {
    const res = await apiClient.patch(`${BASE}/units/${unitId}/`, data);
    return res.data;
  },

  deleteUnit: async (unitId: string): Promise<void> => {
    await apiClient.delete(`${BASE}/units/${unitId}/`);
  },

  // quick status toggle from the grid
  updateUnitStatus: async (unitId: string, status: string): Promise<AvailabilityUnit> => {
    const res = await apiClient.patch(`${BASE}/units/${unitId}/update_status/`, { status });
    return res.data;
  },
};

import apiClient from './axios.config';
import { API_ENDPOINTS } from '../utils/constants';
import type {
  Country,
  CountryFormData,
  CountryListParams,
  CountryListResponse,
  State,
  StateFormData,
  StateListParams,
  StateListResponse,
} from '../types/masters.types';

// Channel Configuration API
export const channelConfigApi = {
  getChannelConfig: async (): Promise<{
    enable_superstockist: boolean;
    enable_distributor: boolean;
    enable_retailer: boolean;
  }> => {
    const response = await apiClient.get('/api/masters/channel-config/');
    return response.data;
  },
};

export const generalSettingsApi = {
  getGeneralSettings: async (): Promise<any> => {
    const response = await apiClient.get('/api/general/general-settings/');
    return response.data;
  },
  updateGeneralSettings: async (data: any): Promise<any> => {
    const isFormData = data instanceof FormData;
    const response = await apiClient.patch('/api/general/general-settings/', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },
};

// Country API
export const countryApi = {
  // Get list of countries with optional filters
  getCountries: async (params?: CountryListParams): Promise<CountryListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.COUNTRIES, { params });
    return response.data;
  },

  // Get single country by ID
  getCountry: async (id: string): Promise<Country> => {
    const response = await apiClient.get(`${API_ENDPOINTS.COUNTRIES}${id}/`);
    return response.data;
  },

  // Create new country
  createCountry: async (data: CountryFormData): Promise<Country> => {
    const response = await apiClient.post(API_ENDPOINTS.COUNTRIES, data);
    return response.data;
  },

  // Update existing country
  updateCountry: async (id: string, data: CountryFormData): Promise<Country> => {
    const response = await apiClient.put(`${API_ENDPOINTS.COUNTRIES}${id}/`, data);
    return response.data;
  },

  // Delete country (soft delete)
  deleteCountry: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.COUNTRIES}${id}/`);
  },
};

// State API
export const stateApi = {
  // Get list of states with optional filters
  getStates: async (params?: StateListParams): Promise<StateListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.STATES, { params });
    return response.data;
  },

  // Get single state by ID
  getState: async (id: string): Promise<State> => {
    const response = await apiClient.get(`${API_ENDPOINTS.STATES}${id}/`);
    return response.data;
  },

  // Create new state
  createState: async (data: StateFormData): Promise<State> => {
    const response = await apiClient.post(API_ENDPOINTS.STATES, data);
    return response.data;
  },

  // Update existing state
  updateState: async (id: string, data: StateFormData): Promise<State> => {
    const response = await apiClient.put(`${API_ENDPOINTS.STATES}${id}/`, data);
    return response.data;
  },

  // Delete state (soft delete)
  deleteState: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.STATES}${id}/`);
  },

  // Get mini list for dropdowns
  getStatesMini: async (): Promise<State[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.STATES}mini/`);
    return response.data;
  },
};

// City API
export const cityApi = {
  // Get list of cities with optional filters
  getCities: async (params?: import('../types/masters.types').CityListParams): Promise<import('../types/masters.types').CityListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.CITIES, { params });
    return response.data;
  },

  // Get single city by ID
  getCity: async (id: string): Promise<import('../types/masters.types').City> => {
    const response = await apiClient.get(`${API_ENDPOINTS.CITIES}${id}/`);
    return response.data;
  },

  // Create new city
  createCity: async (data: import('../types/masters.types').CityFormData): Promise<import('../types/masters.types').City> => {
    const response = await apiClient.post(API_ENDPOINTS.CITIES, data);
    return response.data;
  },

  // Update existing city
  updateCity: async (id: string, data: import('../types/masters.types').CityFormData): Promise<import('../types/masters.types').City> => {
    const response = await apiClient.put(`${API_ENDPOINTS.CITIES}${id}/`, data);
    return response.data;
  },

  // Delete city (soft delete)
  deleteCity: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.CITIES}${id}/`);
  },

  // Get mini list for dropdowns
  getCitiesMini: async (): Promise<import('../types/masters.types').City[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.CITIES}mini/`);
    return response.data;
  },
};

// Area API
export const areaApi = {
  // Get paginated list of areas
  getAreas: async (params: import('../types/masters.types').AreaListParams): Promise<import('../types/masters.types').AreaListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.AREAS, { params });
    return response.data;
  },

  // Get single area by ID
  getArea: async (id: string): Promise<import('../types/masters.types').Area> => {
    const response = await apiClient.get(`${API_ENDPOINTS.AREAS}${id}/`);
    return response.data;
  },

  // Create new area
  createArea: async (data: import('../types/masters.types').AreaFormData): Promise<import('../types/masters.types').Area> => {
    const response = await apiClient.post(API_ENDPOINTS.AREAS, data);
    return response.data;
  },

  // Update existing area
  updateArea: async (id: string, data: import('../types/masters.types').AreaFormData): Promise<import('../types/masters.types').Area> => {
    const response = await apiClient.put(`${API_ENDPOINTS.AREAS}${id}/`, data);
    return response.data;
  },

  // Delete area (soft delete)
  deleteArea: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.AREAS}${id}/`);
  },

  // Get mini list for dropdowns
  getAreasMini: async (): Promise<import('../types/masters.types').Area[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.AREAS}mini/`);
    return response.data;
  },
};

// Route API
export const routeApi = {
  getRoutes: async (params: import('../types/masters.types').RouteListParams): Promise<import('../types/masters.types').RouteListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.ROUTES, { params });
    return response.data;
  },

  getRoute: async (id: string): Promise<import('../types/masters.types').Route> => {
    const response = await apiClient.get(`${API_ENDPOINTS.ROUTES}${id}/`);
    return response.data;
  },

  createRoute: async (data: import('../types/masters.types').RouteFormData): Promise<import('../types/masters.types').Route> => {
    const response = await apiClient.post(API_ENDPOINTS.ROUTES, data);
    return response.data;
  },

  updateRoute: async (id: string, data: import('../types/masters.types').RouteFormData): Promise<import('../types/masters.types').Route> => {
    const response = await apiClient.put(`${API_ENDPOINTS.ROUTES}${id}/`, data);
    return response.data;
  },

  deleteRoute: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.ROUTES}${id}/`);
  },

  getRoutesMini: async (params?: { is_active?: boolean }): Promise<import('../types/masters.types').Route[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.ROUTES}mini/`, { params });
    return response.data;
  },
};

// Company API
export const companyApi = {
  // Get paginated list of companies
  getCompanies: async (params: import('../types/masters.types').CompanyListParams): Promise<import('../types/masters.types').CompanyListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.COMPANIES, { params });
    return response.data;
  },

  // Get single company by ID
  getCompany: async (id: string): Promise<import('../types/masters.types').Company> => {
    const response = await apiClient.get(`${API_ENDPOINTS.COMPANIES}${id}/`);
    return response.data;
  },

  // Create new company (with file upload support)
  createCompany: async (data: import('../types/masters.types').CompanyFormData): Promise<import('../types/masters.types').Company> => {
    const formData = new FormData();
    formData.append('code', data.code);
    formData.append('name', data.name);
    if (data.email) formData.append('email', data.email);
    if (data.phone) formData.append('phone', data.phone);
    if (data.city_id) formData.append('city_id', data.city_id);
    if (data.state_id) formData.append('state_id', data.state_id);
    if (data.address) formData.append('address', data.address);
    if (data.pan_number) formData.append('pan_number', data.pan_number);
    if (data.gst_number) formData.append('gst_number', data.gst_number);
    if (data.logo) formData.append('logo', data.logo);
    
    const response = await apiClient.post(API_ENDPOINTS.COMPANIES, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Update existing company (with file upload support)
  updateCompany: async (id: string, data: import('../types/masters.types').CompanyFormData): Promise<import('../types/masters.types').Company> => {
    const formData = new FormData();
    formData.append('code', data.code);
    formData.append('name', data.name);
    if (data.email) formData.append('email', data.email);
    if (data.phone) formData.append('phone', data.phone);
    if (data.city_id) formData.append('city_id', data.city_id);
    if (data.state_id) formData.append('state_id', data.state_id);
    if (data.address) formData.append('address', data.address);
    if (data.pan_number) formData.append('pan_number', data.pan_number);
    if (data.gst_number) formData.append('gst_number', data.gst_number);
    if (data.logo) formData.append('logo', data.logo);
    
    const response = await apiClient.put(`${API_ENDPOINTS.COMPANIES}${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Delete company (soft delete)
  deleteCompany: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.COMPANIES}${id}/`);
  },

  // Get mini list of companies (for dropdowns)
  getCompaniesMini: async (): Promise<import('../types/masters.types').Company[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.COMPANIES}mini/`);
    return response.data;
  },
};

// Location API
export const locationApi = {
  // Get paginated list of locations
  getLocations: async (params: import('../types/masters.types').LocationListParams): Promise<import('../types/masters.types').LocationListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.LOCATIONS, { params });
    return response.data;
  },

  // Get single location by ID
  getLocation: async (id: string): Promise<import('../types/masters.types').Location> => {
    const response = await apiClient.get(`${API_ENDPOINTS.LOCATIONS}${id}/`);
    return response.data;
  },

  // Create new location
  createLocation: async (data: import('../types/masters.types').LocationFormData): Promise<import('../types/masters.types').Location> => {
    const response = await apiClient.post(API_ENDPOINTS.LOCATIONS, data);
    return response.data;
  },

  // Update existing location
  updateLocation: async (id: string, data: import('../types/masters.types').LocationFormData): Promise<import('../types/masters.types').Location> => {
    const response = await apiClient.put(`${API_ENDPOINTS.LOCATIONS}${id}/`, data);
    return response.data;
  },

  // Delete location (soft delete)
  deleteLocation: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.LOCATIONS}${id}/`);
  },

  // Contact management
  getContacts: async (locationId: string): Promise<any[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.LOCATIONS}${locationId}/contacts/`);
    return response.data;
  },

  createContact: async (locationId: string, data: any): Promise<any> => {
    const response = await apiClient.post(`${API_ENDPOINTS.LOCATIONS}${locationId}/contacts/`, data);
    return response.data;
  },

  updateContact: async (locationId: string, contactId: string, data: any): Promise<any> => {
    const response = await apiClient.put(`${API_ENDPOINTS.LOCATIONS}${locationId}/contacts/${contactId}/`, data);
    return response.data;
  },

  deleteContact: async (locationId: string, contactId: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.LOCATIONS}${locationId}/contacts/${contactId}/`);
  },
};

// Warehouse API
export const warehouseApi = {
  // Get paginated list of warehouses
  getWarehouses: async (params: import('../types/masters.types').WarehouseListParams): Promise<import('../types/masters.types').WarehouseListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.WAREHOUSES, { params });
    return response.data;
  },

  // Get single warehouse by ID
  getWarehouse: async (id: string): Promise<import('../types/masters.types').Warehouse> => {
    const response = await apiClient.get(`${API_ENDPOINTS.WAREHOUSES}${id}/`);
    return response.data;
  },

  // Create new warehouse
  createWarehouse: async (data: import('../types/masters.types').WarehouseFormData): Promise<import('../types/masters.types').Warehouse> => {
    const response = await apiClient.post(API_ENDPOINTS.WAREHOUSES, data);
    return response.data;
  },

  // Update existing warehouse
  updateWarehouse: async (id: string, data: import('../types/masters.types').WarehouseFormData): Promise<import('../types/masters.types').Warehouse> => {
    const response = await apiClient.put(`${API_ENDPOINTS.WAREHOUSES}${id}/`, data);
    return response.data;
  },

  // Delete warehouse (soft delete)
  deleteWarehouse: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.WAREHOUSES}${id}/`);
  },
};

// UOM API
export const uomApi = {
  // Get paginated list of UOMs
  getUOMs: async (params?: import('../types/masters.types').UOMListParams): Promise<import('../types/masters.types').UOMListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.UOMS, { params });
    return response.data;
  },

  // Get single UOM by ID
  getUOM: async (id: string): Promise<import('../types/masters.types').UOM> => {
    const response = await apiClient.get(`${API_ENDPOINTS.UOMS}${id}/`);
    return response.data;
  },

  // Create new UOM
  createUOM: async (data: import('../types/masters.types').UOMFormData): Promise<import('../types/masters.types').UOM> => {
    const response = await apiClient.post(API_ENDPOINTS.UOMS, data);
    return response.data;
  },

  // Update existing UOM
  updateUOM: async (id: string, data: import('../types/masters.types').UOMFormData): Promise<import('../types/masters.types').UOM> => {
    const response = await apiClient.put(`${API_ENDPOINTS.UOMS}${id}/`, data);
    return response.data;
  },

  // Delete UOM (soft delete)
  deleteUOM: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.UOMS}${id}/`);
  },

  // Get mini list for dropdowns (no pagination)
  getUOMMini: async (): Promise<import('../types/masters.types').UOM[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.UOMS}mini/`);
    return response.data;
  },
};

// Category API
export const categoryApi = {
  // Get paginated list of categories
  getCategories: async (params?: import('../types/masters.types').CategoryListParams): Promise<import('../types/masters.types').CategoryListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.CATEGORIES, { params });
    return response.data;
  },

  // Get single category by ID
  getCategory: async (id: string): Promise<import('../types/masters.types').Category> => {
    const response = await apiClient.get(`${API_ENDPOINTS.CATEGORIES}${id}/`);
    return response.data;
  },

  // Create new category
  createCategory: async (data: import('../types/masters.types').CategoryFormData): Promise<import('../types/masters.types').Category> => {
    const response = await apiClient.post(API_ENDPOINTS.CATEGORIES, data);
    return response.data;
  },

  // Update existing category
  updateCategory: async (id: string, data: import('../types/masters.types').CategoryFormData): Promise<import('../types/masters.types').Category> => {
    const response = await apiClient.put(`${API_ENDPOINTS.CATEGORIES}${id}/`, data);
    return response.data;
  },

  // Delete category (soft delete)
  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.CATEGORIES}${id}/`);
  },

  // Get mini list for dropdowns (no pagination)
  getCategoriesMini: async (): Promise<import('../types/masters.types').Category[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.CATEGORIES}mini/`);
    return response.data;
  },
};

// Brand API
export const brandApi = {
  // Get paginated list of brands
  getBrands: async (params?: import('../types/masters.types').BrandListParams): Promise<import('../types/masters.types').BrandListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.BRANDS, { params });
    return response.data;
  },

  // Get single brand by ID
  getBrand: async (id: string): Promise<import('../types/masters.types').Brand> => {
    const response = await apiClient.get(`${API_ENDPOINTS.BRANDS}${id}/`);
    return response.data;
  },

  // Create new brand
  createBrand: async (data: import('../types/masters.types').BrandFormData): Promise<import('../types/masters.types').Brand> => {
    const response = await apiClient.post(API_ENDPOINTS.BRANDS, data);
    return response.data;
  },

  // Update existing brand
  updateBrand: async (id: string, data: import('../types/masters.types').BrandFormData): Promise<import('../types/masters.types').Brand> => {
    const response = await apiClient.put(`${API_ENDPOINTS.BRANDS}${id}/`, data);
    return response.data;
  },

  // Delete brand (soft delete)
  deleteBrand: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.BRANDS}${id}/`);
  },

  // Get mini list for dropdowns (no pagination)
  getBrandsMini: async (): Promise<import('../types/masters.types').Brand[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.BRANDS}mini/`);
    return response.data;
  },
};

// Tax API
export const taxApi = {
  getTaxes: async (params?: import('../types/masters.types').TaxListParams): Promise<import('../types/masters.types').TaxListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.TAXES, { params });
    return response.data;
  },

  getTax: async (id: string): Promise<import('../types/masters.types').Tax> => {
    const response = await apiClient.get(`${API_ENDPOINTS.TAXES}${id}/`);
    return response.data;
  },

  createTax: async (data: import('../types/masters.types').TaxFormData): Promise<import('../types/masters.types').Tax> => {
    const response = await apiClient.post(API_ENDPOINTS.TAXES, data);
    return response.data;
  },

  updateTax: async (id: string, data: import('../types/masters.types').TaxFormData): Promise<import('../types/masters.types').Tax> => {
    const response = await apiClient.put(`${API_ENDPOINTS.TAXES}${id}/`, data);
    return response.data;
  },

  deleteTax: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.TAXES}${id}/`);
  },

  getTaxesMini: async (): Promise<import('../types/masters.types').Tax[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.TAXES}mini/`);
    return response.data;
  },
};

// Item Tax Composition API
export const itemTaxCompositionApi = {
  // Get list of item tax compositions with optional filters
  getItemTaxCompositions: async (
    params?: import('../types/masters.types').ItemTaxCompositionListParams
  ): Promise<import('../types/masters.types').ItemTaxCompositionListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.ITEM_TAX_COMPOSITIONS, { params });
    return response.data;
  },

  // Get single item tax composition by ID
  getItemTaxComposition: async (id: string): Promise<import('../types/masters.types').ItemTaxComposition> => {
    const response = await apiClient.get(`${API_ENDPOINTS.ITEM_TAX_COMPOSITIONS}${id}/`);
    return response.data;
  },

  // Get current tax composition for a specific item
  getItemCurrentTaxComposition: async (itemId: string): Promise<import('../types/masters.types').ItemTaxComposition[]> => {
    const response = await apiClient.get(`/api/masters/items/${itemId}/current-tax-composition/`);
    return response.data;
  },

  // Create new item tax composition
  createItemTaxComposition: async (
    data: import('../types/masters.types').ItemTaxCompositionFormData
  ): Promise<import('../types/masters.types').ItemTaxComposition> => {
    const response = await apiClient.post(API_ENDPOINTS.ITEM_TAX_COMPOSITIONS, data);
    return response.data;
  },

  // Update existing item tax composition
  updateItemTaxComposition: async (
    id: string,
    data: import('../types/masters.types').ItemTaxCompositionFormData
  ): Promise<import('../types/masters.types').ItemTaxComposition> => {
    const response = await apiClient.put(`${API_ENDPOINTS.ITEM_TAX_COMPOSITIONS}${id}/`, data);
    return response.data;
  },

  // Delete item tax composition
  deleteItemTaxComposition: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.ITEM_TAX_COMPOSITIONS}${id}/`);
  },
};

// OutletType API
export const outletTypeApi = {
  getOutletTypes: async (params?: import('../types/masters.types').OutletTypeListParams): Promise<import('../types/masters.types').OutletTypeListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.OUTLET_TYPES, { params });
    return response.data;
  },

  getOutletType: async (id: string): Promise<import('../types/masters.types').OutletType> => {
    const response = await apiClient.get(`${API_ENDPOINTS.OUTLET_TYPES}${id}/`);
    return response.data;
  },

  createOutletType: async (data: import('../types/masters.types').OutletTypeFormData): Promise<import('../types/masters.types').OutletType> => {
    const response = await apiClient.post(API_ENDPOINTS.OUTLET_TYPES, data);
    return response.data;
  },

  updateOutletType: async (id: string, data: import('../types/masters.types').OutletTypeFormData): Promise<import('../types/masters.types').OutletType> => {
    const response = await apiClient.put(`${API_ENDPOINTS.OUTLET_TYPES}${id}/`, data);
    return response.data;
  },

  deleteOutletType: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.OUTLET_TYPES}${id}/`);
  },

  getOutletTypesMini: async (): Promise<import('../types/masters.types').OutletType[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.OUTLET_TYPES}mini/`);
    return response.data;
  },
};

// Agent/Broker API
export const agentApi = {
  getAgents: async (params?: import('../types/masters.types').AgentListParams): Promise<import('../types/masters.types').AgentListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.AGENTS, { params });
    return response.data;
  },

  getAgent: async (id: string): Promise<import('../types/masters.types').Agent> => {
    const response = await apiClient.get(`${API_ENDPOINTS.AGENTS}${id}/`);
    return response.data;
  },

  createAgent: async (data: import('../types/masters.types').AgentFormData): Promise<import('../types/masters.types').Agent> => {
    const response = await apiClient.post(API_ENDPOINTS.AGENTS, data);
    return response.data;
  },

  updateAgent: async (id: string, data: import('../types/masters.types').AgentFormData): Promise<import('../types/masters.types').Agent> => {
    const response = await apiClient.put(`${API_ENDPOINTS.AGENTS}${id}/`, data);
    return response.data;
  },

  deleteAgent: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.AGENTS}${id}/`);
  },

  getAgentsMini: async (): Promise<import('../types/masters.types').Agent[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.AGENTS}mini/`);
    return response.data;
  },
};

// Item API
export const itemApi = {
  getItems: async (params?: import('../types/masters.types').ItemListParams): Promise<import('../types/masters.types').ItemListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.ITEMS, { params });
    return response.data;
  },

  getItem: async (id: string): Promise<import('../types/masters.types').Item> => {
    const response = await apiClient.get(`${API_ENDPOINTS.ITEMS}${id}/`);
    return response.data;
  },

  createItem: async (data: import('../types/masters.types').ItemFormData): Promise<import('../types/masters.types').Item> => {
    const formData = new FormData();
    
    // Handle image upload
    if (data.image && data.image instanceof File) {
      formData.append('image', data.image);
      delete (data as any).image;
    }
    
    // Append other fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    const response = await apiClient.post(API_ENDPOINTS.ITEMS, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateItem: async (id: string, data: import('../types/masters.types').ItemFormData): Promise<import('../types/masters.types').Item> => {
    const formData = new FormData();
    
    // Handle image upload
    if (data.image && data.image instanceof File) {
      formData.append('image', data.image);
      delete (data as any).image;
    }
    
    // Append other fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    const response = await apiClient.put(`${API_ENDPOINTS.ITEMS}${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteItem: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.ITEMS}${id}/`);
  },

  getItemsMini: async (params?: { item_type?: number; is_active?: boolean }): Promise<import('../types/masters.types').Item[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.ITEMS}mini/`, { params });
    return response.data;
  },
};



// ==================== Channel Partner APIs ====================

// Superstockist API
export const superstockistApi = {
  getSuperstockists: async (params?: import('../types/masters.types').SuperstockistListParams): Promise<import('../types/masters.types').SuperstockistListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.SUPERSTOCKISTS, { params });
    return response.data;
  },

  getSuperstockist: async (id: string): Promise<import('../types/masters.types').Superstockist> => {
    const response = await apiClient.get(`${API_ENDPOINTS.SUPERSTOCKISTS}${id}/`);
    return response.data;
  },

  createSuperstockist: async (data: import('../types/masters.types').SuperstockistFormData): Promise<import('../types/masters.types').Superstockist> => {
    const response = await apiClient.post(API_ENDPOINTS.SUPERSTOCKISTS, data);
    return response.data;
  },

  updateSuperstockist: async (id: string, data: import('../types/masters.types').SuperstockistFormData): Promise<import('../types/masters.types').Superstockist> => {
    const response = await apiClient.put(`${API_ENDPOINTS.SUPERSTOCKISTS}${id}/`, data);
    return response.data;
  },

  deleteSuperstockist: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.SUPERSTOCKISTS}${id}/`);
  },

  // Location management
  getLocations: async (superstockistId: string): Promise<import('../types/masters.types').SuperstockistLocation[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.SUPERSTOCKISTS}${superstockistId}/locations/`);
    return response.data;
  },

  addLocation: async (superstockistId: string, data: { state: string; city?: string; area?: string }): Promise<import('../types/masters.types').SuperstockistLocation> => {
    const response = await apiClient.post(`${API_ENDPOINTS.SUPERSTOCKISTS}${superstockistId}/locations/`, data);
    return response.data;
  },

  removeLocation: async (superstockistId: string, locationId: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.SUPERSTOCKISTS}${superstockistId}/locations/${locationId}/`);
  },

  // Get mini list for dropdowns
  getSuperstockistsMini: async (): Promise<import('../types/masters.types').Superstockist[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.SUPERSTOCKISTS}mini/`);
    return response.data;
  },

  // Contact management
  getContacts: async (superstockistId: string) => {
    const response = await apiClient.get(`${API_ENDPOINTS.SUPERSTOCKISTS}${superstockistId}/contacts/`);
    return response.data;
  },

  createContact: async (superstockistId: string, data: any) => {
    const response = await apiClient.post(`${API_ENDPOINTS.SUPERSTOCKISTS}${superstockistId}/contacts/`, data);
    return response.data;
  },

  updateContact: async (superstockistId: string, contactId: string, data: any) => {
    const response = await apiClient.put(`${API_ENDPOINTS.SUPERSTOCKISTS}${superstockistId}/contacts/${contactId}/`, data);
    return response.data;
  },

  deleteContact: async (superstockistId: string, contactId: string) => {
    await apiClient.delete(`${API_ENDPOINTS.SUPERSTOCKISTS}${superstockistId}/contacts/${contactId}/`);
  },
};

// Distributor API
export const distributorApi = {
  getDistributors: async (params?: import('../types/masters.types').DistributorListParams): Promise<import('../types/masters.types').DistributorListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.DISTRIBUTORS, { params });
    return response.data;
  },

  getDistributor: async (id: string): Promise<import('../types/masters.types').Distributor> => {
    const response = await apiClient.get(`${API_ENDPOINTS.DISTRIBUTORS}${id}/`);
    return response.data;
  },

  createDistributor: async (data: import('../types/masters.types').DistributorFormData | FormData): Promise<import('../types/masters.types').Distributor> => {
    const response = await apiClient.post(API_ENDPOINTS.DISTRIBUTORS, data);
    return response.data;
  },

  updateDistributor: async (id: string, data: import('../types/masters.types').DistributorFormData): Promise<import('../types/masters.types').Distributor> => {
    const response = await apiClient.put(`${API_ENDPOINTS.DISTRIBUTORS}${id}/`, data);
    return response.data;
  },

  deleteDistributor: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.DISTRIBUTORS}${id}/`);
  },

  // Location management
  getLocations: async (distributorId: string): Promise<import('../types/masters.types').DistributorLocation[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.DISTRIBUTORS}${distributorId}/locations/`);
    return response.data;
  },

  addLocation: async (distributorId: string, data: { state: string; city?: string; area?: string }): Promise<import('../types/masters.types').DistributorLocation> => {
    const response = await apiClient.post(`${API_ENDPOINTS.DISTRIBUTORS}${distributorId}/locations/`, data);
    return response.data;
  },

  removeLocation: async (distributorId: string, locationId: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.DISTRIBUTORS}${distributorId}/locations/${locationId}/`);
  },

  // Get mini list for dropdowns
  getDistributorsMini: async (): Promise<import('../types/masters.types').Distributor[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.DISTRIBUTORS}mini/`);
    return response.data;
  },

  // Contact management
  getContacts: async (distributorId: string) => {
    const response = await apiClient.get(`${API_ENDPOINTS.DISTRIBUTORS}${distributorId}/contacts/`);
    return response.data;
  },

  createContact: async (distributorId: string, data: any) => {
    const response = await apiClient.post(`${API_ENDPOINTS.DISTRIBUTORS}${distributorId}/contacts/`, data);
    return response.data;
  },

  updateContact: async (distributorId: string, contactId: string, data: any) => {
    const response = await apiClient.put(`${API_ENDPOINTS.DISTRIBUTORS}${distributorId}/contacts/${contactId}/`, data);
    return response.data;
  },

  deleteContact: async (distributorId: string, contactId: string) => {
    await apiClient.delete(`${API_ENDPOINTS.DISTRIBUTORS}${distributorId}/contacts/${contactId}/`);
  },
};

// Retailer API
export const retailerApi = {
  getRetailers: async (params?: import('../types/masters.types').RetailerListParams): Promise<import('../types/masters.types').RetailerListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.RETAILERS, { params });
    return response.data;
  },

  getRetailer: async (id: string): Promise<import('../types/masters.types').Retailer> => {
    const response = await apiClient.get(`${API_ENDPOINTS.RETAILERS}${id}/`);
    return response.data;
  },

  createRetailer: async (data: import('../types/masters.types').RetailerFormData): Promise<import('../types/masters.types').Retailer> => {
    const response = await apiClient.post(API_ENDPOINTS.RETAILERS, data);
    return response.data;
  },

  updateRetailer: async (id: string, data: import('../types/masters.types').RetailerFormData): Promise<import('../types/masters.types').Retailer> => {
    const response = await apiClient.put(`${API_ENDPOINTS.RETAILERS}${id}/`, data);
    return response.data;
  },

  deleteRetailer: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.RETAILERS}${id}/`);
  },

  // Location management
  getLocations: async (retailerId: string): Promise<import('../types/masters.types').RetailerLocation[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.RETAILERS}${retailerId}/locations/`);
    return response.data;
  },

  addLocation: async (retailerId: string, data: { state: string; city?: string; area?: string }): Promise<import('../types/masters.types').RetailerLocation> => {
    const response = await apiClient.post(`${API_ENDPOINTS.RETAILERS}${retailerId}/locations/`, data);
    return response.data;
  },

  removeLocation: async (retailerId: string, locationId: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.RETAILERS}${retailerId}/locations/${locationId}/`);
  },

  // Get mini list for dropdowns
  getRetailersMini: async (): Promise<import('../types/masters.types').Retailer[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.RETAILERS}mini/`);
    return response.data;
  },

  // Contact management
  getContacts: async (retailerId: string) => {
    const response = await apiClient.get(`${API_ENDPOINTS.RETAILERS}${retailerId}/contacts/`);
    return response.data;
  },

  createContact: async (retailerId: string, data: any) => {
    const response = await apiClient.post(`${API_ENDPOINTS.RETAILERS}${retailerId}/contacts/`, data);
    return response.data;
  },

  updateContact: async (retailerId: string, contactId: string, data: any) => {
    const response = await apiClient.put(`${API_ENDPOINTS.RETAILERS}${retailerId}/contacts/${contactId}/`, data);
    return response.data;
  },

  deleteContact: async (retailerId: string, contactId: string) => {
    await apiClient.delete(`${API_ENDPOINTS.RETAILERS}${retailerId}/contacts/${contactId}/`);
  },
};

// Price Book API
export const priceBookApi = {
  // Get list of price books with optional filters
  getPriceBooks: async (params?: import('../types/masters.types').PriceBookListParams): Promise<import('../types/masters.types').PriceBookListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.PRICE_BOOKS, { params });
    return response.data;
  },

  // Get mini list for dropdowns
  getPriceBooksMini: async (): Promise<import('../types/masters.types').PriceBookMini[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.PRICE_BOOKS}mini/`);
    return response.data;
  },

  // Get single price book by ID
  getPriceBook: async (id: string): Promise<import('../types/masters.types').PriceBook> => {
    const response = await apiClient.get(`${API_ENDPOINTS.PRICE_BOOKS}${id}/`);
    return response.data;
  },

  // Create new price book
  createPriceBook: async (data: import('../types/masters.types').PriceBookFormData): Promise<import('../types/masters.types').PriceBook> => {
    const response = await apiClient.post(API_ENDPOINTS.PRICE_BOOKS, data);
    return response.data;
  },

  // Update existing price book
  updatePriceBook: async (id: string, data: import('../types/masters.types').PriceBookFormData): Promise<import('../types/masters.types').PriceBook> => {
    const response = await apiClient.put(`${API_ENDPOINTS.PRICE_BOOKS}${id}/`, data);
    return response.data;
  },

  // Delete price book (soft delete)
  deletePriceBook: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.PRICE_BOOKS}${id}/`);
  },

  // Get price history
  getPriceHistory: async (params?: import('../types/masters.types').PriceBookHistoryListParams): Promise<import('../types/masters.types').PriceBookHistoryListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.PRICE_BOOKS_HISTORY, { params });
    return response.data;
  },

  // Get price for item (price resolution)
  getPrice: async (params: import('../types/masters.types').GetPriceParams): Promise<import('../types/masters.types').GetPriceResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.PRICE_BOOKS_GET_PRICE, { params });
    return response.data;
  },

  // Bulk create/update price books
  bulkCreatePriceBooks: async (data: import('../types/masters.types').BulkPriceBookRequest): Promise<import('../types/masters.types').BulkPriceBookResponse> => {
    const response = await apiClient.post(`${API_ENDPOINTS.PRICE_BOOKS}bulk-create/`, data);
    return response.data;
  },

  // Load price grid with parent prices in a single optimized call
  loadGridWithParents: async (data: import('../types/masters.types').LoadGridWithParentsRequest): Promise<import('../types/masters.types').LoadGridWithParentsResponse> => {
    const response = await apiClient.post(`${API_ENDPOINTS.PRICE_BOOKS}load-grid-with-parents/`, data);
    return response.data;
  },

  // Generate document number
  generateDocumentNumber: async (): Promise<{ document_number: string; financial_year: string }> => {
    const response = await apiClient.get(`${API_ENDPOINTS.PRICE_BOOKS}generate-document-number/`);
    return response.data;
  },
};

// Price Book Document API (Document-centric operations)
export const priceBookDocumentApi = {
  // Get list of price book documents
  getDocuments: async (params?: any): Promise<any> => {
    try {
      const response = await apiClient.get('/api/masters/price-book-documents/', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get single document with all price entries
  getDocument: async (id: string): Promise<any> => {
    try {
      const response = await apiClient.get(`/api/masters/price-book-documents/${id}/`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Update document and price entries
  updateDocument: async (id: string, data: any): Promise<any> => {
    try {
      const response = await apiClient.put(`/api/masters/price-book-documents/${id}/update/`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Delete document and all related price entries
  deleteDocument: async (id: string): Promise<any> => {
    try {
      const response = await apiClient.delete(`/api/masters/price-book-documents/${id}/delete/`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Finalize a draft document (changes status from DRAFT to ACTIVE)
  finalizeDraft: async (id: string): Promise<any> => {
    try {
      const response = await apiClient.post(`/api/masters/price-book-documents/${id}/finalize/`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Duplicate an existing document as a draft
  duplicateAsDraft: async (id: string): Promise<any> => {
    try {
      const response = await apiClient.post(`/api/masters/price-book-documents/${id}/duplicate-as-draft/`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// District API
export const districtApi = {
  getDistricts: async (params?: import('../types/masters.types').DistrictListParams): Promise<import('../types/masters.types').DistrictListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.DISTRICTS, { params });
    return response.data;
  },

  getDistrict: async (id: string): Promise<import('../types/masters.types').District> => {
    const response = await apiClient.get(`${API_ENDPOINTS.DISTRICTS}${id}/`);
    return response.data;
  },

  createDistrict: async (data: import('../types/masters.types').DistrictFormData): Promise<import('../types/masters.types').District> => {
    const response = await apiClient.post(API_ENDPOINTS.DISTRICTS, data);
    return response.data;
  },

  updateDistrict: async (id: string, data: import('../types/masters.types').DistrictFormData): Promise<import('../types/masters.types').District> => {
    const response = await apiClient.put(`${API_ENDPOINTS.DISTRICTS}${id}/`, data);
    return response.data;
  },

  deleteDistrict: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.DISTRICTS}${id}/`);
  },

  getDistrictsMini: async (params?: { state?: string }): Promise<import('../types/masters.types').District[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.DISTRICTS}mini/`, { params });
    return response.data;
  },
};

// Mandal API
export const mandalApi = {
  getMandals: async (params?: import('../types/masters.types').MandalListParams): Promise<import('../types/masters.types').MandalListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.MANDALS, { params });
    return response.data;
  },

  getMandal: async (id: string): Promise<import('../types/masters.types').Mandal> => {
    const response = await apiClient.get(`${API_ENDPOINTS.MANDALS}${id}/`);
    return response.data;
  },

  createMandal: async (data: import('../types/masters.types').MandalFormData): Promise<import('../types/masters.types').Mandal> => {
    const response = await apiClient.post(API_ENDPOINTS.MANDALS, data);
    return response.data;
  },

  updateMandal: async (id: string, data: import('../types/masters.types').MandalFormData): Promise<import('../types/masters.types').Mandal> => {
    const response = await apiClient.put(`${API_ENDPOINTS.MANDALS}${id}/`, data);
    return response.data;
  },

  deleteMandal: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.MANDALS}${id}/`);
  },

  getMandalsMini: async (params?: { state?: string; district?: string }): Promise<import('../types/masters.types').Mandal[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.MANDALS}mini/`, { params });
    return response.data;
  },
};

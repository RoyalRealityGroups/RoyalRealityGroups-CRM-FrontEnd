// Masters Module Type Definitions

export interface Country {
  id: string;
  code: string;
  name: string;
}

export interface CountryFormData {
  code: string;
  name: string;
}

export interface CountryListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type CountryListResponse = PaginatedResponse<Country>;

// State Types
export interface State {
  id: string;
  code: string;
  name: string;
  gst_code?: string;
  country: {
    id: string;
    name: string;
  };
}

export interface StateFormData {
  code: string;
  name: string;
  gst_code?: string;
  country_id: string;
}

export interface StateListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  country?: string;
}

export type StateListResponse = PaginatedResponse<State>;

// City Types
export interface City {
  id: string;
  code: string;
  name: string;
  state: {
    id: string;
    name: string;
    country?: {
      id: string;
      name: string;
    };
  };
  country?: {
    id: string;
    name: string;
  };
  district?: {
    id: string;
    code: string;
    name: string;
  };
  mandal?: {
    id: string;
    code: string;
    name: string;
  };
  pincode?: string;
}

export interface CityFormData {
  code: string;
  name: string;
  state_id: string;
  country_id: string;
  district_id?: string;
  mandal_id?: string;
  pincode?: string;
}

export interface CityListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  state?: string;
  country?: string;
}

export type CityListResponse = PaginatedResponse<City>;

// Area Master
export interface Area {
  id: string;
  code: string;
  name: string;
  country: {
    id: string;
    name: string;
  };
  state: {
    id: string;
    name: string;
  };
  district: {
    id: string;
    code: string;
    name: string;
  };
  mandal: {
    id: string;
    code: string;
    name: string;
  };
  city: {
    id: string;
    name: string;
  };
  pincode?: string;
}

export interface AreaFormData {
  code?: string;
  name: string;
  country_id: string;
  state_id: string;
  district_id: string;
  mandal_id: string;
  city_id: string;
  pincode?: string;
  is_active?: boolean;
}

export interface AreaListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  state?: string;
  city?: string;
  is_active?: boolean;
}

export type AreaListResponse = PaginatedResponse<Area>;

// Route Master
export interface RouteCoverage {
  id: string;
  state: string;
  state_name: string;
  city: string;
  city_name: string;
  area: string;
  area_name: string;
}

export interface Route {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  coverages: RouteCoverage[];
  location_summary?: {
    states: number;
    cities: number;
    areas: number;
  } | null;
  created_on?: string;
  modified_on?: string;
}

export interface RouteFormData {
  code?: string;
  name: string;
  is_active: boolean;
  location_states?: string[];
  location_cities?: string[];
  location_areas: string[];
}

export interface RouteListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  state?: string;
  city?: string;
  area?: string;
  is_active?: boolean;
}

export type RouteListResponse = PaginatedResponse<Route>;

// Company Master
export interface Company {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: {
    id: string;
    name: string;
  } | null;
  state: {
    id: string;
    name: string;
  } | null;
  address: string | null;
  pan_number: string | null;
  gst_number: string | null;
  logo: string | null;
}

export interface CompanyFormData {
  code: string;
  name: string;
  email?: string;
  phone?: string;
  state_id?: string;
  district_id?: string;
  mandal_id?: string;
  city_id?: string;
  address?: string;
  pan_number?: string;
  gst_number?: string;
  logo?: File | null;
}

export interface CompanyListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  state?: string;
  city?: string;
}

export type CompanyListResponse = PaginatedResponse<Company>;

// Location Master
export interface Location {
  id: string;
  code: string;
  name: string;
  company?: {
    id: string;
    name: string;
  };
  companies: Array<{
    id: string;
    name: string;
  }>;
  city: {
    id: string;
    name: string;
  };
  state: {
    id: string;
    name: string;
  };
  country: {
    id: string;
    name: string;
  };
  district?: {
    id: string;
    name: string;
  };
  mandal?: {
    id: string;
    name: string;
  };
  address: string | null;
  pincode: string | null;
  erp_code: string | null;
  erp_id: string | null;
}

export interface LocationFormData {
  code: string;
  name: string;
  company_ids: string[];
  city_id: string;
  state_id: string;
  country_id: string;
  district_id?: string;
  mandal_id?: string;
  address?: string;
  pincode?: string;
  erp_code?: string;
  erp_id?: string;
}

export interface LocationListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  company?: string;
  state?: string;
  country?: string;
  city?: string;
}

export type LocationListResponse = PaginatedResponse<Location>;

// Warehouse Master
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location: {
    id: string;
    name: string;
  };
  erp_code: string | null;
  erp_id: string | null;
}

export interface WarehouseFormData {
  code: string;
  name: string;
  location_id: string;
  erp_code?: string;
  erp_id?: string;
}

export interface WarehouseListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  location?: string;
}

export type WarehouseListResponse = PaginatedResponse<Warehouse>;

// UOM (Unit of Measurement) Types
export interface UOM {
  id: string;
  code: string;
  name: string;
  remarks?: string;
  erp_code?: string;
  erp_id?: string;
  created_on?: string;
}

export interface UOMFormData {
  code: string;
  name: string;
  remarks?: string;
  erp_code?: string;
  erp_id?: string;
}

export interface UOMListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export type UOMListResponse = PaginatedResponse<UOM>;

// Category Types
export interface Category {
  id: string;
  code: string;
  name: string;
  parent?: { id: string; name: string } | null;
  parent_name?: string;
  description?: string;
  is_active: boolean;
  erp_code?: string;
  erp_id?: string;
  created_on: string;
}

export interface CategoryFormData {
  code: string;
  name: string;
  parent_id?: string | null;
  description?: string;
  is_active: boolean;
  erp_code?: string;
  erp_id?: string;
}

export interface CategoryListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  is_active?: boolean;
  parent?: string;
}

export type CategoryListResponse = PaginatedResponse<Category>;

// Brand Types
export interface Brand {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  erp_code?: string;
  erp_id?: string;
  created_on: string;
}

export interface BrandFormData {
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  erp_code?: string;
  erp_id?: string;
}

export interface BrandListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  is_active?: boolean;
}

export type BrandListResponse = PaginatedResponse<Brand>;

// Tax Types
export type TaxType = 'GST' | 'CESS' | 'COMPENSATION_CESS';

export interface Tax {
  id: string;
  code: string;
  name: string;
  tax_type: TaxType;
  tax_rate: number;
  description?: string;
  is_active: boolean;
  is_cess: boolean;
  created_on: string;
}

export interface TaxFormData {
  code: string;
  name: string;
  tax_type: string;
  tax_rate: number;
  description?: string;
  is_active: boolean;
}

export interface TaxListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  is_active?: boolean;
  tax_type?: string;
}

export type TaxListResponse = PaginatedResponse<Tax>;

// Item Tax Composition Types
export type CompositionType = 'PRIMARY' | 'CESS';

export interface TaxMini {
  id: string;
  name: string;
  tax_type: TaxType;
  tax_rate: number;
  is_cess: boolean;
}

export interface ItemTaxComposition {
  id: string;
  item: string;
  item_name: string;
  tax: TaxMini;
  tax_id?: string;
  composition_type: CompositionType;
  composition_type_display: string;
  effective_from: string;
  effective_to: string | null;
  created_on: string;
  modified_on: string;
}

export interface ItemTaxCompositionFormData {
  item: string;
  tax: string;
  composition_type: CompositionType;
  effective_from: string;
  effective_to?: string | null;
}

export interface ItemTaxCompositionListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  item?: string;
  composition_type?: CompositionType;
  effective_date?: string;
}

export type ItemTaxCompositionListResponse = PaginatedResponse<ItemTaxComposition>;

// OutletType Types
export interface OutletType {
  id: string;
  code: string;
  name: string;
  erp_code?: string;
  erp_id?: string;
  created_on: string;
}

export interface OutletTypeFormData {
  code: string;
  name: string;
  erp_code?: string;
  erp_id?: string;
}

export interface OutletTypeListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export type OutletTypeListResponse = PaginatedResponse<OutletType>;

// Agent/Broker Types
export interface Agent {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string | null;
  is_active: boolean;
  created_on?: string;
  modified_on?: string;
}

export interface AgentFormData {
  code?: string;
  name: string;
  phone: string;
  email?: string;
  is_active?: boolean;
}

export interface AgentListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  is_active?: boolean;
}

export type AgentListResponse = PaginatedResponse<Agent>;



// Item UOM Conversion Types
export interface ItemUOMConversion {
  id: string;
  item: string;
  alternate_uom: string;
  alternate_uom_name: string;
  base_uom_name: string;
  conversion_factor: number;
  is_default_purchase: boolean;
  is_default_sales: boolean;
  barcode?: string;
  is_active: boolean;
  created_on: string;
}

export interface ItemUOMConversionFormData {
  item?: string;
  alternate_uom: string;
  conversion_factor: number;
  is_default_purchase?: boolean;
  is_default_sales?: boolean;
  barcode?: string;
  is_active?: boolean;
}

// Item Types
export interface Item {
  id: string;
  code: string;
  name: string;
  description?: string;
  short_name?: string;
  barcode?: string;
  sku?: string;
  company?: string;
  company_name?: string;
  
  // Classification
  item_type: number;
  item_type_display: string;
  product_type: number;
  product_type_display: string;
  parent?: string;
  parent_name?: string;
  category?: string;
  category_name?: string;
  brand?: string;
  brand_name?: string;
  bag_weight?: number;
  
  // UOM
  base_uom: string;
  base_uom_name: string;
  uom_conversions?: ItemUOMConversion[];
  
  // Tax & Legal
  hsn_code?: string;
  sac_code?: string;
  tax_category: number;
  tax_category_display: string;
  cess_applicable: boolean;
  cess_rate?: number;
  
  // Pricing
  cost_price?: number;
  selling_price?: number;
  mrp?: number;
  min_price?: number;
  price_includes_tax: boolean;
  
  // Inventory
  is_stockable: boolean;
  track_inventory: boolean;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_level?: number;
  reorder_quantity?: number;
  
  // Specifications
  weight?: number;
  weight_unit?: string;
  length?: number;
  width?: number;
  height?: number;
  
  // Images
  image?: string;
  additional_images?: string[];
  
  // Business Flags
  is_active: boolean;
  is_saleable: boolean;
  is_purchasable: boolean;
  is_featured: boolean;
  allow_discount: boolean;
  allow_negative_stock: boolean;
  
  // Others
  manufacturer?: string;
  warranty_period?: number;
  warranty_description?: string;
  erp_code?: string;
  erp_id?: string;
  sync_with_erp: boolean;
  tags?: string[];
  notes?: string;
  specifications?: string;
  
  // Current Tax
  current_tax?: {
    id: string;
    name: string;
    rate: number;
  };
  
  created_on: string;
  modified_on: string;
}

export interface ItemFormData {
  code: string;
  name: string;
  description?: string;
  short_name?: string;
  barcode?: string;
  sku?: string;
  company?: string;
  
  item_type: number;
  product_type: number;
  parent?: string;
  category?: string;
  brand?: string;
  bag_weight?: number;
  
  base_uom: string;
  
  hsn_code?: string;
  sac_code?: string;
  tax_category: number;
  cess_applicable: boolean;
  cess_rate?: number;
  
  cost_price?: number;
  selling_price?: number;
  mrp?: number;
  min_price?: number;
  price_includes_tax: boolean;
  
  is_stockable: boolean;
  track_inventory: boolean;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_level?: number;
  reorder_quantity?: number;
  
  weight?: number;
  weight_unit?: string;
  length?: number;
  width?: number;
  height?: number;
  
  image?: File | string;
  additional_images?: string[];
  
  is_active: boolean;
  is_saleable: boolean;
  is_purchasable: boolean;
  is_featured: boolean;
  allow_discount: boolean;
  allow_negative_stock: boolean;
  
  manufacturer?: string;
  warranty_period?: number;
  warranty_description?: string;
  erp_code?: string;
  erp_id?: string;
  sync_with_erp: boolean;
  tags?: string[];
  notes?: string;
  specifications?: string;
}

export interface ItemListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  is_active?: boolean;
  item_type?: number | any;
  product_type?: number;
  category?: string;
  brand?: string;
  is_saleable?: boolean;
  is_purchasable?: boolean;
  is_featured?: boolean;
}

export type ItemListResponse = PaginatedResponse<Item>;

// ==================== Channel Partner Types ====================

// Superstockist Types
export interface SuperstockistLocation {
  id: string;
  state: string;
  state_name: string;
  city: string | null;
  city_name: string | null;
  area: string | null;
  area_name: string | null;
}

export interface Superstockist {
  id: string;
  code: string;
  name: string;
  state: string;
  state_name: string;
  city: string | null;
  city_name: string | null;
  area: string | null;
  area_name: string | null;
  address: string | null;
  pincode: string | null;
  shipping_same_as_billing: boolean;
  shipping_state: string | null;
  shipping_state_name: string | null;
  shipping_city: string | null;
  shipping_city_name: string | null;
  shipping_area: string | null;
  shipping_area_name: string | null;
  shipping_address: string | null;
  shipping_pincode: string | null;
  gstin: string | null;
  pan: string | null;
  aadhar: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_ifsc: string | null;
  bank_account_type: string | null;
  google_location: string | null;
  credit_limit: string;
  credit_days: number;
  is_active: boolean;
  effective_from: string | null;
  effective_to: string | null;
  erp_code: string | null;
  company: string;
  company_name: string;
  created_by: string;
  created_by_name: string;
  created_on: string;
  updated_by: string;
  updated_by_name: string;
  updated_on: string;
  locations: SuperstockistLocation[];
}

export interface SuperstockistFormData {
  code: string;
  name: string;
  company_id: string;
  state_id: string;
  city_id?: string;
  area_id?: string;
  address?: string;
  pincode?: string;
  shipping_same_as_billing?: boolean;
  shipping_state_id?: string;
  shipping_city_id?: string;
  shipping_area_id?: string;
  shipping_address?: string;
  shipping_pincode?: string;
  gstin?: string;
  pan?: string;
  aadhar?: string;
  bank_account_number?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_ifsc?: string;
  bank_account_type?: string;
  google_location?: string;
  credit_limit?: number;
  credit_days?: number;
  is_active?: boolean;
  effective_from?: string;
  effective_to?: string;
  erp_code?: string;
}

export interface SuperstockistListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  is_active?: boolean;
  state?: string;
}

export type SuperstockistListResponse = PaginatedResponse<Superstockist>;

// Distributor Types
export interface DistributorLocation {
  id: string;
  state: string;
  state_name: string;
  city: string | null;
  city_name: string | null;
  area: string | null;
  area_name: string | null;
}

export interface Distributor {
  id: string;
  code: string;
  name: string;
  superstockist: string | null;
  superstockist_name: string | null;
  agent: string | null;
  agent_id?: string | null;
  agent_name?: string | null;
  country: string | null;
  country_name: string | null;
  state: string;
  state_name: string;
  district: string | null;
  district_name: string | null;
  mandal: string | null;
  mandal_name: string | null;
  city: string | null;
  city_name: string | null;
  area: string | null;
  area_name: string | null;
  street: string | null;
  address: string | null;
  pincode: string | null;
  shipping_same_as_billing: boolean;
  shipping_country: string | null;
  shipping_country_name: string | null;
  shipping_state: string | null;
  shipping_state_name: string | null;
  shipping_district: string | null;
  shipping_district_name: string | null;
  shipping_mandal: string | null;
  shipping_mandal_name: string | null;
  shipping_city: string | null;
  shipping_city_name: string | null;
  shipping_area: string | null;
  shipping_area_name: string | null;
  shipping_street: string | null;
  shipping_address: string | null;
  shipping_pincode: string | null;
  gstin: string | null;
  pan: string | null;
  aadhar: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_ifsc: string | null;
  bank_account_type: string | null;
  google_location: string | null;
  credit_limit: string;
  credit_days: number;
  is_active: boolean;
  effective_from: string | null;
  effective_to: string | null;
  erp_code: string | null;
  company: string;
  company_name: string;
  created_by: string;
  created_by_name: string;
  created_on: string;
  updated_by: string;
  updated_by_name: string;
  updated_on: string;
  locations: DistributorLocation[];
}

export interface DistributorFormData {
  code: string;
  name: string;
  company_id: string;
  superstockist_id?: string;
  agent_id?: string;
  country_id?: string;
  state_id: string;
  district_id?: string;
  mandal_id?: string;
  city_id?: string;
  area_id?: string;
  street?: string;
  address?: string;
  pincode?: string;
  shipping_same_as_billing?: boolean;
  shipping_country_id?: string;
  shipping_state_id?: string;
  shipping_district_id?: string;
  shipping_mandal_id?: string;
  shipping_city_id?: string;
  shipping_area_id?: string;
  shipping_street?: string;
  shipping_address?: string;
  shipping_pincode?: string;
  gstin?: string;
  pan?: string;
  aadhar?: string;
  bank_account_number?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_ifsc?: string;
  bank_account_type?: string;
  google_location?: string;
  credit_limit?: number;
  credit_days?: number;
  is_active?: boolean;
  effective_from?: string;
  effective_to?: string;
  erp_code?: string;
}

export interface DistributorListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  is_active?: boolean;
  state?: string;
  superstockist?: string;
}

export type DistributorListResponse = PaginatedResponse<Distributor>;

// Retailer Types
export interface RetailerLocation {
  id: string;
  state: string;
  state_name: string;
  city: string | null;
  city_name: string | null;
  area: string | null;
  area_name: string | null;
}

export interface Retailer {
  id: string;
  code: string;
  name: string;
  distributor: string | null;
  distributor_name: string | null;
  country: string | null;
  country_name: string | null;
  state: string;
  state_name: string;
  district: string | null;
  district_name: string | null;
  mandal: string | null;
  mandal_name: string | null;
  city: string | null;
  city_name: string | null;
  area: string | null;
  area_name: string | null;
  street: string | null;
  address: string | null;
  pincode: string | null;
  shipping_same_as_billing: boolean;
  shipping_country: string | null;
  shipping_country_name: string | null;
  shipping_state: string | null;
  shipping_state_name: string | null;
  shipping_district: string | null;
  shipping_district_name: string | null;
  shipping_mandal: string | null;
  shipping_mandal_name: string | null;
  shipping_city: string | null;
  shipping_city_name: string | null;
  shipping_area: string | null;
  shipping_area_name: string | null;
  shipping_street: string | null;
  shipping_address: string | null;
  shipping_pincode: string | null;
  outlet_type: string | null;
  outlet_type_name: string | null;
  outlet_size: string | null;
  gstin: string | null;
  pan: string | null;
  aadhar: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_ifsc: string | null;
  bank_account_type: string | null;
  google_location: string | null;
  credit_limit: string;
  credit_days: number;
  is_active: boolean;
  effective_from: string | null;
  effective_to: string | null;
  erp_code: string | null;
  company: string;
  company_name: string;
  created_by: string;
  created_by_name: string;
  created_on: string;
  updated_by: string;
  updated_by_name: string;
  updated_on: string;
  locations: RetailerLocation[];
}

export interface RetailerFormData {
  code: string;
  name: string;
  distributor_id?: string;
  company_id?: string;
  country_id?: string;
  state_id: string;
  district_id?: string;
  mandal_id?: string;
  city_id?: string;
  area_id?: string;
  street?: string;
  address?: string;
  pincode?: string;
  shipping_same_as_billing?: boolean;
  shipping_country_id?: string;
  shipping_state_id?: string;
  shipping_district_id?: string;
  shipping_mandal_id?: string;
  shipping_city_id?: string;
  shipping_area_id?: string;
  shipping_street?: string;
  shipping_address?: string;
  shipping_pincode?: string;
  outlet_type_id: string;
  outlet_size?: string;
  gstin?: string;
  pan?: string;
  aadhar?: string;
  bank_account_number?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_ifsc?: string;
  bank_account_type?: string;
  google_location?: string;
  credit_limit?: number;
  credit_days?: number;
  is_active?: boolean;
  effective_from?: string;
  effective_to?: string;
  erp_code?: string;
}

export interface RetailerListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  is_active?: boolean;
  state?: string;
  distributor?: string;
  outlet_type?: string;
}

export type RetailerListResponse = PaginatedResponse<Retailer>;

// Channel Configuration Types
export interface ChannelConfiguration {
  enable_superstockist: boolean;
  enable_distributor: boolean;
  enable_retailer: boolean;
  enforce_channel_hierarchy: boolean;
}

// Price Book Types
export type PriceType = 'BASE' | 'GEOGRAPHIC' | 'CHANNEL_PARTNER';

// Price Book Document Status
export enum PriceBookDocumentStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED'
}

export interface PriceBookDocument {
  id: string;
  document_number: string;
  document_date: string;
  location_type: 'BASE' | 'STATE' | 'CITY' | 'AREA' | 'SUPERSTOCKIST' | 'DISTRIBUTOR' | 'RETAILER';
  cp_filter_state?: string | null;
  cp_filter_city?: string | null;
  cp_filter_area?: string | null;
  effective_from: string;
  effective_to?: string | null;
  remarks?: string | null;
  status: PriceBookDocumentStatus;
  status_display: string;
  total_entries: number;
  authorized_status?: number;
  authorized_level?: number;
  created_on: string;
  modified_on: string;
  created_by?: string;
}

export interface PriceBook {
  id: string;
  code: string;
  company: string;
  item: string;
  item_name: string;
  item_code: string;
  document_number?: string;
  document_date?: string;
  price_type: PriceType;
  
  // Geographic scope (nullable)
  state?: string;
  state_name?: string;
  city?: string;
  city_name?: string;
  area?: string;
  area_name?: string;
  
  // Channel partner scope (nullable)
  superstockist?: string;
  superstockist_name?: string;
  distributor?: string;
  distributor_name?: string;
  retailer?: string;
  retailer_name?: string;
  
  // Pricing
  base_price: string;
  selling_price: string;
  mrp: string;
  discount_percentage: string;
  
  // Validity
  effective_from: string;
  effective_to?: string | null;
  is_active: boolean;
  
  // Additional
  remarks?: string;
  erp_code?: string;
  erp_id?: string;
  
  // Computed
  scope_display: string;
  margin_percentage: string;
  
  // Timestamps
  created_on: string;
  modified_on: string;
}

export interface PriceBookFormData {
  code: string;
  item_id: string;
  price_type: PriceType;
  
  // Geographic (optional based on price_type)
  state_id?: string;
  city_id?: string;
  area_id?: string;
  
  // Channel partner (optional based on price_type)
  superstockist_id?: string;
  distributor_id?: string;
  retailer_id?: string;
  
  // Pricing
  base_price: number;
  selling_price: number;
  mrp: number;
  discount_percentage?: number;
  
  // Validity
  effective_from: string;
  effective_to?: string | null;
  is_active?: boolean;
  
  // Additional
  remarks?: string;
  erp_code?: string;
  erp_id?: string;
}

export interface PriceBookListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  item_code?: string;
  item_name?: string;
  price_type?: PriceType;
  state_code?: string;
  city_code?: string;
  area_code?: string;
  superstockist_code?: string;
  distributor_code?: string;
  retailer_code?: string;
  is_active?: boolean;
  effective_from_start?: string;
  effective_from_end?: string;
}

export type PriceBookListResponse = PaginatedResponse<PriceBook>;

export interface PriceBookMini {
  id: string;
  code: string;
  item_name: string;
  selling_price: string;
  mrp: string;
}

// Price Book History
export type PriceBookAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface PriceBookHistory {
  document_number?: string;
  document_date?: string;
  price_book_code?: string;
  price_book_item?: string;
  action: PriceBookAction;
  action_display: string;
  changes: Record<string, { old: any; new: any }>;
  change_summary: string;
  
  // Price snapshot
  base_price?: string;
  selling_price?: string;
  mrp?: string;
  discount_percentage?: string;
  effective_from?: string;
  effective_to?: string;
  is_active?: boolean;
  remarks?: string;
  
  // Audit
  created_on: string;
  created_by_type?: string;
  created_by_identifier?: string;
}

export interface PriceBookHistoryListParams {
  page?: number;
  page_size?: number;
  price_book_id?: string;
  item_code?: string;
  action?: PriceBookAction;
  created_on_start?: string;
  created_on_end?: string;
}

export type PriceBookHistoryListResponse = PaginatedResponse<PriceBookHistory>;

// Get Price Response
export type PriceMatchLevel = 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST' | 'AREA' | 'CITY' | 'STATE' | 'BASE';

export interface GetPriceResponse {
  price: PriceBook;
  match_level: PriceMatchLevel;
  message: string;
}

export interface GetPriceParams {
  item_id: string;
  state_id?: string;
  city_id?: string;
  area_id?: string;
  retailer_id?: string;
  distributor_id?: string;
  superstockist_id?: string;
  date?: string; // YYYY-MM-DD
}

// Optimized price grid load with parent prices
export interface ParentPriceInfo {
  price: string;
  level: 'BASE' | 'STATE' | 'CITY' | 'AREA' | 'SUPERSTOCKIST' | 'DISTRIBUTOR' | 'RETAILER';
  location_id: string | null;
  location_name: string;
}

export interface LoadGridWithParentsRequest {
  location_type: 'BASE' | 'STATE' | 'CITY' | 'AREA' | 'SUPERSTOCKIST' | 'DISTRIBUTOR' | 'RETAILER';
  item_ids: string[];
  location_ids: string[];
  effective_from: string; // YYYY-MM-DD
  channel_config: {
    enable_superstockist: boolean;
    enable_distributor: boolean;
    enable_retailer: boolean;
  };
}

export interface LoadGridWithParentsResponse {
  current_prices: Record<string, string>;
  parent_prices: Record<string, ParentPriceInfo>;
}
// Bulk Price Book Management
export interface BulkPriceBookEntry {
  item_id: string;
  price_type: PriceType;
  
  // Geographic scope
  state_id?: string;
  city_id?: string;
  area_id?: string;
  
  // Channel partner scope
  superstockist_id?: string;
  distributor_id?: string;
  retailer_id?: string;
  
  // Pricing
  base_price: string;
  selling_price: string;
  mrp: string;
  
  // Validity
  effective_from: string;
  effective_to?: string | null;
  is_active: boolean;
}

export interface BulkPriceBookRequest {
  document_number: string;
  document_date: string;
  location_type: 'BASE' | 'STATE' | 'CITY' | 'AREA' | 'SUPERSTOCKIST' | 'DISTRIBUTOR' | 'RETAILER';
  effective_from: string;
  effective_to?: string | null;
  remarks?: string;
  cp_filter_state?: string | null;
  cp_filter_city?: string | null;
  cp_filter_area?: string | null;
  save_as_draft?: boolean;
  prices: BulkPriceBookEntry[];
}

export interface BulkPriceBookResponse {
  success: boolean;
  created: number;
  updated: number;
  total: number;
  message: string;
  document_number?: string;
  errors?: Array<{
    index: number;
    item_id: string;
    errors?: Record<string, string[]>;
    error?: string;
  }>;
}

export interface FinalizeDraftResponse {
  success: boolean;
  message: string;
  document_number: string;
  status: PriceBookDocumentStatus;
}

export interface DuplicateAsDraftResponse {
  success: boolean;
  message: string;
  document_number: string;
  document_id: string;
  entries_copied: number;
}

// Channel Partner Attachment Types
export type AttachmentType = 'AADHAR' | 'PAN' | 'AGREEMENT' | 'SHOP_PICTURE' | 'CANCELLED_CHEQUE' | 'OWNER_PICTURE' | 'OTHER';

export interface ChannelPartnerAttachment {
  id: string;
  attachment_type: AttachmentType;
  attachment_type_display: string;
  file: string;
  file_url: string;
  description?: string;
  uploaded_on: string;
}

export interface AttachmentFormData {
  attachment_type: AttachmentType;
  file: File;
  description?: string;
}
// Scheme Types
export type SchemeType = 'QUANTITY' | 'VALUE' | 'COMBO' | 'SLAB' | 'FLAT';
export type SchemeStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'DRAFT' | 'PENDING_APPROVAL';
export type ConditionType =
  | 'MIN_QUANTITY'
  | 'MIN_VALUE'
  | 'MAX_QUANTITY'
  | 'MAX_VALUE'
  | 'EXACT_QUANTITY'
  | 'QUANTITY_RANGE'
  | 'VALUE_RANGE'
  | 'ITEM_COMBO';
export type BenefitType =
  | 'DISCOUNT_PERCENTAGE'
  | 'DISCOUNT_AMOUNT'
  | 'FREE_ITEM'
  | 'FREE_QUANTITY'
  | 'CASHBACK';
export type CustomerType = 'SUPERSTOCKIST' | 'DISTRIBUTOR' | 'RETAILER' | 'ALL';

export interface SchemeCondition {
  id: string;
  scheme: string;
  condition_type: ConditionType;
  condition_type_display: string;
  value_from?: number;
  value_to?: number;
  logical_operator?: string;
  min_quantity?: number;
  min_value?: number;
  category?: string;
  category_name?: string;
  item?: string;
  item_name?: string;
  items?: string[];
  items_display?: string[];
  created_date: string;
  modified_date: string;
}

export interface SchemeBenefit {
  id: string;
  scheme: string;
  benefit_type: BenefitType;
  benefit_type_display: string;
  discount_value?: number;
  max_discount_amount?: number;
  discount_type?: 'FIXED' | 'PERCENTAGE';
  free_item?: string;
  free_item_name?: string;
  free_quantity?: number;
  apply_to_category?: string;
  apply_to_category_name?: string;
  apply_to_item?: string;
  apply_to_item_name?: string;
  apply_to_all?: boolean;
  loyalty_points?: number;
  gift_item?: string;
  gift_quantity?: number;
  created_date: string;
  modified_date: string;
}

export interface SchemeApplicability {
  id: string;
  scheme: string;
  customer_type: CustomerType;
  customer_type_display: string;
  state?: string;
  state_name?: string;
  city?: string;
  city_name?: string;
  area?: string;
  area_name?: string;
  superstockist?: string;
  superstockist_name?: string;
  distributor?: string;
  distributor_name?: string;
  retailer?: string;
  retailer_name?: string;
  apply_to_all?: boolean;
  created_date: string;
  modified_date: string;
}

export interface SchemeItem {
  id: string;
  scheme: string;
  item?: string;
  item_name?: string;
  category?: string;
  category_name?: string;
  include_all_items?: boolean;
  created_date: string;
  modified_date: string;
}

export interface Scheme {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: SchemeType;
  type_display: string;
  scheme_type?: SchemeType;
  scheme_type_display?: string;
  status: SchemeStatus;
  status_display: string;
  priority: number;
  company?: string;
  company_name?: string;
  effective_from: string;
  effective_to?: string | null;
  authorized_status?: 1 | 2 | 3;
  authorized_status_name?: string;
  authorized_level?: number;
  authorized_by_type?: string | null;
  authorized_by_identifier?: string | null;
  authorized_on?: string | null;
  current_authorized_level?: number;
  current_authorized_status?: 1 | 2 | 3;
  current_authorized_by_type?: string | null;
  current_authorized_by_identifier?: string | null;
  current_authorized_on?: string | null;
  created_by?: string;
  modified_by?: string;
  created_date: string;
  modified_date: string;
  created_by_name?: string;
  modified_by_name?: string;
  // Nested relationships
  conditions?: SchemeCondition[];
  benefits?: SchemeBenefit[];
  applicability?: SchemeApplicability[];
  items?: SchemeItem[];
}

export interface SchemeFormData {
  code: string;
  name: string;
  description?: string;
  type: SchemeType | '';
  status: SchemeStatus;
  priority: number;
  company?: string;
  effective_from: string;
  effective_to?: string | null;
  conditions: Partial<SchemeCondition>[];
  benefits: Partial<SchemeBenefit>[];
  applicability: Partial<SchemeApplicability>[];
  items: Partial<SchemeItem>[];
}

export interface SchemeListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  scheme_type?: SchemeType;
  status?: SchemeStatus;
  priority?: number;
}

export type SchemeListResponse = PaginatedResponse<Scheme>;

export interface SchemeHistoryResponse {
  scheme_id: string;
  scheme_code: string;
  scheme_name: string;
  history: Array<{
    id: string;
    timestamp: string;
    user: string;
    action: string;
    changes: Record<string, unknown>;
  }>;
}

// District Types
export interface District {
  id: string;
  code: string;
  name: string;
  state: {
    id: string;
    name: string;
    code: string;
    country?: {
      id: string;
      name: string;
      code: string;
    };
  };
  country?: {
    id: string;
    name: string;
    code: string;
  };
  created_on?: string;
  modified_on?: string;
}

export interface DistrictFormData {
  code?: string;
  name: string;
  state_id: string;
  country_id: string;
}

export interface DistrictListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  state?: string;
}

export type DistrictListResponse = PaginatedResponse<District>;

// Mandal Types
export interface Mandal {
  id: string;
  code: string;
  name: string;
  district: {
    id: string;
    code: string;
    name: string;
    state?: {
      id: string;
      name: string;
      code: string;
      country?: {
        id: string;
        name: string;
        code: string;
      };
    };
  };
  state: {
    id: string;
    name: string;
    code: string;
    country?: {
      id: string;
      name: string;
      code: string;
    };
  };
  country?: {
    id: string;
    name: string;
    code: string;
  };
  created_on?: string;
  modified_on?: string;
}

export interface MandalFormData {
  code?: string;
  name: string;
  district_id: string;
  state_id: string;
  country_id: string;
}

export interface MandalListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  state?: string;
  district?: string;
}

export type MandalListResponse = PaginatedResponse<Mandal>;


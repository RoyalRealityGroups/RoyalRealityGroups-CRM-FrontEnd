// Application Constants
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8011';
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/users/login/',
  LOGOUT: '/api/users/logout/',
  FORGOT_PASSWORD: '/api/users/forgot-password/',
  VALIDATE_USERNAME: '/api/users/validate-username/',
  VALIDATE_CURRENT_PASSWORD: '/api/users/validate-current-password/',
  CHANGE_PASSWORD: '/api/users/changepassword/',
  TOKEN_REFRESH: '/api/users/token/refresh/',
  CURRENT_USER: '/api/users/iamuser/',
  GET_PERMISSIONS: '/api/usermanagement/permissions/my/',
  PROJECTS: '/api/masters/projects/',
  PROJECTS_MINI: '/api/masters/projects/mini/',
  PROJECTS_CHOICES: '/api/masters/projects/choices/',
  
  // Permission Management
  SCREENS: '/api/users/screens/',
  USER_PERMISSIONS: '/api/users/permissions/',
  PERMISSION_AUDIT: '/api/users/permissions/audit/',
  
  // User Management
  USERS_LIST: '/api/users/',
  USER_DETAIL: '/api/users/detail/',
  
  // System
  USER_MENU: '/api/system/user_menu/',
  MENU: '/api/system/menu/',
  SUBMENU: '/api/system/submenu/',
  MENUITEM: '/api/system/menuitem/',
  
  // Masters
  COUNTRIES: '/api/masters/countries/',
  STATES: '/api/masters/states/',
  DISTRICTS: '/api/masters/districts/',
  MANDALS: '/api/masters/mandals/',
  CITIES: '/api/masters/cities/',
  AREAS: '/api/masters/areas/',
  ROUTES: '/api/masters/routes/',
  COMPANIES: '/api/masters/companies/',
  LOCATIONS: '/api/masters/locations/',
  COMPANIES_DROPDOWN: '/api/usermanagement/dropdowns/companies/',
  LOCATIONS_DROPDOWN: '/api/usermanagement/dropdowns/locations/',
  WAREHOUSES: '/api/masters/warehouses/',
  ITEMS: '/api/masters/items/',
  UOMS: '/api/masters/uom/',
  CATEGORIES: '/api/masters/categories/',
  BRANDS: '/api/masters/brands/',
  TAXES: '/api/masters/taxes/',
  ITEM_TAX_COMPOSITIONS: '/api/masters/item-tax-compositions/',
  OUTLET_TYPES: '/api/masters/outlet-types/',
  AGENTS: '/api/masters/agents/',
  ACCOUNTS: '/api/masters/accounts/',
  
  // Channel Partners
  SUPERSTOCKISTS: '/api/masters/superstockists/',
  DISTRIBUTORS: '/api/masters/distributors/',
  RETAILERS: '/api/masters/retailers/',
  
  // Price Book
  PRICE_BOOKS: '/api/masters/price-books/',
  PRICE_BOOKS_HISTORY: '/api/masters/price-books/history/',
  PRICE_BOOKS_GET_PRICE: '/api/masters/price-books/get-price/',
  
  // Schemes
  SCHEMES: '/api/masters/schemes/',
  SCHEMES_HISTORY: '/api/masters/schemes/history/',
  SCHEMES_APPLICABLE: '/api/masters/applicable-schemes/',
  SCHEMES_APPLY: '/api/masters/apply-scheme/',
  SCHEMES_CHOICES: '/api/masters/schemes/choices/',
  
} as const;

// App Routes
export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  MASTERS_COUNTRY: '/masters/country',
  NOT_FOUND: '*',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Date Formats
export const DATE_FORMAT = 'DD/MM/YYYY';
export const DATE_FORMAT_DISPLAY = 'DD-MM-YYYY';
export const DATE_FORMAT_API = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'DD/MM/YYYY HH:mm:ss';
export const TIME_FORMAT = 'HH:mm:ss';

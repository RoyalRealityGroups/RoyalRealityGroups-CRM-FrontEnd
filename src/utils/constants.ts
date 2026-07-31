// Application Constants
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8011';
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;

// Route paths
export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
} as const;

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

  // Projects (ProjectManagement app)
  PROJECTS: '/api/projects/',
  PROJECTS_MINI: '/api/projects/mini/',
  PROJECTS_CHOICES: '/api/projects/choices/',

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

  // User management dropdowns
  COMPANIES_DROPDOWN: '/api/usermanagement/dropdowns/companies/',
  LOCATIONS_DROPDOWN: '/api/usermanagement/dropdowns/locations/',

  // Legacy FMCG endpoints (kept for type safety — routes removed from BE)
  CATEGORIES: '',
  ITEMS: '',
  STATES: '',
  CITIES: '',
  AREAS: '',
  ROUTES: '',
  RETAILERS: '',
  DISTRIBUTORS: '',
  SUPERSTOCKISTS: '',
  SCHEMES_CHOICES: '',
  COMPANIES: '',
  LOCATIONS: '',
  WAREHOUSES: '',
  UOMS: '',
  BRANDS: '',
  TAXES: '',
  ITEM_TAX_COMPOSITIONS: '',
  OUTLET_TYPES: '',
  AGENTS: '',
  ACCOUNTS: '',
  PRICE_BOOKS: '',
  PRICE_BOOKS_HISTORY: '',
  PRICE_BOOKS_GET_PRICE: '',
  SCHEMES: '',
  SCHEMES_HISTORY: '',
  SCHEMES_APPLICABLE: '',
  SCHEMES_APPLY: '',
  COUNTRIES: '',
  DISTRICTS: '',
  MANDALS: '',

} as const;

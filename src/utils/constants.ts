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

  // User management dropdowns (still served by Users app, not Masters)
  COMPANIES_DROPDOWN: '/api/usermanagement/dropdowns/companies/',
  LOCATIONS_DROPDOWN: '/api/usermanagement/dropdowns/locations/',

} as const;

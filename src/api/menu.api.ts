import apiClient from './axios.config';
import type { UserMenu, MenuItem, Submenu, MenuItemDetail } from '../types/menu.types';
import { API_ENDPOINTS } from '../utils/constants';

// Menu API functions
export const menuApi = {
  // Get user-specific menu (returns menus + permissions)
  getUserMenu: async (): Promise<UserMenu> => {
    const response = await apiClient.get(API_ENDPOINTS.USER_MENU);
    const data = response.data;
    // New shape: { menus: [...], permissions: [...] }
    if (data.menus) {
      return { menus: data.menus, permissions: data.permissions || [] };
    }
    // Fallback for old paginated shape: { count, results }
    return { menus: data.results || [], permissions: [] };
  },

  // Get all menus
  getAllMenus: async (): Promise<MenuItem[]> => {
    const response = await apiClient.get<{ count: number; results: MenuItem[] }>(API_ENDPOINTS.MENU, {
      params: { page_size: 1000 }
    });
    return response.data.results || [];
  },

  // Get all submenus
  getAllSubmenus: async (): Promise<Submenu[]> => {
    const response = await apiClient.get<{ count: number; results: Submenu[] }>(API_ENDPOINTS.SUBMENU, {
      params: { page_size: 1000 }
    });
    return response.data.results || [];
  },

  // Get all menu items
  getAllMenuItems: async (): Promise<MenuItemDetail[]> => {
    const response = await apiClient.get<{ count: number; results: MenuItemDetail[] }>(API_ENDPOINTS.MENUITEM, {
      params: { page_size: 1000 }
    });
    return response.data.results || [];
  },
};

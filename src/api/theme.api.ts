import apiClient from './axios.config';
import type { ThemeTokens } from '../theme/themeTokens';

const URL = '/api/general/theme-settings/';

export const themeApi = {
  // Public — works before login
  get: async (): Promise<ThemeTokens> => {
    const res = await apiClient.get(URL);
    return res.data;
  },

  // Admin only
  update: async (data: Partial<ThemeTokens>): Promise<ThemeTokens> => {
    const res = await apiClient.patch(URL, data);
    return res.data;
  },

  // Admin only — reset to factory defaults
  reset: async (): Promise<ThemeTokens> => {
    const res = await apiClient.post(URL, { action: 'reset' });
    return res.data;
  },
};

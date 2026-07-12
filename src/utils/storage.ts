// Local Storage Utilities
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  REMEMBER_ME: 'remember_me',
  SAVED_USERNAME: 'saved_username',
  SAVED_PASSWORD: 'saved_password',
} as const;

// Helper to get the appropriate storage based on remember_me setting
const getStorage = (): Storage => {
  const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
  return rememberMe ? localStorage : sessionStorage;
};

export const storage = {
  // Token Management
  setAccessToken: (token: string) => {
    const storage = getStorage();
    storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  getAccessToken: (): string | null => {
    // Check both storages for backward compatibility
    return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  setRefreshToken: (token: string) => {
    const storage = getStorage();
    storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  getRefreshToken: (): string | null => {
    // Check both storages for backward compatibility
    return sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // User Data
  setUser: (user: any) => {
    const storage = getStorage();
    storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUser: (): any | null => {
    // Check both storages for backward compatibility
    const user = sessionStorage.getItem(STORAGE_KEYS.USER) || localStorage.getItem(STORAGE_KEYS.USER);
    if (!user || user === 'undefined' || user === 'null') {
      return null;
    }
    try {
      return JSON.parse(user);
    } catch (e) {
      return null;
    }
  },

  // Remember Me
  setRememberMe: (remember: boolean) => {
    // Always store remember_me in localStorage to check on next session
    localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, remember.toString());
  },

  getRememberMe: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
  },

  // Saved Credentials (for Remember Me)
  setSavedCredentials: (username: string, password: string) => {
    localStorage.setItem(STORAGE_KEYS.SAVED_USERNAME, username);
    // Note: In production, consider encrypting the password or using a more secure method
    localStorage.setItem(STORAGE_KEYS.SAVED_PASSWORD, btoa(password)); // Base64 encode
  },

  getSavedCredentials: (): { username: string; password: string } | null => {
    const username = localStorage.getItem(STORAGE_KEYS.SAVED_USERNAME);
    const encodedPassword = localStorage.getItem(STORAGE_KEYS.SAVED_PASSWORD);
    
    if (username && encodedPassword) {
      try {
        const password = atob(encodedPassword); // Base64 decode
        return { username, password };
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  clearSavedCredentials: () => {
    localStorage.removeItem(STORAGE_KEYS.SAVED_USERNAME);
    localStorage.removeItem(STORAGE_KEYS.SAVED_PASSWORD);
  },

  // Clear All
  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
  },

  clearAll: () => {
    localStorage.clear();
    sessionStorage.clear();
  },
};

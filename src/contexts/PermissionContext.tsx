import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api';
import { useAppSelector } from '../store/hooks';

export interface ScreenPermission {
  id: number;
  user: string;
  screen: number;
  screen_name: string;
  screen_code: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  is_view_only: boolean;
}

export interface PermissionContextValue {
  permissions: ScreenPermission[];
  isLoading: boolean;
  canView: (screenCode: string) => boolean;
  canAdd: (screenCode: string) => boolean;
  canEdit: (screenCode: string) => boolean;
  canDelete: (screenCode: string) => boolean;
  canExport: (screenCode: string) => boolean;
  getScreenPermissions: (screenCode: string) => ScreenPermission | undefined;
  refreshPermissions: () => Promise<void>;
}

export const PermissionContext = createContext<PermissionContextValue | null>(null);

// Module-level state to survive component remounts
let globalFetched = false;
let globalPermissions: ScreenPermission[] = [];

export const resetPermissionState = () => {
  globalFetched = false;
  globalPermissions = [];
};

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [permissions, setPermissions] = useState<ScreenPermission[]>(globalPermissions);
  const [isLoading, setIsLoading] = useState(!globalFetched);

  const fetchPermissions = useCallback(async () => {
    if (globalFetched) {
      setPermissions(globalPermissions);
      setIsLoading(false);
      return;
    }

    globalFetched = true;

    try {
      const data = await authApi.getPermissions();
      if (Array.isArray(data)) {
        globalPermissions = data;
        setPermissions(data);
      } else {
        globalPermissions = [];
        setPermissions([]);
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      globalPermissions = [];
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      resetPermissionState();
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    if (!globalFetched) {
      fetchPermissions();
    } else {
      setPermissions(globalPermissions);
      setIsLoading(false);
    }
  }, [fetchPermissions, isAuthenticated]);

  const canView = useCallback((screenCode: string) => {
    const perm = permissions.find(p => p.screen_code === screenCode);
    return perm?.can_view ?? false;
  }, [permissions]);

  const canAdd = useCallback((screenCode: string) => {
    const perm = permissions.find(p => p.screen_code === screenCode);
    return perm?.can_add ?? false;
  }, [permissions]);

  const canEdit = useCallback((screenCode: string) => {
    const perm = permissions.find(p => p.screen_code === screenCode);
    return perm?.can_edit ?? false;
  }, [permissions]);

  const canDelete = useCallback((screenCode: string) => {
    const perm = permissions.find(p => p.screen_code === screenCode);
    return perm?.can_delete ?? false;
  }, [permissions]);

  const canExport = useCallback((screenCode: string) => {
    const perm = permissions.find(p => p.screen_code === screenCode);
    return perm?.can_export ?? false;
  }, [permissions]);

  const getScreenPermissions = useCallback((screenCode: string) => {
    return permissions.find(p => p.screen_code === screenCode);
  }, [permissions]);

  const refreshPermissions = useCallback(async () => {
    globalFetched = false;
    globalPermissions = [];
    setIsLoading(true);
    await fetchPermissions();
  }, [fetchPermissions]);

  const value: PermissionContextValue = {
    permissions,
    isLoading,
    canView,
    canAdd,
    canEdit,
    canDelete,
    canExport,
    getScreenPermissions,
    refreshPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
};

export default PermissionProvider;

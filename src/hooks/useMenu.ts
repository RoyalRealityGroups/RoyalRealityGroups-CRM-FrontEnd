import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMenuStart, fetchMenuSuccess, fetchMenuFailure, clearMenu } from '../store/slices/menuSlice';
import { fetchPermissionsSuccess } from '../store/slices/permissionsSlice';
import { setUser } from '../store/slices/authSlice';
import { menuApi } from '../api/menu.api';

export const useMenu = () => {
  const dispatch = useAppDispatch();
  const { menus, isLoading, error } = useAppSelector((state) => state.menu);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const fetchMenu = async () => {
    try {
      dispatch(fetchMenuStart());
      const response = await menuApi.getUserMenu();
      dispatch(fetchMenuSuccess(response.menus));

      // If the menu response includes permissions, update them in the store immediately.
      // This means a simple page refresh picks up any admin changes without re-login.
      if (response.permissions && response.permissions.length > 0) {
        dispatch(fetchPermissionsSuccess(response.permissions));
        if (user) {
          const currentPerms = JSON.stringify(user.permissions || []);
          const newPerms = JSON.stringify(response.permissions);
          if (currentPerms !== newPerms) {
            dispatch(setUser({ ...user, permissions: response.permissions }));
          }
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load menu';
      dispatch(fetchMenuFailure(errorMessage));
    }
  };

  const clearUserMenu = () => {
    dispatch(clearMenu());
  };

  // Auto-fetch menu when user is authenticated (only if not already loaded)
  useEffect(() => {
    if (isAuthenticated && (!menus || menus.length === 0) && !isLoading) {
      fetchMenu();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Only depend on isAuthenticated, not menus

  return {
    menus,
    isLoading,
    error,
    fetchMenu,
    clearMenu: clearUserMenu,
  };
};

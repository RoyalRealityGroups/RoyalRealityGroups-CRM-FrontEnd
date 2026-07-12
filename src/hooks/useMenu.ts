import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMenuStart, fetchMenuSuccess, fetchMenuFailure, clearMenu } from '../store/slices/menuSlice';
import { menuApi } from '../api/menu.api';

export const useMenu = () => {
  const dispatch = useAppDispatch();
  const { menus, isLoading, error } = useAppSelector((state) => state.menu);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const fetchMenu = async () => {
    try {
      dispatch(fetchMenuStart());
      const response = await menuApi.getUserMenu();
      dispatch(fetchMenuSuccess(response.menus));
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

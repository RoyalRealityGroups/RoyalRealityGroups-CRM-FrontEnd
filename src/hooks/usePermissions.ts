import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchPermissionsStart,
  fetchPermissionsSuccess,
  fetchPermissionsFailure,
} from '../store/slices/permissionsSlice';
import { setUser } from '../store/slices/authSlice';
import { authApi } from '../api/auth.api';

export const usePermissions = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    dispatch(fetchPermissionsStart());
    authApi.getPermissions().then((permissions) => {
      if (!cancelled) {
        dispatch(fetchPermissionsSuccess(permissions));
        // Replace user permissions with fresh ones from API
        if (user && permissions.length > 0) {
          const currentPerms = JSON.stringify(user.permissions || []);
          const newPerms = JSON.stringify(permissions);
          if (currentPerms !== newPerms) {
            dispatch(setUser({ ...user, permissions }));
          }
        }
      }
    }).catch(() => {
      if (!cancelled) {
        dispatch(fetchPermissionsFailure());
      }
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isAuthenticated]);
};

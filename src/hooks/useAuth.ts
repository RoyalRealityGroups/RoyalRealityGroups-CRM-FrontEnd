import { useAppSelector, useAppDispatch } from '../store/hooks';
import { loginStart, loginSuccess, loginFailure, logout as logoutAction, setUser } from '../store/slices/authSlice';
import { clearMenu, fetchMenuSuccess } from '../store/slices/menuSlice';
import { clearPermissions } from '../store/slices/permissionsSlice';
import { authApi } from '../api/auth.api';
import { menuApi } from '../api/menu.api';
import { channelConfigApi, generalSettingsApi } from '../api/masters.api';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '../utils/constants';

interface LoginFormData {
  username: string;
  password: string;
  remember_me?: boolean;
}

const getFriendlyAuthError = (err: any): string => {
  if (!err?.response) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  const data = err.response?.data || {};
  const rawMessage = data?.detail || data?.message || data?.error || '';
  const message = String(rawMessage).trim();
  const normalized = message.toLowerCase();

  if (normalized.includes('inactive')) {
    return 'Your account is inactive. Please contact your administrator.';
  }
  if (normalized.includes('device not allowed')) {
    return 'This device is not allowed for login. Please contact your administrator.';
  }

  return message || 'Unable to sign in. Please verify your credentials and try again.';
};

const hasLoginFieldError = (errorData: any): boolean => {
  if (!errorData) return false;
  if (errorData.username || errorData.password) return true;
  if (errorData.errors && typeof errorData.errors === 'object') {
    return Boolean(errorData.errors.username || errorData.errors.password);
  }
  return false;
};

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading, error, refreshToken } = useAppSelector((state) => state.auth);

  const login = async (credentials: LoginFormData) => {
    try {
      dispatch(loginStart());
      const response = await authApi.login(credentials);
      
      // Transform backend response to match our User type
      const fullName = response.full_name || '';
      const nameParts = fullName.trim().split(' ');
      const user = {
        id: response.username, // Using username as id for now
        username: response.username,
        email: response.email,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        phone: response.phone,
        group_name: response.group_name,
        is_superuser: response.is_superuser,
        permissions: response.permissions,
        channel_partner_type: (response as any).channel_partner_type || 'STAFF',
        superstockist: (response as any).superstockist || null,
        distributor: (response as any).distributor || null,
        retailer: (response as any).retailer || null,
        superstockist_name: (response as any).superstockist_name || null,
        distributor_name: (response as any).distributor_name || null,
        retailer_name: (response as any).retailer_name || null,
      };
      
      dispatch(loginSuccess({
        user,
        access: response.tokens?.access || '',
        refresh: response.tokens?.refresh || '',
        rememberMe: credentials.remember_me,
      }));

      // Clear all cached queries to ensure fresh data for new user
      queryClient.clear();

      // Preload critical data before navigation to prevent loading gaps
      const [, permissionsResult] = await Promise.allSettled([
        menuApi.getUserMenu().then(res => dispatch(fetchMenuSuccess(res.menus))),
        authApi.getPermissions(),
        queryClient.prefetchQuery({
          queryKey: ['channelConfig'],
          queryFn: channelConfigApi.getChannelConfig,
        }),
        queryClient.prefetchQuery({
          queryKey: ['generalSettings'],
          queryFn: generalSettingsApi.getGeneralSettings,
        }),
      ]);

      // Update user permissions if fetched successfully
      if (permissionsResult.status === 'fulfilled') {
        dispatch(setUser({ ...user, permissions: permissionsResult.value }));
      }

      navigate(ROUTES.DASHBOARD);
    } catch (err: any) {
      // Check if it's a field-specific error (username or password)
      const hasFieldError = hasLoginFieldError(err.response?.data);
      
      if (!hasFieldError) {
        // Only dispatch general error if it's not a field-specific error
        const errorMessage = getFriendlyAuthError(err);
        dispatch(loginFailure(errorMessage));
      } else {
        // For field-specific errors, just reset loading state
        dispatch(loginFailure(''));
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (err) {
    } finally {
      dispatch(logoutAction());
      dispatch(clearMenu());
      dispatch(clearPermissions());
      queryClient.clear(); // Clear all cached queries on logout
      navigate(ROUTES.LOGIN);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
  };
};

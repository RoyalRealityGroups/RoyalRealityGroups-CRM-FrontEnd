import apiClient from './axios.config';
import type {
  LoginResponse,
  ForgotPasswordData,
  ChangePasswordData,
  TokenRefreshResponse,
  User,
} from '../types/auth.types';
import { API_ENDPOINTS } from '../utils/constants';

// Simple login input type (before adding device fields)
interface LoginInput {
  username: string;
  password: string;
  remember_me?: boolean;
}

// Generate or retrieve device UUID
const getDeviceUUID = (): string => {
  let deviceId = localStorage.getItem('device_uuid');
  if (!deviceId) {
    deviceId = `web-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('device_uuid', deviceId);
  }
  return deviceId;
};

// Auth API functions
export const authApi = {
  // Login
  login: async (credentials: LoginInput): Promise<LoginResponse> => {
    // Add required device fields
    const loginData = {
      ...credentials,
      user_type: 'User',
      device_uuid: getDeviceUUID(),
      device_type: 3, // Web
      device_name: `Web Browser - ${navigator.platform}`.substring(0, 100),
    };
    
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.LOGIN,
      loginData
    );
    console.log("Login API response:", response.data);
    return response.data;
  },

  // Logout
  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.LOGOUT, { refresh: refreshToken });
  },

  // Validate Username
  validateUsername: async (username: string): Promise<{ message: string; valid: boolean }> => {
    const response = await apiClient.post<{ message: string; valid: boolean }>(
      API_ENDPOINTS.VALIDATE_USERNAME,
      { username }
    );
    return response.data;
  },

  // Forgot Password
  forgotPassword: async (data: ForgotPasswordData): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.FORGOT_PASSWORD,
      data
    );
    return response.data;
  },

  // Validate Current Password
  validateCurrentPassword: async (currentPassword: string): Promise<{ message: string; valid: boolean }> => {
    const response = await apiClient.post<{ message: string; valid: boolean }>(
      API_ENDPOINTS.VALIDATE_CURRENT_PASSWORD,
      { current_password: currentPassword }
    );
    return response.data;
  },

  // Change Password
  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    const { old_password, password } = data;
    const response = await apiClient.patch<{ message: string }>(
      API_ENDPOINTS.CHANGE_PASSWORD,
      { old_password, password }
    );
    return response.data;
  },

  // Refresh Token
  refreshToken: async (refreshToken: string): Promise<TokenRefreshResponse> => {
    const response = await apiClient.post<TokenRefreshResponse>(
      API_ENDPOINTS.TOKEN_REFRESH,
      { refresh: refreshToken }
    );
    return response.data;
  },

  // Get Current User
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>(API_ENDPOINTS.CURRENT_USER);
    return response.data;
  },

  // Get Permissions (returns screen permissions for current user)
  getPermissions: async () => {
    const response = await apiClient.get(API_ENDPOINTS.GET_PERMISSIONS);
    return response.data;
  },
};

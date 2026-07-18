import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../utils/constants';
import { storage } from '../utils/storage';
import { retryRequest, handleRateLimitError, isOnline, offlineQueue } from '../utils/errorHandling';

// Lightweight navigate helper — avoids window.location.href which causes a full page reload.
// Set by the router once it mounts (see src/App.tsx or router setup).
let _navigate: ((path: string) => void) | null = null;
export const setNavigateRef = (fn: (path: string) => void) => { _navigate = fn; };
const redirectToLogin = () => {
  if (_navigate) {
    _navigate('/login');
  } else {
    // Fallback: use history API directly — no full reload
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getAccessToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // If sending FormData, remove Content-Type header to let browser set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Handle offline errors
    if (!isOnline() && !error.response) {
      offlineQueue.add(() => apiClient(originalRequest));
      return Promise.reject(new Error('You are offline. Request will be retried when connection is restored.'));
    }

    // Handle rate limit errors
    const rateLimitInfo = handleRateLimitError(error);
    if (rateLimitInfo.shouldRetry && !originalRequest._rateLimitRetry) {
      originalRequest._rateLimitRetry = true;
      await new Promise(resolve => setTimeout(resolve, rateLimitInfo.retryAfter));
      return apiClient(originalRequest);
    }

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = storage.getRefreshToken();

      if (!refreshToken) {
        // No refresh token — redirect without a full page reload
        storage.clearAuth();
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        // Try to refresh token
        const response = await axios.post(
          `${API_BASE_URL}/api/users/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;

        // Update stored token
        storage.setAccessToken(access);

        // Update header for original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }

        processQueue(null, access);
        isRefreshing = false;

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — redirect without a full page reload
        processQueue(refreshError, null);
        isRefreshing = false;
        storage.clearAuth();
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

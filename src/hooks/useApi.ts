import { useState, useEffect } from 'react';
import apiClient from '../api/axios.config';
import { storage } from '../utils/storage';

export interface UseApiOptions {
  /**
   * HTTP method
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  /**
   * Request body for POST/PUT/PATCH
   */
  body?: any;
  
  /**
   * Query parameters
   */
  params?: Record<string, any>;
  
  /**
   * Headers
   */
  headers?: Record<string, string>;
  
  /**
   * Whether to execute the request immediately
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Whether to include authorization token
   * @default true
   */
  withAuth?: boolean;
  
  /**
   * Callback on success
   */
  onSuccess?: (data: any) => void;
  
  /**
   * Callback on error
   */
  onError?: (error: any) => void;
}

export interface UseApiResult<T> {
  /**
   * Response data
   */
  data: T | null;
  
  /**
   * Loading state
   */
  loading: boolean;
  
  /**
   * Error object
   */
  error: Error | null;
  
  /**
   * Refetch function to manually trigger the request
   */
  refetch: () => Promise<void>;
  
  /**
   * Mutate function for POST/PUT/DELETE operations
   */
  mutate: (body?: any) => Promise<T | null>;
}

/**
 * Custom hook for API calls with automatic state management
 * 
 * @param endpoint - API endpoint path
 * @param options - Request options
 * @returns Object with data, loading, error, refetch, and mutate
 * 
 * @example
 * ```tsx
 * // GET request
 * const { data, loading, error, refetch } = useApi<Order[]>('/api/orders/', {
 *   params: { status: 'pending' }
 * });
 * 
 * // POST request (manual trigger)
 * const { mutate, loading } = useApi('/api/orders/', {
 *   method: 'POST',
 *   enabled: false,
 * });
 * 
 * const handleCreate = async () => {
 *   await mutate({ customer_id: 1, items: [...] });
 * };
 * ```
 */
export function useApi<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const {
    method = 'GET',
    body,
    params,
    headers,
    enabled = true,
    withAuth = true,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async (requestBody?: any) => {
    setLoading(true);
    setError(null);

    try {
      const config: any = {
        method,
        url: endpoint,
        params,
        data: requestBody || body,
        headers: {
          ...headers,
        },
      };

      // Add authorization token if required
      if (withAuth) {
        const accessToken = storage.getAccessToken();
        if (accessToken) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
      }

      const response = await apiClient.request(config);
      const responseData = response.data;
      
      setData(responseData);
      
      if (onSuccess) {
        onSuccess(responseData);
      }
      
      return responseData;
    } catch (err: any) {
      const errorObj = new Error(
        err.response?.data?.message || 
        err.response?.data?.error || 
        err.message || 
        'An error occurred'
      );
      
      setError(errorObj);
      
      if (onError) {
        onError(errorObj);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (enabled && method === 'GET') {
      fetchData();
    }
  }, [endpoint, enabled, JSON.stringify(params)]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(),
    mutate: (requestBody?: any) => fetchData(requestBody),
  };
}

export default useApi;

import { useState } from 'react';
import apiClient from '../api/axios.config';
import { retryRequest, getUserFriendlyError, formatFieldErrors } from '../utils/errorHandling';

export interface UseApiCallOptions {
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
  retryOnFailure?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export interface UseApiCallResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  execute: (config: any) => Promise<T | null>;
  reset: () => void;
}

/**
 * Enhanced hook for API calls with retry logic and error handling
 */
export function useApiCall<T = any>(
  options: UseApiCallOptions = {}
): UseApiCallResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const execute = async (config: any): Promise<T | null> => {
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const requestFn = () => apiClient.request<T>(config);
      
      const response = options.retryOnFailure
        ? await retryRequest(requestFn)
        : await requestFn();

      const responseData = response.data;
      setData(responseData);

      if (options.onSuccess) {
        options.onSuccess(responseData);
      }

      return responseData;
    } catch (err: any) {
      const errorMessage = getUserFriendlyError(err);
      const fields = formatFieldErrors(err);

      setError(errorMessage);
      setFieldErrors(fields);

      if (options.onError) {
        options.onError(errorMessage);
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setFieldErrors({});
    setLoading(false);
  };

  return {
    data,
    loading,
    error,
    fieldErrors,
    execute,
    reset,
  };
}

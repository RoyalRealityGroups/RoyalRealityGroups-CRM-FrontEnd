import { AxiosError } from 'axios';

export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryableStatuses?: number[];
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Retry a failed request with exponential backoff
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { maxRetries, retryDelay, retryableStatuses } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;

      const status = error?.response?.status;
      const isRetryable = status && retryableStatuses.includes(status);
      const isNetworkError = !error?.response && error?.message?.includes('Network');

      if (attempt < maxRetries && (isRetryable || isNetworkError)) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      break;
    }
  }

  throw lastError;
}

/**
 * Get user-friendly error message from API error
 */
export function getUserFriendlyError(error: any): string {
  if (!error) return 'An unexpected error occurred';

  // Network errors
  if (!error.response) {
    if (error.message?.includes('Network')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }
    return 'Unable to connect to the server. Please try again later.';
  }

  const status = error.response?.status;
  const data = error.response?.data;

  // Extract error message from response
  // Check nested errors first (e.g., {errors: {pan_number: ["already exists"]}})
  if (data?.errors && typeof data.errors === 'object') {
    const fieldErrors = Object.entries(data.errors)
      .map(([field, errors]) => {
        const errorList = Array.isArray(errors) ? errors : [errors];
        return errorList.join(', ');
      });
    if (fieldErrors.length > 0) {
      return fieldErrors.join('; ');
    }
  }

  if (data?.detail) return data.detail;
  if (data?.error) return data.error;
  if (data?.message) return data.message;

  // Field-level errors
  if (data && typeof data === 'object') {
    const fieldErrors = Object.entries(data)
      .filter(([key]) => key !== 'detail' && key !== 'error')
      .map(([field, errors]) => {
        const errorList = Array.isArray(errors) ? errors : [errors];
        return `${field}: ${errorList.join(', ')}`;
      });
    
    if (fieldErrors.length > 0) {
      return fieldErrors.join('\n');
    }
  }

  // Status-based messages
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This action conflicts with existing data.';
    case 413:
      return 'The file or request is too large.';
    case 422:
      return 'Validation error. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    case 504:
      return 'Request timeout. Please try again.';
    default:
      return `An error occurred (${status}). Please try again.`;
  }
}

/**
 * Format field-level validation errors for display
 */
export function formatFieldErrors(error: any): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (!error?.response?.data) return fieldErrors;

  const data = error.response.data;

  Object.entries(data).forEach(([field, errors]) => {
    if (field === 'detail' || field === 'error' || field === 'message') return;

    const errorList = Array.isArray(errors) ? errors : [errors];
    fieldErrors[field] = errorList.join(', ');
  });

  return fieldErrors;
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Wait for network to come back online
 */
export function waitForOnline(timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isOnline()) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', handleOnline);
      reject(new Error('Network timeout'));
    }, timeout);

    const handleOnline = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', handleOnline);
      resolve();
    };

    window.addEventListener('online', handleOnline);
  });
}

/**
 * Validate file upload
 */
export interface FileValidationConfig {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export function validateFile(
  file: File,
  config: FileValidationConfig = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    allowedExtensions = [],
  } = config;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${(maxSize / (1024 * 1024)).toFixed(0)}MB`,
    };
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension must be one of: ${allowedExtensions.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Handle rate limit errors with retry after
 */
export function handleRateLimitError(error: AxiosError): {
  shouldRetry: boolean;
  retryAfter: number;
} {
  if (error.response?.status !== 429) {
    return { shouldRetry: false, retryAfter: 0 };
  }

  const retryAfter = error.response.headers['retry-after'];
  const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;

  return {
    shouldRetry: true,
    retryAfter: retryAfterSeconds * 1000,
  };
}

/**
 * Create offline queue for failed requests
 */
class OfflineQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  add(requestFn: () => Promise<any>): void {
    this.queue.push(requestFn);
  }

  async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const requestFn = this.queue.shift();
      if (requestFn) {
        try {
          await requestFn();
        } catch (error) {
        }
      }
    }

    this.processing = false;
  }

  clear(): void {
    this.queue = [];
  }

  get size(): number {
    return this.queue.length;
  }
}

export const offlineQueue = new OfflineQueue();

// Auto-process queue when coming back online
window.addEventListener('online', () => {
  offlineQueue.process();
});

/**
 * Create mutation error handler for React Query
 */
export function createMutationErrorHandler(
  toastFn: (message: string) => void,
  defaultMessage: string,
  entityName?: string
) {
  return (error: any) => {
    const message = getUserFriendlyError(error);
    toastFn(message || defaultMessage);
  };
}

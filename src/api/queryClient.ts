import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 60 * 1000, // 30 minutes - increased from 5 minutes
      gcTime: 60 * 60 * 1000, // 60 minutes cache - increased from 10 minutes
      networkMode: 'offlineFirst', // Use cache first
    },
  },
});

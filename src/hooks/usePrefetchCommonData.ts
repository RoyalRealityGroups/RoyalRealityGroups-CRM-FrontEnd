import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { channelConfigApi, generalSettingsApi } from '../api/masters.api';

export const usePrefetchCommonData = () => {
  const queryClient = useQueryClient();
  const hasPreloadedRef = useRef(false);

  useEffect(() => {
    // Skip if already preloaded (e.g., during login)
    if (hasPreloadedRef.current) return;
    
    const channelConfigCache = queryClient.getQueryData(['channelConfig']);
    const generalSettingsCache = queryClient.getQueryData(['generalSettings']);
    
    // Only prefetch if not already in cache
    if (!channelConfigCache) {
      queryClient.prefetchQuery({
        queryKey: ['channelConfig'],
        queryFn: channelConfigApi.getChannelConfig,
        staleTime: 30 * 60 * 1000, // 30 minutes
      });
    }

    if (!generalSettingsCache) {
      queryClient.prefetchQuery({
        queryKey: ['generalSettings'],
        queryFn: generalSettingsApi.getGeneralSettings,
        staleTime: 30 * 60 * 1000, // 30 minutes
      });
    }
    
    hasPreloadedRef.current = true;
  }, []); // Empty dependency array - only run once on mount
};

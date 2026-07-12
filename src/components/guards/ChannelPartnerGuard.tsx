import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress, Alert, Button } from '@mui/material';
import apiClient from '../../api/axios.config';

interface ChannelConfig {
  enable_superstockist: boolean;
  enable_distributor: boolean;
  enable_retailer: boolean;
}

interface ChannelPartnerGuardProps {
  children: React.ReactNode;
  partnerType: 'superstockist' | 'distributor' | 'retailer';
}

const ChannelPartnerGuard: React.FC<ChannelPartnerGuardProps> = ({ children, partnerType }) => {
  const navigate = useNavigate();

  const { data: channelConfig, isLoading, error } = useQuery<ChannelConfig>({
    queryKey: ['channelConfig'],
    queryFn: async () => {
      const response = await apiClient.get('/api/masters/channel-config/');
      return {
        enable_superstockist: response.data.enable_superstockist || false,
        enable_distributor: response.data.enable_distributor || false,
        enable_retailer: response.data.enable_retailer || false,
      };
    },
    refetchOnMount: 'always',
    staleTime: 0,
  });

  // Check if partner type is enabled
  const isEnabled = channelConfig
    ? partnerType === 'superstockist'
      ? channelConfig.enable_superstockist
      : partnerType === 'distributor'
      ? channelConfig.enable_distributor
      : channelConfig.enable_retailer
    : false;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load channel configuration</Alert>
      </Box>
    );
  }

  if (!isEnabled) {
    const partnerTypeLabel =
      partnerType.charAt(0).toUpperCase() + partnerType.slice(1).replace('_', ' ');

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <Alert severity="warning" sx={{ maxWidth: 600 }}>
          {partnerTypeLabel} feature is currently disabled. Please enable it in Channel Configuration
          to access this feature.
        </Alert>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/masters')}>
            Back to Masters
          </Button>
          <Button variant="contained" onClick={() => navigate('/settings/channel-configuration')}>
            Channel Configuration
          </Button>
        </Box>
      </Box>
    );
  }

  return <>{children}</>;
};

export default ChannelPartnerGuard;

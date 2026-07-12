import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
} from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios.config';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../../utils/spacing';

interface ChannelConfig {
  id: string;
  enable_superstockist: boolean;
  enable_distributor: boolean;
  enable_retailer: boolean;
  enforce_channel_hierarchy: boolean;
}

const fetchChannelConfig = async (): Promise<ChannelConfig> => {
  const response = await apiClient.get('/api/masters/channel-config/');
  return {
    id: response.data.id,
    enable_superstockist: response.data.enable_superstockist || false,
    enable_distributor: response.data.enable_distributor || false,
    enable_retailer: response.data.enable_retailer || false,
    enforce_channel_hierarchy: response.data.enforce_channel_hierarchy || false,
  };
};

const updateChannelConfig = async (config: ChannelConfig) => {
  const response = await apiClient.patch(
    `/api/masters/channel-config/`,
    {
      enable_superstockist: config.enable_superstockist,
      enable_distributor: config.enable_distributor,
      enable_retailer: config.enable_retailer,
      enforce_channel_hierarchy: config.enforce_channel_hierarchy,
    }
  );
  return response.data;
};

const ChannelConfiguration: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Channel Configuration');
  const [config, setConfig] = useState<ChannelConfig | null>(null);

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Channel Configuration', path: '/settings/channel-configuration', icon: <AccountTreeIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Fetch data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['channelConfig'],
    queryFn: fetchChannelConfig,
  });

  // Initialize local state when data is loaded
  useEffect(() => {
    if (data) {
      setConfig(data);
    }
  }, [data]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: updateChannelConfig,
    onSuccess: (savedData) => {
      // Update local state with the saved data from server
      setConfig({
        id: savedData.id,
        enable_superstockist: savedData.enable_superstockist || false,
        enable_distributor: savedData.enable_distributor || false,
        enable_retailer: savedData.enable_retailer || false,
        enforce_channel_hierarchy: savedData.enforce_channel_hierarchy || false,
      });
      queryClient.invalidateQueries({ queryKey: ['channelConfig'] });
      toastSuccess('Channel configuration saved successfully!');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to save configuration');
    },
  });

  const handleSave = () => {
    if (config) {
      saveMutation.mutate(config);
    }
  };

  const handleRefresh = () => {
    refetch().then((result) => {
      if (result.data) {
        setConfig(result.data);
      }
    });
    toastSuccess('Configuration refreshed');
  };

  const handleBack = () => {
    navigate('/settings');
  };

  const handleToggle = (field: keyof Omit<ChannelConfig, 'id'>) => {
    if (config) {
      setConfig({
        ...config,
        [field]: !config[field],
      });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={getPageContainerStyles()}>
        <Alert severity="error">Failed to load channel configuration</Alert>
      </Box>
    );
  }

  return (
    <Box sx={getPageContainerStyles()}>
      {/* Fixed Header */}
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <ScreenHeader
            title="Channel Configuration"
            showBackButton
            onBack={handleBack}
            disableBox
          />
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={saveMutation.isPending}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={saveMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={getContentSectionStyles()}>
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
            Channel Partner Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure which channel partner types are enabled in your system and control hierarchy enforcement.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {config && (
            <Grid container spacing={3}>
              {/* Enable Settings */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Enable Channel Partners
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enable_superstockist}
                        onChange={() => handleToggle('enable_superstockist')}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          Enable Superstockist
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Top-tier channel partners
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enable_distributor}
                        onChange={() => handleToggle('enable_distributor')}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          Enable Distributor
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Mid-tier channel partners
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enable_retailer}
                        onChange={() => handleToggle('enable_retailer')}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          Enable Retailer
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Retail outlet partners
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              </Grid>

              {/* Hierarchy Settings */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Hierarchy Settings
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    bgcolor: config.enforce_channel_hierarchy ? 'warning.50' : 'grey.50',
                    border: '1px solid', 
                    borderColor: config.enforce_channel_hierarchy ? 'warning.200' : 'grey.200'
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enforce_channel_hierarchy}
                        onChange={() => handleToggle('enforce_channel_hierarchy')}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          Enforce Channel Hierarchy
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          When enabled, distributors must be linked to superstockists, and retailers must be linked to distributors.
                        </Typography>
                      </Box>
                    }
                  />
                  {config.enforce_channel_hierarchy && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="caption">
                        <strong>Note:</strong> With hierarchy enforcement enabled, you cannot create:
                        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                          <li>Distributors without a superstockist assignment</li>
                          <li>Retailers without a distributor assignment</li>
                        </ul>
                      </Typography>
                    </Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ChannelConfiguration;

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import { generalSettingsApi } from '../../api/masters.api';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../../utils/spacing';

interface GeneralSettingsState {
  company_scoped_item_enforcement: boolean;
  allow_multiple_schemes: boolean;
}

const GeneralSettings: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const [settings, setSettings] = useState<GeneralSettingsState>({
    company_scoped_item_enforcement: false,
    allow_multiple_schemes: true,
  });

  usePageTitle('General Settings');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'General Settings', icon: <TuneIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['generalSettings'],
    queryFn: generalSettingsApi.getGeneralSettings,
  });

  useEffect(() => {
    if (data) {
      setSettings({
        company_scoped_item_enforcement: data.company_scoped_item_enforcement,
        allow_multiple_schemes: data.allow_multiple_schemes,
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: generalSettingsApi.updateGeneralSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generalSettings'] });
      toastSuccess('General settings updated successfully');
    },
    onError: (error: any) => {
      toastError(error?.response?.data?.detail || 'Failed to update general settings');
    },
  });

  const hasChanges =
    !!data &&
    (settings.company_scoped_item_enforcement !== data.company_scoped_item_enforcement ||
      settings.allow_multiple_schemes !== data.allow_multiple_schemes);

  const handleSave = () => {
    mutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={getPageContainerStyles()}>
        <Alert severity="error">Failed to load general settings.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <ScreenHeader
            title="General Settings"
            showBackButton
            onBack={() => navigate('/settings')}
            disableBox
          />
          <Button
            variant="contained"
            size="small"
            startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
            onClick={handleSave}
            disabled={!hasChanges || mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      <Box sx={getContentSectionStyles()}>
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
            Sales Controls
          </Typography>

          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.company_scoped_item_enforcement}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      company_scoped_item_enforcement: e.target.checked,
                    }))
                  }
                />
              }
              label="Company-Scoped Item Enforcement"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              When enabled, Item Master company becomes mandatory and Sales Order item selection is restricted to the selected header company.
            </Typography>
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.allow_multiple_schemes}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      allow_multiple_schemes: e.target.checked,
                    }))
                  }
                />
              }
              label="Allow Multiple Schemes"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              When disabled, only one scheme can be selected per sales order.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default GeneralSettings;


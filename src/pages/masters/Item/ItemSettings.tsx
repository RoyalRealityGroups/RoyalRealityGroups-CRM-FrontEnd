import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import SettingsIcon from '@mui/icons-material/Settings';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../api/axios.config';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../../../utils/spacing';

interface ItemFieldConfig {
  id: number;
  field_name: string;
  display_label: string;
  is_visible: boolean;
  is_required: boolean;
  is_readonly: boolean;
  display_order: number;
  section: string;
}

const fetchFieldConfigs = async (): Promise<ItemFieldConfig[]> => {
  const response = await apiClient.get('/api/masters/item-field-config/');
  // Handle paginated response from DRF
  const results = Array.isArray(response.data) ? response.data : response.data.results || [];
  return results.sort((a: ItemFieldConfig, b: ItemFieldConfig) => 
    a.display_order - b.display_order
  );
};

const bulkUpdateFieldConfigs = async (configs: ItemFieldConfig[]) => {
  const response = await apiClient.post(
    '/api/masters/item-field-config/bulk-update/',
    { configurations: configs }
  );
  return response.data;
};

const ItemSettings: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Item Settings');
  const [localConfigs, setLocalConfigs] = useState<ItemFieldConfig[]>([]);

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Settings', path: '/masters/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Item Settings' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const { data: configs, isLoading, error } = useQuery({
    queryKey: ['itemFieldConfigs'],
    queryFn: fetchFieldConfigs,
  });

  const mutation = useMutation({
    mutationFn: bulkUpdateFieldConfigs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemFieldConfigs'] });
      toastSuccess('Settings saved successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to save settings';
      toastError(message);
    },
  });

  useEffect(() => {
    if (configs) {
      setLocalConfigs(configs);
    }
  }, [configs]);

  const handleChange = (id: number, field: keyof ItemFieldConfig, value: any) => {
    setLocalConfigs(prevConfigs =>
      prevConfigs.map(config =>
        config.id === id ? { ...config, [field]: value } : config
      )
    );
  };

  const handleSave = () => {
    mutation.mutate(localConfigs);
  };

  const handleReset = () => {
    if (configs) {
      setLocalConfigs(configs);
    }
  };

  const handleBack = () => {
    navigate('/settings');
  };

  const hasChanges = JSON.stringify(localConfigs) !== JSON.stringify(configs);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {(error as any).response?.data?.error || 'Failed to load field configurations'}
        </Alert>
      </Box>
    );
  }

  // Group configurations by section
  const sections = Array.from(new Set(localConfigs.map(c => c.section)));

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
            title="Item Master Field Settings"
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
              onClick={handleReset}
              disabled={!hasChanges || mutation.isPending}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
              onClick={handleSave}
              disabled={!hasChanges || mutation.isPending}
            >
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Scrollable Content Area */}
      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ p: 3, borderRadius: 0 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Configure which fields are visible, required, and read-only in the Item Master form.
            Changes will be applied to the form immediately after saving.
          </Alert>

          {sections.map(section => {
          const sectionConfigs = localConfigs.filter(c => c.section === section);
          
          return (
            <Box key={section} mb={4}>
              <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize', mb: 2 }}>
                {section} Fields
              </Typography>
              
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="25%">Field Name</TableCell>
                      <TableCell width="25%">Display Label</TableCell>
                      <TableCell align="center" width="10%">Visible</TableCell>
                      <TableCell align="center" width="10%">Required</TableCell>
                      <TableCell align="center" width="10%">Read Only</TableCell>
                      <TableCell align="center" width="10%">Order</TableCell>
                      <TableCell width="10%">Section</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sectionConfigs.map(config => (
                      <TableRow key={config.id} hover>
                        <TableCell>{config.field_name}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={config.display_label}
                            onChange={(e) => handleChange(config.id, 'display_label', e.target.value)}
                            fullWidth
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Switch
                            checked={config.is_visible}
                            onChange={(e) => handleChange(config.id, 'is_visible', e.target.checked)}
                            color="primary"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Switch
                            checked={config.is_required}
                            onChange={(e) => handleChange(config.id, 'is_required', e.target.checked)}
                            color="primary"
                            disabled={!config.is_visible}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Switch
                            checked={config.is_readonly}
                            onChange={(e) => handleChange(config.id, 'is_readonly', e.target.checked)}
                            color="primary"
                            disabled={!config.is_visible}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={config.display_order}
                            onChange={(e) => handleChange(config.id, 'display_order', parseInt(e.target.value) || 0)}
                            sx={{ width: '80px' }}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={config.section}
                              onChange={(e) => handleChange(config.id, 'section', e.target.value)}
                            >
                              <MenuItem value="basic">Basic</MenuItem>
                              <MenuItem value="classification">Classification</MenuItem>
                              <MenuItem value="pricing">Pricing</MenuItem>
                              <MenuItem value="stock">Stock</MenuItem>
                              <MenuItem value="settings">Settings</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        })}
        </Paper>
      </Box>
    </Box>
  );
};

export default ItemSettings;

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Paper, Grid, TextField, Button, Typography, MenuItem,
  FormControl, InputLabel, Select, Divider, CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../../api/inventory.api';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory2';
import PlotIcon from '@mui/icons-material/Landscape';
import type { PlotFormData, InventoryStatus } from '../../types/inventory.types';
import { getPageContainerStyles, getContentSectionStyles } from '../../utils/spacing';

const empty: PlotFormData = {
  plot_number: '',
  project: '',
  area: '',
  price: '',
  status: 'AVAILABLE',
  facing: '',
  notes: '',
};

const PlotForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const isEditMode = location.pathname.includes('/edit/');
  const isViewMode = location.pathname.includes('/view/');
  usePageTitle(isViewMode ? 'View Plot' : isEditMode ? 'Edit Plot' : 'Add Plot');

  const [formData, setFormData] = useState<PlotFormData>(empty);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Inventory', path: '/inventory/plots', icon: <InventoryIcon fontSize="small" /> },
      { label: 'Plots', path: '/inventory/plots', icon: <PlotIcon fontSize="small" /> },
      ...(id ? [{ label: isViewMode ? 'View' : 'Edit', path: location.pathname, icon: <PlotIcon fontSize="small" /> }] : []),
    ]);
  }, [setBreadcrumbs, id, isViewMode, location.pathname]);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['plot', id],
    queryFn: () => inventoryApi.getPlot(id!),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: choices } = useQuery({
    queryKey: ['plot-choices'],
    queryFn: () => inventoryApi.getPlotChoices(),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
  });

  const { data: projects } = useQuery({
    queryKey: ['inventory-projects'],
    queryFn: () => inventoryApi.getProjects(),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (existing) {
      setFormData({
        plot_number: existing.plot_number || '',
        project: existing.project || '',
        area: existing.area,
        price: existing.price,
        status: existing.status || 'AVAILABLE',
        facing: existing.facing || '',
        notes: existing.notes || '',
      });
    }
  }, [existing]);

  const createMut = useMutation({
    mutationFn: (data: PlotFormData) => inventoryApi.createPlot(data),
    onSuccess: () => {
      success('Plot created');
      queryClient.invalidateQueries({ queryKey: ['plots'] });
      navigate('/inventory/plots');
    },
    onError: (e: any) => error(e.response?.data?.message || 'Failed to create plot'),
  });

  const updateMut = useMutation({
    mutationFn: (data: PlotFormData) => inventoryApi.updatePlot(id!, data),
    onSuccess: () => {
      success('Plot updated');
      queryClient.invalidateQueries({ queryKey: ['plots'] });
      navigate('/inventory/plots');
    },
    onError: (e: any) => error(e.response?.data?.message || 'Failed to update plot'),
  });

  const handleSave = () => {
    if (!formData.plot_number || !formData.project || !formData.area || !formData.price) {
      error('Please fill all required fields');
      return;
    }
    const payload = {
      ...formData,
      area: Number(formData.area),
      price: Number(formData.price),
    };
    if (isEditMode) updateMut.mutate(payload);
    else createMut.mutate(payload);
  };

  if (id && isLoading) {
    return (
      <Box sx={getPageContainerStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  const disabled = isViewMode;

  return (
    <Box sx={getPageContainerStyles()}>
      <ScreenHeader title={isViewMode ? 'View Plot' : isEditMode ? 'Edit Plot' : 'Add Plot'} showAddButton={false} />
      <Paper sx={getContentSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Plot Details</Typography>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/inventory/plots')} variant="outlined" size="small">
            Back
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth required size="small"
              label="Plot Number"
              value={formData.plot_number}
              disabled={disabled}
              onChange={(e) => setFormData({ ...formData, plot_number: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth required size="small" disabled={disabled}>
              <InputLabel>Project</InputLabel>
              <Select
                label="Project"
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              >
                {(projects || []).map((p: any) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth required size="small" disabled={disabled}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as InventoryStatus })}
              >
                {(choices?.statuses || []).map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth required size="small"
              label="Area (sq.ft)"
              type="number"
              value={formData.area}
              disabled={disabled}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth required size="small"
              label="Price"
              type="number"
              value={formData.price}
              disabled={disabled}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth size="small"
              label="Facing"
              value={formData.facing || ''}
              disabled={disabled}
              onChange={(e) => setFormData({ ...formData, facing: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth size="small" multiline rows={3}
              label="Notes"
              value={formData.notes || ''}
              disabled={disabled}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Grid>
        </Grid>

        {!disabled && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => navigate('/inventory/plots')} color="inherit">Cancel</Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={createMut.isPending || updateMut.isPending}
            >
              {isEditMode ? 'Update' : 'Create Plot'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PlotForm;
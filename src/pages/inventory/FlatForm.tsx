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
import FlatIcon from '@mui/icons-material/Apartment';
import type { FlatFormData, InventoryStatus } from '../../types/inventory.types';
import { getPageContainerStyles, getContentSectionStyles } from '../../utils/spacing';

const empty: FlatFormData = {
  project: '',
  tower: '',
  floor: '',
  unit_number: '',
  area: '',
  facing: '',
  price: '',
  status: 'AVAILABLE',
  notes: '',
};

const FlatForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const isEditMode = location.pathname.includes('/edit/');
  const isViewMode = location.pathname.includes('/view/');
  usePageTitle(isViewMode ? 'View Flat' : isEditMode ? 'Edit Flat' : 'Add Flat');

  const [formData, setFormData] = useState<FlatFormData>(empty);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Inventory', path: '/inventory/flats', icon: <InventoryIcon fontSize="small" /> },
      { label: 'Flats', path: '/inventory/flats', icon: <FlatIcon fontSize="small" /> },
      ...(id ? [{ label: isViewMode ? 'View' : 'Edit', path: location.pathname, icon: <FlatIcon fontSize="small" /> }] : []),
    ]);
  }, [setBreadcrumbs, id, isViewMode, location.pathname]);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['flat', id],
    queryFn: () => inventoryApi.getFlat(id!),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: choices } = useQuery({
    queryKey: ['flat-choices'],
    queryFn: () => inventoryApi.getFlatChoices(),
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
        project: existing.project || '',
        tower: existing.tower || '',
        floor: existing.floor,
        unit_number: existing.unit_number || '',
        area: existing.area,
        facing: existing.facing || '',
        price: existing.price,
        status: existing.status || 'AVAILABLE',
        notes: existing.notes || '',
      });
    }
  }, [existing]);

  const createMut = useMutation({
    mutationFn: (data: FlatFormData) => inventoryApi.createFlat(data),
    onSuccess: () => {
      success('Flat created');
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      navigate('/inventory/flats');
    },
    onError: (e: any) => error(e.response?.data?.message || 'Failed to create flat'),
  });

  const updateMut = useMutation({
    mutationFn: (data: FlatFormData) => inventoryApi.updateFlat(id!, data),
    onSuccess: () => {
      success('Flat updated');
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      navigate('/inventory/flats');
    },
    onError: (e: any) => error(e.response?.data?.message || 'Failed to update flat'),
  });

  const handleSave = () => {
    if (!formData.project || !formData.tower || !formData.floor || !formData.unit_number || !formData.area || !formData.price) {
      error('Please fill all required fields');
      return;
    }
    const payload = {
      ...formData,
      floor: Number(formData.floor),
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
      <ScreenHeader title={isViewMode ? 'View Flat' : isEditMode ? 'Edit Flat' : 'Add Flat'} showAddButton={false} />
      <Paper sx={getContentSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Flat Details</Typography>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/inventory/flats')} variant="outlined" size="small">
            Back
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
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
            <TextField
              fullWidth required size="small"
              label="Tower"
              value={formData.tower}
              disabled={disabled}
              onChange={(e) => setFormData({ ...formData, tower: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth required size="small"
              label="Floor"
              type="number"
              value={formData.floor}
              disabled={disabled}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth required size="small"
              label="Unit Number"
              value={formData.unit_number}
              disabled={disabled}
              onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
            />
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
              fullWidth size="small"
              label="Facing"
              value={formData.facing || ''}
              disabled={disabled}
              onChange={(e) => setFormData({ ...formData, facing: e.target.value })}
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
            <Button onClick={() => navigate('/inventory/flats')} color="inherit">Cancel</Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={createMut.isPending || updateMut.isPending}
            >
              {isEditMode ? 'Update' : 'Create Flat'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default FlatForm;
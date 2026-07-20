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
  flat_type: '',
  area_sqft: '',
  carpet_area_sqft: '',
  facing: '',
  price: '',
  status: 'AVAILABLE',
  remarks: '',
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
      { label: isViewMode ? 'View' : isEditMode ? 'Edit' : 'Add' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isViewMode, isEditMode]);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['flat', id],
    queryFn: () => inventoryApi.getFlat(id!),
    enabled: !!id,
    staleTime: 0,
  });

  const { data: choices } = useQuery({
    queryKey: ['flat-choices'],
    queryFn: () => inventoryApi.getFlatChoices(),
    staleTime: 0,
  });

  const { data: projects } = useQuery({
    queryKey: ['inventory-projects'],
    queryFn: () => inventoryApi.getProjects(),
    staleTime: 0,
  });

  useEffect(() => {
    if (existing) {
      setFormData({
        project: existing.project || '',
        tower: existing.tower || '',
        floor: existing.floor ?? '',
        unit_number: existing.unit_number || '',
        flat_type: existing.flat_type || '',
        area_sqft: existing.area_sqft ?? '',
        carpet_area_sqft: existing.carpet_area_sqft ?? '',
        facing: existing.facing || '',
        price: existing.price ?? '',
        status: existing.status || 'AVAILABLE',
        remarks: existing.remarks || '',
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
    onError: (e: any) => error(e.response?.data?.detail || e.response?.data?.unit_number?.[0] || 'Failed to create flat'),
  });

  const updateMut = useMutation({
    mutationFn: (data: FlatFormData) => inventoryApi.updateFlat(id!, data),
    onSuccess: () => {
      success('Flat updated');
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      navigate('/inventory/flats');
    },
    onError: (e: any) => error(e.response?.data?.detail || 'Failed to update flat'),
  });

  const handleSave = () => {
    if (!formData.project || !formData.tower || !formData.unit_number) {
      error('Please fill required fields: Project, Tower, Unit Number');
      return;
    }
    const payload: FlatFormData = {
      ...formData,
      floor: formData.floor !== '' ? Number(formData.floor) : '',
      area_sqft: formData.area_sqft ? Number(formData.area_sqft) : undefined,
      carpet_area_sqft: formData.carpet_area_sqft ? Number(formData.carpet_area_sqft) : undefined,
      price: formData.price ? Number(formData.price) : undefined,
    };
    if (isEditMode) updateMut.mutate(payload);
    else createMut.mutate(payload);
  };

  if (id && isLoading) {
    return (
      <Box sx={getPageContainerStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
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
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/inventory/flats')} variant="outlined" size="small">Back</Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {/* Project */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth required size="small" disabled={disabled}>
              <InputLabel>Project</InputLabel>
              <Select label="Project" value={formData.project} onChange={(e) => setFormData({ ...formData, project: e.target.value })}>
                {(projects || []).map((p: any) => (<MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          {/* Tower */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth required size="small" label="Tower" value={formData.tower} disabled={disabled}
              onChange={(e) => setFormData({ ...formData, tower: e.target.value })} />
          </Grid>
          {/* Floor */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth size="small" label="Floor" type="number" value={formData.floor} disabled={disabled}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })} />
          </Grid>
          {/* Unit Number */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth required size="small" label="Unit Number" value={formData.unit_number} disabled={disabled}
              onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })} />
          </Grid>
          {/* Flat Type */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth size="small" label="Flat Type" value={formData.flat_type || ''} disabled={disabled}
              placeholder="e.g. 2BHK, 3BHK"
              onChange={(e) => setFormData({ ...formData, flat_type: e.target.value })} />
          </Grid>
          {/* Area (sq.ft) */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth size="small" label="Area (sq.ft)" type="number" value={formData.area_sqft} disabled={disabled}
              onChange={(e) => setFormData({ ...formData, area_sqft: e.target.value })} />
          </Grid>
          {/* Facing */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth size="small" disabled={disabled}>
              <InputLabel>Facing</InputLabel>
              <Select label="Facing" value={formData.facing || ''} onChange={(e) => setFormData({ ...formData, facing: e.target.value })}>
                <MenuItem value="">None</MenuItem>
                {(choices?.facings || []).map((f) => (<MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          {/* Price */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth size="small" label="Price (₹)" type="number" value={formData.price} disabled={disabled}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
          </Grid>
          {/* Status */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth required size="small" disabled={disabled}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as InventoryStatus })}>
                {(choices?.statuses || []).map((s) => (<MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          {/* Remarks */}
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth size="small" multiline rows={3} label="Remarks" value={formData.remarks || ''} disabled={disabled}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
          </Grid>
        </Grid>

        {!disabled && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => navigate('/inventory/flats')} color="inherit">Cancel</Button>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {isEditMode ? 'Update' : 'Create Flat'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default FlatForm;

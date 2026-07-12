import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Save as SaveIcon, Home as HomeIcon, Folder as FolderIcon, AltRoute as AltRouteIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../../components/common/ScreenHeader';
import LocationCascadeSelector from '../../../components/masters/LocationCascadeSelector';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { routeApi } from '../../../api/masters.api';
import type { RouteFormData } from '../../../types/masters.types';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../../../utils/spacing';

const RouteForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const isEditMode = Boolean(id);

  usePageTitle(isEditMode ? 'Edit Route' : 'Add Route');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RouteFormData>({
    defaultValues: {
      code: '',
      name: '',
      is_active: true,
      location_states: [],
      location_cities: [],
      location_areas: [],
    },
  });

  const [selectedLocationStates, setSelectedLocationStates] = useState<string[]>([]);
  const [selectedLocationCities, setSelectedLocationCities] = useState<string[]>([]);
  const [selectedLocationAreas, setSelectedLocationAreas] = useState<string[]>([]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Route', path: '/masters/route', icon: <AltRouteIcon fontSize="small" /> },
      { label: isEditMode ? 'Edit Route' : 'Add Route' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode]);

  const { data: routeData, isLoading: isLoadingRoute } = useQuery({
    queryKey: ['route', id],
    queryFn: () => routeApi.getRoute(id!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (routeData) {
      reset({
        code: routeData.code || '',
        name: routeData.name || '',
        is_active: routeData.is_active,
        location_states: [],
        location_cities: [],
        location_areas: [],
      });

      const states: string[] = [];
      const cities: string[] = [];
      const areas: string[] = [];

      (routeData.coverages || []).forEach((coverage) => {
        if (coverage.state && !states.includes(coverage.state)) states.push(coverage.state);
        if (coverage.city && !cities.includes(coverage.city)) cities.push(coverage.city);
        if (coverage.area && !areas.includes(coverage.area)) areas.push(coverage.area);
      });

      setSelectedLocationStates(states);
      setSelectedLocationCities(cities);
      setSelectedLocationAreas(areas);
    }
  }, [routeData, reset]);

  const createMutation = useMutation({
    mutationFn: routeApi.createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toastSuccess('Route created successfully');
      setTimeout(() => navigate('/masters/route'), 800);
    },
    onError: (error: any) => {
      toastError(error?.response?.data?.detail || error?.response?.data?.route?.[0] || 'Failed to create route');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: RouteFormData) => routeApi.updateRoute(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['route', id] });
      toastSuccess('Route updated successfully');
      setTimeout(() => navigate('/masters/route'), 800);
    },
    onError: (error: any) => {
      toastError(error?.response?.data?.detail || error?.response?.data?.route?.[0] || 'Failed to update route');
    },
  });

  const onSubmit = async (data: RouteFormData) => {
    if (selectedLocationAreas.length === 0) {
      toastError('At least one coverage area must be selected');
      return;
    }

    const payload: RouteFormData = {
      ...data,
      location_states: selectedLocationStates,
      location_cities: selectedLocationCities,
      location_areas: selectedLocationAreas,
    };

    if (isEditMode) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const handleBack = () => {
    navigate('/masters/route');
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingRoute) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <ScreenHeader title={isEditMode ? 'Edit Route' : 'Add Route'} showBackButton onBack={handleBack} disableBox />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button variant="outlined" color="secondary" size="small" onClick={handleBack} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="route-form"
              variant="contained"
              color="primary"
              size="small"
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ p: 3, borderRadius: 0 }}>
          <form id="route-form" onSubmit={handleSubmit(onSubmit)}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Basic Information
            </Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Route Code
                </Typography>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Leave empty for auto-generation"
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
              </Grid> */}

              <Grid size={{ xs: 12, sm: 5 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Route Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: 'Route name is required',
                    maxLength: { value: 150, message: 'Route name must not exceed 150 characters' },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Enter route name"
                      fullWidth
                      size="small"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Status
                </Typography>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} disabled={isSubmitting} />}
                      label={field.value ? 'Active' : 'Inactive'}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Coverage Areas
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Select the states, cities, and areas to be tagged to this route.
            </Typography>

            <LocationCascadeSelector
              selectedStates={selectedLocationStates}
              selectedCities={selectedLocationCities}
              selectedAreas={selectedLocationAreas}
              onSelectionChange={(selection) => {
                setSelectedLocationStates(selection.states);
                setSelectedLocationCities(selection.cities);
                setSelectedLocationAreas(selection.areas);
              }}
            />

            {(selectedLocationStates.length > 0 || selectedLocationCities.length > 0 || selectedLocationAreas.length > 0) && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {selectedLocationStates.length} states, {selectedLocationCities.length} cities, {selectedLocationAreas.length} areas selected
                </Typography>
              </Box>
            )}
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default RouteForm;

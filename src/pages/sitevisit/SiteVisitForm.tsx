import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteVisitApi } from '../../api/siteVisit.api';
import { leadApi } from '../../api/lead.api';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import type { SiteVisit, SiteVisitFormData, SiteVisitStatus } from '../../types/siteVisit.types';
import { getPageContainerStyles, getContentSectionStyles } from '../../utils/spacing';

const emptyForm: SiteVisitFormData = {
  customer_name: '',
  project_name: '',
  visit_date: new Date().toISOString().split('T')[0],
  assigned_employee: '',
  status: 'SCHEDULED',
  customer_feedback: '',
  remarks: '',
  photos: [],
};

const SiteVisitForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const isEditMode = location.pathname.includes('/edit/');
  const isViewMode = location.pathname.includes('/view/');
  usePageTitle(isViewMode ? 'View Site Visit' : isEditMode ? 'Edit Site Visit' : 'Schedule Site Visit');

  const [formData, setFormData] = useState<SiteVisitFormData>(emptyForm);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Site Visit Management', path: '/sitevisit', icon: <LocationOnIcon fontSize="small" /> },
      ...(id ? [{ label: isViewMode ? 'View' : 'Edit', path: location.pathname, icon: <LocationOnIcon fontSize="small" /> }] : []),
    ]);
  }, [setBreadcrumbs, id, isViewMode, location.pathname]);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['site-visit', id],
    queryFn: () => siteVisitApi.getSiteVisit(id!),
    enabled: !!id,
  });

  const { data: choices } = useQuery({
    queryKey: ['site-visit-choices'],
    queryFn: () => siteVisitApi.getChoices(),
  });

  const { data: usersData } = useQuery({
    queryKey: ['site-visit-users'],
    queryFn: () => leadApi.getUsers(),
  });
  const users: { id: string; name: string }[] = usersData || [];

  useEffect(() => {
    if (existing) {
      const empId =
        typeof existing.assigned_employee === 'string'
          ? existing.assigned_employee
          : existing.assigned_employee?.id || '';
      setFormData({
        customer_name: existing.customer_name || '',
        project_name: existing.project_name || '',
        visit_date: existing.visit_date || '',
        assigned_employee: empId,
        status: existing.status || 'SCHEDULED',
        customer_feedback: existing.customer_feedback || '',
        remarks: existing.remarks || '',
        photos: existing.photos || [],
      });
    }
  }, [existing]);

  const createMutation = useMutation({
    mutationFn: (data: SiteVisitFormData) => siteVisitApi.createSiteVisit(data),
    onSuccess: () => {
      toastSuccess('Site visit scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['site-visits'] });
      navigate('/sitevisit');
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to schedule site visit'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: SiteVisitFormData) => siteVisitApi.updateSiteVisit(id!, data),
    onSuccess: () => {
      toastSuccess('Site visit updated successfully');
      queryClient.invalidateQueries({ queryKey: ['site-visits'] });
      navigate('/sitevisit');
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to update site visit'),
  });

  const handleSave = () => {
    if (!formData.customer_name || !formData.project_name || !formData.visit_date || !formData.assigned_employee) {
      toastError('Please fill all required fields');
      return;
    }
    if (isEditMode) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
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
  const showCompletion = formData.status === 'COMPLETED';

  return (
    <Box sx={getPageContainerStyles()}>
      <ScreenHeader
        title={isViewMode ? 'View Site Visit' : isEditMode ? 'Edit Site Visit' : 'Schedule Site Visit'}
        showAddButton={false}
      />

      <Paper sx={getContentSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Visit Details</Typography>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/sitevisit')} variant="outlined" size="small">
            Back
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
          Schedule
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth required size="small"
              label="Customer Name"
              value={formData.customer_name}
              disabled={disabled}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth required size="small"
              label="Project Name"
              value={formData.project_name}
              disabled={disabled}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth required size="small"
              label="Visit Date" type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.visit_date}
              disabled={disabled}
              onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth required size="small" disabled={disabled}>
              <InputLabel>Assigned Employee</InputLabel>
              <Select
                label="Assigned Employee"
                value={formData.assigned_employee}
                onChange={(e) => setFormData({ ...formData, assigned_employee: e.target.value })}
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
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
                onChange={(e) => setFormData({ ...formData, status: e.target.value as SiteVisitStatus })}
              >
                {(choices?.statuses || [
                  { value: 'SCHEDULED', label: 'Scheduled' },
                  { value: 'CONFIRMED', label: 'Confirmed' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ]).map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {showCompletion && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
              Completion Details
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth size="small" multiline rows={3}
                  label="Customer Feedback"
                  value={formData.customer_feedback || ''}
                  disabled={disabled}
                  onChange={(e) => setFormData({ ...formData, customer_feedback: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth size="small" multiline rows={3}
                  label="Remarks"
                  value={formData.remarks || ''}
                  disabled={disabled}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Photos: {(formData.photos?.length || 0)} attached
                </Typography>
                {/* Photo upload placeholder — wire to backend when API supports it */}
              </Grid>
            </Grid>
          </>
        )}

        {!disabled && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => navigate('/sitevisit')} color="inherit">Cancel</Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isEditMode ? 'Update' : 'Schedule Visit'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default SiteVisitForm;
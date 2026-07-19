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
  CircularProgress,
  IconButton,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteVisitApi } from '../../api/siteVisit.api';
import { leadApi } from '../../api/lead.api';
import { projectsApi } from '../../api/projects';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import type { SiteVisitFormData, SiteVisitStatus } from '../../types/siteVisit.types';
import { getPageContainerStyles, getContentSectionStyles } from '../../utils/spacing';

const emptyForm: SiteVisitFormData = {
  customer_name: '',
  project: '',
  visit_date: new Date().toISOString().split('T')[0],
  assigned_employee: '',
  status: 'SCHEDULED',
  customer_feedback: '',
  remarks: '',
  photos: [],
};

const DEFAULT_STATUSES: { value: SiteVisitStatus; label: string }[] = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const SiteVisitForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const isEditMode = location.pathname.includes('/edit/');
  const isViewMode = location.pathname.includes('/view/');
  const disabled = isViewMode;

  usePageTitle(isViewMode ? 'View Site Visit' : isEditMode ? 'Edit Site Visit' : 'Schedule Site Visit');

  const [formData, setFormData] = useState<SiteVisitFormData>(emptyForm);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // --- Breadcrumbs ---
  useEffect(() => {
    const label = isViewMode ? 'View' : isEditMode ? 'Edit' : 'Schedule';
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Site Visit Management', path: '/sitevisit/list/list', icon: <LocationOnIcon fontSize="small" /> },
      { label },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isViewMode, isEditMode]);

  // --- Queries ---
  const { data: existing, isLoading } = useQuery({
    queryKey: ['site-visit', id],
    queryFn: () => siteVisitApi.getSiteVisit(id!),
    enabled: !!id,
    staleTime: 0,
  });

  const { data: choices } = useQuery({
    queryKey: ['site-visit-choices'],
    queryFn: () => siteVisitApi.getChoices(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['site-visit-users'],
    queryFn: () => leadApi.getUsers(),
    staleTime: 5 * 60 * 1000,
  });
  const users: { id: string; name: string }[] = usersData || [];

  const { data: projectsData } = useQuery({
    queryKey: ['site-visit-projects'],
    queryFn: () => projectsApi.mini(),
    staleTime: 5 * 60 * 1000,
  });
  const projects: { id: string; name: string }[] = projectsData || [];

  // --- Populate form on edit/view ---
  useEffect(() => {
    if (!existing) return;
    const empId =
      typeof existing.assigned_employee === 'string'
        ? existing.assigned_employee
        : existing.assigned_employee?.id || '';
    const projectId =
      typeof existing.project === 'string'
        ? existing.project
        : existing.project?.id || '';
    setFormData({
      customer_name: existing.customer_name || '',
      project: projectId,
      visit_date: existing.visit_date || '',
      assigned_employee: empId,
      status: existing.status || 'SCHEDULED',
      customer_feedback: existing.customer_feedback || '',
      remarks: existing.remarks || '',
      photos: existing.photos || [],
    });
  }, [existing]);

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: (data: FormData) => siteVisitApi.createSiteVisit(data),
    onSuccess: async (created: { id: string }) => {
      // Backend create doesn't handle photos; upload them after the row exists.
      if (selectedFiles.length > 0) {
        try {
          await siteVisitApi.uploadPhotos(created.id, selectedFiles);
        } catch {
          toastError('Visit saved, but photo upload failed');
        }
      }
      toastSuccess('Site visit scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['site-visits'] });
      navigate('/sitevisit/list');
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to schedule site visit'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => siteVisitApi.updateSiteVisit(id!, data as any),
    onSuccess: async () => {
      if (selectedFiles.length > 0) {
        try {
          await siteVisitApi.uploadPhotos(id!, selectedFiles);
        } catch {
          toastError('Visit updated, but photo upload failed');
        }
      }
      toastSuccess('Site visit updated successfully');
      queryClient.invalidateQueries({ queryKey: ['site-visits'] });
      navigate('/sitevisit/list');
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to update site visit'),
  });

  // --- Save handler: send JSON for fields, photos go via upload_photos after create/update ---
  const handleSave = () => {
    if (!formData.customer_name || !formData.project || !formData.visit_date || !formData.assigned_employee) {
      toastError('Please fill all required fields');
      return;
    }

    const fd = new FormData();
    fd.append('customer_name', formData.customer_name);
    fd.append('project', formData.project); // FK UUID — backend rejects project_name
    fd.append('visit_date', formData.visit_date);
    fd.append('assigned_employee', formData.assigned_employee);
    fd.append('status', formData.status);
    if (formData.customer_feedback) fd.append('customer_feedback', formData.customer_feedback);
    if (formData.remarks) fd.append('remarks', formData.remarks);

    if (isEditMode) {
      updateMutation.mutate(fd);
    } else {
      createMutation.mutate(fd);
    }
  };

  // --- File picker: just adds to local state ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setFilePreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const handleRemoveFile = (idx: number) => {
    URL.revokeObjectURL(filePreviews[idx]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setFilePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveSavedPhoto = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== idx),
    }));
  };

  // --- Loading state ---
  if (id && isLoading) {
    return (
      <Box sx={getPageContainerStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  const statuses = choices?.statuses || DEFAULT_STATUSES;
  const showCompletion = formData.status === 'COMPLETED';
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Box sx={getPageContainerStyles()}>
      <ScreenHeader
        title={isViewMode ? 'View Site Visit' : isEditMode ? 'Edit Site Visit' : 'Schedule Site Visit'}
        showAddButton={false}
      />

      <Paper sx={getContentSectionStyles()}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Visit Details</Typography>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/sitevisit/list')} variant="outlined" size="small">
            Back
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {/* Schedule Section */}
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
            <Autocomplete
              size="small"
              options={projects}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              value={projects.find((p) => p.id === formData.project) || null}
              onChange={(_, v) => setFormData({ ...formData, project: v?.id || '' })}
              disabled={disabled}
              renderInput={(params) => (
                <TextField {...params} label="Project" required />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth required size="small"
              label="Visit Date"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
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
                {statuses.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Completion Details Section */}
        {showCompletion && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
              Completion Details
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth size="small" multiline rows={3}
                  label="Customer Feedback"
                  value={formData.customer_feedback || ''}
                  disabled={disabled}
                  onChange={(e) => setFormData({ ...formData, customer_feedback: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth size="small" multiline rows={3}
                  label="Remarks"
                  value={formData.remarks || ''}
                  disabled={disabled}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </Grid>
            </Grid>
          </>
        )}

        {/* Photo Section */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
          Photos
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          {/* Saved photos (from server, edit/view mode) */}
          {(formData.photos || []).map((url, idx) => (
            <Box key={`saved-${idx}`} sx={{ position: 'relative', width: 100, height: 100 }}>
              <img
                src={url}
                alt={`Photo ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
              />
              {!disabled && (
                <IconButton
                  size="small"
                  onClick={() => handleRemoveSavedPhoto(idx)}
                  sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' }, width: 22, height: 22 }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Box>
          ))}
          {/* New files selected (not yet saved) */}
          {filePreviews.map((url, idx) => (
            <Box key={`new-${idx}`} sx={{ position: 'relative', width: 100, height: 100 }}>
              <img
                src={url}
                alt={`New ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
              />
              {!disabled && (
                <IconButton
                  size="small"
                  onClick={() => handleRemoveFile(idx)}
                  sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' }, width: 22, height: 22 }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Box>
          ))}
          {/* Add photo button (looks like a thumbnail placeholder) */}
          {!disabled && (
            <Box
              component="label"
              sx={{
                width: 100, height: 100, border: '2px dashed', borderColor: 'grey.400',
                borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}
            >
              <AddPhotoIcon sx={{ fontSize: 32, color: 'grey.500' }} />
              <input type="file" hidden multiple accept="image/*" onChange={handleFileSelect} />
            </Box>
          )}
          {disabled && (formData.photos || []).length === 0 && (
            <Typography variant="body2" color="text.secondary">No photos</Typography>
          )}
        </Box>

        {/* Single Save Button */}
        {!disabled && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => navigate('/sitevisit/list')} color="inherit">Cancel</Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Schedule Visit'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default SiteVisitForm;

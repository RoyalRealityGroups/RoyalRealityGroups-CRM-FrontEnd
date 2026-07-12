import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Grid, Button, TextField, MenuItem, FormControl, InputLabel, Select,
  Alert, CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../../api/projects';
import apiClient from '../../../api/axios.config';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import ScreenHeader from '../../../components/common/ScreenHeader';
import type { Project, ProjectFormData, ProjectChoices } from '../../../types/project.types';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';

const ProjectFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  usePageTitle(isEdit ? 'Edit Project' : 'New Project');
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  React.useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters' },
      { label: 'Projects', path: '/masters/projects', icon: <BusinessIcon fontSize="small" /> },
      { label: isEdit ? 'Edit' : 'New' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEdit]);

  const [form, setForm] = useState<ProjectFormData | null>(null);

  const { data: project } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id!),
    enabled: isEdit,
  });

  const { data: choices } = useQuery<ProjectChoices>({
    queryKey: ['projects-choices'],
    queryFn: () => projectsApi.choices(),
  });

  const { data: locationsData } = useQuery({
    queryKey: ['locations-mini'],
    queryFn: async () => {
      const r = await apiClient.get('/api/masters/locations/mini/');
      return Array.isArray(r.data) ? r.data : r.data.results || [];
    },
  });
  const locations: any[] = Array.isArray(locationsData) ? locationsData : locationsData?.results || [];

  useEffect(() => {
    if (isEdit && project) {
      setForm({
        name: project.name,
        developer_name: project.developer_name || '',
        project_type: project.project_type,
        location: project.location || null,
        address: project.address || '',
        approval_type: project.approval_type,
        rera_number: project.rera_number || '',
        total_area: project.total_area || '',
        launch_date: project.launch_date || null,
        possession_date: project.possession_date || null,
        description: project.description || '',
        image_url: project.image_url || '',
        brochure_url: project.brochure_url || '',
        layout_plan_url: project.layout_plan_url || '',
        floor_plan_url: project.floor_plan_url || '',
        status: project.status,
        is_active: project.is_active,
      });
    } else if (!isEdit) {
      setForm({
        name: '',
        developer_name: '',
        project_type: 'PLOT',
        location: null,
        address: '',
        approval_type: 'PENDING',
        rera_number: '',
        total_area: '',
        launch_date: null,
        possession_date: null,
        description: '',
        image_url: '',
        brochure_url: '',
        layout_plan_url: '',
        floor_plan_url: '',
        status: 'UPCOMING',
        is_active: true,
      });
    }
  }, [project, isEdit]);

  const saveMutation = useMutation({
    mutationFn: (payload: ProjectFormData) =>
      isEdit ? projectsApi.update(id!, payload) : projectsApi.create(payload),
    onSuccess: (saved) => {
      success(isEdit ? 'Project updated' : 'Project created');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', saved.id] });
      navigate(`/masters/projects/view/${saved.id}`);
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Save failed');
    },
  });

  if (!form) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toastError('Project name is required');
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <Box sx={{ p: 2 }}>
      <ScreenHeader
        title={isEdit ? 'Edit Project' : 'New Project'}
        subtitle={isEdit ? project?.code : undefined}
      />

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth required label="Project Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Developer Name"
              value={form.developer_name}
              onChange={(e) => setForm({ ...form, developer_name: e.target.value })} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Project Type</InputLabel>
              <Select label="Project Type" value={form.project_type}
                onChange={(e) => setForm({ ...form, project_type: e.target.value })}>
                {(choices?.project_types || []).map((c) => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Approval Type</InputLabel>
              <Select label="Approval Type" value={form.approval_type}
                onChange={(e) => setForm({ ...form, approval_type: e.target.value })}>
                {(choices?.approval_types || []).map((c) => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {(choices?.project_statuses || []).map((c) => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select label="Location" value={form.location || ''}
                onChange={(e) => setForm({ ...form, location: e.target.value || null })}>
                <MenuItem value="">— None —</MenuItem>
                {locations.map((l: any) => (
                  <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="RERA Number"
              value={form.rera_number}
              onChange={(e) => setForm({ ...form, rera_number: e.target.value })} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField fullWidth multiline rows={2} label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Total Area" placeholder='e.g. "5 acres"'
              value={form.total_area}
              onChange={(e) => setForm({ ...form, total_area: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth type="date" label="Launch Date"
              InputLabelProps={{ shrink: true }}
              value={form.launch_date || ''}
              onChange={(e) => setForm({ ...form, launch_date: e.target.value || null })} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth type="date" label="Possession Date"
              InputLabelProps={{ shrink: true }}
              value={form.possession_date || ''}
              onChange={(e) => setForm({ ...form, possession_date: e.target.value || null })} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField fullWidth multiline rows={3} label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Image URL"
              value={form.image_url || ''}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Brochure URL"
              value={form.brochure_url || ''}
              onChange={(e) => setForm({ ...form, brochure_url: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Layout Plan URL"
              value={form.layout_plan_url || ''}
              onChange={(e) => setForm({ ...form, layout_plan_url: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Floor Plan URL"
              value={form.floor_plan_url || ''}
              onChange={(e) => setForm({ ...form, floor_plan_url: e.target.value })} />
          </Grid>
        </Grid>

        {saveMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {(saveMutation.error as any)?.response?.data?.message || 'Save failed'}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit}
            disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : (isEdit ? 'Update' : 'Create')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProjectFormPage;
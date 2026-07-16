import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Grid, Typography, Chip, Button,
  CircularProgress, Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../../api/projects';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import ScreenHeader from '../../../components/common/ScreenHeader';
import type { Project } from '../../../types/project.types';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';

const Field: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Box sx={{ mt: 0.5 }}>
      {value ?? <Typography variant="body2" color="text.disabled">—</Typography>}
    </Box>
  </Box>
);

const statusColor = (s: string): any =>
  s === 'ACTIVE' ? 'success' :
  s === 'UPCOMING' ? 'info' :
  s === 'COMPLETED' ? 'default' :
  s === 'SOLD_OUT' ? 'warning' : 'default';

const ProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();
  usePageTitle('Project Details');

  React.useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters' },
      { label: 'Projects', path: '/masters/projects', icon: <BusinessIcon fontSize="small" /> },
      { label: 'Details' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const { data: project, isLoading, isError, error } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !project) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          {(error as any)?.response?.data?.detail || 'Project not found'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} sx={{ mt: 2 }} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <ScreenHeader
        title={project.name}
      />

      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={project.status_display || project.status}
              color={statusColor(project.status)}
              size="small"
            />
            {project.is_deleted && <Chip label="Deleted" color="error" size="small" />}
            {!project.is_active && <Chip label="Inactive" size="small" />}
          </Box>
          <Box>
            <Button startIcon={<ArrowBackIcon />} sx={{ mr: 1 }} onClick={() => navigate('/masters/projects')}>
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/masters/projects/${project.id}/edit`)}
            >
              Edit
            </Button>
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Field label="Project Name" value={project.name} />
            <Field label="Developer Name" value={project.developer_name} />
            <Field label="Project Type" value={project.project_type_display || project.project_type} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Field label="Location" value={project.location} />
            <Field label="Approval Type" value={project.approval_type_display || project.approval_type} />
            <Field label="Project Status" value={
              <Chip
                label={project.status_display || project.status}
                color={statusColor(project.status)}
                size="small"
              />
            } />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProjectView;
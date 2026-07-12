import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Grid, Typography, Chip, Button, Divider,
  CircularProgress, Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
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
        subtitle={`${project.code} · ${project.project_type_display || project.project_type}`}
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

        {project.image_url && (
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <img
              src={project.image_url}
              alt={project.name}
              style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 4 }}
            />
          </Box>
        )}

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>Identification</Typography>
            <Field label="Project Code" value={project.code} />
            <Field label="Project Name" value={project.name} />
            <Field label="Developer" value={project.developer_name} />
            <Field label="RERA Number" value={project.rera_number} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>Classification</Typography>
            <Field label="Project Type" value={project.project_type_display || project.project_type} />
            <Field label="Approval Type" value={project.approval_type_display || project.approval_type} />
            <Field label="Total Area" value={project.total_area} />
            <Field label="Location" value={project.location_name} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>Timeline</Typography>
            <Field
              label="Launch Date"
              value={project.launch_date ? new Date(project.launch_date).toLocaleDateString() : null}
            />
            <Field
              label="Possession Date"
              value={project.possession_date ? new Date(project.possession_date).toLocaleDateString() : null}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>Address</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {project.address || '—'}
            </Typography>
          </Grid>

          {project.description && (
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" gutterBottom>Description</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {project.description}
              </Typography>
            </Grid>
          )}

          {(project.brochure_url || project.layout_plan_url || project.floor_plan_url) && (
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" gutterBottom>Marketing Assets</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {project.brochure_url && (
                  <Button
                    startIcon={<OpenInNewIcon />}
                    href={project.brochure_url}
                    target="_blank"
                    rel="noopener"
                  >
                    Brochure
                  </Button>
                )}
                {project.layout_plan_url && (
                  <Button
                    startIcon={<OpenInNewIcon />}
                    href={project.layout_plan_url}
                    target="_blank"
                    rel="noopener"
                  >
                    Layout Plan
                  </Button>
                )}
                {project.floor_plan_url && (
                  <Button
                    startIcon={<OpenInNewIcon />}
                    href={project.floor_plan_url}
                    target="_blank"
                    rel="noopener"
                  >
                    Floor Plan
                  </Button>
                )}
              </Box>
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Created by {project.created_by_name || '—'} on{' '}
              {project.created_on ? new Date(project.created_on).toLocaleString() : '—'}
              {project.modified_by_name && (
                <> · Last modified by {project.modified_by_name} on{' '}
                {project.modified_on ? new Date(project.modified_on).toLocaleString() : '—'}</>
              )}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProjectView;
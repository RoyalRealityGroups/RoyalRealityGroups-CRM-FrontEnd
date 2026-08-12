import React, { useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, CardActionArea, Typography, Chip,
  LinearProgress, Skeleton, Button, Divider, Paper, Tooltip, IconButton,
} from '@mui/material';
import {
  ArrowBack, Edit as EditIcon, Apartment as FlatIcon,
  Landscape as PlotIcon, MapsHomeWork as MixedIcon,
  HomeWork as HomeWorkIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { availabilityApi } from '../../api/availability.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';
import { getPageContainerStyles, getHeaderSectionStyles, getContentSectionStyles, APP_PRIMARY_COLOR } from '../../utils/spacing';
import { UNIT_STATUS_COLORS, UNIT_STATUS_LABELS } from '../../types/availability.types';
import type { AvailabilityBlock } from '../../types/availability.types';
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';

// ─── radial-style donut summary ───────────────────────────────────────────────
const BlockSummaryBar: React.FC<{ block: AvailabilityBlock }> = ({ block }) => {
  const total = block.total_units || 1;
  const segments = [
    { color: UNIT_STATUS_COLORS.AVAILABLE,  value: block.available_units,  label: 'Available' },
    { color: UNIT_STATUS_COLORS.BLOCKED,    value: block.blocked_units,    label: 'Blocked' },
    { color: UNIT_STATUS_COLORS.BOOKED,     value: block.booked_units,     label: 'Booked' },
    { color: UNIT_STATUS_COLORS.REGISTERED, value: block.registered_units, label: 'Registered' },
  ];

  return (
    <Box>
      {/* segmented bar */}
      <Box sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: '1px', mb: 1 }}>
        {segments.map((s) =>
          s.value > 0 ? (
            <Tooltip key={s.label} title={`${s.label}: ${s.value}`}>
              <Box sx={{
                width: `${(s.value / total) * 100}%`,
                backgroundColor: s.color,
                transition: 'width 0.4s ease',
              }} />
            </Tooltip>
          ) : null
        )}
        {block.total_units === 0 && (
          <Box sx={{ width: '100%', backgroundColor: '#E5E7EB' }} />
        )}
      </Box>
      {/* mini counts */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {segments.map((s) => (
          <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color }} />
            <Typography variant="caption" color="text.secondary">
              {s.label}: <strong>{s.value}</strong>
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// ─── block card ───────────────────────────────────────────────────────────────
const BlockCard: React.FC<{ block: AvailabilityBlock; projectId: string }> = ({ block, projectId }) => {
  const navigate = useNavigate();
  const availPct = block.total_units > 0 ? Math.round((block.available_units / block.total_units) * 100) : 0;

  return (
    <Card sx={{
      height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider',
      transition: 'all 0.2s',
      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', borderColor: APP_PRIMARY_COLOR },
    }}>
      <CardActionArea
        onClick={() => navigate(`/availability/projects/${projectId}/blocks/${block.id}`)}
        sx={{ height: '100%', p: 0 }}
      >
        <CardContent sx={{ p: 2.5 }}>
          {/* header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="h6" fontWeight={700} noWrap>{block.name}</Typography>
            <Chip
              label={`${availPct}% free`}
              size="small"
              sx={{
                backgroundColor: availPct > 50 ? '#ECFDF5' : availPct > 20 ? '#FFFBEB' : '#FEF2F2',
                color: availPct > 50 ? '#059669' : availPct > 20 ? '#D97706' : '#DC2626',
                fontWeight: 700, fontSize: '0.7rem',
              }}
            />
          </Box>

          {block.description && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
              {block.description}
            </Typography>
          )}

          {/* big number */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 2 }}>
            <Typography variant="h3" fontWeight={800} sx={{ color: UNIT_STATUS_COLORS.AVAILABLE, lineHeight: 1 }}>
              {block.available_units}
            </Typography>
            <Typography variant="body2" color="text.secondary">/ {block.total_units} available</Typography>
          </Box>

          <BlockSummaryBar block={block} />

          {block.total_floors && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {block.total_floors} floors
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

// ─── info row ─────────────────────────────────────────────────────────────────
const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) =>
  value ? (
    <Grid size={{ xs: 6, md: 3 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value}</Typography>
    </Grid>
  ) : null;

// ─── main ─────────────────────────────────────────────────────────────────────
const ProjectDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setBreadcrumbs } = useBreadcrumbs();

  const { data: project, isLoading } = useQuery({
    queryKey: ['avail-project', id],
    queryFn: () => availabilityApi.getProject(id!),
    enabled: !!id,
  });

  usePageTitle(project?.name ?? 'Project Detail');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Availability', path: '/availability/projects', icon: <ListAltIcon fontSize="small" /> },
      { label: project?.name ?? '…' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, project?.name]);

  if (isLoading) return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <Skeleton height={64} />
      </Box>
      <Box sx={getContentSectionStyles()}>
        <Grid container spacing={2.5}>
          {[0, 1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );

  if (!project) return null;

  const totalAvail = project.available_units;
  const totalAll = project.total_units;

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <ScreenHeader
          title={project.name}
          subtitle={`${project.project_type_display ?? project.project_type} · ${project.location ?? ''}`}
          showBackButton
          onBack={() => navigate('/availability/projects')}
          showAddButton={false}
        >
          <Button variant="outlined" size="small" startIcon={<EditIcon />}
            onClick={() => navigate(`/availability/projects/edit/${id}`)}>
            Edit
          </Button>
        </ScreenHeader>
      </Box>

      <Box sx={getContentSectionStyles()}>
        {/* project meta */}
        <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5, mb: 2, flexWrap: 'wrap' }}>
            {/* thumbnail */}
            {project.thumbnail_url && (
              <Box
                component="img"
                src={project.thumbnail_url}
                alt={project.name}
                sx={{
                  width: 120, height: 80, objectFit: 'cover',
                  borderRadius: 2, border: '1px solid', borderColor: 'divider',
                  flexShrink: 0,
                }}
              />
            )}
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={project.project_type_display ?? project.project_type} size="small" color="primary" />
                  <Chip label={project.status_display ?? project.status} size="small" variant="outlined" />
                  {project.developer_name && <Chip label={project.developer_name} size="small" variant="outlined" />}
                  {/* brochure download link */}
                  {project.brochure_url && (
                    <Chip
                      component="a"
                      href={project.brochure_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      label="📄 Brochure"
                      size="small"
                      clickable
                      color="info"
                      variant="outlined"
                      sx={{ textDecoration: 'none' }}
                    />
                  )}
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h4" fontWeight={800} sx={{ color: UNIT_STATUS_COLORS.AVAILABLE, lineHeight: 1 }}>
                    {totalAvail}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">of {totalAll} available</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
          <Grid container spacing={1.5}>
            <InfoRow label="Location" value={project.location} />
            <InfoRow label="City" value={project.city} />
            <InfoRow label="Total Area" value={project.total_area} />
            <InfoRow label="Possession" value={project.possession_date} />
            <InfoRow label="Approval" value={project.approval_type_display} />
            <InfoRow label="RERA" value={project.rera_number} />
            <InfoRow label="Contact" value={project.contact_person} />
            <InfoRow label="Phone" value={project.contact_phone} />
            {(project.price_range_min || project.price_range_max) && (
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Price Range</Typography>
                <Typography variant="body2" fontWeight={500}>
                  ₹{Number(project.price_range_min || 0).toLocaleString()} — ₹{Number(project.price_range_max || 0).toLocaleString()}
                </Typography>
              </Grid>
            )}
          </Grid>
          {project.amenities && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Amenities</Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {project.amenities.split(',').map((a) => a.trim()).filter(Boolean).map((a) => (
                  <Chip key={a} label={a} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                ))}
              </Box>
            </>
          )}
        </Paper>

        {/* blocks */}
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          {project.blocks.length} Block{project.blocks.length !== 1 ? 's' : ''}
        </Typography>
        {project.blocks.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography color="text.secondary">No blocks found. Edit the project to add blocks and units.</Typography>
            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate(`/availability/projects/edit/${id}`)}>
              Edit Project
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {project.blocks.map((block) => (
              <Grid key={block.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <BlockCard block={block} projectId={id!} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default ProjectDetail;

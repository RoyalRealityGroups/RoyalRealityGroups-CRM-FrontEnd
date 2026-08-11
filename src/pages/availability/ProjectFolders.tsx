import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, CardActionArea, Typography, Chip,
  InputAdornment, TextField, LinearProgress, IconButton, Tooltip,
  Menu, MenuItem, FormControl, InputLabel, Select, Skeleton,
  alpha, Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreIcon,
  FolderSpecial as FolderIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Apartment as FlatIcon,
  Landscape as PlotIcon,
  MapsHomeWork as MixedIcon,
  HomeWork as HomeWorkIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { availabilityApi } from '../../api/availability.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import ScreenHeader from '../../components/common/ScreenHeader';
import { getPageContainerStyles, getHeaderSectionStyles, getContentSectionStyles, APP_PRIMARY_COLOR } from '../../utils/spacing';
import type { AvailabilityProjectListItem } from '../../types/availability.types';
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';

// ─── colour helpers ───────────────────────────────────────────────────────────

const PROJECT_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ACTIVE:    { bg: '#ECFDF5', text: '#059669', border: '#6EE7B7' },
  UPCOMING:  { bg: '#EFF6FF', text: '#2563EB', border: '#93C5FD' },
  COMPLETED: { bg: '#F5F3FF', text: '#7C3AED', border: '#C4B5FD' },
  SOLD_OUT:  { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' },
};

const PROJECT_TYPE_ICONS: Record<string, React.ReactNode> = {
  FLATS:  <FlatIcon sx={{ fontSize: 28 }} />,
  PLOTS:  <PlotIcon sx={{ fontSize: 28 }} />,
  MIXED:  <MixedIcon sx={{ fontSize: 28 }} />,
};

const PROJECT_TYPE_GRADIENT: Record<string, string> = {
  FLATS:  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  PLOTS:  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  MIXED:  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
};

// ─── stat pill ────────────────────────────────────────────────────────────────

const StatPill: React.FC<{ label: string; value: number; color: string; bg: string }> = ({
  label, value, color, bg,
}) => (
  <Box sx={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    px: 1.5, py: 0.75, borderRadius: 2,
    backgroundColor: bg, minWidth: 54,
  }}>
    <Typography variant="h6" sx={{ fontWeight: 700, color, lineHeight: 1 }}>{value}</Typography>
    <Typography variant="caption" sx={{ color, opacity: 0.8, fontSize: '0.65rem', mt: 0.25 }}>{label}</Typography>
  </Box>
);

// ─── availability bar ─────────────────────────────────────────────────────────

const AvailBar: React.FC<{ available: number; blocked: number; booked: number; registered: number; total: number }> = ({
  available, blocked, booked, registered, total,
}) => {
  if (total === 0) return null;
  const pct = (n: number) => (n / total) * 100;
  const segments = [
    { color: '#10B981', value: available },
    { color: '#F59E0B', value: blocked },
    { color: '#3B82F6', value: booked },
    { color: '#8B5CF6', value: registered },
  ];
  return (
    <Box sx={{ mt: 1.5 }}>
      <Box sx={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: '1px' }}>
        {segments.map((s, i) =>
          s.value > 0 ? (
            <Box key={i} sx={{ width: `${pct(s.value)}%`, backgroundColor: s.color, transition: 'width 0.4s ease' }} />
          ) : null
        )}
      </Box>
    </Box>
  );
};

// ─── project card ─────────────────────────────────────────────────────────────

const ProjectCard: React.FC<{
  project: AvailabilityProjectListItem;
  onEdit: (p: AvailabilityProjectListItem) => void;
  onDelete: (id: string) => void;
}> = ({ project, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const statusStyle = PROJECT_STATUS_COLORS[project.status] ?? { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' };
  const gradient = PROJECT_TYPE_GRADIENT[project.project_type] ?? PROJECT_TYPE_GRADIENT.FLATS;

  return (
    <Card sx={{
      height: '100%', borderRadius: 3, position: 'relative', overflow: 'visible',
      border: '1px solid', borderColor: 'divider',
      transition: 'all 0.25s ease',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', borderColor: APP_PRIMARY_COLOR },
    }}>
      {/* colour banner */}
      <Box sx={{ height: 6, background: gradient, borderRadius: '12px 12px 0 0' }} />

      <CardActionArea
        onClick={() => navigate(`/availability/projects/${project.id}`)}
        sx={{ borderRadius: '0 0 12px 12px', p: 0 }}
      >
        <CardContent sx={{ p: 2.5, pb: '12px !important' }}>
          {/* header row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            {/* thumbnail or gradient icon */}
            <Box sx={{
              width: 52, height: 52, borderRadius: 2.5, flexShrink: 0,
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              {project.thumbnail_url ? (
                <Box
                  component="img"
                  src={project.thumbnail_url}
                  alt={project.name}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <Box sx={{
                  width: '100%', height: '100%',
                  background: gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}>
                  {PROJECT_TYPE_ICONS[project.project_type] ?? <HomeWorkIcon sx={{ fontSize: 28 }} />}
                </Box>
              )}
            </Box>

            {/* name + developer */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap title={project.name}
                sx={{ lineHeight: 1.25, mb: 0.25 }}>
                {project.name}
              </Typography>
              {project.developer_name && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {project.developer_name}
                </Typography>
              )}
              {(project.city || project.location) && (
                <Typography variant="caption" color="text.secondary" display="block" noWrap>
                  📍 {[project.city, project.location].filter(Boolean).join(', ')}
                </Typography>
              )}
            </Box>
          </Box>

          {/* chips */}
          <Box sx={{ display: 'flex', gap: 0.75, mt: 1.5, flexWrap: 'wrap' }}>
            <Chip
              label={project.project_type_display ?? project.project_type}
              size="small"
              sx={{ fontSize: '0.68rem', height: 22, background: gradient, color: '#fff' }}
            />
            <Chip
              label={project.status_display ?? project.status}
              size="small"
              sx={{
                fontSize: '0.68rem', height: 22,
                backgroundColor: statusStyle.bg,
                color: statusStyle.text,
                border: `1px solid ${statusStyle.border}`,
              }}
            />
            <Chip
              label={`${project.block_count} ${project.block_count === 1 ? 'Block' : 'Blocks'}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.68rem', height: 22 }}
            />
          </Box>

          {/* stats row */}
          <Box sx={{ display: 'flex', gap: 0.75, mt: 1.75, justifyContent: 'space-between' }}>
            <StatPill label="Available"  value={project.available_units}  color="#059669" bg="#ECFDF5" />
            <StatPill label="Blocked"    value={project.blocked_units}    color="#D97706" bg="#FFFBEB" />
            <StatPill label="Booked"     value={project.booked_units}     color="#2563EB" bg="#EFF6FF" />
            <StatPill label="Registered" value={project.registered_units} color="#7C3AED" bg="#F5F3FF" />
          </Box>

          <AvailBar
            available={project.available_units}
            blocked={project.blocked_units}
            booked={project.booked_units}
            registered={project.registered_units}
            total={project.total_units}
          />

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Total: <strong>{project.total_units}</strong> units
          </Typography>
        </CardContent>
      </CardActionArea>

      {/* actions menu — outside CardActionArea so clicks don't navigate */}
      <Box sx={{ position: 'absolute', top: 12, right: 8 }}
        onClick={(e) => e.stopPropagation()}>
        <Tooltip title="Actions">
          <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <MoreIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          <MenuItem onClick={() => { setMenuAnchor(null); onEdit(project); }}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
          </MenuItem>
          <MenuItem onClick={() => { setMenuAnchor(null); onDelete(project.id); }}
            sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>
      </Box>
    </Card>
  );
};

// ─── skeleton card ────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
    <Skeleton variant="rectangular" height={6} />
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Skeleton variant="rounded" width={52} height={52} />
        <Box sx={{ flexGrow: 1 }}>
          <Skeleton width="70%" height={20} />
          <Skeleton width="50%" height={16} sx={{ mt: 0.5 }} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
        <Skeleton variant="rounded" width={70} height={22} />
        <Skeleton variant="rounded" width={70} height={22} />
      </Box>
      <Box sx={{ display: 'flex', gap: 0.75, mt: 1.75 }}>
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" width={54} height={48} />)}
      </Box>
      <Skeleton variant="rounded" height={6} sx={{ mt: 1.5, borderRadius: 3 }} />
    </CardContent>
  </Card>
);

// ─── empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <Box sx={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    py: 10, textAlign: 'center',
  }}>
    <Box sx={{
      width: 96, height: 96, borderRadius: '50%', mb: 3,
      background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <FolderIcon sx={{ fontSize: 48, color: APP_PRIMARY_COLOR, opacity: 0.6 }} />
    </Box>
    <Typography variant="h6" fontWeight={600} gutterBottom>No projects yet</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 340 }}>
      Add your first project to start managing availability. Each project gets its own folder with blocks and units.
    </Typography>
    <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}
      sx={{ borderRadius: 2, px: 3 }}>
      Add Project
    </Button>
  </Box>
);

// ─── legend ───────────────────────────────────────────────────────────────────

const Legend = () => (
  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
    {[
      { color: '#10B981', label: 'Available' },
      { color: '#F59E0B', label: 'Blocked' },
      { color: '#3B82F6', label: 'Booked' },
      { color: '#8B5CF6', label: 'Registered' },
    ].map((l) => (
      <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: l.color }} />
        <Typography variant="caption" color="text.secondary">{l.label}</Typography>
      </Box>
    ))}
  </Box>
);

// ─── main page ────────────────────────────────────────────────────────────────

const ProjectFolders: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success, error: toastError } = useToast();
  usePageTitle('Availability List');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Availability List', icon: <ListAltIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['avail-projects', search, statusFilter, typeFilter],
    queryFn: () => availabilityApi.getProjects({
      search: search || undefined,
      status: statusFilter || undefined,
      project_type: typeFilter || undefined,
      page_size: 200,
    }),
    staleTime: 60_000,
  });

  const { data: choices } = useQuery({
    queryKey: ['avail-choices'],
    queryFn: () => availabilityApi.getChoices(),
    staleTime: 10 * 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => availabilityApi.deleteProject(id),
    onSuccess: () => {
      success('Project deleted');
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ['avail-projects'] });
    },
    onError: () => toastError('Failed to delete project'),
  });

  const projects = data?.results ?? [];
  const hasFilters = !!(search || statusFilter || typeFilter);

  return (
    <Box sx={getPageContainerStyles()}>
      {/* header */}
      <Box sx={getHeaderSectionStyles()}>
        <ScreenHeader
          title="Availability List"
          subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          showAddButton
          addButtonText="Add Project"
          onAdd={() => navigate('/availability/projects/add')}
        />
      </Box>

      <Box sx={getContentSectionStyles()}>
        {/* filter bar */}
        <Box sx={{
          display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center',
          p: 2, mb: 2, backgroundColor: '#fff', borderRadius: 2,
          border: '1px solid', borderColor: 'divider',
        }}>
          <TextField
            placeholder="Search projects…"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ width: 260 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel shrink>Status</InputLabel>
            <Select value={statusFilter} label="Status" displayEmpty notched
              onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All Statuses</MenuItem>
              {(choices?.project_statuses ?? []).map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel shrink>Type</InputLabel>
            <Select value={typeFilter} label="Type" displayEmpty notched
              onChange={(e) => setTypeFilter(e.target.value)}>
              <MenuItem value="">All Types</MenuItem>
              {(choices?.project_types ?? []).map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {hasFilters && (
            <Button size="small" variant="text"
              onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); }}>
              Clear
            </Button>
          )}
          <Box sx={{ ml: 'auto' }}><Legend /></Box>
        </Box>

        {/* grid */}
        {isLoading ? (
          <Grid container spacing={2.5}>
            {[...Array(6)].map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <SkeletonCard />
              </Grid>
            ))}
          </Grid>
        ) : projects.length === 0 ? (
          <EmptyState onAdd={() => navigate('/availability/projects/add')} />
        ) : (
          <Grid container spacing={2.5}>
            {projects.map((project) => (
              <Grid key={project.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ProjectCard
                  project={project}
                  onEdit={(p) => navigate(`/availability/projects/edit/${p.id}`)}
                  onDelete={(id) => setDeleteId(id)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Project"
        message="This will permanently delete the project, all its blocks, and all units. This cannot be undone."
        confirmLabel="Delete"
        severity="error"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
};

export default ProjectFolders;

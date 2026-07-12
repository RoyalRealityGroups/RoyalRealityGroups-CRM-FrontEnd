import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Button, IconButton, Tooltip, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, InputLabel, Select, Grid,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../../api/projects';
import apiClient from '../../../api/axios.config';
import type { Project, ProjectFormData, ProjectChoices } from '../../../types/project.types';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';

const emptyForm: ProjectFormData = {
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
};

const ProjectList: React.FC = () => {
  usePageTitle('Projects');
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  React.useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters' },
      { label: 'Projects', path: '/masters/projects', icon: <BusinessIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectFormData>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // List
  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, pageSize, search],
    queryFn: () => projectsApi.list({
      page: page + 1,
      page_size: pageSize,
      search: search || undefined,
    }),
  });

  // Choices
  const { data: choices } = useQuery<ProjectChoices>({
    queryKey: ['projects-choices'],
    queryFn: () => projectsApi.choices(),
  });

  // Locations for the dropdown
  const { data: locationsData } = useQuery({
    queryKey: ['locations-mini'],
    queryFn: async () => {
      const r = await apiClient.get('/api/masters/locations/mini/');
      return Array.isArray(r.data) ? r.data : r.data.results || [];
    },
  });
  const locations = Array.isArray(locationsData) ? locationsData : locationsData?.results || [];

  const rows: Project[] = data?.results || [];
  const total = data?.count || 0;

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (payload: ProjectFormData) =>
      editing ? projectsApi.update(editing.id, payload) : projectsApi.create(payload),
    onSuccess: () => {
      success(editing ? 'Project updated' : 'Project created');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Save failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      success('Project deleted');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteId(null);
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Delete failed');
    },
  });

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (proj: Project) => {
    setEditing(proj);
    setForm({
      name: proj.name,
      developer_name: proj.developer_name || '',
      project_type: proj.project_type,
      location: proj.location || null,
      address: proj.address || '',
      approval_type: proj.approval_type,
      rera_number: proj.rera_number || '',
      total_area: proj.total_area || '',
      launch_date: proj.launch_date || null,
      possession_date: proj.possession_date || null,
      description: proj.description || '',
      image_url: proj.image_url || '',
      brochure_url: proj.brochure_url || '',
      layout_plan_url: proj.layout_plan_url || '',
      floor_plan_url: proj.floor_plan_url || '',
      status: proj.status,
      is_active: proj.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toastError('Project name is required');
      return;
    }
    saveMutation.mutate(form);
  };

  const columns: GridColDef<Project>[] = [
    { field: 'code', headerName: 'Code', width: 110 },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 200 },
    { field: 'developer_name', headerName: 'Developer', flex: 1, minWidth: 150 },
    {
      field: 'project_type_display', headerName: 'Type', width: 100,
      renderCell: (p) => p.row.project_type_display || p.row.project_type,
    },
    {
      field: 'approval_type_display', headerName: 'Approval', width: 110,
      renderCell: (p) => p.row.approval_type_display || p.row.approval_type,
    },
    { field: 'location_name', headerName: 'Location', flex: 1, minWidth: 140 },
    {
      field: 'status', headerName: 'Status', width: 120,
      renderCell: (p) => {
        const s = p.row.status;
        const color: any =
          s === 'ACTIVE' ? 'success' :
          s === 'UPCOMING' ? 'info' :
          s === 'COMPLETED' ? 'default' :
          s === 'SOLD_OUT' ? 'warning' : 'default';
        return <Chip size="small" label={p.row.status_display || s} color={color} />;
      },
    },
    {
      field: 'is_active', headerName: 'Active', width: 80,
      renderCell: (p) => (p.row.is_active ? 'Yes' : 'No'),
    },
    {
      field: 'actions', headerName: 'Actions', width: 140, sortable: false, filterable: false,
      renderCell: (p) => (
        <Box>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => navigate(`/masters/projects/view/${p.row.id}`)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEdit(p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleteId(p.row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <ScreenHeader
        title="Projects"
        showAddButton
        addButtonText="New Project"
        onAdd={handleOpenCreate}
      />

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          size="small"
          label="Search"
          placeholder="Name / code / developer / RERA"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 320 }}
        />
      </Paper>

      <Paper sx={{ height: 620 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          paginationMode="server"
          rowCount={total}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Project' : 'New Project'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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

            {/* Marketing assets */}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}
            disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : (editing ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Project?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        severity="error"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
};

export default ProjectList;
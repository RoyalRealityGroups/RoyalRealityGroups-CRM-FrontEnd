import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Button, IconButton, Tooltip, Chip, Typography,
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
import {
  FileDownload as ExcelIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
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
  location: '',
  approval_type: 'PENDING',
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
      { label: 'Projects', path: '/projects/list', icon: <BusinessIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectFormData>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Project | null>(null);

  // List
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projects', page, pageSize, search, statusFilter, fromDate, toDate],
    queryFn: () => projectsApi.list({
      page: page + 1,
      page_size: pageSize,
      search: search || undefined,
      status: statusFilter || undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    }),
    staleTime: 0,
  });

  // Choices
  const { data: choices } = useQuery<ProjectChoices>({
    queryKey: ['projects-choices'],
    queryFn: () => projectsApi.choices(),
  });

  const rows: Project[] = data?.results || [];
  const total = data?.count || 0;

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (payload: ProjectFormData) =>
      editing ? projectsApi.update(editing.id, payload) : projectsApi.create(payload),
    onSuccess: () => {
      success(editing ? 'Project updated' : 'Project created');
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      refetch();
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProjectFormData> }) =>
      projectsApi.update(id, data as ProjectFormData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Update failed');
    },
  });

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const params: any = {
        export_type: format,
        search: search || undefined,
        status: statusFilter || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      };
      const response = await apiClient.get('/api/masters/projects/export/', {
        params,
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Project_Report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toastError(`Failed to export as ${format.toUpperCase()}`);
    }
  };

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
      project_type: proj.project_type_display || proj.project_type || '',
      location: proj.location || '',
      approval_type: proj.approval_type_display || proj.approval_type || '',
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
    saveMutation.mutate(form as any);
  };

  const columns: GridColDef<Project>[] = [
    { field: 'code', headerName: 'Code', width: 110 },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 200 },
    { field: 'developer_name', headerName: 'Developer', flex: 1, minWidth: 150 },
    {
      field: 'status', headerName: 'Status', width: 160, headerAlign: 'center', align: 'center',
      renderCell: (p) => {
        const statusColor: any =
          p.row.status === 'ACTIVE' ? 'success' :
          p.row.status === 'UPCOMING' ? 'info' :
          p.row.status === 'COMPLETED' ? 'default' :
          p.row.status === 'SOLD_OUT' ? 'warning' : 'default';
        return (
          <Select
            value={p.row.status}
            size="small"
            variant="outlined"
            IconComponent={() => null}
            sx={{
              height: 32,
              '& .MuiSelect-select': { py: 0.5, pr: '8px !important', display: 'flex', alignItems: 'center', justifyContent: 'center' },
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
            }}
            onChange={async (e) => {
              try {
                await projectsApi.update(p.row.id, { ...p.row, status: e.target.value } as any);
                success('Status updated');
                refetch();
              } catch {
                toastError('Failed to update status');
              }
            }}
            renderValue={(value) => (
              <Chip
                size="small"
                label={choices?.project_statuses?.find((c) => c.value === value)?.label || p.row.status_display || value}
                color={
                  value === 'ACTIVE' ? 'success' :
                  value === 'UPCOMING' ? 'info' :
                  value === 'COMPLETED' ? 'default' :
                  value === 'SOLD_OUT' ? 'warning' : 'default'
                }
              />
            )}
          >
            {(choices?.project_statuses || []).map((c) => (
              <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
            ))}
          </Select>
        );
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
            <IconButton size="small" onClick={() => setViewItem(p.row)}>
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
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            label="Search"
            placeholder="Name / code / developer"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ width: 280 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel shrink>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              displayEmpty
              notched
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All</MenuItem>
              {(choices?.project_statuses || []).map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="date"
            label="From Date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          <TextField
            size="small"
            type="date"
            label="To Date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(0); }}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          {(statusFilter || fromDate || toDate) && (
            <Button size="small" variant="text" onClick={() => { setStatusFilter(''); setFromDate(''); setToDate(''); setPage(0); }}>
              Clear Filters
            </Button>
          )}
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" startIcon={<ExcelIcon />} onClick={() => handleExport('excel')}>
              Excel
            </Button>
            <Button size="small" variant="outlined" startIcon={<PdfIcon />} onClick={() => handleExport('pdf')}>
              PDF
            </Button>
          </Box>
        </Box>
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
          processRowUpdate={async (newRow, oldRow) => {
            const changes: Partial<ProjectFormData> = {};
            if (Object.keys(changes).length > 0) {
              await updateMutation.mutateAsync({ id: newRow.id, data: changes });
            }
            return newRow;
          }}
          onProcessRowUpdateError={() => {}}
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
              <TextField fullWidth label="Project Type"
                value={form.project_type}
                onChange={(e) => setForm({ ...form, project_type: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth label="Approval Type"
                value={form.approval_type}
                onChange={(e) => setForm({ ...form, approval_type: e.target.value })} />
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

            <Grid size={{ xs: 12, md: 8 }}>
              <TextField fullWidth label="Location"
                value={form.location ?? ''}
                onChange={(e) => setForm({ ...form, location: e.target.value || null })} />
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

      {/* View Dialog */}
      <Dialog open={!!viewItem} onClose={() => setViewItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Project Details</DialogTitle>
        {viewItem && (
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Project Code</Typography>
                <Typography variant="body1">{viewItem.code}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Name</Typography>
                <Typography variant="body1">{viewItem.name}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Developer</Typography>
                <Typography variant="body1">{viewItem.developer_name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Project Type</Typography>
                <Typography variant="body1">{viewItem.project_type_display || viewItem.project_type || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Location</Typography>
                <Typography variant="body1">{viewItem.location || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={viewItem.status_display || viewItem.status}
                    color={viewItem.status === 'ACTIVE' ? 'success' : viewItem.status === 'UPCOMING' ? 'info' : viewItem.status === 'COMPLETED' ? 'default' : viewItem.status === 'SOLD_OUT' ? 'warning' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Active</Typography>
                <Typography variant="body1">{viewItem.is_active ? 'Yes' : 'No'}</Typography>
              </Grid>
            </Grid>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setViewItem(null)}>Close</Button>
          <Button variant="contained" onClick={() => { if (viewItem) { setViewItem(null); handleOpenEdit(viewItem); } }}>
            Edit
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
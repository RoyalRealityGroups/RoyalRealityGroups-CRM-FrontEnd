import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Divider,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Delete as DeletePhotoIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteVisitApi } from '../../api/siteVisit.api';
import { leadApi } from '../../api/lead.api';
import ScreenHeader from '../../components/common/ScreenHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import type { SiteVisit, SiteVisitStatus } from '../../types/siteVisit.types';

import { API_BASE_URL } from '../../utils/constants';

const statusColors: Record<SiteVisitStatus, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  SCHEDULED: 'info',
  CONFIRMED: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

const DEFAULT_STATUSES: { value: SiteVisitStatus; label: string }[] = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

interface FormState {
  customer_name: string;
  project_name: string;
  visit_date: string;
  assigned_employee: string;
  status: SiteVisitStatus;
  customer_feedback: string;
  remarks: string;
}

const emptyForm: FormState = {
  customer_name: '',
  project_name: '',
  visit_date: new Date().toISOString().split('T')[0],
  assigned_employee: '',
  status: 'SCHEDULED',
  customer_feedback: '',
  remarks: '',
};

const SiteVisits: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  usePageTitle('Site Visits');

  // List state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SiteVisitStatus | ''>('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SiteVisit | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // View dialog state
  const [viewItem, setViewItem] = useState<SiteVisit | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Site Visit Management', path: '/sitevisit/list', icon: <LocationOnIcon fontSize="small" /> },
    ]);
  }, [setBreadcrumbs]);

  // --- Queries ---
  const { data: visitsData, isLoading, refetch } = useQuery({
    queryKey: ['site-visits', paginationModel, searchQuery, statusFilter],
    queryFn: () =>
      siteVisitApi.getSiteVisits({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
      }),
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

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      editing
        ? siteVisitApi.updateSiteVisit(editing.id, data as any)
        : siteVisitApi.createSiteVisit(data),
    onSuccess: () => {
      toastSuccess(editing ? 'Site visit updated' : 'Site visit scheduled');
      handleCloseDialog();
      refetch();
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => siteVisitApi.deleteSiteVisit(id),
    onSuccess: () => {
      toastSuccess('Site visit deleted');
      setDeleteId(null);
      refetch();
    },
    onError: () => toastError('Failed to delete site visit'),
  });

  // --- Dialog handlers ---
  const handleOpenCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSelectedFiles([]);
    setFilePreviews([]);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: SiteVisit) => {
    setEditing(item);
    const empId = typeof item.assigned_employee === 'string'
      ? item.assigned_employee
      : item.assigned_employee?.id || '';
    setForm({
      customer_name: item.customer_name || '',
      project_name: item.project_name || '',
      visit_date: item.visit_date || '',
      assigned_employee: empId,
      status: item.status || 'SCHEDULED',
      customer_feedback: item.customer_feedback || '',
      remarks: item.remarks || '',
    });
    setSelectedFiles([]);
    setFilePreviews([]);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
    filePreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setFilePreviews([]);
  };

  const handleSubmit = () => {
    if (!form.customer_name || !form.project_name || !form.visit_date || !form.assigned_employee) {
      toastError('Please fill all required fields');
      return;
    }
    const fd = new FormData();
    fd.append('customer_name', form.customer_name);
    fd.append('project_name', form.project_name);
    fd.append('visit_date', form.visit_date);
    fd.append('assigned_employee', form.assigned_employee);
    fd.append('status', form.status);
    if (form.customer_feedback) fd.append('customer_feedback', form.customer_feedback);
    if (form.remarks) fd.append('remarks', form.remarks);
    for (const f of selectedFiles) fd.append('photos', f);
    saveMutation.mutate(fd);
  };

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

  // --- Helpers ---
  const getEmployeeName = (v: SiteVisit['assigned_employee']) => {
    if (!v) return '-';
    if (typeof v === 'string') return users.find((u) => u.id === v)?.name || v;
    return v.name;
  };

  const getPhotoUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  const statuses = choices?.statuses || DEFAULT_STATUSES;

  // --- Columns ---
  const columns: GridColDef<SiteVisit>[] = [
    { field: 'customer_name', headerName: 'Customer', flex: 1, minWidth: 150 },
    { field: 'project_name', headerName: 'Project', flex: 1, minWidth: 150 },
    {
      field: 'visit_date', headerName: 'Visit Date', width: 120,
      valueFormatter: (value: any) => (value ? new Date(value).toLocaleDateString() : '-'),
    },
    {
      field: 'assigned_employee', headerName: 'Assigned To', width: 150,
      valueGetter: (_value: any, row: SiteVisit) => getEmployeeName(row.assigned_employee),
    },
    {
      field: 'status', headerName: 'Status', width: 160, headerAlign: 'center', align: 'center',
      renderCell: (params) => (
        <Select
          value={params.value}
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
            const newStatus = e.target.value;
            try {
              const fd = new FormData();
              fd.append('customer_name', params.row.customer_name);
              fd.append('project_name', params.row.project_name);
              fd.append('visit_date', params.row.visit_date);
              fd.append('assigned_employee', typeof params.row.assigned_employee === 'string' ? params.row.assigned_employee : params.row.assigned_employee?.id || '');
              fd.append('status', newStatus);
              await siteVisitApi.updateSiteVisit(params.row.id, fd as any);
              toastSuccess('Status updated');
              refetch();
            } catch {
              toastError('Failed to update status');
            }
          }}
          renderValue={(value) => (
            <Chip
              label={statuses.find((s) => s.value === value)?.label || value}
              color={statusColors[value as SiteVisitStatus] || 'default'}
              size="small"
            />
          )}
        >
          {statuses.map((s) => (
            <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
          ))}
        </Select>
      ),
    },
    {
      field: 'actions', headerName: 'Actions', width: 140, sortable: false, filterable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => setViewItem(params.row)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEdit(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleteId(params.row.id)}>
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
        title="Site Visits"
        showAddButton
        addButtonText="Schedule Visit"
        onAdd={handleOpenCreate}
      />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search by customer or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ width: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel shrink>Status</InputLabel>
            <Select value={statusFilter} label="Status" displayEmpty notched onChange={(e) => setStatusFilter(e.target.value as any)}>
              <MenuItem value="">All</MenuItem>
              {statuses.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ height: 620 }}>
        <DataGrid
          rows={visitsData?.results || []}
          columns={columns}
          loading={isLoading}
          rowCount={visitsData?.count || 0}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50, 100]}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Site Visit' : 'Schedule Site Visit'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth required label="Customer Name"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth required label="Project Name"
                value={form.project_name}
                onChange={(e) => setForm({ ...form, project_name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth required label="Visit Date" type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={form.visit_date}
                onChange={(e) => setForm({ ...form, visit_date: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth required>
                <InputLabel>Assigned Employee</InputLabel>
                <Select label="Assigned Employee" value={form.assigned_employee}
                  onChange={(e) => setForm({ ...form, assigned_employee: e.target.value })}>
                  {users.map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as SiteVisitStatus })}>
                  {statuses.map((s) => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {form.status === 'COMPLETED' && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Completion Details</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth multiline rows={2} label="Customer Feedback"
                    value={form.customer_feedback}
                    onChange={(e) => setForm({ ...form, customer_feedback: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth multiline rows={2} label="Remarks"
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
                </Grid>
                {/* Photo picker — inside Completion section */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Photos</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                    {filePreviews.map((url, idx) => (
                      <Box key={idx} sx={{ position: 'relative', width: 80, height: 80 }}>
                        <img src={url} alt={`Photo ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                        <IconButton size="small" onClick={() => handleRemoveFile(idx)}
                          sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' }, width: 20, height: 20 }}>
                          <DeletePhotoIcon sx={{ fontSize: 12 }} />
                        </IconButton>
                      </Box>
                    ))}
                    <Box component="label"
                      sx={{ width: 80, height: 80, border: '2px dashed', borderColor: 'grey.400', borderRadius: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' } }}>
                      <AddPhotoIcon sx={{ fontSize: 28, color: 'grey.500' }} />
                      <input type="file" hidden multiple accept="image/*" onChange={handleFileSelect} />
                    </Box>
                  </Box>
                </Grid>
              </>
            )}
          </Grid>

          {saveMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(saveMutation.error as any)?.response?.data?.message || 'Save failed'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Schedule Visit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onClose={() => setViewItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Site Visit Details</DialogTitle>
        {viewItem && (
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Customer Name</Typography>
                <Typography variant="body1">{viewItem.customer_name}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Project Name</Typography>
                <Typography variant="body1">{viewItem.project_name}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Visit Date</Typography>
                <Typography variant="body1">{new Date(viewItem.visit_date).toLocaleDateString()}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Assigned Employee</Typography>
                <Typography variant="body1">{getEmployeeName(viewItem.assigned_employee)}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={statuses.find((s) => s.value === viewItem.status)?.label || viewItem.status}
                    color={statusColors[viewItem.status] || 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
              {viewItem.status === 'COMPLETED' && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Completion Details</Typography>
                  </Grid>
                  {viewItem.customer_feedback && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">Customer Feedback</Typography>
                      <Typography variant="body2">{viewItem.customer_feedback}</Typography>
                    </Grid>
                  )}
                  {viewItem.remarks && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">Remarks</Typography>
                      <Typography variant="body2">{viewItem.remarks}</Typography>
                    </Grid>
                  )}
                  {viewItem.photos && viewItem.photos.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">Photos</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                        {viewItem.photos.map((photo) => (
                          <img key={photo.id} src={getPhotoUrl(photo.photo)} alt={photo.caption || 'Photo'}
                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }} />
                        ))}
                      </Box>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setViewItem(null)}>Close</Button>
          <Button variant="contained" onClick={() => { setViewItem(null); if (viewItem) handleOpenEdit(viewItem); }}>
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Site Visit?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        severity="error"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
};

export default SiteVisits;

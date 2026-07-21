import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Typography,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  FileDownload as ExcelIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadApi } from '../../api/lead.api';
import apiClient from '../../api/axios.config';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { hasPermission } from '../../utils/permissions';
import ScreenHeader from '../../components/common/ScreenHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import TodayIcon from '@mui/icons-material/Today';
import type { LeadFollowUp, LeadFollowUpFormData, LeadChoices } from '../../types/lead.types';

interface FollowUpForm {
  lead_id: string;
  follow_up_date: string;
  follow_up_time: string;
  follow_up_type: string;
  discussion_notes: string;
  next_follow_up_date: string;
}

const emptyForm: FollowUpForm = {
  lead_id: '',
  follow_up_date: new Date().toISOString().split('T')[0],
  follow_up_time: '',
  follow_up_type: '',
  discussion_notes: '',
  next_follow_up_date: '',
};

const FollowUps: React.FC = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const canExport = hasPermission(user, 'export_leadfollowup');
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  usePageTitle('Follow-ups');

  // List state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeadFollowUp | null>(null);
  const [form, setForm] = useState<FollowUpForm>(emptyForm);
  const [leadInfo, setLeadInfo] = useState<{ code: string; name: string; mobile: string; email: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<LeadFollowUp | null>(null);

  // Auto-open dialog when arriving from Lead screen with leadId
  useEffect(() => {
    const state = location.state as { leadId?: string; leadCode?: string; leadName?: string; leadMobile?: string; leadEmail?: string } | null;
    if (state?.leadId) {
      setForm({ ...emptyForm, lead_id: state.leadId });
      setLeadInfo({
        code: state.leadCode || '',
        name: state.leadName || '',
        mobile: state.leadMobile || '',
        email: state.leadEmail || '',
      });
      setDialogOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Lead Management', path: '/lead', icon: <PersonIcon fontSize="small" /> },
      { label: 'Follow-ups', icon: <TodayIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // --- Queries ---
  const { data: followUpsData, isLoading, refetch } = useQuery({
    queryKey: ['follow-ups', paginationModel, searchQuery, fromDate, toDate],
    queryFn: () =>
      leadApi.getFollowUps({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      }),
    staleTime: 0,
  });

  const { data: choices } = useQuery<LeadChoices>({
    queryKey: ['lead-choices'],
    queryFn: () => leadApi.getChoices(),
    staleTime: 5 * 60 * 1000,
  });

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: (data: LeadFollowUpFormData) =>
      editing ? leadApi.updateFollowUp(editing.id, data) : leadApi.createFollowUp(data),
    onSuccess: () => {
      toastSuccess(editing ? 'Follow-up updated' : 'Follow-up created');
      handleCloseDialog();
      refetch();
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadApi.deleteFollowUp(id),
    onSuccess: () => {
      toastSuccess('Follow-up deleted');
      setDeleteId(null);
      refetch();
    },
    onError: () => toastError('Failed to delete follow-up'),
  });

  // --- Dialog handlers ---
  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const params: any = {
        export_type: format,
        search: searchQuery || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      };
      const response = await apiClient.get('/api/lead/followups/export/', {
        params,
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FollowUp_Report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
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

  const handleOpenEdit = (item: LeadFollowUp) => {
    setEditing(item);
    setForm({
      lead_id: item.lead?.id || '',
      follow_up_date: item.follow_up_date || '',
      follow_up_time: item.follow_up_time || '',
      follow_up_type: item.follow_up_type || '',
      discussion_notes: item.discussion_notes || '',
      next_follow_up_date: item.next_follow_up_date || '',
    });
    setLeadInfo(item.lead ? {
      code: item.lead.code || '',
      name: item.lead.name || '',
      mobile: item.lead.mobile || '',
      email: '',
    } : null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setLeadInfo(null);
  };

  const handleSubmit = () => {
    if (!form.lead_id || !form.follow_up_date || !form.follow_up_type) {
      toastError('Lead, Follow-up Date, and Type are required');
      return;
    }
    saveMutation.mutate({
      lead_id: form.lead_id,
      follow_up_date: form.follow_up_date,
      follow_up_time: form.follow_up_time || undefined,
      follow_up_type: form.follow_up_type,
      discussion_notes: form.discussion_notes || undefined,
      next_follow_up_date: form.next_follow_up_date || undefined,
    });
  };

  // --- Columns ---
  const columns: GridColDef<LeadFollowUp>[] = [
    {
      field: 'lead_name', headerName: 'Lead', flex: 1, minWidth: 140,
      valueGetter: (_value: any, row: LeadFollowUp) => row.lead?.name || '-',
    },
    {
      field: 'lead_code', headerName: 'Code', width: 110,
      valueGetter: (_value: any, row: LeadFollowUp) => row.lead?.code || '-',
    },
    {
      field: 'follow_up_date', headerName: 'Date', width: 120,
      valueFormatter: (value: any) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      field: 'follow_up_time', headerName: 'Time', width: 100,
      valueFormatter: (value: any) => value ? value.slice(0, 5) : '-',
    },
    {
      field: 'follow_up_type', headerName: 'Type', width: 150, headerAlign: 'center', align: 'center',
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
            const newType = e.target.value;
            try {
              await leadApi.updateFollowUp(params.row.id, {
                lead_id: params.row.lead?.id || '',
                follow_up_date: params.row.follow_up_date,
                follow_up_type: newType,
                follow_up_time: params.row.follow_up_time || undefined,
                discussion_notes: params.row.discussion_notes || undefined,
                next_follow_up_date: params.row.next_follow_up_date || undefined,
              });
              toastSuccess('Type updated');
              refetch();
            } catch {
              toastError('Failed to update type');
            }
          }}
          renderValue={(value) => (
            <Chip
              label={choices?.follow_up_types.find((t) => t.value === value)?.label || value}
              size="small"
              color={
                value === 'CALL' ? 'primary' :
                value === 'WHATSAPP' ? 'success' :
                value === 'MEETING' ? 'warning' :
                value === 'SITE_VISIT' ? 'info' : 'default'
              }
            />
          )}
        >
          {(choices?.follow_up_types || []).map((t) => (
            <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
          ))}
        </Select>
      ),
    },
    {
      field: 'next_follow_up_date', headerName: 'Next Follow-up', width: 130,
      valueFormatter: (value: any) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      field: 'discussion_notes', headerName: 'Notes', flex: 1, minWidth: 150,
      valueGetter: (_value: any, row: LeadFollowUp) => row.discussion_notes || '-',
    },
    {
      field: 'created_by', headerName: 'Created By', width: 120,
      valueGetter: (_value: any, row: LeadFollowUp) => row.created_by?.name || '-',
    },
    {
      field: 'actions', headerName: 'Actions', width: 130, sortable: false, filterable: false,
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
        title="Follow-ups"
        showAddButton={false}
      />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search follow-ups..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ width: 300 }}
          />
          <TextField
            size="small"
            type="date"
            label="From Date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          <TextField
            size="small"
            type="date"
            label="To Date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          {(fromDate || toDate) && (
            <Button size="small" variant="text" onClick={() => { setFromDate(''); setToDate(''); setPaginationModel((p) => ({ ...p, page: 0 })); }}>
              Clear Dates
            </Button>
          )}
          {canExport && (
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" startIcon={<ExcelIcon />} onClick={() => handleExport('excel')}>
                Excel
              </Button>
              <Button size="small" variant="outlined" startIcon={<PdfIcon />} onClick={() => handleExport('pdf')}>
                PDF
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      <Paper sx={{ height: 620 }}>
        <DataGrid
          rows={followUpsData?.results || []}
          columns={columns}
          loading={isLoading}
          rowCount={followUpsData?.count || 0}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50, 100]}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Follow-up' : 'Add Follow-up'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              {leadInfo ? (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Lead ID</Typography>
                      <Typography variant="body2" fontWeight={600}>{leadInfo.code}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Name</Typography>
                      <Typography variant="body2" fontWeight={600}>{leadInfo.name}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Mobile</Typography>
                      <Typography variant="body2" fontWeight={600}>{leadInfo.mobile || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>{leadInfo.email || '-'}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ) : (
                <TextField fullWidth required label="Lead ID"
                  value={form.lead_id}
                  placeholder="Enter Lead ID (UUID)"
                  onChange={(e) => setForm({ ...form, lead_id: e.target.value })}
                  disabled={!!editing}
                />
              )}
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth required label="Follow-up Date" type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={form.follow_up_date}
                onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Follow-up Time" type="time"
                slotProps={{ inputLabel: { shrink: true } }}
                value={form.follow_up_time}
                onChange={(e) => setForm({ ...form, follow_up_time: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Follow-up Type</InputLabel>
                <Select label="Follow-up Type" value={form.follow_up_type}
                  onChange={(e) => setForm({ ...form, follow_up_type: e.target.value })}>
                  {(choices?.follow_up_types || []).map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Next Follow-up Date" type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={form.next_follow_up_date}
                onChange={(e) => setForm({ ...form, next_follow_up_date: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline rows={3} label="Discussion Notes"
                value={form.discussion_notes}
                onChange={(e) => setForm({ ...form, discussion_notes: e.target.value })} />
            </Grid>
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
            {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onClose={() => setViewItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Follow-up Details</DialogTitle>
        {viewItem && (
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Lead</Typography>
                <Typography variant="body1">{viewItem.lead?.name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Lead Code</Typography>
                <Typography variant="body1">{viewItem.lead?.code || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Follow-up Date</Typography>
                <Typography variant="body1">{viewItem.follow_up_date ? new Date(viewItem.follow_up_date).toLocaleDateString() : '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Follow-up Time</Typography>
                <Typography variant="body1">{viewItem.follow_up_time ? new Date(`1970-01-01T${viewItem.follow_up_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Typography variant="body1">
                  {choices?.follow_up_types.find((t) => t.value === viewItem.follow_up_type)?.label || viewItem.follow_up_type}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Next Follow-up</Typography>
                <Typography variant="body1">{viewItem.next_follow_up_date ? new Date(viewItem.next_follow_up_date).toLocaleDateString('en-GB') : '-'}</Typography>
              </Grid>
              {viewItem.discussion_notes && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Discussion Notes</Typography>
                  <Typography variant="body2">{viewItem.discussion_notes}</Typography>
                </Grid>
              )}
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Created By</Typography>
                <Typography variant="body1">{viewItem.created_by?.name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Created On</Typography>
                <Typography variant="body1">{viewItem.created_on ? new Date(viewItem.created_on).toLocaleDateString() : '-'}</Typography>
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Follow-up?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        severity="error"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
};

export default FollowUps;

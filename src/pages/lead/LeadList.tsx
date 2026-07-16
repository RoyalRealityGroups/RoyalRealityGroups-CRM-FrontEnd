import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  EventNote as FollowUpIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadApi } from '../../api/lead.api';
import ScreenHeader from '../../components/common/ScreenHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import type { Lead, LeadFormData, LeadChoices } from '../../types/lead.types';

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  NEW_LEAD: 'info',
  CONTACT_ATTEMPTED: 'warning',
  CONNECTED: 'primary',
  INTERESTED: 'success',
  SITE_VISIT_SCHEDULED: 'secondary',
  SITE_VISIT_COMPLETED: 'success',
  NEGOTIATION: 'warning',
  BOOKING: 'primary',
  REGISTRATION: 'success',
  LOST: 'error',
};

const emptyForm: LeadFormData = {
  name: '',
  mobile: '',
  alternate_number: '',
  email: '',
  budget: '',
  preferred_area: '',
  property_requirement: '',
  lead_source: '',
  status: 'NEW_LEAD',
  assigned_employee_id: '',
  remarks: '',
};

const LeadList: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  usePageTitle('Leads');

  // List state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadFormData>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Lead | null>(null);
  const [duplicates, setDuplicates] = useState<any[] | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Lead Management', path: '/lead', icon: <PersonIcon fontSize="small" /> },
      { label: 'Leads' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // --- Queries ---
  const { data: leadsData, isLoading, refetch } = useQuery({
    queryKey: ['leads', paginationModel, searchQuery, statusFilter],
    queryFn: () =>
      leadApi.getLeads({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
      }),
    staleTime: 0,
  });

  const { data: choices } = useQuery<LeadChoices>({
    queryKey: ['lead-choices'],
    queryFn: () => leadApi.getChoices(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['lead-users'],
    queryFn: () => leadApi.getUsers(),
    staleTime: 5 * 60 * 1000,
  });
  const users: { id: string; name: string }[] = usersData || [];

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: (data: LeadFormData) =>
      editing ? leadApi.updateLead(editing.id, data) : leadApi.createLead(data),
    onSuccess: () => {
      toastSuccess(editing ? 'Lead updated' : 'Lead created');
      handleCloseDialog();
      refetch();
    },
    onError: (err: any) => {
      const resData = err.response?.data;
      if (resData?.has_duplicates && resData?.duplicates) {
        setDuplicates(resData.duplicates);
      } else {
        toastError(resData?.message || resData?.non_field_errors?.[0] || 'Save failed');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadApi.deleteLead(id),
    onSuccess: () => {
      toastSuccess('Lead deleted');
      setDeleteId(null);
      refetch();
    },
    onError: () => toastError('Failed to delete lead'),
  });

  // --- Dialog handlers ---
  const handleOpenCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: Lead) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      mobile: item.mobile || '',
      alternate_number: item.alternate_number || '',
      email: item.email || '',
      budget: item.budget || '',
      preferred_area: item.preferred_area || '',
      property_requirement: item.property_requirement || '',
      lead_source: item.lead_source || '',
      status: item.status || 'NEW_LEAD',
      assigned_employee_id: item.assigned_employee?.id || '',
      remarks: item.remarks || '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = () => {
    if (!form.name || !form.mobile || !form.lead_source) {
      toastError('Name, Mobile, and Lead Source are required');
      return;
    }
    if (!/^\d{10}$/.test(form.mobile)) {
      toastError('Mobile number must be exactly 10 digits');
      return;
    }
    if (form.alternate_number && !/^\d{10}$/.test(form.alternate_number)) {
      toastError('Alternate number must be exactly 10 digits');
      return;
    }
    const payload: any = {
      name: form.name,
      mobile: form.mobile,
      lead_source: form.lead_source,
      status: form.status,
    };
    if (form.alternate_number) payload.alternate_number = form.alternate_number;
    if (form.email) payload.email = form.email;
    if (form.budget) payload.budget = form.budget;
    if (form.preferred_area) payload.preferred_area = form.preferred_area;
    if (form.property_requirement) payload.property_requirement = form.property_requirement;
    if (form.remarks) payload.remarks = form.remarks;
    if (form.assigned_employee_id) payload.assigned_employee = form.assigned_employee_id;
    if (form.cross_lead_override) payload.cross_lead_override = true;
    saveMutation.mutate(payload);
  };

  // --- Columns ---
  const columns: GridColDef<Lead>[] = [
    { field: 'code', headerName: 'Lead ID', width: 110 },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 140 },
    { field: 'mobile', headerName: 'Mobile', width: 130 },
    {
      field: 'lead_source', headerName: 'Source', width: 120,
      valueGetter: (value) => choices?.lead_sources.find((s) => s.value === value)?.label || value,
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
              await leadApi.updateLead(params.row.id, {
                name: params.row.name,
                mobile: params.row.mobile,
                lead_source: params.row.lead_source,
                assigned_employee: params.row.assigned_employee?.id || null,
                status: newStatus,
              } as any);
              toastSuccess('Status updated');
              refetch();
            } catch {
              toastError('Failed to update status');
            }
          }}
          renderValue={(value) => (
            <Chip
              label={choices?.lead_statuses.find((s) => s.value === value)?.label || value}
              color={statusColors[value as string] || 'default'}
              size="small"
            />
          )}
        >
          {(choices?.lead_statuses || []).map((s) => (
            <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
          ))}
        </Select>
      ),
    },
    {
      field: 'assigned_employee', headerName: 'Assigned To', width: 130,
      valueGetter: (value: any) => value?.name || '-',
    },
    {
      field: 'actions', headerName: 'Actions', width: 160, sortable: false, filterable: false,
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
          <Tooltip title="Follow-up">
            <IconButton size="small" color="success" onClick={() => navigate('/lead/follow-ups', { state: { leadId: params.row.id, leadCode: params.row.code, leadName: params.row.name, leadMobile: params.row.mobile, leadEmail: params.row.email } })}>
              <FollowUpIcon fontSize="small" />
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
        title="Leads"
        showAddButton
        addButtonText="Add Lead"
        onAdd={handleOpenCreate}
      />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ width: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel shrink>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              displayEmpty
              notched
              onChange={(e) => { setStatusFilter(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
            >
              <MenuItem value="">All</MenuItem>
              {choices?.lead_statuses.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ height: 620 }}>
        <DataGrid
          rows={leadsData?.results || []}
          columns={columns}
          loading={isLoading}
          rowCount={leadsData?.count || 0}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50, 100]}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Lead' : 'Add Lead'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth required label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth required label="Mobile"
                value={form.mobile}
                inputProps={{ maxLength: 10 }}
                onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Alternate Number"
                value={form.alternate_number}
                inputProps={{ maxLength: 10 }}
                onChange={(e) => setForm({ ...form, alternate_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth label="Budget"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth label="Preferred Area"
                value={form.preferred_area}
                onChange={(e) => setForm({ ...form, preferred_area: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth label="Property Requirement"
                value={form.property_requirement}
                onChange={(e) => setForm({ ...form, property_requirement: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth required>
                <InputLabel>Lead Source</InputLabel>
                <Select label="Lead Source" value={form.lead_source}
                  onChange={(e) => setForm({ ...form, lead_source: e.target.value })}>
                  {(choices?.lead_sources || []).map((s) => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {(choices?.lead_statuses || []).map((s) => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Assigned Employee</InputLabel>
                <Select label="Assigned Employee" value={form.assigned_employee_id}
                  onChange={(e) => setForm({ ...form, assigned_employee_id: e.target.value })}>
                  <MenuItem value="">— None —</MenuItem>
                  {users.map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline rows={2} label="Remarks"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
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
        <DialogTitle>Lead Details</DialogTitle>
        {viewItem && (
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Lead ID</Typography>
                <Typography variant="body1">{viewItem.code}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Name</Typography>
                <Typography variant="body1">{viewItem.name}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Mobile</Typography>
                <Typography variant="body1">{viewItem.mobile}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography variant="body1">{viewItem.email || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Budget</Typography>
                <Typography variant="body1">{viewItem.budget || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Preferred Area</Typography>
                <Typography variant="body1">{viewItem.preferred_area || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Property Requirement</Typography>
                <Typography variant="body1">{viewItem.property_requirement || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Lead Source</Typography>
                <Typography variant="body1">
                  {choices?.lead_sources.find((s) => s.value === viewItem.lead_source)?.label || viewItem.lead_source}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={choices?.lead_statuses.find((s) => s.value === viewItem.status)?.label || viewItem.status}
                    color={statusColors[viewItem.status] || 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Assigned To</Typography>
                <Typography variant="body1">{viewItem.assigned_employee?.name || '-'}</Typography>
              </Grid>
              {viewItem.remarks && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Remarks</Typography>
                  <Typography variant="body2">{viewItem.remarks}</Typography>
                </Grid>
              )}
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

      {/* Duplicate Lead Dialog */}
      <Dialog open={!!duplicates} onClose={() => setDuplicates(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'warning.main' }}>Duplicate Lead Found</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            A lead with the same details already exists:
          </Typography>
          {duplicates?.map((dup, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 1.5 }}>
              <Grid container spacing={1}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Lead ID</Typography>
                  <Typography variant="body2" fontWeight={600}>{dup.lead?.code}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Name</Typography>
                  <Typography variant="body2" fontWeight={600}>{dup.lead?.name}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Typography variant="body2">{dup.lead?.status}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Assigned To</Typography>
                  <Typography variant="body2">{dup.lead?.assigned_employee?.name || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Matched Field</Typography>
                  <Chip label={dup.match_field} size="small" color="warning" />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Matched Value</Typography>
                  <Typography variant="body2" fontWeight={600}>{dup.match_value}</Typography>
                </Grid>
                {dup.lead?.last_follow_up_date && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">Last Follow-up</Typography>
                    <Typography variant="body2">{new Date(dup.lead.last_follow_up_date).toLocaleDateString()}</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicates(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              setDuplicates(null);
              setForm({ ...form, cross_lead_override: true });
              toastSuccess('Override enabled — click Create again to save');
            }}
          >
            Override & Create Anyway
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Lead?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        severity="error"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
};

export default LeadList;

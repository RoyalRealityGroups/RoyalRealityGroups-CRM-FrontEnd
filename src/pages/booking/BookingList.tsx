// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Chip, IconButton, Tooltip, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Grid, Typography, Divider, Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import {
  Visibility as ViewIcon, Edit as EditIcon, Cancel as CancelIcon,
  Search as SearchIcon, Assignment as ContractIcon, Verified as RegIcon,
  FileDownload as ExcelIcon, PictureAsPdf as PdfIcon, History as HistoryIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../../api/booking';
import { leadApi } from '../../api/lead.api';
import { inventoryApi } from '../../api/inventory.api';
import { availabilityApi } from '../../api/availability.api';
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
import type { Booking, BookingFormData, BookingStatusHistory } from '../../types/realestate.types';

const statusColors: Record<string, any> = {
  BOOKED: 'info', AGREEMENT: 'warning', REGISTERED: 'success', CANCELLED: 'error',
};

const BOOKING_STATUSES = [
  { value: 'BOOKED', label: 'Booked' },
  { value: 'AGREEMENT', label: 'Agreement' },
  { value: 'REGISTERED', label: 'Registered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const emptyForm: BookingFormData = {
  lead: '', customer_name: '', customer_mobile: '', customer_email: '',
  project: '', unit_type: 'PLOT', plot: '', flat: '',
  availability_project: '', availability_unit: '',
  agreed_price: undefined, booking_amount: 0,
  booking_date: new Date().toISOString().split('T')[0],
  sales_executive: '', remarks: '',
  property_cost: undefined, revenue: undefined, incentive: undefined,
};

const BookingList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);
  const canAdd = hasPermission(user, 'add_booking');
  const canEdit = hasPermission(user, 'change_booking');
  const canExport = hasPermission(user, 'export_booking');
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  usePageTitle('Bookings');

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [form, setForm] = useState<BookingFormData>(emptyForm);
  const [viewItem, setViewItem] = useState<Booking | null>(null);
  const [statusHistory, setStatusHistory] = useState<BookingStatusHistory[]>([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Quick "Add Lead" dialog (opened from the + next to Lead dropdown)
  const emptyQuickLead = {
    name: '', mobile: '', email: '', lead_source: 'MANUAL',
    budget: '', preferred_area: '', assigned_employee_id: '',
  };
  const [quickLeadOpen, setQuickLeadOpen] = useState(false);
  const [quickLead, setQuickLead] = useState({ ...emptyQuickLead });

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Booking Management' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const { data: bookingsData, isLoading, refetch } = useQuery({
    queryKey: ['bookings', paginationModel, searchQuery, statusFilter, projectFilter, fromDate, toDate],
    queryFn: () => bookingApi.getBookings({
      page: paginationModel.page + 1, page_size: paginationModel.pageSize,
      search: searchQuery || undefined, status: statusFilter || undefined,
      project: projectFilter || undefined, from_date: fromDate || undefined, to_date: toDate || undefined,
    }),
    staleTime: 0,
  });

  // Projects for the FILTER bar — still the legacy mini list (shows all historical projects)
  const { data: projects } = useQuery({
    queryKey: ['projects-mini'],
    queryFn: async () => { const r = await apiClient.get('/api/projects/mini/'); return r.data.results || r.data; },
    staleTime: 5 * 60 * 1000,
  });

  // Projects for the BOOKING FORM dropdown — sourced from the Availability List.
  // No is_active filter here: we want every availability project to be bookable,
  // exactly like the Availability List screen shows them.
  const { data: availabilityProjects = [] } = useQuery({
    queryKey: ['availability-projects-booking'],
    queryFn: async () => {
      const r: any = await availabilityApi.getProjects({ page_size: 500 });
      // Endpoint is paginated → {results: [...]}, but guard for a plain array too.
      if (Array.isArray(r)) return r;
      return r?.results ?? [];
    },
    staleTime: 0,
  });

  const { data: leads } = useQuery({
    queryKey: ['leads-dropdown'],
    queryFn: () => leadApi.getLeads({ page_size: 200 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: employees } = useQuery({
    queryKey: ['lead-users'],
    queryFn: () => leadApi.getUsers(),
    staleTime: 5 * 60 * 1000,
  });

  // Lead source choices for the quick-add-lead dialog
  const { data: leadChoices } = useQuery({
    queryKey: ['lead-choices'],
    queryFn: () => leadApi.getChoices(),
    staleTime: 10 * 60 * 1000,
    enabled: quickLeadOpen,
  });

  // Create a lead from the booking form, then auto-select it
  const createLeadMutation = useMutation({
    mutationFn: (data: any) => leadApi.createLead(data),
    onSuccess: (newLead: any) => {
      toastSuccess(`Lead "${newLead.name}" created`);
      // Refresh the lead dropdown list so the new lead appears everywhere
      queryClient.invalidateQueries({ queryKey: ['leads-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] }); // Lead Management list
      // Auto-select the new lead and prefill customer fields
      setForm((p) => ({
        ...p,
        lead: newLead.id,
        customer_name: newLead.name || p.customer_name,
        customer_mobile: newLead.mobile || p.customer_mobile,
        customer_email: newLead.email || p.customer_email,
      }));
      setQuickLeadOpen(false);
      setQuickLead({ ...emptyQuickLead });
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      const msg = data?.mobile?.[0] || data?.name?.[0] || data?.detail
        || data?.non_field_errors?.[0] || 'Failed to create lead';
      toastError(msg);
    },
  });

  const handleQuickLeadSave = () => {
    if (!quickLead.name.trim() || !quickLead.mobile.trim()) {
      toastError('Lead name and mobile are required');
      return;
    }
    createLeadMutation.mutate({
      name: quickLead.name.trim(),
      mobile: quickLead.mobile.trim(),
      email: quickLead.email.trim() || undefined,
      lead_source: quickLead.lead_source || 'MANUAL',
      budget: quickLead.budget.trim() || undefined,
      preferred_area: quickLead.preferred_area.trim() || undefined,
      assigned_employee_id: quickLead.assigned_employee_id || undefined,
      status: 'ONGOING',
      bucket: 'NEW_LEAD',
    });
  };

  // Available units for the selected Availability project.
  // Includes AVAILABLE + BLOCKED (held) so held units can still be booked.
  // In edit mode we include ALL so the currently-booked unit still shows.
  const {
    data: availableUnits,
    isLoading: unitsLoading,
    isError: unitsError,
    error: unitsErrObj,
  } = useQuery({
    queryKey: ['availability-available-units', form.availability_project, editing?.id],
    queryFn: async () => {
      // Only AVAILABLE units are bookable. In edit mode we pull ALL so the
      // already-booked unit still appears in the dropdown.
      const res = await availabilityApi.getAvailableUnits(
        form.availability_project!,
        editing ? 'ALL' : 'AVAILABLE',
      );
      // Normalise: endpoint returns a plain array, but guard against a
      // paginated {results: [...]} shape just in case.
      return Array.isArray(res) ? res : ((res as any)?.results ?? []);
    },
    enabled: !!form.availability_project && dialogOpen,
    staleTime: 0,
  });

  const saveMutation = useMutation({
    mutationFn: (data: BookingFormData) =>
      editing ? bookingApi.updateBooking(editing.id, data) : bookingApi.createBooking(data),
    onSuccess: () => {
      toastSuccess(editing ? 'Booking updated' : 'Booking created');
      handleCloseDialog();
      refetch();
      queryClient.invalidateQueries({ queryKey: ['available-plots'] });
      queryClient.invalidateQueries({ queryKey: ['available-flats'] });
    },
    onError: (err: any) => {
      toastError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Save failed');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, remarks, cancellationReason }: any) =>
      bookingApi.updateStatus(id, status, remarks, cancellationReason),
    onSuccess: (data) => {
      toastSuccess(`Status updated to ${data.status_display || data.status}`);
      if (viewItem?.id === data.id) {
        setViewItem(data);
        bookingApi.getStatusHistory(data.id).then(setStatusHistory).catch(() => {});
      }
      refetch();
    },
    onError: (err: any) => toastError(err.response?.data?.detail || 'Failed to update status'),
  });

  const handleOpenCreate = () => {
    setEditing(null); setForm(emptyForm); setDialogOpen(true);
  };

  const handleOpenEdit = (item: Booking) => {
    setEditing(item);
    setForm({
      lead: typeof item.lead === 'object' ? (item.lead as any)?.id || '' : item.lead || '',
      customer_name: item.customer_name || '',
      customer_mobile: item.customer_mobile || '',
      customer_email: item.customer_email || '',
      project: typeof item.project === 'object' ? (item.project as any)?.id || '' : item.project || '',
      unit_type: item.unit_type || 'PLOT',
      plot: typeof item.plot === 'object' ? (item.plot as any)?.id || '' : item.plot || '',
      flat: typeof item.flat === 'object' ? (item.flat as any)?.id || '' : item.flat || '',
      availability_project: typeof (item as any).availability_project === 'object'
        ? ((item as any).availability_project as any)?.id || ''
        : (item as any).availability_project || '',
      availability_unit: typeof (item as any).availability_unit === 'object'
        ? ((item as any).availability_unit as any)?.id || ''
        : (item as any).availability_unit || '',
      agreed_price: item.agreed_price ? Number(item.agreed_price) : undefined,
      booking_amount: item.booking_amount ? Number(item.booking_amount) : 0,
      booking_date: item.booking_date || '',
      sales_executive: typeof item.sales_executive === 'object' ? (item.sales_executive as any)?.id || '' : item.sales_executive || '',
      status: item.status,
      remarks: item.remarks || '',
      property_cost: item.property_cost ? Number(item.property_cost) : undefined,
      revenue: item.revenue ? Number(item.revenue) : undefined,
      incentive: item.incentive ? Number(item.incentive) : undefined,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false); setEditing(null); setForm(emptyForm);
  };

  const handleLeadChange = (leadId: string) => {
    const lead = leads?.results?.find((l: any) => l.id === leadId);
    setForm((p) => ({
      ...p, lead: leadId,
      customer_name: lead?.name || p.customer_name,
      customer_mobile: lead?.mobile || p.customer_mobile,
      customer_email: lead?.email || p.customer_email,
      // Note: lead.interested_project points to the legacy ProjectManagement
      // project, which no longer drives the booking form. User picks the
      // Availability project explicitly.
    }));
  };

  const leadSelected = !!form.lead;

  const handleSubmit = () => {
    if (!form.customer_name || !form.availability_project || !form.booking_amount || !form.booking_date) {
      toastError('Customer Name, Project, Total Cost and Date are required');
      return;
    }
    if (!form.availability_unit) { toastError('Please select a unit'); return; }
    // Only send availability fields; clear legacy project/plot/flat so backend
    // uses the Availability flow.
    const payload: BookingFormData = {
      ...form,
      project: undefined,
      plot: undefined,
      flat: undefined,
    };
    saveMutation.mutate(payload);
  };

  const handleView = async (booking: Booking) => {
    setViewItem(booking);
    try { setStatusHistory(await bookingApi.getStatusHistory(booking.id)); } catch { setStatusHistory([]); }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const response = await apiClient.get('/api/booking/bookings/export/', {
        params: { export_type: format, search: searchQuery || undefined, status: statusFilter || undefined, project: projectFilter || undefined, from_date: fromDate || undefined, to_date: toDate || undefined },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Booking_Report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); window.URL.revokeObjectURL(url);
    } catch { toastError('Export failed'); }
  };

  const getProjectName = (item: Booking) => {
    if (typeof item.project === 'object' && item.project) return (item.project as any).name;
    return item.project_name || '-';
  };

  const columns: GridColDef<Booking>[] = [
    { field: 'customer_name', headerName: 'Customer Name', flex: 1, minWidth: 150 },
    { field: 'project_name', headerName: 'Project Name', flex: 1, minWidth: 150,
      valueGetter: (_: any, row: Booking) => getProjectName(row) },
    { field: 'unit_number', headerName: 'Unit No.', width: 110 },
    { field: 'unit_type', headerName: 'Type', width: 80 },
    { field: 'booking_date', headerName: 'Booking Date', width: 130,
      valueFormatter: (v: any) => v ? new Date(v).toLocaleDateString('en-IN') : '-' },
    { field: 'agreed_price', headerName: 'Agreed Price', width: 130,
      valueFormatter: (v: any) => v ? `₹${Number(v).toLocaleString('en-IN')}` : '—' },
    { field: 'status', headerName: 'Status', width: 160, headerAlign: 'center', align: 'center',
      renderCell: (params) => (
        <Select value={params.value} size="small" variant="outlined" IconComponent={() => null}
          sx={{ height: 32, '& .MuiSelect-select': { py: 0.5, pr: '8px !important', display: 'flex', alignItems: 'center', justifyContent: 'center' },
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
          onChange={async (e) => {
            const newStatus = e.target.value;
            if (newStatus === 'CANCELLED') { setCancelTarget(params.row); setCancelReason(''); setCancelDialogOpen(true); return; }
            try {
              await bookingApi.updateStatus(params.row.id, newStatus, `Status changed to ${newStatus}`);
              toastSuccess('Status updated'); refetch();
            } catch (err: any) { toastError(err.response?.data?.detail || 'Failed to update status'); }
          }}
          renderValue={(value) => (
            <Chip label={BOOKING_STATUSES.find((s) => s.value === value)?.label || value}
              color={statusColors[value as string] || 'default'} size="small" />
          )}>
          {BOOKING_STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
        </Select>
      ),
    },
    { field: 'actions', headerName: 'Actions', width: 120, sortable: false, filterable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View"><IconButton size="small" onClick={() => handleView(params.row)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
          {canEdit && params.row.status !== 'REGISTERED' && params.row.status !== 'CANCELLED' && (
            <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenEdit(params.row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <ScreenHeader title="Bookings" showAddButton={canAdd} addButtonText="New Booking" onAdd={handleOpenCreate} />

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField size="small" placeholder="Search customer, unit or code..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ width: 300 }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel shrink>Status</InputLabel>
            <Select value={statusFilter} label="Status" displayEmpty notched
              onChange={(e) => { setStatusFilter(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}>
              <MenuItem value="">All</MenuItem>
              {BOOKING_STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel shrink>Project</InputLabel>
            <Select value={projectFilter} label="Project" displayEmpty notched
              onChange={(e) => { setProjectFilter(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}>
              <MenuItem value="">All</MenuItem>
              {(projects || []).map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" type="date" label="From Date" value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
            InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
          <TextField size="small" type="date" label="To Date" value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
            InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
          {(statusFilter || projectFilter || fromDate || toDate) && (
            <Button size="small" variant="text"
              onClick={() => { setStatusFilter(''); setProjectFilter(''); setFromDate(''); setToDate(''); setPaginationModel((p) => ({ ...p, page: 0 })); }}>
              Clear Filters
            </Button>
          )}
          {canExport && (
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" startIcon={<ExcelIcon />} onClick={() => handleExport('excel')}>Excel</Button>
              <Button size="small" variant="outlined" startIcon={<PdfIcon />} onClick={() => handleExport('pdf')}>PDF</Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Grid */}
      <Paper sx={{ height: 620 }}>
        <DataGrid rows={bookingsData?.results || []} columns={columns} loading={isLoading}
          rowCount={bookingsData?.count || 0} paginationMode="server"
          paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50, 100]} disableRowSelectionOnClick />
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Booking' : 'New Booking'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Lead</InputLabel>
                  <Select value={form.lead || ''} label="Lead"
                    onChange={(e) => handleLeadChange(e.target.value)}>
                    <MenuItem value="">— No lead —</MenuItem>
                    {leads?.results?.map((l: any) => <MenuItem key={l.id} value={l.id}>{l.name} ({l.code})</MenuItem>)}
                  </Select>
                </FormControl>
                <Tooltip title="Add new lead">
                  <IconButton color="primary" size="small"
                    onClick={() => { setQuickLead({ ...emptyQuickLead }); setQuickLeadOpen(true); }}
                    sx={{ border: '1px solid', borderColor: 'primary.main', borderRadius: 1.5, flexShrink: 0 }}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth required size="small" label="Customer Name"
                value={form.customer_name}
                onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))}
                disabled={leadSelected} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth size="small" label="Mobile"
                value={form.customer_mobile}
                onChange={(e) => setForm((p) => ({ ...p, customer_mobile: e.target.value }))}
                disabled={leadSelected} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth size="small" label="Email" type="email"
                value={form.customer_email}
                onChange={(e) => setForm((p) => ({ ...p, customer_email: e.target.value }))}
                disabled={leadSelected} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required size="small">
                <InputLabel>Project</InputLabel>
                <Select value={form.availability_project || ''} label="Project"
                  onChange={(e) => {
                    const projectId = e.target.value;
                    const selected = (availabilityProjects || []).find((p: any) => p.id === projectId);
                    // unit_type stays for display/legacy; derive from project type
                    const unitType = selected?.project_type === 'PLOTS' ? 'PLOT' : 'FLAT';
                    setForm((p) => ({
                      ...p,
                      availability_project: projectId,
                      availability_unit: '',
                      unit_type: unitType,
                      plot: '', flat: '',
                    }));
                  }}>
                  {(availabilityProjects || []).map((p: any) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} · {p.available_units ?? 0} available
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required size="small" disabled={!form.availability_project || unitsLoading}>
                <InputLabel>Select Unit</InputLabel>
                <Select value={form.availability_unit || ''} label="Select Unit"
                  onChange={(e) => {
                    const unitId = e.target.value;
                    const unit = (availableUnits || []).find((u: any) => u.id === unitId);
                    setForm((p) => ({
                      ...p,
                      availability_unit: unitId,
                      // auto-fill price if empty
                      agreed_price: p.agreed_price ?? (unit?.price ? Number(unit.price) : undefined),
                      booking_amount: p.booking_amount || (unit?.price ? Number(unit.price) : 0),
                    }));
                  }}>
                  <MenuItem value="">
                    {unitsLoading ? 'Loading units…' : '— Select —'}
                  </MenuItem>
                  {(availableUnits || []).map((u: any) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.block_name ? `${u.block_name} · ` : ''}
                      {u.unit_number}
                      {u.unit_type_display ? ` · ${u.unit_type_display}` : ''}
                      {u.floor != null ? ` · Floor ${u.floor}` : ''}
                      {u.price ? ` · ₹${Number(u.price).toLocaleString('en-IN')}` : ''}
                      {u.status && u.status !== 'AVAILABLE' ? ` · [${u.status}]` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {form.availability_project && unitsError && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="error">
                  Failed to load units: {(unitsErrObj as any)?.response?.data?.detail
                    || (unitsErrObj as any)?.message || 'Unknown error'}
                </Alert>
              </Grid>
            )}
            {form.availability_project && !unitsLoading && !unitsError && (availableUnits?.length === 0) && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="warning">
                  No available units in this project. All units may be booked/registered,
                  or you haven't added units yet in the Availability List.
                </Alert>
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth size="small" type="number" label="Agreed Price (₹)"
                value={form.agreed_price ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, agreed_price: e.target.value ? Number(e.target.value) : undefined }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth required size="small" type="number" label="Total Cost (₹)"
                value={form.booking_amount}
                onChange={(e) => setForm((p) => ({ ...p, booking_amount: Number(e.target.value) }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth required size="small" type="date" label="Booking Date"
                InputLabelProps={{ shrink: true }} value={form.booking_date}
                onChange={(e) => setForm((p) => ({ ...p, booking_date: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Employee</InputLabel>
                <Select value={form.sales_executive || ''} label="Employee"
                  onChange={(e) => setForm((p) => ({ ...p, sales_executive: e.target.value }))}>
                  <MenuItem value="">— None —</MenuItem>
                  {(employees || []).map((e: any) => <MenuItem key={e.id} value={e.id}>{e.name || e.username}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth size="small" multiline rows={2} label="Remarks"
                value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth size="small" type="number" label="Property Cost (₹)"
                value={form.property_cost ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, property_cost: e.target.value ? Number(e.target.value) : undefined }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth size="small" type="number" label="Revenue (₹)"
                value={form.revenue ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, revenue: e.target.value ? Number(e.target.value) : undefined }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth size="small" type="number" label="Incentive (₹)"
                value={form.incentive ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, incentive: e.target.value ? Number(e.target.value) : undefined }))} />
            </Grid>
          </Grid>
          {saveMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(saveMutation.error as any)?.response?.data?.detail || 'Save failed'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create Booking'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onClose={() => setViewItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Booking Details</DialogTitle>
        {viewItem && (
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Booking ID</Typography>
                <Typography variant="body1">{viewItem.code}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip label={BOOKING_STATUSES.find((s) => s.value === viewItem.status)?.label || viewItem.status}
                    color={statusColors[viewItem.status] || 'default'} size="small" />
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Customer</Typography>
                <Typography variant="body1">{viewItem.customer_name}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Mobile</Typography>
                <Typography variant="body1">{viewItem.customer_mobile || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Project</Typography>
                <Typography variant="body1">{getProjectName(viewItem)}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Unit</Typography>
                <Typography variant="body1">{viewItem.unit_number || '-'} ({viewItem.unit_type})</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Agreed Price</Typography>
                <Typography variant="body1">{viewItem.agreed_price ? `₹${Number(viewItem.agreed_price).toLocaleString('en-IN')}` : '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Total Cost</Typography>
                <Typography variant="body1">₹{Number(viewItem.booking_amount).toLocaleString('en-IN')}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Booking Date</Typography>
                <Typography variant="body1">{viewItem.booking_date}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Sales Executive</Typography>
                <Typography variant="body1">{viewItem.sales_executive_name || '-'}</Typography>
              </Grid>
              {viewItem.status === 'CANCELLED' && (
                <Grid size={{ xs: 12 }}>
                  <Alert severity="error">Cancelled on {viewItem.cancelled_date} — {viewItem.cancellation_reason}</Alert>
                </Grid>
              )}
              {viewItem.remarks && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Remarks</Typography>
                  <Typography variant="body2">{viewItem.remarks}</Typography>
                </Grid>
              )}
              {/* Status History */}
              {statusHistory.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <HistoryIcon fontSize="small" /> Status History (Last 5)
                  </Typography>
                  <Box sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {statusHistory.slice(0, 3).map((h) => (
                      <Box key={h.id}>
                        <Typography variant="body2" fontWeight={600}>{h.from_status || 'INIT'} → {h.to_status}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          by {h.changed_by?.username} on {new Date(h.changed_on).toLocaleString('en-IN')}
                        </Typography>
                        {h.remarks && <Typography variant="caption" display="block" color="text.secondary">Remarks: {h.remarks}</Typography>}
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setViewItem(null)}>Close</Button>
          {viewItem && canEdit && viewItem.status !== 'REGISTERED' && viewItem.status !== 'CANCELLED' && (
            <Button variant="contained" onClick={() => { setViewItem(null); handleOpenEdit(viewItem); }}>Edit</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Quick Add Lead Dialog */}
      <Dialog open={quickLeadOpen} onClose={() => setQuickLeadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon fontSize="small" /> Add New Lead
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth required size="small" label="Lead Name" autoFocus
                value={quickLead.name}
                onChange={(e) => setQuickLead((p) => ({ ...p, name: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth required size="small" label="Mobile"
                value={quickLead.mobile}
                onChange={(e) => setQuickLead((p) => ({ ...p, mobile: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth size="small" label="Email" type="email"
                value={quickLead.email}
                onChange={(e) => setQuickLead((p) => ({ ...p, email: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Lead Source</InputLabel>
                <Select value={quickLead.lead_source} label="Lead Source"
                  onChange={(e) => setQuickLead((p) => ({ ...p, lead_source: e.target.value }))}>
                  {(leadChoices?.lead_sources || [
                    { value: 'MANUAL', label: 'Manual Entry' },
                  ]).map((s: any) => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth size="small" label="Budget"
                value={quickLead.budget}
                onChange={(e) => setQuickLead((p) => ({ ...p, budget: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth size="small" label="Preferred Area"
                value={quickLead.preferred_area}
                onChange={(e) => setQuickLead((p) => ({ ...p, preferred_area: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Assign to Employee</InputLabel>
                <Select value={quickLead.assigned_employee_id} label="Assign to Employee"
                  onChange={(e) => setQuickLead((p) => ({ ...p, assigned_employee_id: e.target.value }))}>
                  <MenuItem value="">— None —</MenuItem>
                  {(employees || []).map((emp: any) => (
                    <MenuItem key={emp.id} value={emp.id}>{emp.name || emp.username}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickLeadOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={handleQuickLeadSave} disabled={createLeadMutation.isPending}>
            {createLeadMutation.isPending ? 'Saving…' : 'Create Lead'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will release the unit back to <b>AVAILABLE</b>. This is irreversible.
          </Typography>
          <TextField fullWidth required multiline rows={3} size="small" label="Cancellation Reason"
            value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Dismiss</Button>
          <Button color="error" variant="contained" disabled={!cancelReason || updateStatusMutation.isPending}
            onClick={() => {
              if (cancelTarget) {
                updateStatusMutation.mutate({ id: cancelTarget.id, status: 'CANCELLED', cancellationReason: cancelReason, remarks: `Cancelled: ${cancelReason}` });
                setCancelDialogOpen(false); setCancelTarget(null);
              }
            }}>
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingList;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  Divider,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  Assignment as ContractIcon,
  Verified as RegIcon,
  Home as HomeIcon,
  Receipt as ReceiptIcon,
  FileDownload as ExcelIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../../api/booking';
import { inventoryApi } from '../../api/inventory.api';
import { projectsApi } from '../../api/projects';
import { leadApi } from '../../api/lead.api';
import apiClient from '../../api/axios.config';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
} from '../../utils/spacing';
import type { Booking, BookingFormData, BookingStatusHistory } from '../../types/realestate.types';

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  BOOKED: 'info',
  AGREEMENT: 'warning',
  REGISTERED: 'success',
  CANCELLED: 'error',
};

const Bookings: React.FC = () => {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();
  usePageTitle('Booking Management');

  // Breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Booking Management' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // List States
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dialog States
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Form States
  const [formData, setFormData] = useState<BookingFormData>({
    lead: '',
    customer_name: '',
    customer_mobile: '',
    customer_email: '',
    project: '',
    unit_type: 'PLOT',
    plot: '',
    flat: '',
    agreed_price: 0,
    booking_amount: 0,
    booking_date: new Date().toISOString().split('T')[0],
    sales_executive: '',
    remarks: '',
  });

  const [cancelReason, setCancelReason] = useState('');
  const [statusHistory, setStatusHistory] = useState<BookingStatusHistory[]>([]);

  // Queries
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings', paginationModel, searchQuery, statusFilter, projectFilter, fromDate, toDate],
    queryFn: () =>
      bookingApi.getBookings({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery,
        status: statusFilter || undefined,
        project: projectFilter || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      }),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-mini'],
    queryFn: () => projectsApi.mini(),
  });

  const { data: leads } = useQuery({
    queryKey: ['leads-dropdown'],
    queryFn: () => leadApi.getLeads({ page_size: 100 }),
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-dropdown'],
    queryFn: () => leadApi.getUsers(),
  });

  // Dynamic units fetching inside form
  const { data: availablePlots } = useQuery({
    queryKey: ['available-plots', formData.project],
    queryFn: () => inventoryApi.getPlots({ project: formData.project, status: 'AVAILABLE' }),
    enabled: !!formData.project && formData.unit_type === 'PLOT',
  });

  const { data: availableFlats } = useQuery({
    queryKey: ['available-flats', formData.project],
    queryFn: () => inventoryApi.getFlats({ project: formData.project, status: 'AVAILABLE' }),
    enabled: !!formData.project && formData.unit_type === 'FLAT',
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: BookingFormData) => bookingApi.createBooking(data),
    onSuccess: () => {
      toastSuccess('Booking created successfully');
      setOpenAddDialog(false);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-plots'] });
      queryClient.invalidateQueries({ queryKey: ['available-flats'] });
      resetForm();
    },
    onError: (err: any) => {
      toastError(err.response?.data?.detail || 'Failed to create booking');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, remarks, cancellationReason }: { id: string; status: string; remarks?: string; cancellationReason?: string }) =>
      bookingApi.updateStatus(id, status, remarks, cancellationReason),
    onSuccess: (data) => {
      toastSuccess(`Booking status updated to ${data.status}`);
      setSelectedBooking(data);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      // Reload history
      bookingApi.getStatusHistory(data.id).then(setStatusHistory);
    },
    onError: (err: any) => {
      toastError(err.response?.data?.detail || 'Failed to update booking status');
    },
  });

  const resetForm = () => {
    setFormData({
      lead: '',
      customer_name: '',
      customer_mobile: '',
      customer_email: '',
      project: '',
      unit_type: 'PLOT',
      plot: '',
      flat: '',
      agreed_price: 0,
      booking_amount: 0,
      booking_date: new Date().toISOString().split('T')[0],
      sales_executive: '',
      remarks: '',
    });
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const params: any = {
        export_type: format,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        project: projectFilter || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      };
      const response = await apiClient.get('/api/booking/bookings/export/', {
        params,
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Booking_Report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toastError(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  const handleLeadChange = (leadId: string) => {
    const selectedLead = leads?.results?.find((l: any) => l.id === leadId);
    if (selectedLead) {
      setFormData(prev => ({
        ...prev,
        lead: leadId,
        customer_name: selectedLead.name,
        customer_mobile: selectedLead.mobile,
        customer_email: selectedLead.email || '',
        project: (selectedLead as any).interested_project || prev.project || '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        lead: leadId,
      }));
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.project || !formData.booking_amount || !formData.booking_date) {
      toastError('Please fill required fields (Customer Name, Project, Booking Amount, Date)');
      return;
    }
    if (formData.unit_type === 'PLOT' && !formData.plot) {
      toastError('Please select a Plot unit');
      return;
    }
    if (formData.unit_type === 'FLAT' && !formData.flat) {
      toastError('Please select a Flat unit');
      return;
    }
    createMutation.mutate(formData);
  };

  const fetchStatusHistory = async (bookingId: string) => {
    try {
      const history = await bookingApi.getStatusHistory(bookingId);
      setStatusHistory(history);
    } catch (e) {
      console.error(e);
    }
  };

  const columns: GridColDef<Booking>[] = [
    { field: 'customer_name', headerName: 'Customer Name', flex: 1, minWidth: 150 },
    {
      field: 'project_name',
      headerName: 'Project',
      width: 180,
      valueGetter: (_, row) => {
        if (typeof row.project === 'object' && row.project !== null) {
          return (row.project as any).name;
        }
        return row.project_name || row.project || '-';
      }
    },
    { field: 'unit_number', headerName: 'Unit No.', width: 120 },
    { field: 'booking_date', headerName: 'Booking Date', width: 130 },
    {
      field: 'agreed_price',
      headerName: 'Agreed Price',
      width: 140,
      valueFormatter: (value) => value ? `₹${Number(value).toLocaleString()}` : '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={statusColors[params.value] || 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View details / history">
            <IconButton
              onClick={() => {
                setSelectedBooking(params.row);
                fetchStatusHistory(params.row.id);
                setOpenViewDialog(true);
              }}
              size="small"
              color="primary"
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          {params.row.status === 'BOOKED' && (
            <Tooltip title="Sign Agreement">
              <IconButton
                onClick={() => updateStatusMutation.mutate({ id: params.row.id, status: 'AGREEMENT', remarks: 'Signed agreement form' })}
                size="small"
                color="warning"
              >
                <ContractIcon />
              </IconButton>
            </Tooltip>
          )}
          {params.row.status === 'AGREEMENT' && (
            <Tooltip title="Register Sale">
              <IconButton
                onClick={() => updateStatusMutation.mutate({ id: params.row.id, status: 'REGISTERED', remarks: 'Registered property sale' })}
                size="small"
                color="success"
              >
                <RegIcon />
              </IconButton>
            </Tooltip>
          )}
          {params.row.status !== 'CANCELLED' && params.row.status !== 'REGISTERED' && (
            <Tooltip title="Cancel Booking">
              <IconButton
                onClick={() => {
                  setSelectedBooking(params.row);
                  setCancelReason('');
                  setOpenCancelDialog(true);
                }}
                size="small"
                color="error"
              >
                <CancelIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <ScreenHeader
        title="Booking Management"
        showAddButton
        addButtonText="New Booking"
        onAdd={() => {
          resetForm();
          setOpenAddDialog(true);
        }}
      />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search Customer, Unit or Code..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 280 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel shrink>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
              label="Status"
              displayEmpty
              notched
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="BOOKED">Booked</MenuItem>
              <MenuItem value="AGREEMENT">Agreement</MenuItem>
              <MenuItem value="REGISTERED">Registered</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel shrink>Project</InputLabel>
            <Select
              value={projectFilter}
              onChange={(e) => { setProjectFilter(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
              label="Project"
              displayEmpty
              notched
            >
              <MenuItem value="">All</MenuItem>
              {projects?.map((proj) => (
                <MenuItem key={proj.id} value={proj.id}>
                  {proj.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="date"
            label="From Date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 155 }}
          />
          <TextField
            size="small"
            type="date"
            label="To Date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 155 }}
          />
          {(statusFilter || projectFilter || fromDate || toDate) && (
            <Button size="small" variant="text" onClick={() => { setStatusFilter(''); setProjectFilter(''); setFromDate(''); setToDate(''); setPaginationModel((p) => ({ ...p, page: 0 })); }}>
              Clear
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
            rows={bookingsData?.results || []}
            columns={columns}
            loading={isLoading}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            rowCount={bookingsData?.count || 0}
            pageSizeOptions={[10, 20, 50]}
            disableRowSelectionOnClick
          />
        </Paper>

      {/* New Booking Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Property Booking</DialogTitle>
        <form onSubmit={handleCreate}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Link Customer (Lead)</InputLabel>
                  <Select
                    value={formData.lead || ''}
                    onChange={(e) => handleLeadChange(e.target.value)}
                    label="Link Customer (Lead)"
                  >
                    <MenuItem value="">-- Select Customer --</MenuItem>
                    {leads?.results?.map((l: any) => (
                      <MenuItem key={l.id} value={l.id}>
                        {l.name} ({l.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Customer Name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData(p => ({ ...p, customer_name: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Mobile Number"
                  value={formData.customer_mobile}
                  onChange={(e) => setFormData(p => ({ ...p, customer_mobile: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email ID"
                  value={formData.customer_email}
                  onChange={(e) => setFormData(p => ({ ...p, customer_email: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required size="small">
                  <InputLabel>Select Project</InputLabel>
                  <Select
                    value={formData.project || ''}
                    onChange={(e) => setFormData(p => ({ ...p, project: e.target.value, plot: '', flat: '' }))}
                    label="Select Project"
                  >
                    {projects?.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required size="small">
                  <InputLabel>Unit Type</InputLabel>
                  <Select
                    value={formData.unit_type}
                    onChange={(e) => setFormData(p => ({ ...p, unit_type: e.target.value as 'PLOT' | 'FLAT', plot: '', flat: '' }))}
                    label="Unit Type"
                  >
                    <MenuItem value="PLOT">Plot (Layout Plot / Villa)</MenuItem>
                    <MenuItem value="FLAT">Flat (Apartment Unit)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {formData.unit_type === 'PLOT' ? (
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth required size="small">
                    <InputLabel>Select Available Plot</InputLabel>
                    <Select
                      value={formData.plot || ''}
                      onChange={(e) => setFormData(p => ({ ...p, plot: e.target.value }))}
                      label="Select Available Plot"
                    >
                      <MenuItem value="">-- Select Plot Number --</MenuItem>
                      {availablePlots?.results?.map((plot: any) => (
                        <MenuItem key={plot.id} value={plot.id}>
                          Plot {plot.plot_number} ({plot.area_sqyd} SqYds | facing {plot.facing || 'N/A'}) - ₹{plot.total_price ? Number(plot.total_price).toLocaleString() : '—'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ) : (
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth required size="small">
                    <InputLabel>Select Available Flat / Apartment Unit</InputLabel>
                    <Select
                      value={formData.flat || ''}
                      onChange={(e) => setFormData(p => ({ ...p, flat: e.target.value }))}
                      label="Select Available Flat / Apartment Unit"
                    >
                      <MenuItem value="">-- Select Flat / Unit Number --</MenuItem>
                      {availableFlats?.results?.map((flat: any) => (
                        <MenuItem key={flat.id} value={flat.id}>
                          Unit {flat.unit_number} ({flat.tower || ''} Floor {flat.floor} | {flat.flat_type}) - ₹{flat.price ? Number(flat.price).toLocaleString() : '—'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  label="Agreed Sale Price (₹)"
                  value={formData.agreed_price}
                  onChange={(e) => setFormData(p => ({ ...p, agreed_price: Number(e.target.value) }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  size="small"
                  label="Downpayment / Booking Amount (₹)"
                  value={formData.booking_amount}
                  onChange={(e) => setFormData(p => ({ ...p, booking_amount: Number(e.target.value) }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  size="small"
                  label="Booking Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.booking_date}
                  onChange={(e) => setFormData(p => ({ ...p, booking_date: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sales Executive</InputLabel>
                  <Select
                    value={formData.sales_executive || ''}
                    onChange={(e) => setFormData(p => ({ ...p, sales_executive: e.target.value }))}
                    label="Sales Executive"
                  >
                    {employees?.map((emp: any) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.name || emp.username || 'Unknown'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
            <Button variant="contained" type="submit" loading={createMutation.isPending}>
              Book Property
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Booking Details & Status History Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        {selectedBooking && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">Booking Details: {selectedBooking.code}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Created on {selectedBooking.booking_date}
                </Typography>
              </Box>
              <Chip label={selectedBooking.status} color={statusColors[selectedBooking.status] || 'default'} />
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* General Info */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Customer Details
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedBooking.customer_name}</Typography>
                  <Typography variant="body2" color="text.secondary">Mobile: {selectedBooking.customer_mobile || '—'}</Typography>
                  <Typography variant="body2" color="text.secondary">Email: {selectedBooking.customer_email || '—'}</Typography>

                  <Box sx={{ mt: 3 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Property / Unit Details
                  </Typography>
                  <Typography variant="body1">
                    Project:{' '}
                    {typeof selectedBooking.project === 'object' && selectedBooking.project !== null
                      ? (selectedBooking.project as any).name
                      : selectedBooking.project_name || '—'}
                  </Typography>
                  <Typography variant="body2">Unit Type: {selectedBooking.unit_type}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Unit Number: {selectedBooking.unit_number || '—'}</Typography>
                </Grid>

                {/* Financials & Executive */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Financial Summary
                  </Typography>
                  <Typography variant="body1">
                    Agreed Sale Price: <b>₹{selectedBooking.agreed_price ? Number(selectedBooking.agreed_price).toLocaleString() : '—'}</b>
                  </Typography>
                  <Typography variant="body1">
                    Booking Amount Paid: <b>₹{selectedBooking.booking_amount ? Number(selectedBooking.booking_amount).toLocaleString() : '—'}</b>
                  </Typography>

                  <Box sx={{ mt: 3 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Sales Executive
                  </Typography>
                  <Typography variant="body1">
                    {typeof selectedBooking.sales_executive === 'object' && selectedBooking.sales_executive !== null
                      ? `${(selectedBooking.sales_executive as any).first_name || ''} ${(selectedBooking.sales_executive as any).last_name || ''}`.trim() || (selectedBooking.sales_executive as any).username
                      : selectedBooking.sales_executive_name || '—'}
                  </Typography>

                  {selectedBooking.status === 'CANCELLED' && (
                    <Box sx={{ mt: 2, p: 1.5, border: '1px solid red', borderRadius: 1, bgcolor: 'rgba(255,0,0,0.02)' }}>
                      <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                        Cancelled on {selectedBooking.cancelled_date}
                      </Typography>
                      <Typography variant="body2" color="error.dark">
                        Reason: {selectedBooking.cancellation_reason}
                      </Typography>
                    </Box>
                  )}
                </Grid>

                {/* Audit Trail / Status History */}
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon /> Status Progress Audit Trail
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pl: 2, borderLeft: '2px solid rgba(0, 0, 0, 0.1)' }}>
                    {statusHistory && statusHistory.length > 0 ? (
                      statusHistory.map((hist) => (
                        <Box key={hist.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {hist.from_status || 'INIT'} → {hist.to_status}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              by {hist.changed_by?.username} on {new Date(hist.changed_on).toLocaleString()}
                            </Typography>
                          </Box>
                          {hist.remarks && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 1 }}>
                              Remarks: {hist.remarks}
                            </Typography>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        No status history available.
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              {selectedBooking.status === 'BOOKED' && (
                <Button
                  color="warning"
                  variant="contained"
                  startIcon={<ContractIcon />}
                  onClick={() => updateStatusMutation.mutate({ id: selectedBooking.id, status: 'AGREEMENT', remarks: 'Signed contract agreement' })}
                  loading={updateStatusMutation.isPending}
                >
                  Move to Agreement
                </Button>
              )}
              {selectedBooking.status === 'AGREEMENT' && (
                <Button
                  color="success"
                  variant="contained"
                  startIcon={<RegIcon />}
                  onClick={() => updateStatusMutation.mutate({ id: selectedBooking.id, status: 'REGISTERED', remarks: 'Completed registration' })}
                  loading={updateStatusMutation.isPending}
                >
                  Complete Registration
                </Button>
              )}
              <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Cancellation Reason Dialog */}
      <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cancelling this booking will set the property unit back to <b>AVAILABLE</b>. This action is irreversible.
          </Typography>
          <TextField
            fullWidth
            required
            multiline
            rows={3}
            size="small"
            label="Cancellation Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>Dismiss</Button>
          <Button
            color="error"
            variant="contained"
            disabled={!cancelReason}
            onClick={() => {
              if (selectedBooking) {
                updateStatusMutation.mutate({
                  id: selectedBooking.id,
                  status: 'CANCELLED',
                  cancellationReason: cancelReason,
                  remarks: `Cancelled booking: ${cancelReason}`,
                });
                setOpenCancelDialog(false);
              }
            }}
            loading={updateStatusMutation.isPending}
          >
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Bookings;

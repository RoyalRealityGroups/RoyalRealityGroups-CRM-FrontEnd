// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Paper, Grid, TextField, Button, FormControl, InputLabel,
  Select, MenuItem, Typography, Divider, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon, History as HistoryIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../../api/booking';
import { inventoryApi } from '../../api/inventory.api';
import { leadApi } from '../../api/lead.api';
import apiClient from '../../api/axios.config';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import { getPageContainerStyles, getContentSectionStyles } from '../../utils/spacing';
import HomeIcon from '@mui/icons-material/Home';
import type { BookingFormData, BookingStatusHistory } from '../../types/realestate.types';

const statusColors: Record<string, any> = {
  BOOKED: 'info', AGREEMENT: 'warning', REGISTERED: 'success', CANCELLED: 'error',
};

const emptyForm: BookingFormData = {
  lead: '',
  customer_name: '',
  customer_mobile: '',
  customer_email: '',
  project: '',
  unit_type: 'PLOT',
  plot: '',
  flat: '',
  agreed_price: undefined,
  booking_amount: 0,
  booking_date: new Date().toISOString().split('T')[0],
  sales_executive: '',
  remarks: '',
};

const BookingForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  const isEdit = Boolean(id);
  const isView = location.pathname.includes('/view/');

  usePageTitle(isView ? 'View Booking' : isEdit ? 'Edit Booking' : 'New Booking');

  const [formData, setFormData] = useState<BookingFormData>(emptyForm);
  const [statusHistory, setStatusHistory] = useState<BookingStatusHistory[]>([]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Booking Management', path: '/booking/list' },
      { label: isView ? 'View Booking' : isEdit ? 'Edit Booking' : 'New Booking' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEdit, isView]);

  // Fetch existing booking if editing/viewing
  const { data: bookingData, isLoading: bookingLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.getBooking(id!),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (bookingData) {
      setFormData({
        lead: typeof bookingData.lead === 'object' ? (bookingData.lead as any)?.id || '' : bookingData.lead || '',
        customer_name: bookingData.customer_name || '',
        customer_mobile: bookingData.customer_mobile || '',
        customer_email: bookingData.customer_email || '',
        project: typeof bookingData.project === 'object' ? (bookingData.project as any)?.id || '' : bookingData.project || '',
        unit_type: bookingData.unit_type || 'PLOT',
        plot: typeof bookingData.plot === 'object' ? (bookingData.plot as any)?.id || '' : bookingData.plot || '',
        flat: typeof bookingData.flat === 'object' ? (bookingData.flat as any)?.id || '' : bookingData.flat || '',
        agreed_price: bookingData.agreed_price ? Number(bookingData.agreed_price) : undefined,
        booking_amount: bookingData.booking_amount ? Number(bookingData.booking_amount) : 0,
        booking_date: bookingData.booking_date || '',
        sales_executive: typeof bookingData.sales_executive === 'object' ? (bookingData.sales_executive as any)?.id || '' : bookingData.sales_executive || '',
        status: bookingData.status,
        remarks: bookingData.remarks || '',
      });
      // Load history
      bookingApi.getStatusHistory(id!).then(setStatusHistory).catch(() => {});
    }
  }, [bookingData, id]);

  // Dropdown data
  const { data: projects } = useQuery({
    queryKey: ['projects-mini'],
    queryFn: async () => { const r = await apiClient.get('/api/masters/projects/mini/'); return r.data.results || r.data; },
    staleTime: 5 * 60 * 1000,
  });

  const { data: leads } = useQuery({
    queryKey: ['leads-dropdown'],
    queryFn: () => leadApi.getLeads({ page_size: 200, status: undefined }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: employees } = useQuery({
    queryKey: ['lead-users'],
    queryFn: () => leadApi.getUsers(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: availablePlots } = useQuery({
    queryKey: ['available-plots', formData.project, id],
    queryFn: () => inventoryApi.getPlots({ project: formData.project, status: 'AVAILABLE' }),
    enabled: !!formData.project && formData.unit_type === 'PLOT' && !isView,
  });

  const { data: availableFlats } = useQuery({
    queryKey: ['available-flats', formData.project, id],
    queryFn: () => inventoryApi.getFlats({ project: formData.project, status: 'AVAILABLE' }),
    enabled: !!formData.project && formData.unit_type === 'FLAT' && !isView,
  });

  const saveMutation = useMutation({
    mutationFn: (data: BookingFormData) =>
      isEdit ? bookingApi.updateBooking(id!, data) : bookingApi.createBooking(data),
    onSuccess: () => {
      toastSuccess(isEdit ? 'Booking updated' : 'Booking created');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      navigate('/booking/list');
    },
    onError: (err: any) => {
      toastError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Save failed');
    },
  });

  const handleLeadChange = (leadId: string) => {
    const lead = leads?.results?.find((l: any) => l.id === leadId);
    setFormData((p) => ({
      ...p,
      lead: leadId,
      customer_name: lead?.name || p.customer_name,
      customer_mobile: lead?.mobile || p.customer_mobile,
      customer_email: lead?.email || p.customer_email,
      project: lead?.interested_project || p.project,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.project || !formData.booking_amount || !formData.booking_date) {
      toastError('Customer Name, Project, Booking Amount, and Date are required');
      return;
    }
    if (formData.unit_type === 'PLOT' && !formData.plot) { toastError('Please select a plot'); return; }
    if (formData.unit_type === 'FLAT' && !formData.flat) { toastError('Please select a flat'); return; }
    saveMutation.mutate(formData);
  };

  const field = (key: keyof BookingFormData) => ({
    value: formData[key] ?? '',
    onChange: (e: any) => setFormData((p) => ({ ...p, [key]: e.target.value })),
    disabled: isView || saveMutation.isPending,
  });

  if (bookingLoading) return <Box p={3}><Typography>Loading...</Typography></Box>;

  return (
    <Box sx={getPageContainerStyles()}>
      <ScreenHeader
        title={isView ? 'View Booking' : isEdit ? 'Edit Booking' : 'New Booking'}
        showBackButton
        onBack={() => navigate('/booking/list')}
        showAddButton={false}
        disableBox
      />

      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Status chip on view/edit */}
              {isEdit && bookingData && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip label={bookingData.status_display || bookingData.status}
                      color={statusColors[bookingData.status] || 'default'} />
                    <Typography variant="caption" color="text.secondary">Booking ID: {bookingData.code}</Typography>
                    <Button size="small" startIcon={<HistoryIcon />} variant="text"
                      onClick={() => setHistoryDialogOpen(true)}>
                      History
                    </Button>
                  </Box>
                </Grid>
              )}

              {/* Customer Section */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>Customer Details</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small" disabled={isView}>
                  <InputLabel>Link to Lead (optional)</InputLabel>
                  <Select value={formData.lead || ''} label="Link to Lead (optional)"
                    onChange={(e) => handleLeadChange(e.target.value)}>
                    <MenuItem value="">— No lead —</MenuItem>
                    {leads?.results?.map((l: any) => (
                      <MenuItem key={l.id} value={l.id}>{l.name} ({l.code})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth required size="small" label="Customer Name" {...field('customer_name')} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth size="small" label="Mobile" {...field('customer_mobile')} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth size="small" label="Email" type="email" {...field('customer_email')} />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" gutterBottom>Property Details</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required size="small" disabled={isView}>
                  <InputLabel>Project</InputLabel>
                  <Select value={formData.project || ''} label="Project"
                    onChange={(e) => setFormData((p) => ({ ...p, project: e.target.value, plot: '', flat: '' }))}>
                    {(projects || []).map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required size="small" disabled={isView}>
                  <InputLabel>Unit Type</InputLabel>
                  <Select value={formData.unit_type} label="Unit Type"
                    onChange={(e) => setFormData((p) => ({ ...p, unit_type: e.target.value as any, plot: '', flat: '' }))}>
                    <MenuItem value="PLOT">Plot</MenuItem>
                    <MenuItem value="FLAT">Flat / Unit</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {formData.unit_type === 'PLOT' ? (
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth required size="small" disabled={isView}>
                    <InputLabel>Select Plot</InputLabel>
                    <Select value={formData.plot || ''} label="Select Plot"
                      onChange={(e) => setFormData((p) => ({ ...p, plot: e.target.value }))}>
                      <MenuItem value="">— Select —</MenuItem>
                      {availablePlots?.results?.map((p: any) => (
                        <MenuItem key={p.id} value={p.id}>
                          Plot {p.plot_number} · {p.area_sqyd} SqYd · {p.facing || 'N/A'} · ₹{p.total_price ? Number(p.total_price).toLocaleString('en-IN') : '—'}
                        </MenuItem>
                      ))}
                      {/* Show current plot in edit mode even if not available */}
                      {isEdit && formData.plot && !availablePlots?.results?.find((p: any) => p.id === formData.plot) && (
                        <MenuItem value={formData.plot}>
                          {typeof bookingData?.plot === 'object' ? `Plot ${(bookingData.plot as any).plot_number} (current)` : `Current Plot`}
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid>
              ) : (
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth required size="small" disabled={isView}>
                    <InputLabel>Select Flat</InputLabel>
                    <Select value={formData.flat || ''} label="Select Flat"
                      onChange={(e) => setFormData((p) => ({ ...p, flat: e.target.value }))}>
                      <MenuItem value="">— Select —</MenuItem>
                      {availableFlats?.results?.map((f: any) => (
                        <MenuItem key={f.id} value={f.id}>
                          Unit {f.unit_number} · {f.tower || ''} Floor {f.floor} · {f.flat_type} · ₹{f.price ? Number(f.price).toLocaleString('en-IN') : '—'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" gutterBottom>Financials & Team</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth size="small" type="number" label="Agreed Sale Price (₹)"
                  value={formData.agreed_price ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, agreed_price: e.target.value ? Number(e.target.value) : undefined }))}
                  disabled={isView || saveMutation.isPending} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth required size="small" type="number" label="Booking Amount (₹)"
                  value={formData.booking_amount}
                  onChange={(e) => setFormData((p) => ({ ...p, booking_amount: Number(e.target.value) }))}
                  disabled={isView || saveMutation.isPending} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth required size="small" type="date" label="Booking Date"
                  InputLabelProps={{ shrink: true }} {...field('booking_date')} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small" disabled={isView}>
                  <InputLabel>Sales Executive</InputLabel>
                  <Select value={formData.sales_executive || ''} label="Sales Executive"
                    onChange={(e) => setFormData((p) => ({ ...p, sales_executive: e.target.value }))}>
                    <MenuItem value="">— None —</MenuItem>
                    {(employees || []).map((e: any) => (
                      <MenuItem key={e.id} value={e.id}>{e.name || e.username}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth size="small" multiline rows={2} label="Remarks" {...field('remarks')} />
              </Grid>

              {/* Actions */}
              {!isView && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button variant="outlined" startIcon={<BackIcon />} onClick={() => navigate('/booking/list')}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saveMutation.isPending}>
                      {saveMutation.isPending ? 'Saving...' : isEdit ? 'Update Booking' : 'Create Booking'}
                    </Button>
                  </Box>
                </Grid>
              )}
              {isView && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button variant="outlined" onClick={() => navigate('/booking/list')}>Back</Button>
                    <Button variant="contained" onClick={() => navigate(`/booking/edit/${id}`)}>Edit</Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </form>
        </Paper>
      </Box>

      {/* Status History Dialog */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon /> Status History
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {statusHistory.length > 0 ? statusHistory.map((h) => (
              <Box key={h.id}>
                <Typography variant="body2" fontWeight={600}>{h.from_status || 'INIT'} → {h.to_status}</Typography>
                <Typography variant="caption" color="text.secondary">
                  by {h.changed_by?.username} on {new Date(h.changed_on).toLocaleString('en-IN')}
                </Typography>
                {h.remarks && <Typography variant="caption" display="block" color="text.secondary">Remarks: {h.remarks}</Typography>}
              </Box>
            )) : <Typography variant="body2" color="text.disabled">No history yet.</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingForm;

import React, { useState, useEffect } from 'react';
import {
  Box, Paper, IconButton, Tooltip, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import {
  Visibility as ViewIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Landscape as PlotIcon,
  FileDownload as ExcelIcon, PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { hasPermission } from '../../utils/permissions';
import { inventoryApi } from '../../api/inventory.api';
import apiClient from '../../api/axios.config';
import ScreenHeader from '../../components/common/ScreenHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory2';
import type { Plot, InventoryStatus, PlotFormData } from '../../types/inventory.types';
import { STATUS_COLORS, STATUS_LABELS } from '../../types/inventory.types';

const emptyForm: PlotFormData = {
  project: '',
  plot_number: '',
  area_sqyd: '',
  area_sqft: '',
  facing: '',
  road_width: '',
  price_per_sqyd: '',
  total_price: '',
  status: 'AVAILABLE',
  remarks: '',
};

const PlotList: React.FC = () => {
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const user = useSelector((state: RootState) => state.auth.user);
  const canExport = hasPermission(user, 'export_plotinventory');
  const { success, error: toastError } = useToast();
  usePageTitle('Plot Inventory');

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | ''>('');
  const [projectFilter, setProjectFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Plot | null>(null);
  const [viewItem, setViewItem] = useState<Plot | null>(null);
  const [form, setForm] = useState<PlotFormData>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Inventory Management', path: '/inventory', icon: <InventoryIcon fontSize="small" /> },
      { label: 'Plots', icon: <PlotIcon fontSize="small" /> },
    ]);
  }, [setBreadcrumbs]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['plots', paginationModel, searchQuery, statusFilter, projectFilter, fromDate, toDate],
    queryFn: () => inventoryApi.getPlots({
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
      search: searchQuery,
      status: statusFilter || undefined,
      project: projectFilter || undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    }),
  });

  const { data: choices } = useQuery({
    queryKey: ['plot-choices'],
    queryFn: () => inventoryApi.getPlotChoices(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: projects } = useQuery({
    queryKey: ['inventory-projects'],
    queryFn: () => inventoryApi.getProjects(),
    staleTime: 5 * 60 * 1000,
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (data: PlotFormData) => {
      const payload: any = {
        ...data,
        area_sqyd: data.area_sqyd ? Number(data.area_sqyd) : undefined,
        area_sqft: data.area_sqft ? Number(data.area_sqft) : undefined,
        price_per_sqyd: data.price_per_sqyd ? Number(data.price_per_sqyd) : undefined,
        total_price: data.total_price ? Number(data.total_price) : undefined,
      };
      return editing ? inventoryApi.updatePlot(editing.id, payload) : inventoryApi.createPlot(payload);
    },
    onSuccess: () => {
      success(editing ? 'Plot updated' : 'Plot created');
      handleCloseDialog();
      refetch();
    },
    onError: (err: any) => toastError(err.response?.data?.detail || err.response?.data?.plot_number?.[0] || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.deletePlot(id),
    onSuccess: () => {
      success('Plot deleted');
      setDeleteId(null);
      refetch();
    },
    onError: () => toastError('Failed to delete plot'),
  });

  // Dialog handlers
  const handleOpenCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const handleOpenEdit = (item: Plot) => {
    setEditing(item);
    setForm({
      project: item.project || '',
      plot_number: item.plot_number || '',
      area_sqyd: item.area_sqyd ?? '',
      area_sqft: item.area_sqft ?? '',
      facing: item.facing || '',
      road_width: item.road_width || '',
      price_per_sqyd: item.price_per_sqyd ?? '',
      total_price: item.total_price ?? '',
      status: item.status || 'AVAILABLE',
      remarks: item.remarks || '',
    });
    setDialogOpen(true);
  };
  const handleCloseDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyForm); };

  const handleSubmit = () => {
    if (!form.project || !form.plot_number) {
      toastError('Project and Plot Number are required');
      return;
    }
    saveMutation.mutate(form);
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const params: any = { export_type: format, search: searchQuery || undefined, status: statusFilter || undefined, project: projectFilter || undefined, from_date: fromDate || undefined, to_date: toDate || undefined };
      const response = await apiClient.get('/api/inventory/plots/export/', { params, responseType: 'blob' });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Plot_Report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch { toastError(`Failed to export as ${format.toUpperCase()}`); }
  };

  const columns: GridColDef<Plot>[] = [
    { field: 'plot_number', headerName: 'Plot #', width: 120 },
    { field: 'project_name', headerName: 'Project', flex: 1, minWidth: 160, valueGetter: (_v, row) => row.project_name || row.project },
    { field: 'area_sqft', headerName: 'Area (sq.ft)', width: 110, valueFormatter: (v: any) => v ? `${v}` : '-' },
    { field: 'total_price', headerName: 'Total Price', width: 140, valueFormatter: (v: any) => v != null ? `₹${Number(v).toLocaleString()}` : '-' },
    { field: 'facing', headerName: 'Facing', width: 100 },
    { field: 'status', headerName: 'Status', width: 130, headerAlign: 'center', align: 'center', renderCell: (p) => <Chip label={STATUS_LABELS[p.value as InventoryStatus] || p.value} color={STATUS_COLORS[p.value as InventoryStatus] || 'default'} size="small" /> },
    {
      field: 'actions', headerName: 'Actions', width: 140, sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View"><IconButton size="small" onClick={() => setViewItem(params.row)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenEdit(params.row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(params.row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <ScreenHeader title="Plot Inventory" showAddButton addButtonText="Add Plot" onAdd={handleOpenCreate} />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField placeholder="Search by plot number..." size="small" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={{ width: 280 }} />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel shrink>Status</InputLabel>
            <Select value={statusFilter} label="Status" displayEmpty notched onChange={(e) => { setStatusFilter(e.target.value as any); setPaginationModel((p) => ({ ...p, page: 0 })); }}>
              <MenuItem value="">All</MenuItem>
              {(choices?.statuses || []).map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel shrink>Project</InputLabel>
            <Select value={projectFilter} label="Project" displayEmpty notched onChange={(e) => { setProjectFilter(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}>
              <MenuItem value="">All</MenuItem>
              {(projects || []).map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" type="date" label="From Date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }} InputLabelProps={{ shrink: true }} sx={{ width: 155 }} />
          <TextField size="small" type="date" label="To Date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }} InputLabelProps={{ shrink: true }} sx={{ width: 155 }} />
          {(statusFilter || projectFilter || fromDate || toDate) && (
            <Button size="small" variant="text" onClick={() => { setStatusFilter(''); setProjectFilter(''); setFromDate(''); setToDate(''); setPaginationModel((p) => ({ ...p, page: 0 })); }}>Clear</Button>
          )}
          {canExport && (
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" startIcon={<ExcelIcon />} onClick={() => handleExport('excel')}>Excel</Button>
              <Button size="small" variant="outlined" startIcon={<PdfIcon />} onClick={() => handleExport('pdf')}>PDF</Button>
            </Box>
          )}
        </Box>
      </Paper>

      <Paper sx={{ height: 620 }}>
        <DataGrid rows={data?.results || []} columns={columns} loading={isLoading} rowCount={data?.count || 0} paginationMode="server" paginationModel={paginationModel} onPaginationModelChange={setPaginationModel} pageSizeOptions={[10, 20, 50]} disableRowSelectionOnClick />
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Plot' : 'Add Plot'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required size="small">
                <InputLabel>Project</InputLabel>
                <Select label="Project" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
                  {(projects || []).map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth required size="small" label="Plot Number" value={form.plot_number} onChange={(e) => setForm({ ...form, plot_number: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth size="small" label="Area (sq.yd)" type="number" value={form.area_sqyd} onChange={(e) => setForm({ ...form, area_sqyd: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth size="small" label="Area (sq.ft)" type="number" value={form.area_sqft} onChange={(e) => setForm({ ...form, area_sqft: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Facing</InputLabel>
                <Select label="Facing" value={form.facing} onChange={(e) => setForm({ ...form, facing: e.target.value })}>
                  <MenuItem value="">None</MenuItem>
                  {(choices?.facings || []).map((f) => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth size="small" label="Road Width" value={form.road_width} onChange={(e) => setForm({ ...form, road_width: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth size="small" label="Price per sq.yd" type="number" value={form.price_per_sqyd} onChange={(e) => setForm({ ...form, price_per_sqyd: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth size="small" label="Total Price" type="number" value={form.total_price} onChange={(e) => setForm({ ...form, total_price: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                  {(choices?.statuses || []).map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth size="small" label="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saveMutation.isPending}>
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onClose={() => setViewItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Plot Details</DialogTitle>
        <DialogContent>
          {viewItem && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 6 }}><Typography variant="caption" color="text.secondary">Project</Typography><Typography>{viewItem.project_name || '-'}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography variant="caption" color="text.secondary">Plot Number</Typography><Typography>{viewItem.plot_number}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography variant="caption" color="text.secondary">Area (sq.yd)</Typography><Typography>{viewItem.area_sqyd || '-'}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography variant="caption" color="text.secondary">Area (sq.ft)</Typography><Typography>{viewItem.area_sqft || '-'}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography variant="caption" color="text.secondary">Facing</Typography><Typography>{viewItem.facing || '-'}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography variant="caption" color="text.secondary">Road Width</Typography><Typography>{viewItem.road_width || '-'}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography variant="caption" color="text.secondary">Price/sq.yd</Typography><Typography>{viewItem.price_per_sqyd ? `₹${Number(viewItem.price_per_sqyd).toLocaleString()}` : '-'}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography variant="caption" color="text.secondary">Total Price</Typography><Typography>{viewItem.total_price ? `₹${Number(viewItem.total_price).toLocaleString()}` : '-'}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography variant="caption" color="text.secondary">Status</Typography><Typography><Chip label={STATUS_LABELS[viewItem.status as InventoryStatus] || viewItem.status} color={STATUS_COLORS[viewItem.status as InventoryStatus] || 'default'} size="small" /></Typography></Grid>
              <Grid size={{ xs: 12 }}><Typography variant="caption" color="text.secondary">Remarks</Typography><Typography>{viewItem.remarks || '-'}</Typography></Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewItem(null)}>Close</Button>
          <Button variant="contained" onClick={() => { if (viewItem) { handleOpenEdit(viewItem); setViewItem(null); } }}>Edit</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Plot"
        message="Are you sure you want to delete this plot?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
};

export default PlotList;

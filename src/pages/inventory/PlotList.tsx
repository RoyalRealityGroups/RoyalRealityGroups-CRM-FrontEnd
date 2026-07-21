import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, IconButton, Tooltip, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Chip, Button,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import {
  Visibility as ViewIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Landscape as PlotIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../../api/inventory.api';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory2';
import type { Plot, InventoryStatus } from '../../types/inventory.types';
import { STATUS_COLORS, STATUS_LABELS } from '../../types/inventory.types';
import {
  getPageContainerStyles, getHeaderSectionStyles,
} from '../../utils/spacing';

const PlotList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success, error } = useToast();
  usePageTitle('Plot Inventory');

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | ''>('');
  const [projectFilter, setProjectFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Inventory Management', path: '/inventory/plots', icon: <InventoryIcon fontSize="small" /> },
      { label: 'Plots', path: '/inventory/plots', icon: <PlotIcon fontSize="small" /> },
    ]);
  }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
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
    refetchOnMount: 'always',
  });

  const { data: projects } = useQuery({
    queryKey: ['inventory-projects'],
    queryFn: () => inventoryApi.getProjects(),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.deletePlot(id),
    onSuccess: () => {
      success('Plot deleted');
      queryClient.invalidateQueries({ queryKey: ['plots'] });
    },
    onError: () => error('Failed to delete plot'),
  });

  const columns: GridColDef<Plot>[] = [
    { field: 'plot_number', headerName: 'Plot #', width: 120 },
    {
      field: 'project_name',
      headerName: 'Project',
      width: 180,
      valueGetter: (_v, row) => row.project_name || row.project,
    },
    {
      field: 'area_sqft',
      headerName: 'Area (sq.ft)',
      width: 110,
      valueFormatter: (v: any) => v ? `${v}` : '-',
    },
    {
      field: 'total_price',
      headerName: 'Total Price',
      width: 140,
      valueFormatter: (v: any) => v != null ? `₹${Number(v).toLocaleString()}` : '-',
    },
    { field: 'facing', headerName: 'Facing', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={STATUS_LABELS[params.value as InventoryStatus] || params.value}
          color={STATUS_COLORS[params.value as InventoryStatus] || 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => navigate(`/inventory/plots/view/${params.row.id}`)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => navigate(`/inventory/plots/edit/${params.row.id}`)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(params.row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <ScreenHeader
          title="Plot Inventory"
          showAddButton
          addButtonText="Add Plot"
          onAdd={() => navigate('/inventory/plots/add')}
        />
        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search by plot number..."
            size="small"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
            sx={{ width: 280 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel shrink>Status</InputLabel>
            <Select value={statusFilter} label="Status" displayEmpty notched onChange={(e) => { setStatusFilter(e.target.value as any); setPaginationModel((p) => ({ ...p, page: 0 })); }}>
              <MenuItem value="">All</MenuItem>
              {(choices?.statuses || []).map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel shrink>Project</InputLabel>
            <Select value={projectFilter} label="Project" displayEmpty notched onChange={(e) => { setProjectFilter(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}>
              <MenuItem value="">All</MenuItem>
              {(projects || []).map((p: any) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
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
        </Box>
      </Box>
      <Paper sx={{ height: 620 }}>
        <DataGrid
          rows={data?.results || []}
          columns={columns}
          loading={isLoading}
          rowCount={data?.count || 0}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
};

export default PlotList;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteVisitApi } from '../../api/siteVisit.api';
import { leadApi } from '../../api/lead.api';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import type { SiteVisit, SiteVisitStatus } from '../../types/siteVisit.types';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../utils/spacing';

const statusColors: Record<SiteVisitStatus, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  SCHEDULED: 'info',
  CONFIRMED: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

const SiteVisits: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  usePageTitle('Site Visits');

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SiteVisitStatus | ''>('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Site Visit Management', path: '/sitevisit', icon: <LocationOnIcon fontSize="small" /> },
    ]);
  }, [setBreadcrumbs]);

  const { data: visitsData, isLoading } = useQuery({
    queryKey: ['site-visits', paginationModel, searchQuery, statusFilter, employeeFilter],
    queryFn: () =>
      siteVisitApi.getSiteVisits({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery,
        status: statusFilter || undefined,
        assigned_employee: employeeFilter || undefined,
      }),
  });

  const { data: choices } = useQuery({
    queryKey: ['site-visit-choices'],
    queryFn: () => siteVisitApi.getChoices(),
  });

  const { data: usersData } = useQuery({
    queryKey: ['site-visit-users'],
    queryFn: () => leadApi.getUsers(),
  });
  const users: { id: string; name: string }[] = usersData || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => siteVisitApi.deleteSiteVisit(id),
    onSuccess: () => {
      toastSuccess('Site visit deleted');
      queryClient.invalidateQueries({ queryKey: ['site-visits'] });
    },
    onError: () => toastError('Failed to delete site visit'),
  });

  const getEmployeeName = (v: SiteVisit['assigned_employee']) => {
    if (!v) return '-';
    if (typeof v === 'string') {
      return users.find((u) => u.id === v)?.name || v;
    }
    return v.name;
  };

  const columns: GridColDef<SiteVisit>[] = [
    { field: 'customer_name', headerName: 'Customer', width: 160 },
    { field: 'project_name', headerName: 'Project', width: 160 },
    {
      field: 'visit_date',
      headerName: 'Visit Date',
      width: 130,
      valueFormatter: (value: any) => (value ? new Date(value).toLocaleDateString() : '-'),
    },
    {
      field: 'assigned_employee',
      headerName: 'Assigned To',
      width: 160,
      valueGetter: (_value: any, row: SiteVisit) => getEmployeeName(row.assigned_employee),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={choices?.statuses?.find((s) => s.value === params.value)?.label || params.value}
          color={statusColors[params.value as SiteVisitStatus] || 'default'}
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
            <IconButton size="small" onClick={() => navigate(`/sitevisit/view/${params.row.id}`)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => navigate(`/sitevisit/edit/${params.row.id}`)}>
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
          title="Site Visits"
          showAddButton
          addButtonText="Schedule Visit"
          onAdd={() => navigate('/sitevisit/add')}
        />

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <TextField
            placeholder="Search by customer or project..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value as any)}>
              <MenuItem value="">All</MenuItem>
              {choices?.statuses?.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Assigned Employee</InputLabel>
            <Select value={employeeFilter} label="Assigned Employee" onChange={(e) => setEmployeeFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Paper sx={getContentSectionStyles()}>
        <DataGrid
          rows={visitsData?.results || []}
          columns={columns}
          loading={isLoading}
          rowCount={visitsData?.count || 0}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={getDataGridStyles()}
        />
      </Paper>
    </Box>
  );
};

export default SiteVisits;
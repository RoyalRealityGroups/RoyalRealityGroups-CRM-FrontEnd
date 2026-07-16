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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  EventNote as FollowUpIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadApi } from '../../api/lead.api';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import type { Lead, LeadChoices } from '../../types/lead.types';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../utils/spacing';

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

const LeadList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Lead List');

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Lead Management', path: '/lead', icon: <PersonIcon fontSize="small" /> },
      { label: 'Lead List', path: '/lead/list', icon: <PersonIcon fontSize="small" /> },
    ]);
  }, [setBreadcrumbs]);

  // Fetch leads
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', paginationModel, searchQuery, statusFilter, sourceFilter],
    queryFn: () =>
      leadApi.getLeads({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery,
        status: statusFilter || undefined,
        lead_source: sourceFilter || undefined,
      }),
  });

  // Fetch choices
  const { data: choices } = useQuery({
    queryKey: ['lead-choices'],
    queryFn: () => leadApi.getChoices(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadApi.deleteLead(id),
    onSuccess: () => {
      toastSuccess('Lead deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: () => {
      toastError('Failed to delete lead');
    },
  });

  const columns: GridColDef<Lead>[] = [
    { field: 'code', headerName: 'Lead ID', width: 120 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'mobile', headerName: 'Mobile', width: 130 },
    { field: 'email', headerName: 'Email', width: 180 },
    { field: 'budget', headerName: 'Budget', width: 100 },
    { field: 'preferred_area', headerName: 'Preferred Area', width: 130 },
    { field: 'property_requirement', headerName: 'Property Req.', width: 130 },
    {
      field: 'lead_source',
      headerName: 'Source',
      width: 120,
      valueGetter: (value) => choices?.lead_sources.find(s => s.value === value)?.label || value,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={choices?.lead_statuses.find(s => s.value === params.value)?.label || params.value}
          color={statusColors[params.value] || 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'assigned_employee',
      headerName: 'Assigned To',
      width: 130,
      valueGetter: (value: any) => value?.name || '-',
    },
    { field: 'created_on', headerName: 'Created On', width: 140, valueFormatter: (value) => new Date(value).toLocaleDateString() },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => navigate(`/lead/view/${params.row.id}`)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Follow-up">
            <IconButton size="small" color="success" onClick={() => navigate('/lead/follow-ups', { state: { leadId: params.row.id } })}>
              <FollowUpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => navigate(`/lead/edit/${params.row.id}`)}>
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
          title="Lead List"
          
          showAddButton
          addButtonText="Add Lead"
          onAdd={() => navigate('/lead/add')}
        />

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <TextField
            placeholder="Search leads..."
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {choices?.lead_statuses.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Source</InputLabel>
            <Select
              value={sourceFilter}
              label="Source"
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {choices?.lead_sources.map((source) => (
                <MenuItem key={source.value} value={source.value}>
                  {source.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Paper sx={getContentSectionStyles()}>
        <DataGrid
          rows={leadsData?.results || []}
          columns={columns}
          loading={isLoading}
          rowCount={leadsData?.count || 0}
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

export default LeadList;

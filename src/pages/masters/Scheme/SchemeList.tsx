import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  Popover,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Typography,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  CardGiftcard as SchemeIcon,
  Tune as TuneIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { authorizationApi } from '../../../api/authorization.api';
import type {
  Scheme,
  SchemeFormData,
  SchemeListParams,
  SchemeListResponse,
  SchemeStatus,
  SchemeType,
} from '../../../types/masters.types';
import apiClient from '../../../api/axios.config';
import { API_ENDPOINTS } from '../../../utils/constants';
import { hasPermission } from '../../../utils/permissions';
import ScreenHeader from '../../../components/common/ScreenHeader';
import ApprovalButton from '../../../components/authorization/ApprovalButton';
import BulkRejectDialog from '../../../components/authorization/BulkRejectDialog';
import { format } from 'date-fns';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../../utils/spacing';

const SchemeList: React.FC = () => {
  const navigate = useNavigate();

  // Derive display status: if effective_to is in the past, treat as EXPIRED
  const getEffectiveStatus = (row: any): string => {
    if (row.effective_to && new Date(row.effective_to) < new Date(new Date().toDateString())) {
      return 'EXPIRED';
    }
    return row.status;
  };
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Schemes');

  // State Management
  const [activeTab, setActiveTab] = useState(0);
  const [hasAuthRights, setHasAuthRights] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  // Restore state from navigation (when coming back from history page)
  useEffect(() => {
    if (location.state) {
      const { activeTab: returnTab, page: returnPage, pageSize: returnPageSize } = location.state as any;
      if (returnTab !== undefined) setActiveTab(returnTab);
      if (returnPage !== undefined || returnPageSize !== undefined) {
        setPaginationModel({
          page: returnPage !== undefined ? returnPage : 0,
          pageSize: returnPageSize !== undefined ? returnPageSize : 10,
        });
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [schemeTypeFilter, setSchemeTypeFilter] = useState<SchemeType | ''>('');
  const [appliedSchemeTypeFilter, setAppliedSchemeTypeFilter] = useState<SchemeType | ''>('');
  const [statusFilter, setStatusFilter] = useState<SchemeStatus | ''>('');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<SchemeStatus | ''>('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const filterOpen = Boolean(filterAnchorEl);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      // { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Schemes', icon: <SchemeIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      if (searchInput !== searchQuery) {
        setPaginationModel(prev => ({ ...prev, page: 0 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  }, []);

  // Check authorization rights and get pending count
  const { data: authCountsData } = useQuery({
    queryKey: ['authCounts', 'masters', 'scheme'],
    queryFn: () => authorizationApi.getStatusCounts('masters', 'scheme'),
    refetchInterval: activeTab === 1 ? 30000 : false,
  });

  useEffect(() => {
    if (authCountsData) {
      const count = authCountsData.pending_count ?? authCountsData.Pending ?? 0;
      setHasAuthRights(count > 0);
      setPendingCount(count);
      if (count === 0 && activeTab === 1) {
        setActiveTab(0);
      }
    }
  }, [authCountsData, activeTab]);

  // Fetch pending authorizations
  const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['pendingAuth', 'masters', 'scheme', paginationModel.page, paginationModel.pageSize],
    queryFn: () => authorizationApi.getPendingAuthorizations('masters', 'scheme', {
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
    }),
    enabled: activeTab === 1,
  });

  const handleBack = () => {
    navigate('/');
  };

  // Query for schemes list
  const { data: schemesData, isLoading: schemesLoading, isFetching: schemesFetching, error: schemesError } = useQuery<SchemeListResponse | any[]>({
    queryKey: [
      'schemes',
      paginationModel.page,
      paginationModel.pageSize,
      searchQuery,
      appliedSchemeTypeFilter,
      appliedStatusFilter,
      activeTab,
    ],
    queryFn: async () => {
      const params: SchemeListParams = {
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
      };

      if (schemeTypeFilter) {
        params.scheme_type = schemeTypeFilter as any;
      }

      if (statusFilter) {
        params.status = statusFilter as SchemeStatus;
      }

      const response = await apiClient.get(API_ENDPOINTS.SCHEMES, { params });
      return response.data;
    },
    enabled: user != null,
  });

  const isArrayResponse = Array.isArray(schemesData);
  const schemesRows = isArrayResponse ? schemesData : (schemesData?.results || []);
  const schemesCount = isArrayResponse ? schemesData.length : (schemesData?.count || 0);

  const { data: schemeChoices } = useQuery({
    queryKey: ['scheme-choices'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.SCHEMES_CHOICES);
      return response.data;
    },
    enabled: user != null,
  });

  const schemeTypeOptions = schemeChoices?.scheme_types || [];

  // Mutation for creating/updating scheme
  const createMutation = useMutation({
    mutationFn: async (data: SchemeFormData) => {
      const response = await apiClient.post(API_ENDPOINTS.SCHEMES, data);
      return response.data;
    },
    onSuccess: () => {
      toastSuccess('Scheme created successfully');
      queryClient.invalidateQueries({ queryKey: ['schemes'] });
    },
    onError: (error: any) => {
      toastError(error?.response?.data?.detail || error?.response?.data?.message || 'Unable to create scheme');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SchemeFormData) => {
      const response = await apiClient.put(
        `${API_ENDPOINTS.SCHEMES}${selectedScheme?.id}/`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      toastSuccess('Scheme updated successfully');
      queryClient.invalidateQueries({ queryKey: ['schemes'] });
    },
    onError: (error: any) => {
      toastError(error?.response?.data?.detail || error?.response?.data?.message || 'Unable to update scheme');
    },
  });

  const handleFormSubmit = async (data: SchemeFormData) => {
    if (selectedScheme?.id) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  // Mutation for deleting scheme
  const deleteMutation = useMutation({
    mutationFn: async (schemeId: string) => {
      const response = await apiClient.delete(`${API_ENDPOINTS.SCHEMES}${schemeId}/`);
      return response.data;
    },
    onSuccess: () => {
      toastSuccess('Scheme deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedScheme(null);
      queryClient.invalidateQueries({ queryKey: ['schemes'] });
    },
    onError: (error: any) => {
      toastError(error?.response?.data?.detail || error?.response?.data?.message || 'Unable to delete scheme');
    },
  });

  // Bulk authorization handlers
  const bulkApproveMutation = useMutation({
    mutationFn: (instanceIds: string[]) => {
      const instances = instanceIds.map(id => ({
        instance_id: id,
        authorized_status: 2 as 1 | 2 | 3,
        description: 'Bulk approved',
      }));
      return authorizationApi.bulkApprove('masters', 'scheme', { instances });
    },
    onSuccess: () => {
      toastSuccess(`${selectedRows.length} scheme(s) approved successfully`);
      setSelectedRows([]);
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
      queryClient.invalidateQueries({ queryKey: ['schemes'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to approve schemes');
    },
  });

  const bulkRejectMutation = useMutation({
    mutationFn: ({ instanceIds, reason }: { instanceIds: string[]; reason: string }) => {
      const instances = instanceIds.map(id => ({
        instance_id: id,
        authorized_status: 3 as 1 | 2 | 3,
        description: reason,
      }));
      return authorizationApi.bulkApprove('masters', 'scheme', { instances });
    },
    onSuccess: () => {
      toastSuccess(`${selectedRows.length} scheme(s) rejected successfully`);
      setSelectedRows([]);
      setBulkRejectDialogOpen(false);
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
      queryClient.invalidateQueries({ queryKey: ['schemes'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to reject schemes');
    },
  });

  const handleBulkApprove = () => {
    if (selectedRows.length > 0) {
      bulkApproveMutation.mutate(selectedRows);
    }
  };

  const handleBulkReject = () => {
    if (selectedRows.length > 0) {
      setBulkRejectDialogOpen(true);
    }
  };

  const confirmBulkReject = (reason: string) => {
    bulkRejectMutation.mutate({ instanceIds: selectedRows, reason });
  };

  const handleClearSelection = () => {
    setSelectedRows([]);
  };

  const handleDeleteConfirm = () => {
    if (selectedScheme?.id) {
      deleteMutation.mutate(selectedScheme.id);
    }
  };

  // Mutation for activating scheme
  const activateMutation = useMutation({
    mutationFn: async (schemeId: string) => {
      const response = await apiClient.post(`${API_ENDPOINTS.SCHEMES}${schemeId}/activate/`);
      return response.data;
    },
    onSuccess: () => {
      toastSuccess('Scheme activated successfully');
      queryClient.invalidateQueries({ queryKey: ['schemes'] });
    },
    onError: (error: any) => {
      toastError(
        error?.response?.data?.detail || error?.response?.data?.message || 'Unable to activate scheme'
      );
    },
  });

  // Mutation for deactivating scheme
  const deactivateMutation = useMutation({
    mutationFn: async (schemeId: string) => {
      const response = await apiClient.post(`${API_ENDPOINTS.SCHEMES}${schemeId}/deactivate/`);
      return response.data;
    },
    onSuccess: () => {
      toastSuccess('Scheme deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['schemes'] });
    },
    onError: (error: any) => {
      toastError(
        error?.response?.data?.detail || error?.response?.data?.message || 'Unable to deactivate scheme'
      );
    },
  });

  // Handle filter button click
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  // Handle filter close
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  // Clear filters

  const handleApplyFilters = () => {
    setAppliedSchemeTypeFilter(schemeTypeFilter);
    setAppliedStatusFilter(statusFilter);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
  };

    const clearFilters = () => {
    setSchemeTypeFilter('');
    setAppliedSchemeTypeFilter('');
    setStatusFilter('');
    setAppliedStatusFilter('');
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  // Get active filter count
  const activeFiltersCount = [appliedSchemeTypeFilter, appliedStatusFilter].filter(Boolean).length;

  const handleCreate = () => {
    navigate('/scheme/new');
  };

  const handleViewClick = (scheme: Scheme) => {
    navigate(`/scheme/${scheme.id}/view`);
  };

  const handleEditClick = (scheme: Scheme) => {
    navigate(`/scheme/${scheme.id}/edit`);
  };

  const handleDeleteClick = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setDeleteDialogOpen(true);
  };

  const handleViewHistory = () => {
    const params = new URLSearchParams({
      returnTab: activeTab.toString(),
      returnPage: paginationModel.page.toString(),
      returnPageSize: paginationModel.pageSize.toString(),
    });
    navigate(`/scheme/history?${params.toString()}`);
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'sno',
      headerName: 'S.No',
      width: 70,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: any) => {
        const api = params?.api;
        const index = api?.getRowIndexRelativeToVisibleRows?.(params.id);
        const resolvedIndex = typeof index === 'number' && index >= 0
          ? index
          : api?.getRowIndex?.(params.id) ?? 0;
        return (
          <Typography variant="body2" fontWeight={500}>
            {paginationModel.page * paginationModel.pageSize + resolvedIndex + 1}
          </Typography>
        );
      },
    },
    {
      field: 'code',
      headerName: 'Code',
      width: 110,
      sortable: false,
      renderCell: (params) => (
        <Typography
          variant="body2"
          fontWeight={500}
          sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          onClick={() => handleViewClick(params.row)}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 180,
      sortable: false,
      renderCell: (params) => (
        <Typography variant="body2" noWrap title={params.value}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'scheme_type',
      headerName: 'Type',
      width: 140,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip 
          label={params.row.scheme_type_display || params.row.scheme_type} 
          size="small" 
          variant="outlined"
          sx={{ 
            borderRadius: 1.5,
            fontWeight: 500,
            fontSize: '0.75rem',
          }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const effectiveStatus = getEffectiveStatus(params.row);
        const statusColorMap: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
          ACTIVE: 'success',
          INACTIVE: 'default',
          DRAFT: 'warning',
          PENDING_APPROVAL: 'warning',
          EXPIRED: 'error',
        };
        const statusLabelMap: Record<string, string> = {
          ACTIVE: 'Active',
          INACTIVE: 'Inactive',
          DRAFT: 'Draft',
          PENDING_APPROVAL: 'Pending Approval',
          EXPIRED: 'Expired',
        };
        return (
          <Chip 
            label={statusLabelMap[effectiveStatus] || params.row.status_display || effectiveStatus} 
            size="small" 
            color={statusColorMap[effectiveStatus] || 'default'}
            sx={{ 
              borderRadius: 1.5,
              fontWeight: 600,
              fontSize: '0.75rem',
              minWidth: 75,
            }}
          />
        );
      },
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 85,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'authorization',
      headerName: 'Authorization',
      width: 130,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const effectiveAuthStatus =
          params.row.status === 'DRAFT' ? 0 : (params.row.authorized_status ?? 1);
        return (
          <ApprovalButton
            appLabel="masters"
            modelName="scheme"
            instanceId={params.row.id}
            currentStatus={effectiveAuthStatus as 0 | 1 | 2 | 3}
            currentLevel={params.row.authorized_level}
            onApprove={() => queryClient.invalidateQueries({ queryKey: ['schemes'] })}
            onReject={() => queryClient.invalidateQueries({ queryKey: ['schemes'] })}
          />
        );
      },
    },
    {
      field: 'effective_from',
      headerName: 'Valid From',
      width: 115,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="body2">
          {format(new Date(params.row.effective_from), 'dd/MM/yyyy')}
        </Typography>
      ),
    },
    {
      field: 'effective_to',
      headerName: 'Valid To',
      width: 115,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: params.row.effective_to ? 'text.primary' : 'success.main', fontWeight: params.row.effective_to ? 400 : 600 }}>
          {params.row.effective_to ? format(new Date(params.row.effective_to), 'dd/MM/yyyy') : 'Ongoing'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 170,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          {(() => { const effectiveStatus = getEffectiveStatus(params.row); return (
          <>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={() => handleViewClick(params.row)}
              sx={{ 
                color: 'info.main',
                '&:hover': { bgcolor: 'info.lighter' }
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {hasPermission(user, 'change_scheme') && effectiveStatus !== 'EXPIRED' && (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => handleEditClick(params.row)}
                sx={{ 
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'primary.lighter' }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission(user, 'delete_scheme') && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => handleDeleteClick(params.row)}
                sx={{ 
                  color: 'error.main',
                  '&:hover': { bgcolor: 'error.lighter' }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {effectiveStatus === 'DRAFT' && hasPermission(user, 'change_scheme') && (
            <Tooltip title="Activate">
              <IconButton
                size="small"
                onClick={() => activateMutation.mutate(params.row.id)}
                disabled={activateMutation.isPending}
                sx={{ 
                  color: 'success.main',
                  '&:hover': { bgcolor: 'success.lighter' }
                }}
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {effectiveStatus === 'ACTIVE' && hasPermission(user, 'change_scheme') && (
            <Tooltip title="Deactivate">
              <IconButton
                size="small"
                onClick={() => deactivateMutation.mutate(params.row.id)}
                disabled={deactivateMutation.isPending}
                sx={{ 
                  color: 'warning.main',
                  '&:hover': { bgcolor: 'warning.lighter' }
                }}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission(user, 'view_scheme') && (
            <Tooltip title="View History">
              <IconButton
                size="small"
                onClick={() => navigate(`/scheme/${params.row.id}/history?scheme_id=${params.row.id}`)}
                sx={{ 
                  color: 'info.main',
                  '&:hover': { bgcolor: 'info.lighter' }
                }}
              >
                <HistoryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          </>
          ); })()}
        </Box>
      ),
    },
  ];

  // Pending authorization columns with checkbox
  const pendingColumns: GridColDef[] = [
    {
      field: 'checkbox',
      headerName: '',
      width: 50,
      sortable: false,
      renderHeader: () => (
        <input
          type="checkbox"
          checked={selectedRows.length === (pendingData?.results?.length || 0) && selectedRows.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRows(pendingData?.results?.map((r: any) => r.id) || []);
            } else {
              setSelectedRows([]);
            }
          }}
        />
      ),
      renderCell: (params) => (
        <input
          type="checkbox"
          checked={selectedRows.includes(params.row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRows([...selectedRows, params.row.id]);
            } else {
              setSelectedRows(selectedRows.filter(id => id !== params.row.id));
            }
          }}
        />
      ),
    },
    ...columns.filter(col => col.field !== 'authorization'),
    {
      field: 'pending_approver_names',
      headerName: 'Pending Approver',
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    ...columns.filter(col => col.field === 'authorization'),
  ];

  return (
    <Box sx={getPageContainerStyles()}>
      {/* Fixed Header */}
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}>
          {/* Left side - Title with back button */}
          <ScreenHeader
            title="Scheme Master"
            showBackButton={false}
            onBack={handleBack}
            disableBox
          />
          
          {/* Right side - Search box, Filter and Action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              placeholder="Search schemes..."
              size="small"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              sx={{
                width: 280,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#006766',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#006766',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#006766' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Filter Button */}
            <Tooltip title="Filter">
              <IconButton
                onClick={handleFilterClick}
                sx={{
                  backgroundColor: activeFiltersCount > 0 ? 'primary.main' : '#fff',
                  color: activeFiltersCount > 0 ? '#fff' : '#006766',
                  border: '1px solid',
                  borderColor: activeFiltersCount > 0 ? 'primary.main' : 'rgba(0, 0, 0, 0.23)',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: activeFiltersCount > 0 ? 'primary.dark' : 'rgba(0, 103, 102, 0.04)',
                  },
                }}
              >
                <Badge badgeContent={activeFiltersCount} color="error">
                  <FilterListIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* Filter Popover */}
            <Popover
              open={filterOpen}
              anchorEl={filterAnchorEl}
              onClose={handleFilterClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              sx={{ mt: 1 }}
            >
              <Box sx={{ p: 2, minWidth: 280 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Filters
                  </Typography>
                  {activeFiltersCount > 0 ? (
                    <Button size="small" onClick={clearFilters}>
                      Clear All
                    </Button>
                  ) : (
                    <IconButton size="small" onClick={handleFilterClose}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />

                {/* Scheme Type Filter */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Scheme Type
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={schemeTypeFilter}
                    onChange={(e) => {
                      setSchemeTypeFilter(e.target.value as SchemeType | '');
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    {schemeTypeOptions.map((option: { id: string; name: string }) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                {/* Status Filter */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Status
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as SchemeStatus | '');
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="DRAFT">Draft</MenuItem>
                    <MenuItem value="PENDING_APPROVAL">Pending Approval</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                    <MenuItem value="EXPIRED">Expired</MenuItem>
                  </TextField>
                </Box>
              </Box>
            </Popover>
            
            {/* View History Button */}
            {hasPermission(user, 'view_schemehistory') && (
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={handleViewHistory}
                sx={{ whiteSpace: 'nowrap' }}
              >
                View History
              </Button>
            )}
            
            {/* Create Scheme Button */}
            {hasPermission(user, 'add_scheme') && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Create Scheme
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Scrollable Content Area */}
      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 400,
          borderRadius: 0,
        }}>
          {/* Tabs */}
          {hasAuthRights && pendingCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => {
                  setActiveTab(newValue);
                  setSelectedRows([]);
                  setPaginationModel({ page: 0, pageSize: 20 });
                }}
              >
                <Tab label="All Records" />
                <Tab label={`Pending Authorization (${pendingCount})`} />
              </Tabs>

              {activeTab === 1 && selectedRows.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    {selectedRows.length} selected
                  </Typography>
                  <Tooltip title="Approve Selected">
                    <IconButton
                      size="small"
                      onClick={handleBulkApprove}
                      disabled={bulkApproveMutation.isPending || bulkRejectMutation.isPending}
                      sx={{ color: 'success.main' }}
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reject Selected">
                    <IconButton
                      size="small"
                      onClick={handleBulkReject}
                      disabled={bulkApproveMutation.isPending || bulkRejectMutation.isPending}
                      sx={{ color: 'error.main' }}
                    >
                      <CancelIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Clear Selection">
                    <IconButton
                      size="small"
                      onClick={handleClearSelection}
                      disabled={bulkApproveMutation.isPending || bulkRejectMutation.isPending}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          )}

          {/* DataGrid */}
          {schemesError && (
            <Alert severity="error" sx={{ m: 2 }}>
              Failed to load schemes
            </Alert>
          )}
          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            {activeTab === 0 && (
              <DataGrid
                rows={schemesRows}
                columns={columns}
                getRowId={(row) => row.id}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 20, 50, 100]}
                rowCount={schemesCount}
                paginationMode={isArrayResponse ? 'client' : 'server'}
                loading={schemesLoading || schemesFetching}
                disableColumnMenu
                disableRowSelectionOnClick
                sx={getDataGridStyles()}
              />
            )}
            {activeTab === 1 && (
              <DataGrid
                rows={pendingData?.results || []}
                columns={pendingColumns}
                getRowId={(row) => row.id}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 20, 50, 100]}
                rowCount={pendingData?.count || 0}
                paginationMode="server"
                loading={pendingLoading}
                disableColumnMenu
                disableRowSelectionOnClick
                sx={getDataGridStyles()}
              />
            )}
          </Box>
        </Paper>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedScheme(null);
        }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the scheme <strong>{selectedScheme?.name}</strong> (Code: {selectedScheme?.code})?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedScheme(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <BulkRejectDialog
        open={bulkRejectDialogOpen}
        selectedCount={selectedRows.length}
        onClose={() => setBulkRejectDialogOpen(false)}
        onConfirm={confirmBulkReject}
        loading={bulkRejectMutation.isPending}
      />
    </Box>
  );
};

export default SchemeList;

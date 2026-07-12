import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Typography,
  Popover,
  Badge,
  Divider,
  Autocomplete,
  Tabs,
  Tab,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Print as PrintIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { salesOrderApi } from '../../../api/sales.api';
import { channelConfigApi } from '../../../api/masters.api';
import ScreenHeader from '../../../components/common/ScreenHeader';
import SearchableDropdown from '../../../components/common/SearchableDropdown';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import ReceiptIcon from '@mui/icons-material/Receipt';
import type { SalesOrderListItem, SalesOrderStatus, CustomerType } from '../../../types/sales.types';
import type { DropdownOption } from '../../../types/common.types';
    
import ApprovalButton from '../../../components/authorization/ApprovalButton';

import BulkRejectDialog from '../../../components/authorization/BulkRejectDialog';
import { authorizationApi } from '../../../api/authorization.api';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../../utils/spacing';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { toDateString } from '../../../utils/format';
import { hasPermission } from '../../../utils/permissions';
import type { RootState } from '../../../store/store';

const SalesOrderList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);

  // Set page title
 
  usePageTitle('Sales Orders');
useEffect(()=>{
  console.log("userAccessList Data:", user);
},[user])
  // State
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderListItem | null>(null);

  // Filter state (working state in popover)
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [customerTypeFilter, setCustomerTypeFilter] = useState<DropdownOption | null>(null);
  const [customerFilter, setCustomerFilter] = useState<DropdownOption | null>(null);
  const [statusFilter, setStatusFilter] = useState<DropdownOption | null>(null);
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Applied filter state (used by query)
  const [appliedCustomerTypeFilter, setAppliedCustomerTypeFilter] = useState<DropdownOption | null>(null);
  const [appliedCustomerFilter, setAppliedCustomerFilter] = useState<DropdownOption | null>(null);
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<DropdownOption | null>(null);
  const [appliedDateFromFilter, setAppliedDateFromFilter] = useState('');
  const [appliedDateToFilter, setAppliedDateToFilter] = useState('');

  // Authorization tab state
  const [activeTab, setActiveTab] = useState(0);
  const [hasAuthRights, setHasAuthRights] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);

  // Restore state from navigation (when coming back from view page)
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
      // Clear the state after restoring to prevent issues on subsequent navigations
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Channel config
  const { data: channelConfig } = useQuery({
    queryKey: ['channelConfig'],
    queryFn: channelConfigApi.getChannelConfig,
  });

  // Filter popover handlers
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleApplyFilters = () => {
    setAppliedCustomerTypeFilter(customerTypeFilter);
    setAppliedCustomerFilter(customerFilter);
    setAppliedStatusFilter(statusFilter);
    setAppliedDateFromFilter(dateFromFilter);
    setAppliedDateToFilter(dateToFilter);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
  };

  const handleClearFilters = () => {
    setCustomerTypeFilter(null);
    setCustomerFilter(null);
    setStatusFilter(null);
    setDateFromFilter('');
    setDateToFilter('');
    setAppliedCustomerTypeFilter(null);
    setAppliedCustomerFilter(null);
    setAppliedStatusFilter(null);
    setAppliedDateFromFilter('');
    setAppliedDateToFilter('');
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
  };

  const filterOpen = Boolean(filterAnchorEl);
  const activeFilterCount =
    (appliedCustomerTypeFilter ? 1 : 0) +
    (appliedCustomerFilter ? 1 : 0) +
    (appliedStatusFilter ? 1 : 0) +
    (appliedDateFromFilter ? 1 : 0) +
    (appliedDateToFilter ? 1 : 0);

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Sales', path: '/sales', icon: <FolderIcon fontSize="small" /> },
      { label: 'Sales Order', icon: <ReceiptIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      if (searchInput !== searchQuery) {
        setPaginationModel(prev => ({ ...prev, page: 0 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  }, []);

  // Check authorization rights and get pending count
  const { data: authCountsData } = useQuery({
    queryKey: ['authCounts', 'sales', 'salesorder'],
    queryFn: () => authorizationApi.getStatusCounts('sales', 'salesorder'),
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
  const { data: pendingDataRaw, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: [
      'pendingAuth', 'sales', 'salesorder',
      paginationModel.page, paginationModel.pageSize,
      searchQuery,
      appliedCustomerTypeFilter?.id,
      appliedCustomerFilter?.id,
      appliedDateFromFilter,
      appliedDateToFilter,
    ],
    queryFn: () => authorizationApi.getPendingAuthorizations('sales', 'salesorder', {
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
      search: searchQuery || undefined,
      customer_type: appliedCustomerTypeFilter?.id || undefined,
      retailer: appliedCustomerTypeFilter?.id === 'RETAILER' ? appliedCustomerFilter?.id : undefined,
      distributor: appliedCustomerTypeFilter?.id === 'DISTRIBUTOR' ? appliedCustomerFilter?.id : undefined,
      superstockist: appliedCustomerTypeFilter?.id === 'SUPERSTOCKIST' ? appliedCustomerFilter?.id : undefined,
      order_date_from: appliedDateFromFilter || undefined,
      order_date_to: appliedDateToFilter || undefined,
    }),
    enabled: activeTab === 1,
  });

  // Client-side filtering for pending authorizations (fallback if backend doesn't support filters)
  const pendingData = (() => {
    if (!pendingDataRaw?.results) return pendingDataRaw;
    let filtered = [...pendingDataRaw.results];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((r: any) =>
        (r.order_number || '').toLowerCase().includes(q) ||
        (r.customer_name || '').toLowerCase().includes(q)
      );
    }
    if (appliedCustomerTypeFilter?.id) {
      filtered = filtered.filter((r: any) => r.customer_type === appliedCustomerTypeFilter.id);
    }
    if (appliedCustomerFilter?.id) {
      const custId = String(appliedCustomerFilter.id);
      filtered = filtered.filter((r: any) =>
        String(r.retailer) === custId ||
        String(r.distributor) === custId ||
        String(r.superstockist) === custId
      );
    }
    if (appliedDateFromFilter) {
      filtered = filtered.filter((r: any) => r.order_date >= appliedDateFromFilter);
    }
    if (appliedDateToFilter) {
      filtered = filtered.filter((r: any) => r.order_date <= appliedDateToFilter);
    }

    return { ...pendingDataRaw, results: filtered, count: filtered.length };
  })();

  // Fetch orders
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'salesOrders',
      paginationModel.page,
      paginationModel.pageSize,
      searchQuery,
      appliedCustomerTypeFilter?.id,
      appliedCustomerFilter?.id,
      appliedStatusFilter?.id,
      appliedDateFromFilter,
      appliedDateToFilter,
    ],
    queryFn: () =>
      salesOrderApi.getOrders({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
        customer_type: appliedCustomerTypeFilter?.id as CustomerType | undefined,
        retailer: appliedCustomerTypeFilter?.id === 'RETAILER' ? appliedCustomerFilter?.id as string | undefined : undefined,
        distributor: appliedCustomerTypeFilter?.id === 'DISTRIBUTOR' ? appliedCustomerFilter?.id as string | undefined : undefined,
        superstockist: appliedCustomerTypeFilter?.id === 'SUPERSTOCKIST' ? appliedCustomerFilter?.id as string | undefined : undefined,
        status: appliedStatusFilter?.id as SalesOrderStatus | undefined,
        order_date_from: appliedDateFromFilter || undefined,
        order_date_to: appliedDateToFilter || undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: salesOrderApi.deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['pendingAuth'] });
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
      toastSuccess('Sales order deleted successfully');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to delete order');

    },
  });

  // Handlers
  const handleCreate = () => {
    navigate('/sales/orders/create');
  };

  const handleEdit = (order: SalesOrderListItem) => {
    navigate(`/sales/orders/${order.id}`);
  };

  const handleView = (order: SalesOrderListItem) => {
    // Pass current tab and pagination info as query params
    const params = new URLSearchParams({
      returnTab: activeTab.toString(),
      returnPage: paginationModel.page.toString(),
      returnPageSize: paginationModel.pageSize.toString(),
    });
    navigate(`/sales/orders/${order.id}/view?${params.toString()}`);
  };

  const handleDelete = (order: SalesOrderListItem) => {
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedOrder) {
      deleteMutation.mutate(selectedOrder.id);
    }
  };

  // Bulk authorization handlers
  const bulkApproveMutation = useMutation({
    mutationFn: (instanceIds: string[]) => {
      const instances = instanceIds.map(id => ({
        instance_id: id,
        authorized_status: 2 as 1 | 2 | 3,
        description: 'Bulk approved',
      }));
      return authorizationApi.bulkApprove('sales', 'salesorder', { instances });
    },
    onSuccess: async () => {
      toastSuccess(`${selectedRows.length} order(s) approved successfully`);
      setSelectedRows([]);
      await new Promise((r) => setTimeout(r, 300));
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to approve orders');
    },
  });

  const bulkRejectMutation = useMutation({
    mutationFn: ({ instanceIds, reason }: { instanceIds: string[]; reason: string }) => {
      const instances = instanceIds.map(id => ({
        instance_id: id,
        authorized_status: 3 as 1 | 2 | 3,
        description: reason,
      }));
      return authorizationApi.bulkApprove('sales', 'salesorder', { instances });
    },
    onSuccess: async () => {
      toastSuccess(`${selectedRows.length} order(s) rejected successfully`);
      setSelectedRows([]);
      setBulkRejectDialogOpen(false);
      await new Promise((r) => setTimeout(r, 300));
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to reject orders');
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

  // Status chip colors
  const getStatusColor = (status: SalesOrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'PENDING':
        return 'warning';
      case 'CONFIRMED':
        return 'info';
      case 'PARTIALLY_DISPATCHED':
        return 'primary';
      case 'DISPATCHED':
        return 'primary';
      case 'PARTIALLY_INVOICED':
        return 'warning';
      case 'INVOICED':
        return 'secondary';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  // Customer type options based on channel config
  const customerTypeOptions: DropdownOption[] = [
    ...(channelConfig?.enable_retailer
      ? [{ id: 'RETAILER', name: 'Retailer' }]
      : []),
    ...(channelConfig?.enable_distributor
      ? [{ id: 'DISTRIBUTOR', name: 'Distributor' }]
      : []),
    ...(channelConfig?.enable_superstockist
      ? [{ id: 'SUPERSTOCKIST', name: 'Superstockist' }]
      : []),
  ];

  // Status options
  const statusOptions: DropdownOption[] = [
    { id: 'DRAFT', name: 'Draft' },
    { id: 'PENDING', name: 'Pending' },
    { id: 'CONFIRMED', name: 'Confirmed' },
    { id: 'PARTIALLY_DISPATCHED', name: 'Partially Dispatched' },
    { id: 'DISPATCHED', name: 'Dispatched' },
    { id: 'PARTIALLY_INVOICED', name: 'Partially Invoiced' },
    { id: 'INVOICED', name: 'Invoiced' },
    { id: 'DELIVERED', name: 'Delivered' },
    { id: 'CANCELLED', name: 'Cancelled' },
  ];

  // DataGrid columns
  const canEditOrder = (order: SalesOrderListItem) =>
    hasPermission(user, 'change_salesorder') && ['DRAFT', 'PENDING'].includes(order.status);

  const canDeleteOrder = (order: SalesOrderListItem) =>
    hasPermission(user, 'delete_salesorder') && ['PENDING', 'REJECTED'].includes(order.status as any);

  const columns: GridColDef<SalesOrderListItem>[] = [
    {
      field: 'sno',
      headerName: 'S.No',
      width: 70,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => {
        const rowIndex = paginationModel.page * paginationModel.pageSize + params.api.getRowIndexRelativeToVisibleRows(params.id) + 1;
        return rowIndex;
      },
    },
    {
      field: 'order_number',
      headerName: 'Order Number',
      width: 140,
      renderCell: (params) => (
        <Typography
          sx={{
            cursor: hasPermission(user, 'view_salesorder') ? 'pointer' : 'default',
            color: hasPermission(user, 'view_salesorder') ? 'primary.main' : 'text.primary',
            fontWeight: 500,
            fontFamily: 'Poppins, sans-serif',
            fontSize: '0.875rem',
          }}
          onClick={() => hasPermission(user, 'view_salesorder') && handleView(params.row)}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'order_date',
      headerName: 'Order Date',
      width: 110,
      valueFormatter: (params) => format(new Date(params), 'dd-MM-yyyy'),
    },
    {
      field: 'customer_type_display',
      headerName: 'Customer Type',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    {
      field: 'customer_name',
      headerName: 'Customer',
      minWidth: 200,
      flex: 1,
      renderCell: (params) => (
        <Typography
          sx={{
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            lineHeight: 1.2,
            py: 0.5,
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'items_count',
      headerName: 'Products',
      width: 70,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'grand_total',
      headerName: 'Amount',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value: number) => `₹${value?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`,
    },
    {
      field: 'status_display',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.row.status)}
          size="small"
        />
      ),
    },
    {
      field: 'authorization',
      headerName: 'Authorization',
      width: 120,
      sortable: false,
      renderCell: (params) => {
        const effectiveAuthStatus =
          params.row.status === 'DRAFT' ? 0 : (params.row.authorized_status ?? 1);
        return (
          <ApprovalButton
            appLabel="sales"
            modelName="salesorder"
            instanceId={params.row.id}
            currentStatus={effectiveAuthStatus as 0 | 1 | 2 | 3}
            currentLevel={params.row.authorized_level}
            onApprove={() => queryClient.invalidateQueries({ queryKey: ['salesOrders'] })}
            onReject={() => queryClient.invalidateQueries({ queryKey: ['salesOrders'] })}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {hasPermission(user, 'view_salesorder') && (
            <Tooltip title="View">
              <IconButton size="small" onClick={() => handleView(params.row)}>
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission(user, 'change_salesorder') && (
            <Tooltip title={canEditOrder(params.row) ? 'Edit' : 'Edit is allowed only for DRAFT or PENDING orders'}>
              <span>
              <IconButton
                size="small"
                onClick={() => handleEdit(params.row)}
                disabled={!canEditOrder(params.row)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              </span>
            </Tooltip>
          )}
          {hasPermission(user, 'delete_salesorder') && (
            <Tooltip title={canDeleteOrder(params.row) ? 'Delete' : 'Delete is allowed only for PENDING or REJECTED orders'}>
              <span>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDelete(params.row)}
                disabled={!canDeleteOrder(params.row)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              </span>
            </Tooltip>
          )}
          {hasPermission(user, 'print_salesorder') && (
            <Tooltip title="Print">
              <IconButton size="small" onClick={() => navigate(`/sales/orders/${params.row.id}/print`)}>
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  // Pending authorization columns with checkbox
  const pendingColumns: GridColDef<SalesOrderListItem>[] = [
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
      {/* Fixed Header Section */}
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          {/* Left side - Title with back button */}
          <ScreenHeader
            title="Sales Orders"
            showBackButton={true}
            onBack={() => navigate('/sales')}
            disableBox
          />
          
          {/* Right side - Search, filters and Add button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              placeholder="Search orders..."
              value={searchInput}
              onChange={handleSearchChange}
              size="small"
              sx={{
                width: { xs: '100%', sm: 280 },
                minWidth: 0,
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
            
            <Tooltip title="Filter">
              <IconButton
                onClick={handleFilterClick}
                sx={{
                  backgroundColor: activeFilterCount > 0 ? 'primary.main' : '#fff',
                  color: activeFilterCount > 0 ? '#fff' : '#006766',
                  border: '1px solid',
                  borderColor: activeFilterCount > 0 ? 'primary.main' : 'rgba(0, 0, 0, 0.23)',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: activeFilterCount > 0 ? 'primary.dark' : 'rgba(0, 103, 102, 0.04)',
                  },
                }}
              >
                <Badge badgeContent={activeFilterCount} color="error">
                  <FilterListIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {hasPermission(user, 'add_salesorder') && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                sx={{ whiteSpace: 'nowrap' }}
              >
                New Order
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
          minHeight: 0,
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
                sx={{ flexShrink: 0 }}
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

          {/* Tab Content */}
          <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {/* All Records Tab */}
            {activeTab === 0 && (
              <DataGrid
                rows={data?.results || []}
                columns={columns}
                rowCount={data?.count || 0}
                loading={isLoading || isFetching}
                pageSizeOptions={[10, 20, 50, 100]}
                paginationModel={paginationModel}
                paginationMode="server"
                onPaginationModelChange={setPaginationModel}
                disableRowSelectionOnClick
                disableColumnMenu
                sx={{
                  ...getDataGridStyles(),
                  height: '100%',
                  '& .MuiDataGrid-cell': {
                    display: 'flex',
                    alignItems: 'center',
                  },
                }}
              />
            )}

            {/* Pending Authorization Tab */}
            {activeTab === 1 && (
              <DataGrid
                rows={pendingData?.results || []}
                columns={pendingColumns}
                rowCount={pendingData?.count || 0}
                loading={pendingLoading}
                pageSizeOptions={[10, 20, 50, 100]}
                paginationModel={paginationModel}
                paginationMode="server"
                onPaginationModelChange={setPaginationModel}
                disableRowSelectionOnClick
                checkboxSelection={false}
                disableColumnMenu
                sx={{
                  ...getDataGridStyles(),
                  height: '100%',
                  '& .MuiDataGrid-cell': {
                    display: 'flex',
                    alignItems: 'center',
                  },
                }}
              />
            )}
          </Box>
        </Paper>
      </Box>

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
      >
        <Box sx={{ p: 3, width: { xs: 280, sm: 350 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Filters</Typography>
            <IconButton size="small" onClick={handleFilterClose}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              size="small"
              options={customerTypeOptions}
              value={customerTypeFilter}
              onChange={(_, newValue) => {
                setCustomerTypeFilter(newValue);
                setCustomerFilter(null);
              }}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => <TextField {...params} label="Customer Type" />}
            />
            
            <SearchableDropdown
              label="Customer"
              apiEndpoint="/api/sales/orders/customer-dropdown/"
              value={customerFilter}
              onChange={(value) => setCustomerFilter(Array.isArray(value) ? value[0] || null : value)}
              additionalFilters={customerTypeFilter ? { customer_type: customerTypeFilter.id } : undefined}
              disabled={!customerTypeFilter}
              placeholder={customerTypeFilter ? "Select Customer" : "Select customer type first"}
            />
            
            <Autocomplete
              size="small"
              options={statusOptions}
              value={statusFilter}
              onChange={(_, newValue) => setStatusFilter(newValue)}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => <TextField {...params} label="Status" />}
            />
            
            <DatePicker
              label="Date From"
              format="DD-MM-YYYY"
              value={dateFromFilter ? dayjs(dateFromFilter) : null}
              onChange={(date) => setDateFromFilter(toDateString(date))}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  InputLabelProps: { shrink: true },
                },
              }}
            />
            
            <DatePicker
              label="Date To"
              format="DD-MM-YYYY"
              value={dateToFilter ? dayjs(dateToFilter) : null}
              onChange={(date) => setDateToFilter(toDateString(date))}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  InputLabelProps: { shrink: true },
                },
              }}
            />
            
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                fullWidth
              >
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                fullWidth
              >
                Apply
              </Button>
            </Box>
          </Box>
        </Box>
      </Popover>

      {/* Delete Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={(_event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            return;
          }
          setDeleteDialogOpen(false);
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Delete Sales Order
          <IconButton
            aria-label="close"
            onClick={() => setDeleteDialogOpen(false)}
            size="small"
            disabled={deleteMutation.isPending}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete order <strong>{selectedOrder?.order_number}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
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

export default SalesOrderList;

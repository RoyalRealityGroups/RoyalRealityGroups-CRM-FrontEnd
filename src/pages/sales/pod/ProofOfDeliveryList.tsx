import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Button,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  IconButton,
  Tooltip,
  Menu,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
  Verified as VerifiedIcon,
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { Tabs, Tab } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel, GridRowSelectionModel } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import ScreenHeader from '../../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { podApi } from '../../../api/pod.api';
import type { ProofOfDelivery } from '../../../types/pod.types';
import { getPageContainerStyles, getHeaderSectionStyles, getContentSectionStyles, getDataGridStyles } from '../../../utils/spacing';
import ApprovalButton from '../../../components/authorization/ApprovalButton';
import FloatingActionBar from '../../../components/authorization/FloatingActionBar';
import BulkRejectDialog from '../../../components/authorization/BulkRejectDialog';
import { authorizationApi } from '../../../api/authorization.api';

const ProofOfDeliveryList: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { setBreadcrumbs } = useBreadcrumbs();
  const { error: toastError, success: toastSuccess } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [hasAuthRights, setHasAuthRights] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const activeFilterCount = statusFilter ? 1 : 0;

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Sales', path: '/sales', icon: <FolderIcon fontSize="small" /> },
      { label: 'Proof of Delivery', icon: <VerifiedIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      if (searchInput !== searchQuery) {
        setPaginationModel(prev => ({ ...prev, page: 0 }));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  }, []);

  const { data: authCountsData } = useQuery({
    queryKey: ['authCounts', 'delivery', 'proofofdelivery'],
    queryFn: () => authorizationApi.getStatusCounts('delivery', 'proofofdelivery'),
  });

  useEffect(() => {
    if (authCountsData) {
      setHasAuthRights((authCountsData.pending_count ?? authCountsData.Pending ?? 0) > 0);
      setPendingCount(authCountsData.pending_count ?? authCountsData.Pending ?? 0);
    }
  }, [authCountsData]);

  const { data: pendingData, isLoading: isPendingLoading, isFetching: isPendingFetching } = useQuery({
    queryKey: ['pendingPods', paginationModel.page, paginationModel.pageSize, searchQuery],
    queryFn: () => authorizationApi.getPendingAuthorizations(
      'delivery',
      'proofofdelivery',
      {
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
      }
    ),
    enabled: activeTab === 1 && hasAuthRights,
    placeholderData: previous => previous,
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (ids: string[]) => authorizationApi.bulkApprove('delivery', 'proofofdelivery', { instances: ids.map(id => ({ instance_id: id, authorized_status: 2 as 1 | 2 | 3 })) }),
    onSuccess: () => {
      toastSuccess('Records approved successfully');
      setSelectedRows({ type: 'include', ids: new Set() });
      queryClient.invalidateQueries({ queryKey: ['pendingPods'] });
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
      queryClient.invalidateQueries({ queryKey: ['pods'] });
    },
    onError: () => {
      toastError('Failed to approve records');
    },
  });

  const bulkRejectMutation = useMutation({
    mutationFn: ({ ids, reason }: { ids: string[]; reason: string }) =>
      authorizationApi.bulkApprove('delivery', 'proofofdelivery', { instances: ids.map(id => ({ instance_id: id, authorized_status: 3 as 1 | 2 | 3, description: reason })) }),
    onSuccess: () => {
      toastSuccess('Records rejected successfully');
      setSelectedRows({ type: 'include', ids: new Set() });
      setBulkRejectDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['pendingPods'] });
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
      queryClient.invalidateQueries({ queryKey: ['pods'] });
    },
    onError: () => {
      toastError('Failed to reject records');
    },
  });

  const handleBulkApprove = () => {
    if (selectedRows && typeof selectedRows === 'object' && 'ids' in selectedRows) {
      const ids = Array.from(selectedRows.ids) as string[];
      if (ids.length > 0) {
        bulkApproveMutation.mutate(ids);
      }
    }
  };

  const handleBulkReject = (reason: string) => {
    if (selectedRows && typeof selectedRows === 'object' && 'ids' in selectedRows) {
      const ids = Array.from(selectedRows.ids) as string[];
      if (ids.length > 0) {
        bulkRejectMutation.mutate({ ids, reason });
      }
    }
  };

  const handleApprove = async (instanceId: string) => {
    try {
      await authorizationApi.bulkApprove('delivery', 'proofofdelivery', { instances: [{ instance_id: instanceId, authorized_status: 2 as 1 | 2 | 3 }] });
      toastSuccess('Record approved successfully');
      queryClient.invalidateQueries({ queryKey: ['pods'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPods'] });
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
    } catch (error) {
      toastError('Failed to approve record');
    }
  };

  const handleReject = async (instanceId: string, reason: string) => {
    try {
      await authorizationApi.bulkApprove('delivery', 'proofofdelivery', { instances: [{ instance_id: instanceId, authorized_status: 3 as 1 | 2 | 3, description: reason }] });
      toastSuccess('Record rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['pods'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPods'] });
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
    } catch (error) {
      toastError('Failed to reject record');
    }
  };

  const handlePrint = (id: string) => {
    navigate(`/sales/pod/${id}/print?print=1`);
  };

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['pods', paginationModel.page, paginationModel.pageSize, searchQuery, statusFilter],
    queryFn: () => podApi.getAll({
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
      search: searchQuery || undefined,
      status: statusFilter || undefined,
    }),
    placeholderData: previous => previous,
  });

  useEffect(() => {
    if (isError) {
      toastError('Failed to load Proof of Delivery records');
    }
  }, [isError, toastError]);

  const rows: ProofOfDelivery[] = (data as any)?.results || [];
  const rowCount = (data as any)?.count || 0;

  const pendingRows: ProofOfDelivery[] = (pendingData as any)?.results || [];
  const pendingRowCount = (pendingData as any)?.count || 0;

  const pendingColumns: GridColDef<ProofOfDelivery>[] = [
    {
      field: 'checkbox',
      headerName: '',
      width: 50,
      sortable: false,
      disableColumnMenu: true,
      renderHeader: () => null,
      renderCell: () => null,
    },
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
      field: 'pod_number',
      headerName: 'POD Document No',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography 
          sx={{ 
            cursor: hasPermission(user, 'view_proofofdelivery') ? 'pointer' : 'default',
            color: hasPermission(user, 'view_proofofdelivery') ? 'primary.main' : 'text.primary',
            fontWeight: 500, 
            fontFamily: 'Poppins, sans-serif', 
            fontSize: '0.875rem' 
          }} 
          onClick={() => hasPermission(user, 'view_proofofdelivery') && navigate(`/sales/pod/${params.row.id}/view`)}
        >
          {params.row.pod_number}
        </Typography>
      ),
    },
    {
      field: 'pod_date',
      headerName: 'POD Date',
      width: 120,
      valueGetter: (value) => value ? format(new Date(value), 'dd-MM-yyyy') : '',
    },
    { field: 'customer_name', headerName: 'Customer', flex: 1.2, minWidth: 180 },
    { field: 'invoice_number', headerName: 'Invoice No', flex: 1, minWidth: 140 },
    { field: 'receiver_name', headerName: 'Received By', flex: 1, minWidth: 140 },
    { field: 'delivered_by', headerName: 'Delivered By', flex: 1, minWidth: 140 },
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
    {
      field: 'authorization',
      headerName: 'Authorization',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <ApprovalButton
          appLabel="delivery"
          modelName="proofofdelivery"
          instanceId={params.row.id}
          currentStatus={(params.row.authorized_status ?? 1) as 0 | 1 | 2 | 3}
          currentLevel={params.row.authorized_level}
          onApprove={() => handleApprove(params.row.id)}
          onReject={(reason) => handleReject(params.row.id, reason)}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {hasPermission(user, 'view_proofofdelivery') && (
            <Tooltip title="View">
              <IconButton size="small" onClick={() => navigate(`/sales/pod/${params.row.id}/view`)}>
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission(user, 'print_proofofdelivery') && (
            <Tooltip title="Print">
              <IconButton size="small" onClick={() => handlePrint(params.row.id)}>
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission(user, 'change_proofofdelivery') && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => navigate(`/sales/pod/edit/${params.row.id}`)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  const columns: GridColDef<ProofOfDelivery>[] = [
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
      field: 'pod_number',
      headerName: 'POD Document No',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography 
          sx={{ 
            cursor: hasPermission(user, 'view_proofofdelivery') ? 'pointer' : 'default',
            color: hasPermission(user, 'view_proofofdelivery') ? 'primary.main' : 'text.primary',
            fontWeight: 500, 
            fontFamily: 'Poppins, sans-serif', 
            fontSize: '0.875rem' 
          }} 
          onClick={() => hasPermission(user, 'view_proofofdelivery') && navigate(`/sales/pod/${params.row.id}/view`)}
        >
          {params.row.pod_number}
        </Typography>
      ),
    },
    {
      field: 'pod_date',
      headerName: 'POD Date',
      width: 120,
      valueGetter: (value) => value ? format(new Date(value), 'dd-MM-yyyy') : '',
    },
    { field: 'customer_name', headerName: 'Customer', flex: 1.2, minWidth: 180 },
    { field: 'invoice_number', headerName: 'Invoice No', flex: 1, minWidth: 140 },
    { field: 'receiver_name', headerName: 'Received By', flex: 1, minWidth: 140 },
    { field: 'delivered_by', headerName: 'Delivered By', flex: 1, minWidth: 140 },
    {
      field: 'authorization',
      headerName: 'Authorization',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <ApprovalButton
          appLabel="delivery"
          modelName="proofofdelivery"
          instanceId={params.row.id}
          currentStatus={(params.row.authorized_status ?? 1) as 0 | 1 | 2 | 3}
          currentLevel={params.row.authorized_level}
          onApprove={() => handleApprove(params.row.id)}
          onReject={(reason) => handleReject(params.row.id, reason)}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {hasPermission(user, 'view_proofofdelivery') && (
            <Tooltip title="View">
              <IconButton size="small" onClick={() => navigate(`/sales/pod/${params.row.id}/view`)}>
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission(user, 'print_proofofdelivery') && (
            <Tooltip title="Print">
              <IconButton size="small" onClick={() => handlePrint(params.row.id)}>
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission(user, 'change_proofofdelivery') && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => navigate(`/sales/pod/edit/${params.row.id}`)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <ScreenHeader
            title="Proof of Delivery"
            showBackButton={true}
            onBack={() => navigate('/sales')}
            disableBox
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search invoice, order, receiver"
              value={searchInput}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#006766' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: 280,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 2,
                  '&:hover fieldset': { borderColor: '#006766' },
                  '&.Mui-focused fieldset': { borderColor: '#006766' },
                },
              }}
            />
            
            <Tooltip title="Filter">
              <IconButton
                onClick={(e) => setFilterAnchor(e.currentTarget)}
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
            
            {hasPermission(user, 'add_proofofdelivery') && (
              <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/sales/pod/create')}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add POD
            </Button>
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 400,
          borderRadius: 0,
        }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
            <Tabs value={activeTab} onChange={(_, newValue) => {
              setActiveTab(newValue);
              setSelectedRows({ type: 'include', ids: new Set() });
              setPaginationModel({ page: 0, pageSize: 20 });
            }}>
              <Tab label="All Records" />
              {hasAuthRights && (
                <Tab label={`Pending Authorization (${pendingCount})`} />
              )}
            </Tabs>
            {activeTab === 1 && selectedRows && typeof selectedRows === 'object' && 'ids' in selectedRows && selectedRows.ids.size > 0 && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleBulkApprove}
                  disabled={bulkApproveMutation.isPending}
                >
                  Approve ({selectedRows && typeof selectedRows === 'object' && 'ids' in selectedRows ? selectedRows.ids.size : 0})
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => setBulkRejectDialogOpen(true)}
                  disabled={bulkRejectMutation.isPending}
                >
                  Reject ({selectedRows && typeof selectedRows === 'object' && 'ids' in selectedRows ? selectedRows.ids.size : 0})
                </Button>
              </Box>
            )}
          </Box>
          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            {activeTab === 0 ? (
              <DataGrid
                rows={rows}
                columns={columns}
                loading={isLoading || isFetching}
                disableRowSelectionOnClick
                disableColumnMenu
                pageSizeOptions={[10, 20, 50]}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                rowCount={rowCount}
                paginationMode="server"
                sx={{
                  ...getDataGridStyles(),
                  '& .MuiDataGrid-cell': {
                    display: 'flex',
                    alignItems: 'center',
                  },
                }}
              />
            ) : (
              <DataGrid
                rows={pendingRows}
                columns={pendingColumns}
                loading={isPendingLoading || isPendingFetching}
                checkboxSelection
                disableRowSelectionOnClick
                disableColumnMenu
                pageSizeOptions={[10, 20, 50]}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                rowCount={pendingRowCount}
                paginationMode="server"
                rowSelectionModel={selectedRows}
                onRowSelectionModelChange={setSelectedRows}
                sx={{
                  ...getDataGridStyles(),
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

      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 220, p: 2 } } }}
      >
        <TextField
          fullWidth
          size="small"
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="SUCCESS">Delivered</MenuItem>   
          {/* <MenuItem value="PARTIAL">Partial</MenuItem>
          <MenuItem value="FAILED">Failed</MenuItem> */}

        </TextField>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button size="small" onClick={() => setStatusFilter('')}>Clear</Button>
        </Box>
      </Menu>

      <BulkRejectDialog
        open={bulkRejectDialogOpen}
        onClose={() => setBulkRejectDialogOpen(false)}
        onConfirm={handleBulkReject}
        selectedCount={selectedRows && typeof selectedRows === 'object' && 'ids' in selectedRows ? selectedRows.ids.size : 0}
      />
    </Box>
  );
};

export default ProofOfDeliveryList;

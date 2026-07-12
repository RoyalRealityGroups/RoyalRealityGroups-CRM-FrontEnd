import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Button,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  LocalShipping as TruckIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import ScreenHeader from '../../../components/common/ScreenHeader';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { getPageContainerStyles, getHeaderSectionStyles, getContentSectionStyles, getDataGridStyles } from '../../../utils/spacing';
import { dispatchApi } from '../../../api/dispatch.api';
import type { DispatchPlan } from '../../../types/dispatch.types';
import ApprovalButton from '../../../components/authorization/ApprovalButton';
import FloatingActionBar from '../../../components/authorization/FloatingActionBar';
import BulkRejectDialog from '../../../components/authorization/BulkRejectDialog';
import { authorizationApi } from '../../../api/authorization.api';
import { Tabs, Tab } from '@mui/material';

const DispatchPlanList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Dispatch Plans');
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<DispatchPlan | null>(null);

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
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Sales', path: '/sales', icon: <FolderIcon fontSize="small" /> },
      { label: 'Dispatch Planning', icon: <TruckIcon fontSize="small" /> },
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

  // Check authorization rights
  const { data: authCountsData } = useQuery({
    queryKey: ['authCounts', 'delivery', 'dispatchplan'],
    queryFn: () => authorizationApi.getStatusCounts('delivery', 'dispatchplan'),
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
    queryKey: ['pendingAuth', 'delivery', 'dispatchplan', paginationModel.page, paginationModel.pageSize],
    queryFn: () => authorizationApi.getPendingAuthorizations('delivery', 'dispatchplan', {
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
    }),
    enabled: activeTab === 1,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['dispatchPlans', paginationModel.page, paginationModel.pageSize, searchQuery],
    queryFn: () => dispatchApi.getAll({
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
      search: searchQuery || undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  const deleteMutation = useMutation({
    mutationFn: dispatchApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatchPlans'] });
      setDeleteDialogOpen(false);
      setSelectedPlan(null);
      toastSuccess('Dispatch plan deleted successfully');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to delete dispatch plan');
    },
  });

  const handleView = (id: string) => {
    const params = new URLSearchParams({
      returnTab: activeTab.toString(),
      returnPage: paginationModel.page.toString(),
      returnPageSize: paginationModel.pageSize.toString(),
    });
    navigate(`/sales/dispatch/${id}/view?${params.toString()}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/sales/dispatch/${id}/edit`);
  };

  const handlePrint = (id: string) => {
    navigate(`/sales/dispatch/${id}/print?print=1`);
  };

  const handleDelete = (plan: DispatchPlan) => {
    setSelectedPlan(plan);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPlan) {
      deleteMutation.mutate(selectedPlan.id);
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
      return authorizationApi.bulkApprove('delivery', 'dispatchplan', { instances });
    },
    onSuccess: () => {
      toastSuccess(`${selectedRows.length} dispatch plan(s) approved successfully`);
      setSelectedRows([]);
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
      queryClient.invalidateQueries({ queryKey: ['dispatchPlans'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to approve dispatch plans');
    },
  });

  const bulkRejectMutation = useMutation({
    mutationFn: ({ instanceIds, reason }: { instanceIds: string[]; reason: string }) => {
      const instances = instanceIds.map(id => ({
        instance_id: id,
        authorized_status: 3 as 1 | 2 | 3,
        description: reason,
      }));
      return authorizationApi.bulkApprove('delivery', 'dispatchplan', { instances });
    },
    onSuccess: () => {
      toastSuccess(`${selectedRows.length} dispatch plan(s) rejected successfully`);
      setSelectedRows([]);
      setBulkRejectDialogOpen(false);
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
      queryClient.invalidateQueries({ queryKey: ['dispatchPlans'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to reject dispatch plans');
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

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'default',
      PENDING: 'warning',
      CONFIRMED: 'primary',
      IN_TRANSIT: 'warning',
      DELIVERED: 'success',
      CANCELLED: 'error',
    } as const;
    return colors[status as keyof typeof colors] || 'default';
  };

  const columns: GridColDef<DispatchPlan>[] = [
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
      field: 'dispatch_number',
      headerName: 'Dispatch Number',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography
          sx={{ 
            cursor: hasPermission(user, 'view_dispatchplan') ? 'pointer' : 'default',
            color: hasPermission(user, 'view_dispatchplan') ? 'primary.main' : 'text.primary',
            fontWeight: 500, 
            fontFamily: 'Poppins, sans-serif', 
            fontSize: '0.875rem',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
          onClick={() => hasPermission(user, 'view_dispatchplan') && handleView(params.row.id)}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'dispatch_date',
      headerName: 'Dispatch Date',
      flex: 0.8,
      minWidth: 120,
      valueFormatter: (params) => format(new Date(params), 'dd-MM-yyyy'),
    },
    {
      field: 'planned_dispatch_date',
      headerName: 'Planned Date',
      flex: 0.8,
      minWidth: 120,
      valueFormatter: (params) => format(new Date(params), 'dd-MM-yyyy'),
    },
    {
      field: 'location_name',
      headerName: 'Location',
      flex: 1.2,
      minWidth: 150,
      renderCell: (params) => (
        <Typography
          sx={{
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            lineHeight: 1.2,
            py: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'vehicle_number',
      headerName: 'Vehicle No',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => (
        <Typography
          sx={{
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'total_orders',
      headerName: 'Orders',
      flex: 0.5,
      minWidth: 80,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      minWidth: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'authorization',
      headerName: 'Authorization',
      flex: 1,
      minWidth: 140,
      sortable: false,
      renderCell: (params) => {
        const effectiveAuthStatus =
          params.row.status === 'DRAFT' ? 0 : (params.row.authorized_status ?? 1);
        return (
          <ApprovalButton
            appLabel="delivery"
            modelName="dispatchplan"
            instanceId={params.row.id}
            currentStatus={effectiveAuthStatus as 0 | 1 | 2 | 3}
            currentLevel={params.row.authorized_level}
            onApprove={() => queryClient.invalidateQueries({ queryKey: ['dispatchPlans'] })}
            onReject={() => queryClient.invalidateQueries({ queryKey: ['dispatchPlans'] })}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {hasPermission(user, 'view_dispatchplan') && (
            <Tooltip title="View">
              <IconButton size="small" onClick={() => handleView(params.row.id)}>
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission(user, 'print_dispatchplan') && (
            <Tooltip title="Print">
              <IconButton size="small" onClick={() => handlePrint(params.row.id)}>
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission(user, 'change_dispatchplan') && params.row.authorized_status !== 2 && (
            <Tooltip title="Edit">
            <IconButton 
              size="small" 
              onClick={() => handleEdit(params.row.id)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          )}
          {hasPermission(user, 'delete_dispatchplan') && (
            <Tooltip title={params.row.status === 'DRAFT' ? 'Delete' : 'Only draft records can be deleted'}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(params.row)}
                  disabled={params.row.status !== 'DRAFT'}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  // Pending authorization columns with checkbox
  const pendingColumns: GridColDef<DispatchPlan>[] = [
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
    ...columns.filter(col => col.field !== 'authorization' && col.field !== 'actions'),
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
            title="Dispatch Planning"
            showBackButton={true}
            onBack={() => navigate('/sales')}
            disableBox
          />
          
          {/* Right side - Search and Add button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              placeholder="Search dispatch plans..."
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
            
            {hasPermission(user, 'add_dispatchplan') && (
              <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/sales/dispatch/new')}
              sx={{ whiteSpace: 'nowrap' }}
            >
              New Dispatch Plan
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
          width: '100%',
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
                getRowHeight={() => 'auto'}
                sx={{
                  ...getDataGridStyles(),
                  height: '100%',
                  '& .MuiDataGrid-cell': {
                    display: 'flex',
                    alignItems: 'center',
                    py: 1,
                  },
                  '& .MuiDataGrid-row': {
                    minHeight: '52px !important',
                    maxHeight: 'fit-content !important',
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
                getRowHeight={() => 'auto'}
                sx={{
                  ...getDataGridStyles(),
                  height: '100%',
                  '& .MuiDataGrid-cell': {
                    display: 'flex',
                    alignItems: 'center',
                    py: 1,
                  },
                  '& .MuiDataGrid-row': {
                    minHeight: '52px !important',
                    maxHeight: 'fit-content !important',
                  },
                }}
              />
            )}
          </Box>
        </Paper>
      </Box>

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
          Delete Dispatch Plan
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
            Are you sure you want to delete dispatch plan <strong>{selectedPlan?.dispatch_number}</strong>?
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

export default DispatchPlanList;

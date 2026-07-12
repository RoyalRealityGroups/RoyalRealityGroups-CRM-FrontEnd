import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIconAction,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import ScreenHeader from '../../components/common/ScreenHeader';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { getPageContainerStyles, getHeaderSectionStyles, getContentSectionStyles, getDataGridStyles } from '../../utils/spacing';
import { receiptApi } from '../../api/receipt.api';
import type { Receipt } from '../../types/receipt.types';
import ApprovalButton from '../../components/authorization/ApprovalButton';
import BulkRejectDialog from '../../components/authorization/BulkRejectDialog';
import { authorizationApi } from '../../api/authorization.api';
import { hasPermission } from '../../utils/permissions';
import type { RootState } from '../../store/store';

const ReceiptList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);

  usePageTitle('Receipts');
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const [activeTab, setActiveTab] = useState(0);
  const [hasAuthRights, setHasAuthRights] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);

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
      { label: 'Receipts', icon: <ReceiptIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

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

  const { data: authCountsData } = useQuery({
    queryKey: ['authCounts', 'receipts', 'receipt'],
    queryFn: () => authorizationApi.getStatusCounts('receipts', 'receipt'),
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

  const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['pendingAuth', 'receipts', 'receipt', paginationModel.page, paginationModel.pageSize],
    queryFn: () => authorizationApi.getPendingAuthorizations('receipts', 'receipt', {
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
    }),
    enabled: activeTab === 1,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['receipts', paginationModel.page, paginationModel.pageSize, searchQuery, paymentModeFilter],
    queryFn: () => receiptApi.getAll({
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
      search: searchQuery || undefined,
      payment_mode: paymentModeFilter || undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  const deleteMutation = useMutation({
    mutationFn: receiptApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setDeleteDialogOpen(false);
      setSelectedReceipt(null);
      toastSuccess('Receipt deleted successfully');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to delete receipt');
    },
  });

  const handleView = (id: string) => {
    const params = new URLSearchParams({
      returnTab: activeTab.toString(),
      returnPage: paginationModel.page.toString(),
      returnPageSize: paginationModel.pageSize.toString(),
    });
    navigate(`/receipts/${id}/view?${params.toString()}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/receipts/edit/${id}`);
  };

  const handlePrint = (id: string) => {
    navigate(`/receipts/${id}/print?print=1`);
  };

  const handleDelete = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedReceipt) {
      deleteMutation.mutate(selectedReceipt.id!);
    }
  };

  const bulkApproveMutation = useMutation({
    mutationFn: (instanceIds: string[]) => {
      const instances = instanceIds.map(id => ({
        instance_id: id,
        authorized_status: 2 as 1 | 2 | 3,
        description: 'Bulk approved',
      }));
      return authorizationApi.bulkApprove('receipts', 'receipt', { instances });
    },
    onSuccess: () => {
      toastSuccess(`${selectedRows.length} receipt(s) approved successfully`);
      setSelectedRows([]);
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to approve receipts');
    },
  });

  const bulkRejectMutation = useMutation({
    mutationFn: ({ instanceIds, reason }: { instanceIds: string[]; reason: string }) => {
      const instances = instanceIds.map(id => ({
        instance_id: id,
        authorized_status: 3 as 1 | 2 | 3,
        description: reason,
      }));
      return authorizationApi.bulkApprove('receipts', 'receipt', { instances });
    },
    onSuccess: () => {
      toastSuccess(`${selectedRows.length} receipt(s) rejected successfully`);
      setSelectedRows([]);
      setBulkRejectDialogOpen(false);
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to reject receipts');
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

  const columns: GridColDef<Receipt>[] = [
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
      field: 'receipt_number',
      headerName: 'Receipt Number',
      width: 150,
      renderCell: (params) => (
        <Typography
          sx={{
            cursor: hasPermission(user, 'view_receipt') ? 'pointer' : 'default',
            color: hasPermission(user, 'view_receipt') ? 'primary.main' : 'text.primary',
            fontWeight: 500,
            fontFamily: 'Poppins, sans-serif',
            fontSize: '0.875rem',
          }}
          onClick={() => hasPermission(user, 'view_receipt') && handleView(params.row.id!)}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'receipt_date',
      headerName: 'Receipt Date',
      width: 120,
      valueFormatter: (params) => format(new Date(params), 'dd-MM-yyyy'),
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
      field: 'payment_mode_display',
      headerName: 'Payment Mode',
      width: 130,
    },
    {
      field: 'total_amount',
      headerName: 'Total Amount',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value: number) => `₹${value?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`,
    },
    {
      field: 'allocated_amount',
      headerName: 'Allocated',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value: number) => `₹${value?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`,
    },
    {
      field: 'adjustment_amount',
      headerName: 'Adjustment',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value: number) => `₹${value?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`,
    },
    {
      field: 'authorization',
      headerName: 'Authorization',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <ApprovalButton
          appLabel="receipts"
          modelName="receipt"
          instanceId={params.row.id!}
          currentStatus={(params.row.authorized_status ?? 1) as 0 | 1 | 2 | 3}
          currentLevel={params.row.authorized_level}
          onApprove={() => queryClient.invalidateQueries({ queryKey: ['receipts'] })}
          onReject={() => queryClient.invalidateQueries({ queryKey: ['receipts'] })}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      sortable: false,
      renderCell: (params) => {
        const isEditableStateNotFullyAuthorized = [0, 1].includes(params.row.authorized_status ?? 1);

        return (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {hasPermission(user, 'view_receipt') && (
              <Tooltip title="View">
                <IconButton size="small" onClick={() => handleView(params.row.id!)}>
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission(user, 'print_receipt') && (
              <Tooltip title="Print">
                <IconButton size="small" onClick={() => handlePrint(params.row.id!)}>
                  <PrintIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission(user, 'change_receipt') && isEditableStateNotFullyAuthorized && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleEdit(params.row.id!)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission(user, 'delete_receipt') && isEditableStateNotFullyAuthorized && (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(params.row)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  const pendingColumns: GridColDef<Receipt>[] = [
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
          checked={selectedRows.includes(params.row.id!)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRows([...selectedRows, params.row.id!]);
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
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <ScreenHeader
            title="Receipt Management"
            showBackButton={true}
            onBack={() => navigate('/sales')}
            disableBox
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
              <InputLabel>Payment Mode</InputLabel>
              <Select
                value={paymentModeFilter}
                label="Payment Mode"
                onChange={(e) => setPaymentModeFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="CHEQUE">Cheque</MenuItem>
                <MenuItem value="NEFT">NEFT</MenuItem>
                <MenuItem value="RTGS">RTGS</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="CARD">Card</MenuItem>
              </Select>
            </FormControl>

            <TextField
              placeholder="Search receipts..."
              value={searchInput}
              onChange={handleSearchChange}
              size="small"
              sx={{ width: { xs: '100%', sm: 250 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            {hasPermission(user, 'add_receipt') && (
              <Button
                variant="contained"
                startIcon={<ReceiptIcon />}
                onClick={() => navigate('/receipts/create')}
              >
                Create Receipt
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
          minHeight: 0,
          borderRadius: 0,
        }}>
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
                      <CancelIconAction />
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

          <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Delete Receipt
          <IconButton onClick={() => setDeleteDialogOpen(false)} size="small" disabled={deleteMutation.isPending}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete receipt <strong>{selectedReceipt?.receipt_number}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default ReceiptList;

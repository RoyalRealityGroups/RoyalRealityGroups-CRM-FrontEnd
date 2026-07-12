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
  Close as CloseIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
  Cancel as CancelIcon,
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIconAction,
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
import { invoiceApi } from '../../../api/invoice.api';
import type { Invoice } from '../../../types/invoice.types';
import ApprovalButton from '../../../components/authorization/ApprovalButton';
import FloatingActionBar from '../../../components/authorization/FloatingActionBar';
import BulkRejectDialog from '../../../components/authorization/BulkRejectDialog';
import { authorizationApi } from '../../../api/authorization.api';
import { hasPermission } from '../../../utils/permissions';
import type { RootState } from '../../../store/store';

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);

  usePageTitle('Invoices');
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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
      { label: 'Invoice', icon: <ReceiptIcon fontSize="small" /> },
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

  // Check authorization rights and get pending count
  const { data: authCountsData } = useQuery({
    queryKey: ['authCounts', 'sales', 'invoice'],
    queryFn: () => authorizationApi.getStatusCounts('sales', 'invoice'),
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
    queryKey: ['pendingAuth', 'sales', 'invoice', paginationModel.page, paginationModel.pageSize],
    queryFn: () => authorizationApi.getPendingAuthorizations('sales', 'invoice', {
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
    }),
    enabled: activeTab === 1,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['invoices', paginationModel.page, paginationModel.pageSize, searchQuery, statusFilter, sourceFilter],
    queryFn: () => invoiceApi.getAll({
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      source_type: sourceFilter || undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  const deleteMutation = useMutation({
    mutationFn: invoiceApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
      toastSuccess('Invoice deleted successfully');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to delete invoice');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: invoiceApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setCancelDialogOpen(false);
      setSelectedInvoice(null);
      toastSuccess('Invoice cancelled successfully');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to cancel invoice');
    },
  });

  const handleEdit = (id: string) => {
    navigate(`/sales/invoice/edit/${id}`);
  };

  const handlePrint = (id: string) => {
    navigate(`/sales/invoice/${id}/print?print=1`);
  };

  const handleView = (id: string) => {
    const params = new URLSearchParams({
      returnTab: activeTab.toString(),
      returnPage: paginationModel.page.toString(),
      returnPageSize: paginationModel.pageSize.toString(),
    });
    navigate(`/sales/invoice/${id}/view?${params.toString()}`);
  };

  const handleDelete = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  const handleCancel = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCancelDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedInvoice) {
      deleteMutation.mutate(selectedInvoice.id!);
    }
  };

  const confirmCancel = () => {
    if (selectedInvoice) {
      cancelMutation.mutate(selectedInvoice.id!);
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
      return authorizationApi.bulkApprove('sales', 'invoice', { instances });
    },
    onSuccess: () => {
      toastSuccess(`${selectedRows.length} invoice(s) approved successfully`);
      setSelectedRows([]);
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to approve invoices');
    },
  });

  const bulkRejectMutation = useMutation({
    mutationFn: ({ instanceIds, reason }: { instanceIds: string[]; reason: string }) => {
      const instances = instanceIds.map(id => ({
        instance_id: id,
        authorized_status: 3 as 1 | 2 | 3,
        description: reason,
      }));
      return authorizationApi.bulkApprove('sales', 'invoice', { instances });
    },
    onSuccess: () => {
      toastSuccess(`${selectedRows.length} invoice(s) rejected successfully`);
      setSelectedRows([]);
      setBulkRejectDialogOpen(false);
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to reject invoices');
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
      PAID: 'success',
      PARTIALLY_PAID: 'warning',
      CANCELLED: 'error',
    } as const;
    return colors[status as keyof typeof colors] || 'default';
  };

  const columns: GridColDef<Invoice>[] = [
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
      field: 'invoice_number',
      headerName: 'Invoice Number',
      width: 150,
      renderCell: (params) => (
        <Typography
          sx={{
            cursor: hasPermission(user, 'view_invoice') ? 'pointer' : 'default',
            color: hasPermission(user, 'view_invoice') ? 'primary.main' : 'text.primary',
            fontWeight: 500,
            fontFamily: 'Poppins, sans-serif',
            fontSize: '0.875rem',
          }}
          onClick={() => hasPermission(user, 'view_invoice') && handleView(params.row.id!)}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'invoice_date',
      headerName: 'Invoice Date',
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
      field: 'order_number',
      headerName: 'Order Number',
      width: 140,
    },
    {
      field: 'source_type',
      headerName: 'Source',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'DISPATCH' ? 'info' : 'secondary'}
        />
      ),
    },
    {
      field: 'grand_total',
      headerName: 'Total',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value: number) => `₹${value?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`,
    },
    {
      field: 'balance_amount',
      headerName: 'Balance',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value: number) => `₹${value?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
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
      width: 120,
      sortable: false,
      renderCell: (params) => {
        const effectiveAuthStatus =
          params.row.status === 'DRAFT' ? 0 : (params.row.authorized_status ?? 1);
        return (
          <ApprovalButton
            appLabel="sales"
            modelName="invoice"
            instanceId={params.row.id!}
            currentStatus={effectiveAuthStatus as 0 | 1 | 2 | 3}
            currentLevel={params.row.authorized_level}
            onApprove={() => queryClient.invalidateQueries({ queryKey: ['invoices'] })}
            onReject={() => queryClient.invalidateQueries({ queryKey: ['invoices'] })}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params) => {
        const isEditableStateNotFullyAuthorized =
          ['DRAFT', 'PENDING'].includes(params.row.status) && params.row.authorized_status !== 2;

        return (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {hasPermission(user, 'view_invoice') && (
              <Tooltip title="View">
                <IconButton size="small" onClick={() => handleView(params.row.id!)}>
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission(user, 'print_invoice') && (
              <Tooltip title="Print">
                <IconButton size="small" onClick={() => handlePrint(params.row.id!)}>
                  <PrintIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission(user, 'change_invoice') && isEditableStateNotFullyAuthorized && (
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
            {hasPermission(user, 'cancel_invoice') && ['DRAFT', 'PENDING', 'CONFIRMED'].includes(params.row.status) && (
              <Tooltip title="Cancel">
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => handleCancel(params.row)}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission(user, 'delete_invoice') && isEditableStateNotFullyAuthorized && (
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

  // Pending authorization columns with checkbox
  const pendingColumns: GridColDef<Invoice>[] = [
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
            title="Invoice Management"
            showBackButton={true}
            onBack={() => navigate('/sales')}
            disableBox
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 6px)', sm: 120 } }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
                <MenuItem value="PARTIALLY_PAID">Partially Paid</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 6px)', sm: 120 } }}>
              <InputLabel>Source</InputLabel>
              <Select
                value={sourceFilter}
                label="Source"
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="DISPATCH">Dispatch</MenuItem>
                <MenuItem value="ORDER">Order</MenuItem>
              </Select>
            </FormControl>

            <TextField
              placeholder="Search invoices..."
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
            
            {hasPermission(user, 'add_invoice') && (
              <Button
                variant="contained"
                startIcon={<ReceiptIcon />}
                onClick={() => navigate('/sales/invoice/create')}
              >
                Create Invoice
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

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Delete Invoice
          <IconButton onClick={() => setDeleteDialogOpen(false)} size="small" disabled={deleteMutation.isPending}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete invoice <strong>{selectedInvoice?.invoice_number}</strong>?
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

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Cancel Invoice
          <IconButton onClick={() => setCancelDialogOpen(false)} size="small" disabled={cancelMutation.isPending}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel invoice <strong>{selectedInvoice?.invoice_number}</strong>?
            You can create a new invoice if needed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelMutation.isPending}>
            No
          </Button>
          <Button onClick={confirmCancel} color="warning" variant="contained" disabled={cancelMutation.isPending}>
            {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
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

export default InvoiceList;

import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';
import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  TextField,
  InputAdornment,
  Chip,
  MenuItem,
  Popover,
  Typography,
  Badge,
  Divider,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel, GridRowSelectionModel } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  History as HistoryIcon,
  LocalOffer as PriceIcon,
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Tabs, Tab } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { priceBookApi, priceBookDocumentApi } from '../../../api/masters.api';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import type { PriceBook, PriceBookFormData, PriceType, PriceBookDocumentStatus } from '../../../types/masters.types';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../../utils/spacing';
import PriceBookFormDialog from '../../../components/masters/PriceBookFormDialog';
import { format } from 'date-fns';
import ApprovalButton from '../../../components/authorization/ApprovalButton';
import BulkRejectDialog from '../../../components/authorization/BulkRejectDialog';
import { authorizationApi } from '../../../api/authorization.api';

const PriceBookList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Price Book');

  const [activeTab, setActiveTab] = useState(0);
  const [hasAuthRights, setHasAuthRights] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
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
  const [priceTypeFilter, setPriceTypeFilter] = useState<PriceType | ''>('');
  const [appliedPriceTypeFilter, setAppliedPriceTypeFilter] = useState<PriceType | ''>('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | ''>('');
  const [appliedIsActiveFilter, setAppliedIsActiveFilter] = useState<boolean | ''>('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const filterOpen = Boolean(filterAnchorEl);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPriceBook, setSelectedPriceBook] = useState<PriceBook | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      // { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Price Book', icon: <PriceIcon fontSize="small" /> },
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
  }, [searchInput, searchQuery]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  }, []);

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };


  const handleApplyFilters = () => {
    setAppliedPriceTypeFilter(priceTypeFilter);
    setAppliedIsActiveFilter(isActiveFilter);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
  };

    const clearFilters = () => {
    setPriceTypeFilter('');
    setAppliedPriceTypeFilter('');
    setIsActiveFilter('');
    setAppliedIsActiveFilter('');
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
  };

  const activeFiltersCount = (priceTypeFilter ? 1 : 0) + (isActiveFilter !== '' ? 1 : 0);

  const { data: authCountsData } = useQuery({
    queryKey: ['authCounts', 'masters', 'pricebookdocument'],
    queryFn: () => authorizationApi.getStatusCounts('masters', 'pricebookdocument'),
  });

  useEffect(() => {
    if (authCountsData) {
      setHasAuthRights((authCountsData.pending_count ?? authCountsData.Pending ?? 0) > 0);
      setPendingCount(authCountsData.pending_count ?? authCountsData.Pending ?? 0);
    }
  }, [authCountsData]);

  const { data: pendingData, isLoading: isPendingLoading, isFetching: isPendingFetching } = useQuery({
    queryKey: ['pendingPriceBooks', paginationModel.page, paginationModel.pageSize, searchQuery],
    queryFn: () => authorizationApi.getPendingAuthorizations(
      'masters',
      'pricebookdocument',
      {
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
      }
    ),
    enabled: activeTab === 1 && hasAuthRights,
    placeholderData: previous => previous,
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (ids: string[]) => authorizationApi.bulkApprove('masters', 'pricebookdocument', { instances: ids.map(id => ({ instance_id: id, authorized_status: 2 as 1 | 2 | 3 })) }),
    onSuccess: () => {
      toastSuccess('Records approved successfully');
      setSelectedRows({ type: 'include', ids: new Set() });
      queryClient.invalidateQueries({ queryKey: ['pendingPriceBooks'] });
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
      queryClient.invalidateQueries({ queryKey: ['priceBookDocuments'] });
    },
    onError: () => {
      toastError('Failed to approve records');
    },
  });

  const bulkRejectMutation = useMutation({
    mutationFn: ({ ids, reason }: { ids: string[]; reason: string }) =>
      authorizationApi.bulkApprove('masters', 'pricebookdocument', { instances: ids.map(id => ({ instance_id: id, authorized_status: 3 as 1 | 2 | 3, description: reason })) }),
    onSuccess: () => {
      toastSuccess('Records rejected successfully');
      setSelectedRows({ type: 'include', ids: new Set() });
      setBulkRejectDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['pendingPriceBooks'] });
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
      queryClient.invalidateQueries({ queryKey: ['priceBookDocuments'] });
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
      await authorizationApi.bulkApprove('masters', 'pricebookdocument', { instances: [{ instance_id: instanceId, authorized_status: 2 as 1 | 2 | 3 }] });
      toastSuccess('Record approved successfully');
      queryClient.invalidateQueries({ queryKey: ['priceBookDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPriceBooks'] });
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
    } catch (error) {
      toastError('Failed to approve record');
    }
  };

  const handleReject = async (instanceId: string, reason: string) => {
    try {
      await authorizationApi.bulkApprove('masters', 'pricebookdocument', { instances: [{ instance_id: instanceId, authorized_status: 3 as 1 | 2 | 3, description: reason }] });
      toastSuccess('Record rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['priceBookDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPriceBooks'] });
      queryClient.invalidateQueries({ queryKey: ['authCounts'] });
    } catch (error) {
      toastError('Failed to reject record');
    }
  };
  // Fetch price book documents (changed from individual price books)
  const { data, isLoading } = useQuery({
    queryKey: ['priceBookDocuments', paginationModel.page, paginationModel.pageSize, searchQuery, appliedPriceTypeFilter, appliedIsActiveFilter],
    queryFn: () => priceBookDocumentApi.getDocuments({
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
      search: searchQuery || undefined,
      location_type: priceTypeFilter || undefined,
      status: appliedIsActiveFilter || undefined,
      ordering: '-document_date,-created_on',
    }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: PriceBookFormData) => priceBookApi.createPriceBook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceBooks'] });
      setFormDialogOpen(false);
      toastSuccess('Price Book created successfully');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to create Price Book');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PriceBookFormData }) =>
      priceBookApi.updatePriceBook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceBooks'] });
      setFormDialogOpen(false);
      setSelectedPriceBook(null);
      toastSuccess('Price Book updated successfully');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to update Price Book');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => priceBookDocumentApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceBookDocuments'] });
      setDeleteDialogOpen(false);
      setSelectedPriceBook(null);
      toastSuccess('Price Book document and all entries deleted successfully');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete Price Book document');
    },
  });

  // Finalize draft mutation
  const finalizeMutation = useMutation({
    mutationFn: (id: string) => priceBookDocumentApi.finalizeDraft(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['priceBookDocuments'] });
      toastSuccess(data.message || 'Draft finalized successfully');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to finalize draft');
    },
  });

  // Duplicate as draft mutation
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => priceBookDocumentApi.duplicateAsDraft(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['priceBookDocuments'] });
      toastSuccess(data.message || 'Document duplicated as draft successfully');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to duplicate document');
    },
  });

  const handleBack = () => {
    navigate('/');
  };

  const handleCreate = () => {
    navigate('/price-book/manage');
  };

  const handleEdit = (document: any) => {
    // Navigate to bulk manage screen with document ID for editing
    navigate(`/price-book/manage?documentId=${document.id}`);
  };

  const handleDeleteClick = (document: any) => {
    setSelectedPriceBook(document);
    // Blur active element to release focus before opening dialog
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedPriceBook) {
      deleteMutation.mutate(selectedPriceBook.id);
    }
  };

  const handleFinalize = (document: any) => {
    if (window.confirm(`Are you sure you want to finalize "${document.document_number}"? This will activate the prices and cannot be undone.`)) {
      finalizeMutation.mutate(document.id);
    }
  };

  const handleDuplicate = (document: any) => {
    if (window.confirm(`Create a draft copy of "${document.document_number}"?`)) {
      duplicateMutation.mutate(document.id);
    }
  };

  const handleView = (document: any) => {
    const params = new URLSearchParams({
      documentId: document.id,
      returnTab: activeTab.toString(),
      returnPage: paginationModel.page.toString(),
      returnPageSize: paginationModel.pageSize.toString(),
    });
    navigate(`/price-book/view?${params.toString()}`);
  };

  const handlePrint = (document: any) => {
    navigate(`/price-book/print?documentId=${document.id}`);
  };

  const handleFormSubmit = async (data: PriceBookFormData) => {
    if (selectedPriceBook) {
      await updateMutation.mutateAsync({ id: selectedPriceBook.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleViewHistory = () => {
    const params = new URLSearchParams({
      returnTab: activeTab.toString(),
      returnPage: paginationModel.page.toString(),
      returnPageSize: paginationModel.pageSize.toString(),
    });
    navigate(`/price-book/history?${params.toString()}`);
  };

  const pendingColumns: GridColDef[] = [
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
      sortable: false,
      renderCell: (params) => {
        const dataArray = Array.isArray(pendingData) ? pendingData : (pendingData?.results || []);
        const rowIndex = dataArray.findIndex((row: any) => row.id === params.row.id) ?? -1;
        return rowIndex !== -1 ? paginationModel.page * paginationModel.pageSize + rowIndex + 1 : '';
      },
    },
    {
      field: 'document_number',
      headerName: 'Doc. No',
      width: 150,
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography
            variant="body2"
            sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => handleView(params.row)}
          >
            {params.row.document_number}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'document_date',
      headerName: 'Doc. Date',
      width: 120,
      renderCell: (params) => format(new Date(params.row.document_date), 'dd-MM-yyyy'),
    },
    {
      field: 'location_type',
      headerName: 'Location Type',
      width: 150,
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.row.location_type.replace('_', ' ')}
          color="primary"
          size="small"
        />
      ),
    },
    {
      field: 'effective_from',
      headerName: 'Effective From',
      width: 130,
      flex: 1,
      renderCell: (params) => format(new Date(params.row.effective_from), 'dd-MM-yyyy'),
    },
    {
      field: 'effective_to',
      headerName: 'Effective To',
      width: 130,
      flex: 1,
      renderCell: (params) =>
        params.row.effective_to && params.row.effective_to !== null
          ? format(new Date(params.row.effective_to), 'dd-MM-yyyy')
          : 'Ongoing',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      flex: 0.7,
      renderCell: (params) => {
        const status = params.row.status || 'ACTIVE';
        const colors: Record<string, any> = {
          DRAFT: { bg: '#fff3cd', color: '#856404', label: 'Draft' },
          ACTIVE: { bg: '#d4edda', color: '#155724', label: 'Active' },
          CLOSED: { bg: '#d1ecf1', color: '#0c5460', label: 'Closed' },
        };
        const config = colors[status] || colors.ACTIVE;
        return (
          <Chip
            label={config.label}
            size="small"
            sx={{
              backgroundColor: config.bg,
              color: config.color,
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        );
      },
    },
    {
      field: 'total_entries',
      headerName: 'Total Entries',
      width: 120,
      flex: 0.7,
      align: 'center',
      headerAlign: 'center',
    },
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
      renderCell: (params) => {
        const effectiveAuthStatus =
          params.row.status === 'DRAFT' ? 0 : (params.row.authorized_status ?? 1);
        return (
          <ApprovalButton
            appLabel="masters"
            modelName="pricebookdocument"
            instanceId={params.row.id}
            currentStatus={effectiveAuthStatus as 0 | 1 | 2 | 3}
            currentLevel={params.row.authorized_level}
            onApprove={() => handleApprove(params.row.id)}
            onReject={(reason) => handleReject(params.row.id, reason)}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => {
        const isDraft = params.row.status === 'DRAFT';
        return (
          <Box>
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={() => handleView(params.row)}
                color="info"
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {isDraft && hasPermission(user, 'change_pricebook') && (
              <Tooltip title="Finalize Draft">
                <IconButton
                  size="small"
                  onClick={() => handleFinalize(params.row)}
                  color="success"
                >
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission(user, 'print_pricebook') && (
              <Tooltip title="Print">
                <IconButton
                  size="small"
                  onClick={() => handlePrint(params.row)}
                  color="primary"
                >
                  <PrintIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission(user, 'add_pricebook') && (
              <Tooltip title="Duplicate as Draft">
                <IconButton
                  size="small"
                  onClick={() => handleDuplicate(params.row)}
                  color="info"
                >
                  <FileCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission(user, 'change_pricebook') && (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => handleEdit(params.row)}
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
            {hasPermission(user, 'delete_pricebook') && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => handleDeleteClick(params.row)}
                color="error"
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

  const columns: GridColDef[] = [
    {
      field: 'sno',
      headerName: 'S.No',
      width: 70,
      sortable: false,
      renderCell: (params) => {
        const dataArray = Array.isArray(data) ? data : (data?.results || []);
        const rowIndex = dataArray.findIndex((row: any) => row.id === params.row.id) ?? -1;
        return rowIndex !== -1 ? paginationModel.page * paginationModel.pageSize + rowIndex + 1 : '';
      },
    },
    {
      field: 'document_number',
      headerName: 'Doc. No',
      width: 150,
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography
            variant="body2"
            sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => handleView(params.row)}
          >
            {params.row.document_number}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'document_date',
      headerName: 'Doc. Date',
      width: 120,
      renderCell: (params) => format(new Date(params.row.document_date), 'dd-MM-yyyy'),
    },
    {
      field: 'location_type',
      headerName: 'Location Type',
      width: 150,
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.row.location_type.replace('_', ' ')}
          color="primary"
          size="small"
        />
      ),
    },
    {
      field: 'effective_from',
      headerName: 'Effective From',
      width: 130,
      flex: 1,
      renderCell: (params) => format(new Date(params.row.effective_from), 'dd-MM-yyyy'),
    },
    {
      field: 'effective_to',
      headerName: 'Effective To',
      width: 130,
      flex: 1,
      renderCell: (params) =>
        params.row.effective_to && params.row.effective_to !== null
          ? format(new Date(params.row.effective_to), 'dd-MM-yyyy')
          : 'Ongoing',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      flex: 0.7,
      renderCell: (params) => {
        const status = params.row.status || 'ACTIVE';
        const colors: Record<string, any> = {
          DRAFT: { bg: '#fff3cd', color: '#856404', label: 'Draft' },
          ACTIVE: { bg: '#d4edda', color: '#155724', label: 'Active' },
          CLOSED: { bg: '#d1ecf1', color: '#0c5460', label: 'Closed' },
        };
        const config = colors[status] || colors.ACTIVE;
        return (
          <Chip
            label={config.label}
            size="small"
            sx={{
              backgroundColor: config.bg,
              color: config.color,
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        );
      },
    },
    {
      field: 'total_entries',
      headerName: 'Total Entries',
      width: 120,
      flex: 0.7,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => {
        const isDraft = params.row.status === 'DRAFT';
        return (
          <Box>
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={() => handleView(params.row)}
                color="info"
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {isDraft && hasPermission(user, 'change_pricebook') && (
              <Tooltip title="Finalize Draft">
                <IconButton
                  size="small"
                  onClick={() => handleFinalize(params.row)}
                  color="success"
                >
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission(user, 'print_pricebook') && (
              <Tooltip title="Print">
                <IconButton
                  size="small"
                  onClick={() => handlePrint(params.row)}
                  color="primary"
                >
                  <PrintIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission(user, 'add_pricebook') && (
              <Tooltip title="Duplicate as Draft">
                <IconButton
                  size="small"
                  onClick={() => handleDuplicate(params.row)}
                  color="info"
                >
                  <FileCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission(user, 'change_pricebook') && (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => handleEdit(params.row)}
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
            {hasPermission(user, 'delete_pricebook') && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => handleDeleteClick(params.row)}
                color="error"
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
            title="Price Book Master"
            showBackButton={false}
            onBack={handleBack}
            disableBox
          />
          
          {/* Right side - Search box, Filter and Add buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              placeholder="Search by code, item..."
              size="small"
              value={searchInput}
              onChange={handleSearchChange}
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
                
                {/* Price Type Filter */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Price Type
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={priceTypeFilter}
                    onChange={(e) => {
                      setPriceTypeFilter(e.target.value as PriceType | '');
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="BASE">Base</MenuItem>
                    <MenuItem value="STATE">State</MenuItem>
                    <MenuItem value="CITY">City</MenuItem>
                    <MenuItem value="AREA">Area</MenuItem>
                    <MenuItem value="SUPERSTOCKIST">Superstockist</MenuItem>
                    <MenuItem value="DISTRIBUTOR">Distributor</MenuItem>
                    <MenuItem value="RETAILER">Retailer</MenuItem>
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
                    value={isActiveFilter}
                    onChange={(e) => {
                      setIsActiveFilter(e.target.value as any);
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="DRAFT">Draft</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="CLOSED">Closed</MenuItem>
                  </TextField>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button size="small" onClick={clearFilters} fullWidth variant="outlined">Clear</Button>
              <Button size="small" onClick={handleApplyFilters} fullWidth variant="contained">Apply</Button>
 </Box>

              </Box>
            </Popover>
            
            {hasPermission(user, 'view_pricebookhistory') && (
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={handleViewHistory}
                sx={{ whiteSpace: 'nowrap' }}
              >
                View History
              </Button>
            )}
            {hasPermission(user, 'add_pricebook') && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Bulk Manage Prices
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
                rows={Array.isArray(data) ? data : (data?.results || [])}
                columns={columns}
                rowCount={Array.isArray(data) ? data.length : (data?.count || 0)}
                loading={isLoading}
                pageSizeOptions={[10, 20, 50, 100]}
                paginationModel={paginationModel}
                paginationMode="server"
                onPaginationModelChange={setPaginationModel}
                disableRowSelectionOnClick
                sx={getDataGridStyles()}
              />
            ) : (
              <DataGrid
                rows={Array.isArray(pendingData) ? pendingData : (pendingData?.results || [])}
                columns={pendingColumns}
                rowCount={Array.isArray(pendingData) ? pendingData.length : (pendingData?.count || 0)}
                loading={isPendingLoading || isPendingFetching}
                checkboxSelection
                pageSizeOptions={[10, 20, 50, 100]}
                paginationModel={paginationModel}
                paginationMode="server"
                onPaginationModelChange={setPaginationModel}
                rowSelectionModel={selectedRows}
                onRowSelectionModelChange={setSelectedRows}
                disableRowSelectionOnClick
                sx={getDataGridStyles()}
              />
            )}
          </Box>
        </Paper>
      </Box>

      {/* Form Dialog */}
      <PriceBookFormDialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false);
          setSelectedPriceBook(null);
        }}
        onSubmit={handleFormSubmit}
        priceBook={selectedPriceBook}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        disableRestoreFocus
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete price book "{selectedPriceBook?.code}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} autoFocus>Cancel</Button>
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

      <BulkRejectDialog
        open={bulkRejectDialogOpen}
        onClose={() => setBulkRejectDialogOpen(false)}
        onConfirm={handleBulkReject}
        selectedCount={selectedRows && typeof selectedRows === 'object' && 'ids' in selectedRows ? selectedRows.ids.size : 0}
      />
    </Box>
  );
};

export default PriceBookList;

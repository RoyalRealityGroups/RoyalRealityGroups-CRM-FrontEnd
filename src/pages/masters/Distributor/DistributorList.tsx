import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Alert,
  TextField,
  InputAdornment,
  Popover,
  Typography,
  Badge,
  Divider,
  Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Close as CloseIcon, FilterList as FilterListIcon, Add as AddIcon, FileUpload as FileUploadIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';
import { distributorApi } from '../../../api/masters.api';
import DistributorViewDialog from './DistributorViewDialog';
import ScreenHeader from '../../../components/common/ScreenHeader';
import ChannelPartnerGuard from '../../../components/guards/ChannelPartnerGuard';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks/usePageTitle';
import type { Distributor } from '../../../types/masters.types';
import type { DropdownOption } from '../../../types/common.types';
import { API_ENDPOINTS } from '../../../utils/constants';
import { getContentSectionStyles, getDataGridStyles, getHeaderSectionStyles, getPageContainerStyles } from '../../../utils/spacing';
import SearchableDropdown from '../../../components/common/SearchableDropdown';
import apiClient from '../../../api/axios.config';
import { exportApi } from '../../../api/export.api';

const DistributorList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);

  usePageTitle('Distributor Master');

  // State
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewDistributor, setViewDistributor] = useState<Distributor | null>(null);
  const [exporting, setExporting] = useState(false);
  
  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [stateFilter, setStateFilter] = useState<DropdownOption | null>(null);
  const [appliedStateFilter, setAppliedStateFilter] = useState<DropdownOption | null>(null);
  const [superstockistFilter, setSuperstockistFilter] = useState<DropdownOption | null>(null);
  const [appliedSuperstockistFilter, setAppliedSuperstockistFilter] = useState<DropdownOption | null>(null);
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [appliedIsActiveFilter, setAppliedIsActiveFilter] = useState<string>('');
  
  // Filter popover handlers
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  

  const handleApplyFilters = () => {
    setAppliedStateFilter(stateFilter);
    setAppliedSuperstockistFilter(superstockistFilter);
    setAppliedIsActiveFilter(isActiveFilter);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
  };

    const handleClearFilters = () => { setFilterAnchorEl(null);
    setStateFilter(null);
    setAppliedStateFilter(null);
    setSuperstockistFilter(null);
    setAppliedSuperstockistFilter(null);
    setIsActiveFilter('');
    setAppliedIsActiveFilter('');
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };
  
  const filterOpen = Boolean(filterAnchorEl);

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Distributor', icon: <LocalShippingIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Fetch channel configuration
  const { data: channelConfig } = useQuery({
    queryKey: ['channelConfig'],
    queryFn: async () => {
      const response = await apiClient.get('/api/masters/channel-config/');
      return {
        enforce_channel_hierarchy: response.data.enforce_channel_hierarchy || false,
        enable_superstockist: response.data.enable_superstockist || false,
      };
    },
  });

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    return (appliedStateFilter ? 1 : 0) + 
      (channelConfig?.enforce_channel_hierarchy && channelConfig?.enable_superstockist && superstockistFilter ? 1 : 0) + 
      (appliedIsActiveFilter !== '' ? 1 : 0);
  }, [stateFilter, superstockistFilter, isActiveFilter, channelConfig]);

  // Fetch distributors
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['distributors', paginationModel.page + 1, paginationModel.pageSize, searchQuery, appliedStateFilter?.id, appliedSuperstockistFilter?.id, appliedIsActiveFilter],
    queryFn: () =>
      distributorApi.getDistributors({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
        state: stateFilter?.id?.toString(),
        superstockist: superstockistFilter?.id?.toString(),
        is_active: isActiveFilter === 'true' ? true : isActiveFilter === 'false' ? false : undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => distributorApi.deleteDistributor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      toastSuccess('Distributor deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedDistributor(null);
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete distributor');
    },
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Search input handler
  const handleSearchInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(event.target.value);
      setTimeout(() => {
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
      }, 300);
    },
    []
  );

  // Handlers
  const handleAdd = () => {
    navigate('/masters/distributor/add');
  };

  const handleView = (distributor: Distributor) => {
    setViewDistributor(distributor);
    setViewDialogOpen(true);
  };

  const handleEdit = (distributor: Distributor) => {
    navigate(`/masters/distributor/edit/${distributor.id}`);
  };

  const handleDelete = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedDistributor) {
      deleteMutation.mutate(selectedDistributor.id);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportApi.genericExport('Distributor');
      toastSuccess('Export downloaded successfully');
    } catch {
      toastError('Failed to export distributors');
    } finally {
      setExporting(false);
    }
  };

  const handleBack = () => {
    navigate('/masters');
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'sno',
      headerName: 'S.No',
      width: 70,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const index = data?.results?.findIndex((row: Distributor) => row.id === params.row.id) ?? 0;
        return paginationModel.page * paginationModel.pageSize + index + 1;
      },
    },
    {
      field: 'code',
      headerName: 'Code',
      width: 120,
      sortable: true,
      renderCell: (params) => (
        <Box
          sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
          onClick={() => handleView(params.row)}
        >
          {params.value}
        </Box>
      ),
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 180,
      sortable: true,
    },
    ...(channelConfig?.enforce_channel_hierarchy && channelConfig?.enable_superstockist ? [{
      field: 'superstockist',
      headerName: 'Superstockist',
      width: 150,
      sortable: false,
      valueGetter: (_: any, row: any) => row.superstockist_name || '-',
    }] : []),
    {
      field: 'state',
      headerName: 'State',
      width: 130,
      sortable: false,
      valueGetter: (_, row) => row.state_name || '-',
    },
     {
      field: 'agent_name',
      headerName: 'Agent Name',
      flex: 1,
      minWidth: 180,
      sortable: true,
      valueGetter: (_, row) => row.agent_name || '-',
    },
    {
      field: 'gstin',
      headerName: 'GSTIN',
      width: 150,
      sortable: false,
      valueGetter: (_, row) => row.gstin || '-',
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Chip
          label={params.row.is_active ? 'Active' : 'Inactive'}
          color={params.row.is_active ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      sortable: false,
      renderCell: (params) => (
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
          {hasPermission(user, 'change_distributor') && (
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
          {hasPermission(user, 'delete_distributor') && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => handleDelete(params.row)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
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
            title="Distributor Master"
            showBackButton
            onBack={handleBack}
            disableBox
          />
          
          {/* Right side - Search box, Filter and Add button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              placeholder="Search distributors..."
              size="small"
              value={searchInput}
              onChange={handleSearchInputChange}
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

            {/* Export Button */}
            {hasPermission(user, 'export_distributor') && (
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={handleExport}
              disabled={exporting}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
            )}

            {/* Add Button */}
            {hasPermission(user, 'add_distributor') && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Add Distributor
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={getContentSectionStyles()}>
        <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* DataGrid */}
          <Box sx={{ flexGrow: 1, width: '100%' }}>
            <DataGrid
              rows={data?.results || []}
              columns={columns}
              paginationMode="server"
              pageSizeOptions={[10, 20, 50, 100]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              rowCount={data?.count || 0}
              loading={isLoading || isFetching}
              disableRowSelectionOnClick
              sx={getDataGridStyles()}
            />
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
        sx={{ mt: 1 }}
      >
        <Box sx={{ p: 2, minWidth: 280 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Filters
            </Typography>
            {activeFilterCount > 0 ? (
              <Button size="small" onClick={handleClearFilters}>
                Clear All
              </Button>
            ) : (
              <IconButton size="small" onClick={handleFilterClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {/* Superstockist Filter */}
          {channelConfig?.enforce_channel_hierarchy && channelConfig?.enable_superstockist && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Superstockist
              </Typography>
              <SearchableDropdown
                label=""
                placeholder="Select Superstockist"
                value={superstockistFilter}
                onChange={(newValue) => {
                  setSuperstockistFilter(Array.isArray(newValue) ? null : newValue);
                }}
                apiEndpoint={`${API_ENDPOINTS.SUPERSTOCKISTS}mini/`}
              />
            </Box>
          )}

          {/* State Filter */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              State
            </Typography>
            <SearchableDropdown
              label=""
              placeholder="Select State"
              value={stateFilter}
              onChange={(newValue) => {
                setStateFilter(Array.isArray(newValue) ? null : newValue);
              }}
              apiEndpoint={API_ENDPOINTS.STATES}
            />
          </Box>

          {/* Status Filter */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Status
            </Typography>
            <TextField
              select
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
              }}
              size="small"
              fullWidth
              SelectProps={{
                native: true,
              }}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
              <option value="">All</option>
            </TextField>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button size="small" onClick={handleClearFilters} fullWidth variant="outlined">Clear</Button>
              <Button size="small" onClick={handleApplyFilters} fullWidth variant="contained">Apply</Button>
 </Box>

        </Box>
      </Popover>

      {/* View Dialog */}
      <DistributorViewDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setViewDistributor(null);
        }}
        distributor={viewDistributor}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedDistributor?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const DistributorListWithGuard: React.FC = () => (
  <ChannelPartnerGuard partnerType="distributor">
    <DistributorList />
  </ChannelPartnerGuard>
);

export default DistributorListWithGuard;

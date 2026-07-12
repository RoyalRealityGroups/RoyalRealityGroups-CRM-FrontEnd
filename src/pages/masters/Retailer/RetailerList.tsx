import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Close as CloseIcon, FilterList as FilterListIcon, Add as AddIcon, FileUpload as FileUploadIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { retailerApi } from '../../../api/masters.api';
import RetailerViewDialog from './RetailerViewDialog';
import ScreenHeader from '../../../components/common/ScreenHeader';
import ChannelPartnerGuard from '../../../components/guards/ChannelPartnerGuard';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import StorefrontIcon from '@mui/icons-material/Storefront';
import type { Retailer } from '../../../types/masters.types';
import type { DropdownOption } from '../../../types/common.types';
import { API_ENDPOINTS } from '../../../utils/constants';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../../utils/spacing';
import SearchableDropdown from '../../../components/common/SearchableDropdown';
import apiClient from '../../../api/axios.config';
import { exportApi } from '../../../api/export.api';

const RetailerList: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Retailer Master');

  // State
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewRetailer, setViewRetailer] = useState<Retailer | null>(null);
  const [exporting, setExporting] = useState(false);
  
  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [stateFilter, setStateFilter] = useState<DropdownOption | null>(null);
  const [appliedStateFilter, setAppliedStateFilter] = useState<DropdownOption | null>(null);
  const [distributorFilter, setDistributorFilter] = useState<DropdownOption | null>(null);
  const [appliedDistributorFilter, setAppliedDistributorFilter] = useState<DropdownOption | null>(null);
  const [outletTypeFilter, setOutletTypeFilter] = useState<DropdownOption | null>(null);
  const [appliedOutletTypeFilter, setAppliedOutletTypeFilter] = useState<DropdownOption | null>(null);
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
    setAppliedDistributorFilter(distributorFilter);
    setAppliedOutletTypeFilter(outletTypeFilter);
    setAppliedIsActiveFilter(isActiveFilter);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
  };

    const handleClearFilters = () => { setFilterAnchorEl(null);
    setStateFilter(null);
    setAppliedStateFilter(null);
    setDistributorFilter(null);
    setAppliedDistributorFilter(null);
    setOutletTypeFilter(null);
    setAppliedOutletTypeFilter(null);
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
      { label: 'Retailer', icon: <StorefrontIcon fontSize="small" /> },
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
      };
    },
  });

  const activeFilterCount = useMemo(() => {
    return (appliedStateFilter ? 1 : 0) + 
      (channelConfig?.enforce_channel_hierarchy && distributorFilter ? 1 : 0) + 
      (appliedOutletTypeFilter ? 1 : 0) + 
      (appliedIsActiveFilter !== '' ? 1 : 0);
  }, [stateFilter, distributorFilter, outletTypeFilter, isActiveFilter, channelConfig]);

  // Fetch retailers
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['retailers', paginationModel.page + 1, paginationModel.pageSize, searchQuery, appliedStateFilter?.id, appliedDistributorFilter?.id, appliedOutletTypeFilter?.id, appliedIsActiveFilter],
    queryFn: () =>
      retailerApi.getRetailers({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
        state: stateFilter?.id?.toString(),
        distributor: distributorFilter?.id?.toString(),
        outlet_type: outletTypeFilter?.id?.toString(),
        is_active: isActiveFilter === 'true' ? true : isActiveFilter === 'false' ? false : undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => retailerApi.deleteRetailer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retailers'] });
      toastSuccess('Retailer deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedRetailer(null);
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete retailer');
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
    navigate('/masters/retailer/add');
  };

  const handleView = (retailer: Retailer) => {
    setViewRetailer(retailer);
    setViewDialogOpen(true);
  };

  const handleEdit = (retailer: Retailer) => {
    navigate(`/masters/retailer/edit/${retailer.id}`);
  };

  const handleDelete = (retailer: Retailer) => {
    setSelectedRetailer(retailer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedRetailer) {
      deleteMutation.mutate(selectedRetailer.id);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportApi.genericExport('Retailer');
      toastSuccess('Export downloaded successfully');
    } catch {
      toastError('Failed to export retailers');
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
        const index = data?.results?.findIndex((row: Retailer) => row.id === params.row.id) ?? 0;
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
    ...(channelConfig?.enforce_channel_hierarchy ? [{
      field: 'distributor',
      headerName: 'Distributor',
      width: 150,
      sortable: false,
      valueGetter: (_: any, row: any) => row.distributor_name || '-',
    }] : []),
    {
      field: 'outlet_type',
      headerName: 'Outlet Type',
      width: 130,
      sortable: false,
      valueGetter: (_, row) => row.outlet_type_name || '-',
    },
    {
      field: 'state',
      headerName: 'State',
      width: 130,
      sortable: false,
      valueGetter: (_, row) => row.state_name || '-',
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
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          {hasPermission(user, 'change_retailer') && (
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
          {hasPermission(user, 'delete_retailer') && (
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
            title="Retailer Master"
            showBackButton
            onBack={handleBack}
            disableBox
          />
          
          {/* Right side - Search box, Filter and Add button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              placeholder="Search retailers..."
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
            {hasPermission(user, 'export_retailer') && (
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
            {hasPermission(user, 'add_retailer') && (
              <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add Retailer
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
          
          {/* Distributor Filter */}
          {channelConfig?.enforce_channel_hierarchy && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Distributor
              </Typography>
              <SearchableDropdown
                label=""
                placeholder="Select Distributor"
                value={distributorFilter}
                onChange={(newValue) => {
                  setDistributorFilter(Array.isArray(newValue) ? null : newValue);
                }}
                apiEndpoint={`${API_ENDPOINTS.DISTRIBUTORS}mini/`}
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
              apiEndpoint={`${API_ENDPOINTS.STATES}mini/`}
            />
          </Box>

          {/* Outlet Type Filter */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Outlet Type
            </Typography>
            <SearchableDropdown
              label=""
              placeholder="Select Outlet Type"
              value={outletTypeFilter}
              onChange={(newValue) => {
                setOutletTypeFilter(Array.isArray(newValue) ? null : newValue);
              }}
              apiEndpoint={`${API_ENDPOINTS.OUTLET_TYPES}mini/`}
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
      <RetailerViewDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setViewRetailer(null);
        }}
        retailer={viewRetailer}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedRetailer?.name}? This action cannot be undone.
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

const RetailerListWithGuard: React.FC = () => (
  <ChannelPartnerGuard partnerType="retailer">
    <RetailerList />
  </ChannelPartnerGuard>
);

export default RetailerListWithGuard;

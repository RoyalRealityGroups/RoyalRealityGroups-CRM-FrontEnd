import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Tooltip,
  Popover,
  Typography,
  Badge,
  Divider,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
  Warehouse as WarehouseIcon,
  Close as CloseIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ScreenHeader from '../../../components/common/ScreenHeader';
import WarehouseFormDialog from './WarehouseFormDialog';
import WarehouseViewDialog from './WarehouseViewDialog';
import { warehouseApi } from '../../../api/masters.api';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import type { Warehouse, WarehouseFormData } from '../../../types/masters.types';
import type { DropdownOption } from '../../../types/common.types';
import { API_ENDPOINTS } from '../../../utils/constants';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../../utils/spacing';
import SearchableDropdown from '../../../components/common/SearchableDropdown';
import { exportApi } from '../../../api/export.api';

const WarehouseList: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Warehouse Master');

  // State
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewWarehouse, setViewWarehouse] = useState<Warehouse | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [locationFilter, setLocationFilter] = useState<DropdownOption | null>(null);
  const [appliedLocationFilter, setAppliedLocationFilter] = useState<DropdownOption | null>(null);
  const [exporting, setExporting] = useState(false);


  const handleApplyFilters = () => {
    setAppliedLocationFilter(locationFilter);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
  };

    const handleClearFilters = () => { setFilterAnchorEl(null);
    setLocationFilter(null);
    setAppliedLocationFilter(null);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };
  
  const filterOpen = Boolean(filterAnchorEl);
  const activeFilterCount = locationFilter ? 1 : 0;

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Warehouse', icon: <WarehouseIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Debounced search - triggers API call after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      // Reset to first page when search changes
      if (searchInput !== searchQuery) {
        setPaginationModel(prev => ({ ...prev, page: 0 }));
      }
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handle search input change
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  }, []);

  // Fetch warehouses with filters
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['warehouses', paginationModel.page, paginationModel.pageSize, searchQuery, appliedLocationFilter?.id],
    queryFn: () =>
      warehouseApi.getWarehouses({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
        location: appliedLocationFilter?.id ? String(appliedLocationFilter.id) : undefined,
      }),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: warehouseApi.createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setFormOpen(false);
      toastSuccess('Warehouse created successfully');
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to create warehouse';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        }
      }
      
      toastError(errorMessage);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WarehouseFormData }) =>
      warehouseApi.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setFormOpen(false);
      setSelectedWarehouse(null);
      toastSuccess('Warehouse updated successfully');
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to update warehouse';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        }
      }
      
      toastError(errorMessage);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: warehouseApi.deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setDeleteDialogOpen(false);
      setSelectedWarehouse(null);
      toastSuccess('Warehouse deleted successfully');
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to delete warehouse';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        }
      }
      
      setDeleteDialogOpen(false);
      toastError(errorMessage);
    },
  });

  // Handlers
  const handleAdd = () => {
    setSelectedWarehouse(null);
    setFormOpen(true);
  };

  const handleView = (warehouse: Warehouse) => {
    setViewWarehouse(warehouse);
    setViewDialogOpen(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormOpen(true);
  };

  const handleDelete = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: WarehouseFormData) => {
    if (selectedWarehouse) {
      await updateMutation.mutateAsync({ id: selectedWarehouse.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedWarehouse) {
      deleteMutation.mutate(selectedWarehouse.id);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportApi.genericExport('WareHouse');
      toastSuccess('Export downloaded successfully');
    } catch {
      toastError('Failed to export warehouses');
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
        const index = data?.results?.findIndex((row: Warehouse) => row.id === params.row.id) ?? 0;
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
      headerName: 'Warehouse Name',
      flex: 1,
      minWidth: 200,
      sortable: true,
    },
    {
      field: 'location',
      headerName: 'Location',
      flex: 1,
      minWidth: 180,
      sortable: false,
      valueGetter: (_, row) => row.location?.name || '',
    },
    {
      field: 'erp_code',
      headerName: 'ERP Code',
      width: 130,
      sortable: true,
      valueGetter: (_, row) => row.erp_code || '-',
    },
    {
      field: 'erp_id',
      headerName: 'ERP ID',
      width: 130,
      sortable: true,
      valueGetter: (_, row) => row.erp_id || '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          {hasPermission(user, 'change_warehouse') && (
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
          {hasPermission(user, 'delete_warehouse') && (
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
            title="Warehouse Master"
            showBackButton
            onBack={handleBack}
            disableBox
          />
          
          {/* Right side - Search box, Filter and Add button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              placeholder="Search warehouses..."
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
            {hasPermission(user, 'export_warehouse') && (
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
            {hasPermission(user, 'add_warehouse') && (
              <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              Add Warehouse
            </Button>
            )}
          </Box>
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
            
            {/* Location Filter */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Location
              </Typography>
              <SearchableDropdown
                label=""
                placeholder="Select Location"
                apiEndpoint={API_ENDPOINTS.LOCATIONS_DROPDOWN}
                value={locationFilter}
                onChange={(value) => {
                  setLocationFilter(Array.isArray(value) ? null : value);
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button size="small" onClick={handleClearFilters} fullWidth variant="outlined">Clear</Button>
              <Button size="small" onClick={handleApplyFilters} fullWidth variant="contained">Apply</Button>
 </Box>

          </Box>
        </Popover>
      </Box>

      {/* Content */}
      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 400,
          borderRadius: 0,
        }}>
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              Failed to load warehouses
            </Alert>
          )}
          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
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
              sx={getDataGridStyles()}
            />
          </Box>
        </Paper>
      </Box>

      {/* View Dialog */}
      <WarehouseViewDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setViewWarehouse(null);
        }}
        warehouse={viewWarehouse}
      />

      {/* Form Dialog */}
      <WarehouseFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedWarehouse(null);
        }}
        onSubmit={handleFormSubmit}
        warehouse={selectedWarehouse}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the warehouse "{selectedWarehouse?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
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

    </Box>
  );
};

export default WarehouseList;

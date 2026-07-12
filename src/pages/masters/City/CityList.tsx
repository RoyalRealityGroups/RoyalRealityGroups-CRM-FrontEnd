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
  Alert,
  TextField,
  InputAdornment,
  Popover,
  Typography,
  Badge,
  Divider,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Add as AddIcon, Close as CloseIcon, FilterList as FilterListIcon, FileUpload as FileUploadIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';
import { cityApi } from '../../../api/masters.api';
import CityFormDialog from './CityFormDialog';
import CityViewDialog from './CityViewDialog';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import useToast from '../../../hooks/useToast';
import { usePageTitle } from '../../../hooks/usePageTitle';
import type { City, CityFormData } from '../../../types/masters.types';
import type { DropdownOption } from '../../../types/common.types';
import { API_ENDPOINTS } from '../../../utils/constants';
import { getContentSectionStyles, getDataGridStyles, getHeaderSectionStyles, getPageContainerStyles } from '../../../utils/spacing';
import SearchableDropdown from '../../../components/common/SearchableDropdown';
import { exportApi } from '../../../api/export.api';

const CityList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);

  usePageTitle('City Master');

  // State
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewCity, setViewCity] = useState<City | null>(null);
  
  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [stateFilter, setStateFilter] = useState<DropdownOption | null>(null);
  const [appliedStateFilter, setAppliedStateFilter] = useState<DropdownOption | null>(null);
  const [countryFilter, setCountryFilter] = useState<DropdownOption | null>(null);
  const [appliedCountryFilter, setAppliedCountryFilter] = useState<DropdownOption | null>(null);
  const [exporting, setExporting] = useState(false);
  
  // Filter popover handlers
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  

  const handleApplyFilters = () => {
    setAppliedStateFilter(stateFilter);
    setAppliedCountryFilter(countryFilter);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
  };

    const handleClearFilters = () => { setFilterAnchorEl(null);
    setStateFilter(null);
    setAppliedStateFilter(null);
    setCountryFilter(null);
    setAppliedCountryFilter(null);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };
  
  const filterOpen = Boolean(filterAnchorEl);
  const activeFilterCount = (appliedStateFilter ? 1 : 0) + (appliedCountryFilter ? 1 : 0);

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'City', icon: <LocationCityIcon fontSize="small" /> },
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

  // Fetch cities with filters
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['cities', paginationModel.page, paginationModel.pageSize, searchQuery, appliedStateFilter?.id, appliedCountryFilter?.id],
    queryFn: () =>
      cityApi.getCities({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
        state: appliedStateFilter?.id ? String(appliedStateFilter.id) : undefined,
        country: appliedCountryFilter?.id ? String(appliedCountryFilter.id) : undefined,
      }),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: cityApi.createCity,
    onSuccess: async (data) => {
      console.log('City created successfully:', data);
      setFormOpen(false);
      toastSuccess('City created successfully');
      // Force refetch after a short delay to ensure backend has processed
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['cities'] });
      }, 100);
    },
    onError: (error: any) => {
      console.error('Create city error:', error);
      console.error('Error response:', error.response);
      let errorMessage = 'Failed to create city';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.errors) {
          // Handle validation errors first (field-level)
          const firstError = Object.values(data.errors)[0];
          errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
        } else if (data.name) {
          errorMessage = Array.isArray(data.name) ? data.name[0] : data.name;
        } else if (data.code) {
          errorMessage = Array.isArray(data.code) ? data.code[0] : data.code;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        } else if (data.detail) {
          errorMessage = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }
      }
      
      toastError(errorMessage);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CityFormData }) =>
      cityApi.updateCity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      queryClient.refetchQueries({ queryKey: ['cities'] });
      setFormOpen(false);
      setSelectedCity(null);
      toastSuccess('City updated successfully');
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to update city';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.errors) {
          const firstError = Object.values(data.errors)[0];
          errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
        } else if (data.name) {
          errorMessage = Array.isArray(data.name) ? data.name[0] : data.name;
        } else if (data.code) {
          errorMessage = Array.isArray(data.code) ? data.code[0] : data.code;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        } else if (data.detail) {
          errorMessage = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }
      }
      
      toastError(errorMessage);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: cityApi.deleteCity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      queryClient.refetchQueries({ queryKey: ['cities'] });
      setDeleteDialogOpen(false);
      setSelectedCity(null);
      toastSuccess('City deleted successfully');
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to delete city';
      
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
    setSelectedCity(null);
    setFormOpen(true);
  };

  const handleView = (city: City) => {
    setViewCity(city);
    setViewDialogOpen(true);
  };

  const handleEdit = (city: City) => {
    setSelectedCity(city);
    setFormOpen(true);
  };

  const handleDelete = (city: City) => {
    setSelectedCity(city);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: CityFormData) => {
    // Prevent double submission
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }
    
    if (selectedCity) {
      await updateMutation.mutateAsync({ id: selectedCity.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedCity) {
      deleteMutation.mutate(selectedCity.id);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportApi.genericExport('City');
      toastSuccess('Export downloaded successfully');
    } catch {
      toastError('Failed to export cities');
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
        const index = data?.results?.findIndex((row: City) => row.id === params.row.id) ?? 0;
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
      headerName: 'City Name',
      flex: 1,
      minWidth: 200,
      sortable: true,
    },
    {
      field: 'state',
      headerName: 'State',
      flex: 1,
      minWidth: 180,
      sortable: false,
      valueGetter: (_, row) => row.state?.name || '',
    },
    {
      field: 'country',
      headerName: 'Country',
      flex: 1,
      minWidth: 180,
      sortable: false,
      valueGetter: (_, row) => row.country?.name || '',
    },
    {
      field: 'pincode',
      headerName: 'PIN Code',
      width: 120,
      sortable: false,
      valueGetter: (_, row) => row.pincode || '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          {hasPermission(user, 'change_city') && (
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
          {hasPermission(user, 'delete_city') && (
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
            title="City Master"
            showBackButton
            onBack={handleBack}
            disableBox
          />
          
          {/* Right side - Search box, Filter and Add button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              placeholder="Search cities..."
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
                
                {/* Country Filter */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Country
                  </Typography>
                  <SearchableDropdown
                    label=""
                    placeholder="Select Country"
                    apiEndpoint={API_ENDPOINTS.COUNTRIES}
                    value={countryFilter}
                    onChange={(value) => {
                      setCountryFilter(Array.isArray(value) ? null : value);
                      // Reset state filter when country changes
                      if (stateFilter) {
                        setStateFilter(null);
                      }
                      setPaginationModel(prev => ({ ...prev, page: 0 }));
                    }}
                  />
                </Box>
                
                {/* State Filter */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    State
                  </Typography>
                  <SearchableDropdown
                    label=""
                    placeholder="Select State"
                    apiEndpoint={API_ENDPOINTS.STATES}
                    additionalFilters={countryFilter ? { country: countryFilter.id } : undefined}
                    value={stateFilter}
                    onChange={(value) => {
                      setStateFilter(Array.isArray(value) ? null : value);
                    }}
                    disabled={!countryFilter}
                  />
                  {!countryFilter && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Select a country first
                    </Typography>
                  )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button size="small" onClick={handleClearFilters} fullWidth variant="outlined">Clear</Button>
              <Button size="small" onClick={handleApplyFilters} fullWidth variant="contained">Apply</Button>
 </Box>

              </Box>
            </Popover>
            
            {hasPermission(user, 'export_city') && (
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
            {hasPermission(user, 'add_city') && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Add New City
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
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              Failed to load cities
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
      <CityViewDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setViewCity(null);
        }}
        city={viewCity}
      />

      {/* Form Dialog */}
      <CityFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedCity(null);
        }}
        onSubmit={handleFormSubmit}
        city={selectedCity}
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
            Are you sure you want to delete the city "{selectedCity?.name}"? This action cannot be undone.
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

export default CityList;

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
import { locationApi } from '../../../api/masters.api';
import LocationViewDialog from './LocationViewDialog';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import PlaceIcon from '@mui/icons-material/Place';
import type { Location } from '../../../types/masters.types';
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

const LocationList: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Location Master');

  // State
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewLocation, setViewLocation] = useState<Location | null>(null);
  
  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [companyFilter, setCompanyFilter] = useState<DropdownOption | null>(null);
  const [appliedCompanyFilter, setAppliedCompanyFilter] = useState<DropdownOption | null>(null);
  const [countryFilter, setCountryFilter] = useState<DropdownOption | null>(null);
  const [appliedCountryFilter, setAppliedCountryFilter] = useState<DropdownOption | null>(null);
  const [stateFilter, setStateFilter] = useState<DropdownOption | null>(null);
  const [appliedStateFilter, setAppliedStateFilter] = useState<DropdownOption | null>(null);
  const [cityFilter, setCityFilter] = useState<DropdownOption | null>(null);
  const [appliedCityFilter, setAppliedCityFilter] = useState<DropdownOption | null>(null);
  const [exporting, setExporting] = useState(false);
  
  // Filter popover handlers
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  

  const handleApplyFilters = () => {
    setAppliedCompanyFilter(companyFilter);
    setAppliedCountryFilter(countryFilter);
    setAppliedStateFilter(stateFilter);
    setAppliedCityFilter(cityFilter);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
  };

    const handleClearFilters = () => { setFilterAnchorEl(null);
    setCompanyFilter(null);
    setAppliedCompanyFilter(null);
    setCountryFilter(null);
    setAppliedCountryFilter(null);
    setStateFilter(null);
    setAppliedStateFilter(null);
    setCityFilter(null);
    setAppliedCityFilter(null);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };
  
  const filterOpen = Boolean(filterAnchorEl);
  const activeFilterCount = (appliedCompanyFilter ? 1 : 0) + (appliedCountryFilter ? 1 : 0) + (appliedStateFilter ? 1 : 0) + (appliedCityFilter ? 1 : 0);

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Location', icon: <PlaceIcon fontSize="small" /> },
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

  // Fetch locations with filters
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['locations', paginationModel.page, paginationModel.pageSize, searchQuery, appliedCompanyFilter?.id, appliedCountryFilter?.id, appliedStateFilter?.id, appliedCityFilter?.id],
    queryFn: () =>
      locationApi.getLocations({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
        company: appliedCompanyFilter?.id ? String(appliedCompanyFilter.id) : undefined,
        country: appliedCountryFilter?.id ? String(appliedCountryFilter.id) : undefined,
        state: appliedStateFilter?.id ? String(appliedStateFilter.id) : undefined,
        city: appliedCityFilter?.id ? String(appliedCityFilter.id) : undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: locationApi.deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setDeleteDialogOpen(false);
      setSelectedLocation(null);
      toastSuccess('Location deleted successfully');
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to delete location';
      
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
    navigate('/masters/location/add');
  };

  const handleView = (location: Location) => {
    setViewLocation(location);
    setViewDialogOpen(true);
  };

  const handleEdit = (location: Location) => {
    navigate(`/masters/location/edit/${location.id}`);
  };

  const handleDelete = (location: Location) => {
    setSelectedLocation(location);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedLocation) {
      deleteMutation.mutate(selectedLocation.id);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportApi.genericExport('Location');
      toastSuccess('Export downloaded successfully');
    } catch {
      toastError('Failed to export locations');
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
        const index = data?.results?.findIndex((row: Location) => row.id === params.row.id) ?? 0;
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
      headerName: 'Location Name',
      flex: 1,
      minWidth: 180,
      sortable: true,
    },
    {
      field: 'company',
      headerName: 'Companies',
      flex: 1,
      minWidth: 220,
      sortable: false,
      valueGetter: (_, row) => (row.companies?.map((company: any) => company.name).join(', ') || '-'),
    },
    {
      field: 'city',
      headerName: 'City',
      flex: 1,
      minWidth: 130,
      sortable: false,
      valueGetter: (_, row) => row.city?.name || '',
    },
    {
      field: 'state',
      headerName: 'State',
      flex: 1,
      minWidth: 130,
      sortable: false,
      valueGetter: (_, row) => row.state?.name || '',
    },
    {
      field: 'country',
      headerName: 'Country',
      flex: 1,
      minWidth: 130,
      sortable: false,
      valueGetter: (_, row) => row.country?.name || '',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          {hasPermission(user, 'change_location') && (
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
          {hasPermission(user, 'delete_location') && (
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
            title="Location Master"
            showBackButton
            onBack={handleBack}
            disableBox
          />
          
          {/* Right side - Search box, Filter and Add button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              placeholder="Search locations..."
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
                
                {/* Company Filter */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Company
                  </Typography>
                  <SearchableDropdown
                    label=""
                    placeholder="Select Company"
                    apiEndpoint={API_ENDPOINTS.COMPANIES_DROPDOWN}
                    value={companyFilter}
                    onChange={(value) => {
                      setCompanyFilter(Array.isArray(value) ? null : value);
                    }}
                  />
                </Box>
                
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
                      // Reset state and city filters when country changes
                      if (stateFilter) {
                        setStateFilter(null);
                      }
                      if (cityFilter) {
                        setCityFilter(null);
                      }
                      setPaginationModel(prev => ({ ...prev, page: 0 }));
                    }}
                  />
                </Box>
                
                {/* State Filter */}
                <Box sx={{ mb: 2 }}>
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
                      // Reset city filter when state changes
                      if (cityFilter) {
                        setCityFilter(null);
                      }
                      setPaginationModel(prev => ({ ...prev, page: 0 }));
                    }}
                    disabled={!countryFilter}
                  />
                  {!countryFilter && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Select a country first
                    </Typography>
                  )}
                </Box>
                
                {/* City Filter */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    City
                  </Typography>
                  <SearchableDropdown
                    label=""
                    placeholder="Select City"
                    apiEndpoint={API_ENDPOINTS.CITIES}
                    additionalFilters={stateFilter ? { state: stateFilter.id } : undefined}
                    value={cityFilter}
                    onChange={(value) => {
                      setCityFilter(Array.isArray(value) ? null : value);
                    }}
                    disabled={!stateFilter}
                  />
                  {!stateFilter && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Select a state first
                    </Typography>
                  )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button size="small" onClick={handleClearFilters} fullWidth variant="outlined">Clear</Button>
              <Button size="small" onClick={handleApplyFilters} fullWidth variant="contained">Apply</Button>
 </Box>

              </Box>
            </Popover>
            
            {hasPermission(user, 'export_location') && (
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
            {hasPermission(user, 'add_location') && (
              <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add New Location
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
              Failed to load locations
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
      <LocationViewDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setViewLocation(null);
        }}
        location={viewLocation}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the location "{selectedLocation?.name}"? This action cannot be undone.
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

export default LocationList;

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
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
  Tooltip,
  Popover,
  Typography,
  Badge,
  Divider,
  Paper,
} from '@mui/material';
import AutoDismissAlert from '../../../components/common/AutoDismissAlert';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
  GridView as GridViewIcon,
  Close as CloseIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';
import ScreenHeader from '../../../components/common/ScreenHeader';
import AreaFormDialog from './AreaFormDialog';
import AreaViewDialog from './AreaViewDialog';
import { areaApi } from '../../../api/masters.api';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import type { Area, AreaFormData } from '../../../types/masters.types';
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

const AreaList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);

  const [exporting, setExporting] = useState(false);

  usePageTitle('Village/Town Master');

  // State
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewArea, setViewArea] = useState<Area | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  // Filter state (temp = popover selections, applied = used in query)
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [stateFilter, setStateFilter] = useState<DropdownOption | null>(null);
  const [cityFilter, setCityFilter] = useState<DropdownOption | null>(null);
  const [appliedStateFilter, setAppliedStateFilter] = useState<DropdownOption | null>(null);
  const [appliedCityFilter, setAppliedCityFilter] = useState<DropdownOption | null>(null);

  const handleApplyFilters = () => {
    setAppliedStateFilter(stateFilter);
    setAppliedCityFilter(cityFilter);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
  };

  const handleClearFilters = () => {
    setStateFilter(null);
    setCityFilter(null);
    setAppliedStateFilter(null);
    setAppliedCityFilter(null);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
  };
  
  const filterOpen = Boolean(filterAnchorEl);
  const activeFilterCount = (appliedStateFilter ? 1 : 0) + (appliedCityFilter ? 1 : 0);

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
      { label: 'Village/Town', icon: <GridViewIcon fontSize="small" /> },
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

  // Fetch areas with filters
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['areas', paginationModel.page, paginationModel.pageSize, searchQuery, appliedStateFilter?.id, appliedCityFilter?.id],
    queryFn: () =>
      areaApi.getAreas({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
        state: appliedStateFilter?.id ? String(appliedStateFilter.id) : undefined,
        city: appliedCityFilter?.id ? String(appliedCityFilter.id) : undefined,
      }),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: areaApi.createArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      setFormOpen(false);
      toastSuccess('Village/Town created successfully');
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to create village/town';
      
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
    mutationFn: ({ id, data }: { id: string; data: AreaFormData }) =>
      areaApi.updateArea(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      setFormOpen(false);
      setSelectedArea(null);
      toastSuccess('Village/Town updated successfully');
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to update village/town';
      
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
    mutationFn: areaApi.deleteArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      setDeleteDialogOpen(false);
      setSelectedArea(null);
      toastSuccess('Village/Town deleted successfully');
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to delete village/town';
      
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
    setSelectedArea(null);
    setFormOpen(true);
  };

  const handleView = (area: Area) => {
    setViewArea(area);
    setViewDialogOpen(true);
  };

  const handleEdit = (area: Area) => {
    setSelectedArea(area);
    setFormOpen(true);
  };

  const handleDelete = (area: Area) => {
    setSelectedArea(area);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: AreaFormData) => {
    if (selectedArea) {
      await updateMutation.mutateAsync({ id: selectedArea.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedArea) {
      deleteMutation.mutate(selectedArea.id);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportApi.genericExport('Area');
      toastSuccess('Export downloaded successfully');
    } catch (err: any) {
      toastError(err?.response?.data?.message || 'Failed to export data');
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
        const index = data?.results?.findIndex((row: Area) => row.id === params.row.id) ?? 0;
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
      headerName: 'Village/Town Name',
      flex: 1,
      minWidth: 200,
      sortable: true,
    },
    {
      field: 'city',
      headerName: 'City',
      flex: 1,
      minWidth: 180,
      sortable: false,
      valueGetter: (_, row) => row.city?.name || '',
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
          {hasPermission(user, 'change_area') && (
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
          {hasPermission(user, 'delete_area') && (
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
            title="Village/Town Master"
            showBackButton
            onBack={handleBack}
            disableBox
          />
          
          {/* Right side - Search box, Filter and Add button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              placeholder="Search villages/towns..."
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
            {hasPermission(user, 'export_area') && (
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
            )}

            {/* Add Button */}
            {hasPermission(user, 'add_area') && (
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
                Add Village/Town
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
            
            {/* State Filter */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                State
              </Typography>
              <SearchableDropdown
                label=""
                placeholder="Select State"
                apiEndpoint={API_ENDPOINTS.STATES}
                value={stateFilter}
                onChange={(value) => {
                  setStateFilter(Array.isArray(value) ? null : value);
                  if (cityFilter) {
                    setCityFilter(null);
                  }
                }}
              />
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
            <AutoDismissAlert severity="error" sx={{ m: 2 }}>
              Failed to load villages/towns
            </AutoDismissAlert>
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
      <AreaViewDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setViewArea(null);
        }}
        area={viewArea}
      />

      {/* Form Dialog */}
      <AreaFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedArea(null);
        }}
        onSubmit={handleFormSubmit}
        area={selectedArea}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'normal',
            }}
          >
            Are you sure you want to delete the village/town "{selectedArea?.name}"? This action cannot be undone.
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

export default AreaList;

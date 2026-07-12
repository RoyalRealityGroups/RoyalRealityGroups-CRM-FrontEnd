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
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
  AltRoute as AltRouteIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';
import RouteViewDialog from './RouteViewDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';
import { routeApi } from '../../../api/masters.api';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import type { Route } from '../../../types/masters.types';
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

const RouteList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);

  usePageTitle('Route Master');

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewRoute, setViewRoute] = useState<Route | null>(null);
  const [exporting, setExporting] = useState(false);

  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [stateFilter, setStateFilter] = useState<DropdownOption | null>(null);
  const [appliedStateFilter, setAppliedStateFilter] = useState<DropdownOption | null>(null);
  const [cityFilter, setCityFilter] = useState<DropdownOption | null>(null);
  const [appliedCityFilter, setAppliedCityFilter] = useState<DropdownOption | null>(null);
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [appliedIsActiveFilter, setAppliedIsActiveFilter] = useState<string>('');

  const filterOpen = Boolean(filterAnchorEl);
  const activeFilterCount = (appliedStateFilter ? 1 : 0) + (appliedCityFilter ? 1 : 0) + (appliedIsActiveFilter !== '' ? 1 : 0);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Route', icon: <AltRouteIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['routes', paginationModel.page + 1, paginationModel.pageSize, searchQuery, appliedStateFilter?.id, appliedCityFilter?.id, appliedIsActiveFilter],
    queryFn: () =>
      routeApi.getRoutes({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
        state: appliedStateFilter?.id ? String(appliedStateFilter.id) : undefined,
        city: appliedCityFilter?.id ? String(appliedCityFilter.id) : undefined,
        is_active: isActiveFilter === 'true' ? true : isActiveFilter === 'false' ? false : undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routeApi.deleteRoute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toastSuccess('Route deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedRoute(null);
    },
    onError: (error: any) => {
      toastError(error?.response?.data?.detail || 'Failed to delete route');
    },
  });

  const handleSearchInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  }, []);

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportApi.genericExport('Route');
      toastSuccess('Export downloaded successfully');
    } catch {
      toastError('Failed to export routes');
    } finally {
      setExporting(false);
    }
  };

  const handleBack = () => navigate('/masters');
  const handleAdd = () => navigate('/masters/route/add');
  const handleView = (route: Route) => {
    setViewRoute(route);
    setViewDialogOpen(true);
  };
  const handleEdit = (route: Route) => navigate(`/masters/route/edit/${route.id}`);
  const handleDelete = (route: Route) => {
    setSelectedRoute(route);
    setDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = () => {
    if (selectedRoute) {
      deleteMutation.mutate(selectedRoute.id);
    }
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => setFilterAnchorEl(null);


  const handleApplyFilters = () => {
    setAppliedStateFilter(stateFilter);
    setAppliedCityFilter(cityFilter);
    setAppliedIsActiveFilter(isActiveFilter);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
  };

    const handleClearFilters = () => { setFilterAnchorEl(null);
    setStateFilter(null);
    setAppliedStateFilter(null);
    setCityFilter(null);
    setAppliedCityFilter(null);
    setIsActiveFilter('');
    setAppliedIsActiveFilter('');
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const columns: GridColDef[] = [
    {
      field: 'sno',
      headerName: 'S.No',
      width: 70,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const index = data?.results?.findIndex((row: Route) => row.id === params.row.id) ?? 0;
        return paginationModel.page * paginationModel.pageSize + index + 1;
      },
    },
    {
      field: 'code',
      headerName: 'Code',
      width: 130,
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
      headerName: 'Route Name',
      flex: 1,
      minWidth: 200,
      sortable: true,
    },
    {
      field: 'coverage',
      headerName: 'Coverage',
      width: 140,
      sortable: false,
      valueGetter: (_, row) => `${row.location_summary?.areas || row.coverages?.length || 0} areas`,
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 110,
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
          {hasPermission(user, 'change_route') && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => handleEdit(params.row)} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission(user, 'delete_route') && (
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => handleDelete(params.row)} color="error">
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
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <ScreenHeader title="Route Master" showBackButton onBack={handleBack} disableBox />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              placeholder="Search routes..."
              size="small"
              value={searchInput}
              onChange={handleSearchInputChange}
              sx={{
                width: 280,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 2,
                  '&:hover fieldset': { borderColor: '#006766' },
                  '&.Mui-focused fieldset': { borderColor: '#006766' },
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

            <Tooltip title="Filter">
              <IconButton
                onClick={handleFilterClick}
                sx={{
                  backgroundColor: activeFilterCount > 0 ? 'primary.main' : '#fff',
                  color: activeFilterCount > 0 ? '#fff' : '#006766',
                  border: '1px solid',
                  borderColor: activeFilterCount > 0 ? 'primary.main' : 'rgba(0, 0, 0, 0.23)',
                  borderRadius: 2,
                }}
              >
                <Badge badgeContent={activeFilterCount} color="error">
                  <FilterListIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {hasPermission(user, 'export_route') && (
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

            {hasPermission(user, 'add_route') && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
                Add Route
              </Button>
            )}
          </Box>
        </Box>

        <Popover
          open={filterOpen}
          anchorEl={filterAnchorEl}
          onClose={handleFilterClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: 1 }}
        >
          <Box sx={{ p: 2, minWidth: 280 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>Filters</Typography>
              {activeFilterCount > 0 ? (
                <Button size="small" onClick={handleClearFilters}>Clear All</Button>
              ) : (
                <IconButton size="small" onClick={handleFilterClose}><CloseIcon fontSize="small" /></IconButton>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>State</Typography>
              <SearchableDropdown
                label=""
                placeholder="Select State"
                apiEndpoint={API_ENDPOINTS.STATES}
                value={stateFilter}
                onChange={(value) => {
                  setStateFilter(Array.isArray(value) ? null : value);
                  setCityFilter(null);
                  setPaginationModel((prev) => ({ ...prev, page: 0 }));
                }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>City</Typography>
              <SearchableDropdown
                label=""
                placeholder="Select City"
                apiEndpoint={API_ENDPOINTS.CITIES}
                additionalFilters={stateFilter ? { state: stateFilter.id } : undefined}
                value={cityFilter}
                onChange={(value) => {
                  setCityFilter(Array.isArray(value) ? null : value);
                  setPaginationModel((prev) => ({ ...prev, page: 0 }));
                }}
                disabled={!stateFilter}
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Status</Typography>
              <SearchableDropdown
                label=""
                apiEndpoint=""
                staticOptions={[
                  { id: 'true', name: 'Active' },
                  { id: 'false', name: 'Inactive' },
                ]}
                value={isActiveFilter ? { id: isActiveFilter, name: isActiveFilter === 'true' ? 'Active' : 'Inactive' } : null}
                onChange={(value) => {
                  const single = Array.isArray(value) ? null : value;
                  setIsActiveFilter(single ? String(single.id) : '');
                  setPaginationModel((prev) => ({ ...prev, page: 0 }));
                }}
                placeholder="All statuses"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button size="small" onClick={handleClearFilters} fullWidth variant="outlined">Clear</Button>
              <Button size="small" onClick={handleApplyFilters} fullWidth variant="contained">Apply</Button>
 </Box>

          </Box>
        </Popover>
      </Box>

      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 400, borderRadius: 0 }}>
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
      <RouteViewDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setViewRoute(null);
        }}
        route={viewRoute}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the route "{selectedRoute?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RouteList;

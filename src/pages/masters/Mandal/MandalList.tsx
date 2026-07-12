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
import { mandalApi } from '../../../api/masters.api';
import MandalFormDialog from './MandalFormDialog';
import MandalViewDialog from './MandalViewDialog';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import PlaceIcon from '@mui/icons-material/Place';
import type { Mandal, MandalFormData } from '../../../types/masters.types';
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
import { createMutationErrorHandler } from '../../../utils/errorHandling';

const MandalList: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Mandal Master');

  // State
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMandal, setSelectedMandal] = useState<Mandal | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewMandal, setViewMandal] = useState<Mandal | null>(null);
  
  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [districtFilter, setDistrictFilter] = useState<DropdownOption | null>(null);
  const [appliedDistrictFilter, setAppliedDistrictFilter] = useState<DropdownOption | null>(null);
  const [exporting, setExporting] = useState(false);
  
  // Filter popover handlers
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  const handleApplyFilters = () => {
    setAppliedDistrictFilter(districtFilter);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
  };

  const handleClearFilters = () => {
    setFilterAnchorEl(null);
    setDistrictFilter(null);
    setAppliedDistrictFilter(null);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };
  
  const filterOpen = Boolean(filterAnchorEl);
  const activeFilterCount = appliedDistrictFilter ? 1 : 0;

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Mandal', icon: <PlaceIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Debounced search
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

  // Fetch mandals
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['mandals', paginationModel.page, paginationModel.pageSize, searchQuery, appliedDistrictFilter?.id],
    queryFn: () =>
      mandalApi.getMandals({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
        district: appliedDistrictFilter?.id ? String(appliedDistrictFilter.id) : undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: mandalApi.createMandal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mandals'] });
      queryClient.refetchQueries({ queryKey: ['mandals'] });
      setFormOpen(false);
      toastSuccess('Mandal created successfully');
    },
    onError: createMutationErrorHandler(toastError, 'Failed to create mandal', 'Mandal'),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MandalFormData }) =>
      mandalApi.updateMandal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mandals'] });
      queryClient.refetchQueries({ queryKey: ['mandals'] });
      setFormOpen(false);
      setSelectedMandal(null);
      toastSuccess('Mandal updated successfully');
    },
    onError: createMutationErrorHandler(toastError, 'Failed to update mandal', 'Mandal'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: mandalApi.deleteMandal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mandals'] });
      queryClient.refetchQueries({ queryKey: ['mandals'] });
      setDeleteDialogOpen(false);
      setSelectedMandal(null);
      toastSuccess('Mandal deleted successfully');
    },
    onError: createMutationErrorHandler(toastError, 'Failed to delete mandal', 'Mandal'),
  });

  // Handlers
  const handleAdd = () => {
    setSelectedMandal(null);
    setFormOpen(true);
  };

  const handleView = (mandal: Mandal) => {
    setViewMandal(mandal);
    setViewDialogOpen(true);
  };

  const handleEdit = (mandal: Mandal) => {
    setSelectedMandal(mandal);
    setFormOpen(true);
  };

  const handleDelete = (mandal: Mandal) => {
    setSelectedMandal(mandal);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: MandalFormData) => {
    if (selectedMandal) {
      await updateMutation.mutateAsync({ id: selectedMandal.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedMandal) {
      deleteMutation.mutate(selectedMandal.id);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportApi.genericExport('Mandal');
      toastSuccess('Export downloaded successfully');
    } catch {
      toastError('Failed to export mandals');
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
        const index = data?.results?.findIndex((row: Mandal) => row.id === params.row.id) ?? 0;
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
      headerName: 'Mandal Name',
      flex: 1,
      minWidth: 200,
      sortable: true,
    },
    {
      field: 'district',
      headerName: 'District',
      flex: 1,
      minWidth: 180,
      sortable: false,
      valueGetter: (_, row) => row.district?.name || '',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          {hasPermission(user, 'change_mandal') && (
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
          {hasPermission(user, 'delete_mandal') && (
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
          <ScreenHeader
            title="Mandal Master"
            showBackButton
            onBack={handleBack}
            disableBox
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              placeholder="Search mandals..."
              size="small"
              value={searchInput}
              onChange={handleSearchChange}
              sx={{
                width: 280,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 2,
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
                    <IconButton size="small" onClick={handleFilterClose}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>District</Typography>
                  <SearchableDropdown
                    label=""
                    placeholder="Select District"
                    apiEndpoint={API_ENDPOINTS.DISTRICTS}
                    value={districtFilter}
                    onChange={(value) => setDistrictFilter(Array.isArray(value) ? null : value)}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button size="small" onClick={handleClearFilters} fullWidth variant="outlined">Clear</Button>
                  <Button size="small" onClick={handleApplyFilters} fullWidth variant="contained">Apply</Button>
                </Box>
              </Box>
            </Popover>
            
            {hasPermission(user, 'export_mandal') && (
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
            {hasPermission(user, 'add_mandal') && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Add New Mandal
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
              Failed to load mandals
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

      <MandalFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedMandal(null);
        }}
        onSubmit={handleFormSubmit}
        mandal={selectedMandal}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <MandalViewDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setViewMandal(null);
        }}
        mandal={viewMandal}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the mandal "{selectedMandal?.name}"? This action cannot be undone.
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

export default MandalList;

import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { hasPermission } from '../../utils/permissions';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authorizationApi } from '../../api/authorization.api';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../utils/spacing';

export default function AuthorizationDefinitionList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);

  usePageTitle('Authorization Definitions');

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<any>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Authorizations', icon: <CheckCircleIcon fontSize="small" /> },
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

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['authorizationDefinitions', paginationModel.page, paginationModel.pageSize, searchQuery],
    queryFn: () => authorizationApi.listDefinitions({
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
      search: searchQuery || undefined,
    }),
    placeholderData: (previousData) => previousData,
    refetchOnMount: 'always',
  });

  const deleteMutation = useMutation({
    mutationFn: authorizationApi.deleteDefinition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorizationDefinitions'] });
      setDeleteDialogOpen(false);
      setSelectedDefinition(null);
      toastSuccess('Authorization definition deleted successfully');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to delete authorization definition');
    },
  });

  const handleCreate = () => {
    navigate('/settings/authorization-definitions/new');
  };

  const handleView = (definition: any) => {
    navigate(`/settings/authorization-definitions/${definition.id}/view`);
  };

  const handleEdit = (definition: any) => {
    navigate(`/settings/authorization-definitions/${definition.id}`);
  };

  const handleDelete = (definition: any) => {
    setSelectedDefinition(definition);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDefinition) {
      deleteMutation.mutate(selectedDefinition.id);
    }
  };

  const columns: GridColDef[] = [
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
    { field: 'authorization_name', headerName: 'Authorization Name', minWidth: 200, flex: 1 },
    {
      field: 'screen_name',
      headerName: 'Screen',
      width: 150,
      valueGetter: (value, row) => row.screen?.content_type_detail?.name || row.screen_name || 'N/A',
    },
    {
      field: 'company',
      headerName: 'Company',
      width: 150,
      valueGetter: (value, row) => {
        if (row.has_all_companies) {
          return 'All';
        }
        const names = Array.isArray(row.companies) ? row.companies.map((c: any) => c?.name).filter(Boolean) : [];
        return names.length ? names.join(', ') : 'N/A';
      },
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 150,
      valueGetter: (value, row) => {
        if (row.has_all_locations) {
          return 'All';
        }
        const names = Array.isArray(row.locations) ? row.locations.map((l: any) => l?.name).filter(Boolean) : [];
        return names.length ? names.join(', ') : 'N/A';
      },
    },
    {
      field: 'level',
      headerName: 'Final Level',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <Chip label={`L${params.value}`} color="primary" size="small" />,
    },
    {
      field: 'auto_approve_creator_level',
      headerName: 'Auto-Approve',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Enabled' : 'Disabled'}
          color={params.value ? 'success' : 'default'}
          size="small"
          variant={params.value ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'effective_from',
      headerName: 'Effective From',
      width: 130,
      valueFormatter: (value) => value ? new Date(value).toLocaleDateString('en-GB') : 'N/A',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {hasPermission(user, 'view_authorizationdefinition') && (
            <Tooltip title="View">
              <IconButton size="small" onClick={() => handleView(params.row)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission(user, 'change_authorizationdefinition') && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => handleEdit(params.row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission(user, 'delete_authorizationdefinition') && (
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => handleDelete(params.row)}>
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
          <ScreenHeader
            title="Authorization Definitions"
            showBackButton={true}
            onBack={() => navigate('/settings')}
            disableBox
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              placeholder="Search..."
              value={searchInput}
              onChange={handleSearchChange}
              size="small"
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
            
            {hasPermission(user, 'add_authorizationdefinition') && (
              <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add Authorization
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
        </Paper>
      </Box>

      <Dialog 
        open={deleteDialogOpen} 
        onClose={(_event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            return;
          }
          setDeleteDialogOpen(false);
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Delete Authorization Definition
          <IconButton
            aria-label="close"
            onClick={() => setDeleteDialogOpen(false)}
            size="small"
            disabled={deleteMutation.isPending}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selectedDefinition?.authorization_name}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
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
}

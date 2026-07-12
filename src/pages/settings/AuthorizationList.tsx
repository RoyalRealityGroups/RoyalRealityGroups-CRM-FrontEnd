import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { hasPermission } from '../../utils/permissions';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  CheckCircle as AuthIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authorizationApi } from '../../api/authorization.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import type { Authorization, AuthorizationListParams } from '../../types/authorization.types';
import ScreenHeader from '../../components/common/ScreenHeader';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../utils/spacing';

const AuthorizationList: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Authorizations');
  
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAuth, setSelectedAuth] = useState<Authorization | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Authorizations', icon: <AuthIcon fontSize="small" /> },
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

  const queryParams: AuthorizationListParams = {
    page: paginationModel.page + 1,
    page_size: paginationModel.pageSize,
    search: searchQuery || undefined,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['authorizations', queryParams],
    queryFn: () => authorizationApi.list(queryParams),
    refetchOnMount: 'always',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => authorizationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorizations'] });
      toastSuccess('Authorization deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedAuth(null);
    },
    onError: () => {
      toastError('Failed to delete authorization');
    },
  });

  const columns: GridColDef<Authorization>[] = [
    {
      field: 'sno',
      headerName: 'S.No',
      width: 70,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => {
        const index = data?.results.findIndex((row) => row.id === params.row.id);
        return index !== undefined && index !== -1
          ? paginationModel.page * paginationModel.pageSize + index + 1
          : '-';
      },
    },
    {
      field: 'screen_name',
      headerName: 'Screen',
      flex: 1,
      minWidth: 200,
      valueGetter: (value, row) => {
        const screen = row.screen as any;
        return screen?.content_type_detail?.name || screen?.model || '-';
      },
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.row.type === 1 ? 'User' : 'Group'}
          size="small"
          color={params.row.type === 1 ? 'primary' : 'secondary'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
      valueGetter: (value, row) => {
        const group = row.group as any;
        const user = row.user as any;
        return group?.name || user?.first_name || '-';
      },
    },
    {
      field: 'level',
      headerName: 'Level',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip label={`L${params.row.level}`} size="small" color="info" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          {hasPermission(user, 'change_authorizationdefinition') && (
            <IconButton
              size="small"
              onClick={() => navigate(`/settings/authorization-definitions/${params.row.authorization_definition_id}`)}
              title="Edit"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {hasPermission(user, 'delete_authorizationdefinition') && (
            <IconButton
              size="small"
              onClick={() => {
                setSelectedAuth(params.row);
                setDeleteDialogOpen(true);
              }}
              title="Delete"
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <ScreenHeader title="Authorizations" showBackButton onBack={() => navigate('/settings')} disableBox />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              placeholder="Search..."
              size="small"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              sx={{ width: 280 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#006766' }} />
                  </InputAdornment>
                ),
              }}
            />
            {(hasPermission(user, 'add_authorization') || hasPermission(user, 'add_authorizationdefinition')) && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/settings/authorization-definitions/new')}>
              Add Authorization
            </Button>
            )}
          </Box>
        </Box>
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
                disableColumnMenu
              sx={getDataGridStyles()}
            />
          </Box>
        </Paper>
      </Box>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Authorization</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this authorization? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => selectedAuth && deleteMutation.mutate(selectedAuth.id)} color="error" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuthorizationList;

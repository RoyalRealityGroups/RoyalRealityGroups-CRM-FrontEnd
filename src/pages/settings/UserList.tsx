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
  Alert,
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
  People as PeopleIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, type UserDetail, type UserListParams, type UserDeleteResponse } from '../../api/users.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../utils/spacing';

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Users');
  
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Users', icon: <PeopleIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const queryParams: UserListParams = {
    page: paginationModel.page + 1,
    page_size: paginationModel.pageSize,
    search: searchQuery || undefined,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', queryParams],
    queryFn: () => usersApi.list(queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: (response: UserDeleteResponse) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteDialogOpen(false);
      setSelectedUser(null);

      if (response?.status === 'inactive') {
        toastError(response?.message || 'User cannot be deleted and has been marked as inactive.');
        return;
      }

      toastSuccess(response?.message || 'User deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete user';
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      toastError(message);
    },
  });

  const columns: GridColDef<UserDetail>[] = [
    {
      field: 'sno',
      headerName: 'S.No',
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const index = data?.results.findIndex(row => row.id === params.row.id);
        return index !== undefined && index !== -1 
          ? paginationModel.page * paginationModel.pageSize + index + 1 
          : '';
      },
    },
    {
      field: 'username',
      headerName: 'Username',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          onClick={() => navigate(`/settings/users/view/${params.row.id}`)}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'fullname',
      headerName: 'Full Name',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'designation',
      headerName: 'Designation',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.row.designation || '-'}
        </Typography>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 130,
    },
    {
      field: 'groups',
      headerName: 'Groups',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {params.row.groups && params.row.groups.length > 0 ? (
            params.row.groups.map((group) => (
              <Chip
                key={group.id}
                label={group.name}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))
          ) : (
            <Typography variant="caption" color="text.secondary">
              No groups
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          icon={params.row.is_active ? <ActiveIcon /> : <InactiveIcon />}
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
      filterable: false,
      renderCell: (params) => (
        <Box>
          {hasPermission(user, 'change_user') && (
            <IconButton
              size="small"
              onClick={() => navigate(`/settings/users/${params.row.id}`)}
              title="Edit"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {hasPermission(user, 'delete_user') && (
            <IconButton
              size="small"
              onClick={() => {
                setSelectedUser(params.row);
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

  const handleAdd = () => {
    navigate('/settings/users/new');
  };

  const handleDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Failed to load users</Typography>
      </Box>
    );
  }

  return (
    <Box sx={getPageContainerStyles()}>
      {/* Fixed Header */}
      <Box sx={getHeaderSectionStyles()}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <ScreenHeader
            title="Users"
            showBackButton
            onBack={() => navigate('/settings')}
            disableBox
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search users..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {hasPermission(user, 'add_user') && (
              <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add User
            </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Scrollable Content Area */}
      <Box sx={getContentSectionStyles()}>
        <Paper
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 0,
          }}
        >
          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            <DataGrid
              rows={data?.results || []}
              columns={columns}
              rowCount={data?.count || 0}
              loading={isLoading}
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={paginationModel}
              paginationMode="server"
              onPaginationModelChange={setPaginationModel}
              disableRowSelectionOnClick
                disableColumnMenu
              getRowHeight={() => 'auto'}
              sx={{
                ...getDataGridStyles(),
                '& .MuiDataGrid-cell': { 
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            />
          </Box>
        </Paper>
      </Box>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user "{selectedUser?.fullname}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
            setSelectedUser(null);
          }}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserList;

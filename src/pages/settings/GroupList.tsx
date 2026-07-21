    import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { hasPermission } from '../../utils/permissions';
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
  Groups as GroupsIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../../api/groups.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import type { Group, GroupListParams } from '../../types/auth.types';
import ScreenHeader from '../../components/common/ScreenHeader';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../utils/spacing';

const GroupList: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Groups');
  
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Groups', icon: <GroupsIcon fontSize="small" /> },
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

  const queryParams: GroupListParams = {
    page: paginationModel.page + 1,
    page_size: paginationModel.pageSize,
    search: searchQuery || undefined,
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['groups', queryParams],
    queryFn: () => groupsApi.list(queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => groupsApi.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toastSuccess(response?.message || 'Group deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedGroup(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete group';
      toastError(message);
    },
  });

  const columns: GridColDef<Group>[] = [
    {
      field: 'sno',
      headerName: 'S.No',
      width: 70,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const index = data?.results.findIndex((row) => row.id === params.row.id);
        return index !== undefined && index !== -1
          ? paginationModel.page * paginationModel.pageSize + index + 1
          : '-';
      },
    },
    {
      field: 'name',
      headerName: 'Group Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'users',
      headerName: 'Users Count',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (value, row) => row.users?.length || 0,
    },
    {
      field: 'permissions',
      headerName: 'Permissions',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Chip
          label={`${params.row.permissions?.length || 0} permissions`}
          size="small"
          color="primary"
          variant="outlined"
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
          {hasPermission(user, 'change_group') && (
            <IconButton
              size="small"
              onClick={() => navigate(`/settings/groups/${params.row.id}`)}
              title="Edit"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {hasPermission(user, 'delete_group') && (
            <IconButton
              size="small"
              onClick={() => {
                setSelectedGroup(params.row);
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

  const handleBack = () => {
    navigate('/settings');
  };

  const handleAdd = () => {
    navigate('/settings/groups/new');
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  const handleDelete = () => {
    if (selectedGroup) {
      deleteMutation.mutate(selectedGroup.id);
    }
  };

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Failed to load groups</Typography>
      </Box>
    );
  }

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
            title="Groups Master"
            showBackButton
            onBack={handleBack}
            disableBox
          />
          
          {/* Right side - Search box and Add button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              placeholder="Search groups..."
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
            {hasPermission(user, 'add_group') && (
              <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add New Group
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
            />
          </Box>
        </Paper>
      </Box>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Group</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the group "{selectedGroup?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
            setSelectedGroup(null);
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

export default GroupList;

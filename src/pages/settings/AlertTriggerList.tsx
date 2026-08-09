import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Switch,
  IconButton,
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
  Search as SearchIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  NotificationsActive as TriggerIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertTriggerApi } from '../../api/alertTrigger.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';
import type { AlertTrigger } from '../../types/alertTrigger.types';
import {
  getPageContainerStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../utils/spacing';

const AlertTriggerList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  usePageTitle('Alert Triggers');

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<AlertTrigger | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Alert Triggers', icon: <TriggerIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      if (searchInput !== searchQuery) {
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch triggers
  const { data, isLoading } = useQuery({
    queryKey: ['alertTriggers', paginationModel.page, paginationModel.pageSize, searchQuery],
    queryFn: () =>
      alertTriggerApi.list({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
      }),
  });

  // Toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      alertTriggerApi.toggleStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertTriggers'] });
      toastSuccess('Trigger status updated');
    },
    onError: () => toastError('Failed to update status'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => alertTriggerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertTriggers'] });
      toastSuccess('Trigger deleted');
      setDeleteDialogOpen(false);
      setSelectedTrigger(null);
    },
    onError: () => toastError('Failed to delete trigger'),
  });

  const handleToggle = (trigger: AlertTrigger) => {
    toggleMutation.mutate({ id: trigger.id, is_active: !trigger.is_active });
  };

  const handleDelete = (trigger: AlertTrigger) => {
    setSelectedTrigger(trigger);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTrigger) {
      deleteMutation.mutate(selectedTrigger.id);
    }
  };

  const getChannelChip = (type: number | null, typeName: string) => {
    const colorMap: Record<number, 'primary' | 'success' | 'warning'> = {
      1: 'warning',  // SMS
      2: 'primary',  // Email
      3: 'success',  // Notification (FCM)
    };
    return (
      <Chip
        label={typeName || 'N/A'}
        size="small"
        color={type ? colorMap[type] || 'default' : 'default'}
        variant="outlined"
      />
    );
  };

  const columns: GridColDef[] = [
    {
      field: 'event',
      headerName: 'Event',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {params.row.event_type_name || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.screen?.model || 'Unknown'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'module',
      headerName: 'Module',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.row.screen?.app_label || 'N/A'}
          size="small"
          color="primary"
          variant="filled"
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'channel',
      headerName: 'Channel',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => getChannelChip(params.row.type, params.row.type_name),
    },
    {
      field: 'recipient',
      headerName: 'Recipient',
      flex: 1.2,
      minWidth: 150,
      renderCell: (params) => {
        const row = params.row as AlertTrigger;
        if (row.sender_type === 1) return <Typography variant="body2">Created By</Typography>;
        if (row.sender_type === 2)
          return (
            <Typography variant="body2">
              {row.send_to_groups?.map((g) => g.name).join(', ') || 'Groups'}
            </Typography>
          );
        if (row.sender_type === 3)
          return (
            <Typography variant="body2">
              {row.alert_users?.length || 0} user(s)
            </Typography>
          );
        if (row.sender_type === 4)
          return <Typography variant="body2">Variable: {row.variable}</Typography>;
        if (row.sender_type === 5)
          return <Typography variant="body2">{row.value}</Typography>;
        return <Typography variant="body2">{row.sender_type_name || 'N/A'}</Typography>;
      },
    },
    {
      field: 'is_active',
      headerName: 'Enabled',
      width: 100,
      renderCell: (params) => (
        <Switch
          checked={params.row.is_active}
          onChange={() => handleToggle(params.row)}
          size="small"
          color="primary"
        />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => navigate(`/settings/alert-triggers/${params.row.id}`)}
            aria-label="Edit trigger"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row)}
            color="error"
            aria-label="Delete trigger"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={getPageContainerStyles()}>
      <ScreenHeader
        title="Alert Triggers"
        showBackButton
        onBack={() => navigate('/settings')}
      />

      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <TextField
          size="small"
          placeholder="Search triggers..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ width: { xs: '100%', sm: 280 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchInput ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchInput('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/settings/alert-triggers/create')}
        >
          Create Trigger
        </Button>
      </Box>

      {/* Data Grid */}
      <Paper sx={{ ...getContentSectionStyles(), p: 0 }}>
        <DataGrid
          rows={data?.results || []}
          columns={columns}
          rowCount={data?.count || 0}
          loading={isLoading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          paginationMode="server"
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          autoHeight
          getRowHeight={() => 'auto'}
          sx={{
            ...getDataGridStyles(),
            '& .MuiDataGrid-cell': { py: 1 },
          }}
        />
      </Paper>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Alert Trigger</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this trigger? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
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
};

export default AlertTriggerList;

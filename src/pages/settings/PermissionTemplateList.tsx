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
  Security as SecurityIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionTemplateApi, type PermissionTemplate } from '../../api/users.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../utils/spacing';

const PermissionTemplateList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Permission Templates');

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PermissionTemplate | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Permission Templates', icon: <SecurityIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['permissionTemplates', paginationModel.page, paginationModel.pageSize, searchQuery],
    queryFn: () => permissionTemplateApi.list({
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
      search: searchQuery || undefined,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => permissionTemplateApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissionTemplates'] });
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
      toastSuccess('Permission template deleted successfully');
    },
    onError: (error: any) => {
      toastError(error?.response?.data?.detail || 'Failed to delete template');
    },
  });

  const handleDeleteClick = (template: PermissionTemplate) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedTemplate) {
      deleteMutation.mutate(selectedTemplate.id);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Template Name',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1.5,
      minWidth: 250,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" noWrap>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'details',
      headerName: 'Screens',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value?.length || 0}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          icon={params.value ? <ActiveIcon /> : <InactiveIcon />}
          label={params.value ? 'Active' : 'Inactive'}
          size="small"
          color={params.value ? 'success' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => navigate(`/settings/permission-templates/${params.row.id}`)}
            title="Edit"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteClick(params.row)}
            title="Delete"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={getPageContainerStyles()}>
      {/* Header */}
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <ScreenHeader title="Permission Templates" disableBox />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/settings/permission-templates/new')}
            size="small"
          >
            Add Template
          </Button>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={getContentSectionStyles()}>
        {/* Search */}
        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Data Grid */}
        <Paper sx={{ height: 'calc(100vh - 280px)', width: '100%' }}>
          <DataGrid
            rows={data?.results || []}
            columns={columns}
            loading={isLoading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50, 100]}
            rowCount={data?.count || 0}
            paginationMode="server"
            disableRowSelectionOnClick
            sx={getDataGridStyles()}
          />
        </Paper>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Permission Template</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the template "{selectedTemplate?.name}"?
            This action cannot be undone.
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

export default PermissionTemplateList;

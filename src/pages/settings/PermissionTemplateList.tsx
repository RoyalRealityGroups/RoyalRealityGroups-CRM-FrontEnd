import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionTemplateApi, type PermissionTemplate } from '../../api/users.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';

const PermissionTemplateList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Permission Templates');

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
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
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1.5,
      minWidth: 250,
      valueGetter: (value: any) => value || '-',
    },
    {
      field: 'details',
      headerName: 'Screens',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (value: any) => value?.length || 0,
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          size="small"
          color={params.value ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => navigate(`/settings/permission-templates/${params.row.id}`)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => navigate(`/settings/permission-templates/${params.row.id}`)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDeleteClick(params.row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <ScreenHeader
        title="Permission Templates"
        showAddButton
        addButtonText="Add Template"
        onAdd={() => navigate('/settings/permission-templates/new')}
      />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ width: 300 }}
          />
        </Box>
      </Paper>

      <Paper sx={{ height: 620 }}>
        <DataGrid
          rows={data?.results || []}
          columns={columns}
          loading={isLoading}
          rowCount={data?.count || 0}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50, 100]}
          disableRowSelectionOnClick
        />
      </Paper>

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

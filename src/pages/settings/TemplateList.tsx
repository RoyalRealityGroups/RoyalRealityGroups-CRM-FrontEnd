import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Description as TemplateIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/axios.config';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';

interface Template {
  id: number;
  code: string;
  name: string;
  message: string;
  screen: { id: number; app_label: string; model: string } | null;
  is_active: boolean;
  created_on: string;
}

interface TemplateFormData {
  name: string;
  subject: string;
  body: string;
  is_active: boolean;
}

const templateApi = {
  list: async (params?: any) => {
    const response = await apiClient.get('/api/system/template/', { params });
    return response.data;
  },
  create: async (data: { name: string; message: string; is_active: boolean }) => {
    const response = await apiClient.post('/api/system/template/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<{ name: string; message: string; is_active: boolean }>) => {
    const response = await apiClient.put(`/api/system/template/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/api/system/template/${id}`);
  },
};

const TemplateList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  usePageTitle('Notification Templates');

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({ name: '', subject: '', body: '', is_active: true });

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Notification Templates', icon: <TemplateIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      if (searchInput !== searchQuery) setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['templates', paginationModel.page, paginationModel.pageSize, searchQuery],
    queryFn: () => templateApi.list({
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
      search: searchQuery || undefined,
    }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      // Create subject template
      await templateApi.create({ name: `${data.name} - Subject`, message: data.subject, is_active: data.is_active });
      // Create body template
      await templateApi.create({ name: `${data.name} - Body`, message: data.body, is_active: data.is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toastSuccess('Subject & Body templates created');
      closeDialog();
    },
    onError: () => toastError('Failed to create templates'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; message: string; is_active: boolean }> }) => templateApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toastSuccess('Template updated');
      closeDialog();
    },
    onError: () => toastError('Failed to update template'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => templateApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toastSuccess('Template deleted');
    },
    onError: () => toastError('Failed to delete template'),
  });

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData({ name: '', subject: '', body: '', is_active: true });
    setDialogOpen(true);
  };

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template);
    setFormData({ name: template.name, subject: template.message, body: template.message, is_active: template.is_active });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setFormData({ name: '', subject: '', body: '', is_active: true });
  };

  const handleSubmit = () => {
    if (editingTemplate) {
      if (!formData.subject.trim()) {
        toastError('Message is required');
        return;
      }
      updateMutation.mutate({ id: editingTemplate.id, data: { name: formData.name, message: formData.subject, is_active: formData.is_active } });
    } else {
      if (!formData.name.trim() || !formData.subject.trim() || !formData.body.trim()) {
        toastError('Name, subject and body are required');
        return;
      }
      createMutation.mutate(formData);
    }
  };

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Code', width: 120 },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 200 },
    {
      field: 'message',
      headerName: 'Message',
      flex: 2,
      minWidth: 250,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'is_active',
      headerName: 'Active',
      width: 80,
      renderCell: (params) => (
        <Switch checked={params.value} size="small" disabled />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => openEditDialog(params.row)} aria-label="Edit">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(params.row.id)} aria-label="Delete">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <ScreenHeader title="Notification Templates" showBackButton onBack={() => navigate('/settings')} />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search templates..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{ width: { xs: '100%', sm: 280 } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              endAdornment: searchInput ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchInput('')}><CloseIcon fontSize="small" /></IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
            Create Template
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 620 }}>
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
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Notification Template'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Template Name"
              fullWidth
              size="small"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. New Lead Notification"
              helperText={!editingTemplate ? 'Two templates will be created: "<name> - Subject" and "<name> - Body"' : undefined}
            />
            <TextField
              label="Subject"
              fullWidth
              size="small"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g. New Lead: ((instance.name))"
              helperText="Short notification title/subject line"
            />
            {!editingTemplate && (
              <TextField
                label="Body"
                fullWidth
                multiline
                rows={4}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="e.g. A new lead ((instance.name)) has been created from ((instance.lead_source)). Budget: ((instance.budget))"
                helperText="Detailed notification message body"
              />
            )}
            <Alert severity="info" sx={{ py: 0.5 }}>
              <Typography variant="caption" fontWeight={600}>Available variables:</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                <Chip label="((instance.name))" size="small" variant="outlined" />
                <Chip label="((instance.id))" size="small" variant="outlined" />
                <Chip label="((instance.code))" size="small" variant="outlined" />
                <Chip label="((instance.created_on))" size="small" variant="outlined" />
                <Chip label="((user.username))" size="small" variant="outlined" />
                <Chip label="((user.first_name))" size="small" variant="outlined" />
                <Chip label="((user.email))" size="small" variant="outlined" />
              </Box>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editingTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateList;

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
  Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Add as AddIcon, Close as CloseIcon, FileUpload as FileUploadIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { taxApi } from '../../../api/masters.api';
import TaxFormDialog from './TaxFormDialog';
import TaxViewDialog from './TaxViewDialog';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { formatDate } from '../../../utils/format';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import PercentIcon from '@mui/icons-material/Percent';
import type { Tax, TaxFormData } from '../../../types/masters.types';
import { exportApi } from '../../../api/export.api';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../../utils/spacing';

const TaxList: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Tax Master');

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<Tax | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewTax, setViewTax] = useState<Tax | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Tax', icon: <PercentIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPaginationModel(prev => ({ ...prev, page: 0 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  }, []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['taxes', paginationModel.page, paginationModel.pageSize, searchQuery],
    queryFn: () =>
      taxApi.getTaxes({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: taxApi.createTax,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      setFormOpen(false);
      toastSuccess('Tax created successfully!');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to create tax');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaxFormData }) => taxApi.updateTax(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      setFormOpen(false);
      setSelectedTax(null);
      toastSuccess('Tax updated successfully!');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to update tax');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: taxApi.deleteTax,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      setDeleteDialogOpen(false);
      setSelectedTax(null);
      toastSuccess('Tax deleted successfully!');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete tax');
    },
  });

  const handleAddClick = () => {
    setSelectedTax(null);
    setFormOpen(true);
  };

  const handleViewClick = (tax: Tax) => {
    setViewTax(tax);
    setViewDialogOpen(true);
  };

  const handleEditClick = (tax: Tax) => {
    setSelectedTax(tax);
    setFormOpen(true);
  };

  const handleDeleteClick = (tax: Tax) => {
    setSelectedTax(tax);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: TaxFormData) => {
    if (selectedTax) {
      await updateMutation.mutateAsync({ id: selectedTax.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedTax) {
      deleteMutation.mutate(selectedTax.id);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportApi.genericExport('Tax');
      toastSuccess('Export downloaded successfully');
    } catch {
      toastError('Failed to export taxes');
    } finally {
      setExporting(false);
    }
  };

  const handleBack = () => {
    navigate('/masters');
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
        const index = data?.results?.findIndex((row: Tax) => row.id === params.row.id) ?? 0;
        return paginationModel.page * paginationModel.pageSize + index + 1;
      },
    },
    {
      field: 'code',
      headerName: 'Code',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Box
          sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
          onClick={() => handleViewClick(params.row)}
        >
          {params.value}
        </Box>
      ),
    },
    {
      field: 'name',
      headerName: 'Tax Name',
      flex: 1.2,
      minWidth: 200,
    },
    {
      field: 'tax_type',
      headerName: 'Tax Type',
      flex: 0.8,
      minWidth: 120,
    },
    {
      field: 'tax_rate',
      headerName: 'Tax Rate (%)',
      flex: 0.6,
      minWidth: 100,
      renderCell: (params) => `${params.value}%`,
    },
    {
      field: 'is_cess',
      headerName: 'CESS Tax',
      flex: 0.6,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'warning' : 'default'}
          variant={params.value ? 'filled' : 'outlined'}
          size="small"
        />
      ),
    },
    {
      field: 'is_active',
      headerName: 'Status',
      flex: 0.6,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'created_on',
      headerName: 'Created On',
      flex: 0.8,
      minWidth: 150,
      valueFormatter: (value) => {
        return value ? formatDate(value, 'DD-MM-YYYY HH:mm') : '';
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.6,
      minWidth: 100,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {hasPermission(user, 'change_tax') && (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => handleEditClick(params.row)}
                sx={{ color: 'primary.main' }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission(user, 'delete_tax') && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => handleDeleteClick(params.row)}
                sx={{ color: 'error.main' }}
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
          {/* Left side - Title with back button */}
          <ScreenHeader
            title="Tax Master"
            showBackButton
            onBack={handleBack}
            disableBox
          />
          
          {/* Right side - Search box and Add button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              placeholder="Search taxes..."
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
            {hasPermission(user, 'export_tax') && (
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
            {hasPermission(user, 'add_tax') && (
              <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddClick}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add New Tax
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
              sx={getDataGridStyles()}
            />
          </Box>
        </Paper>
      </Box>

      {/* View Dialog */}
      <TaxViewDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setViewTax(null);
        }}
        tax={viewTax}
      />

      {/* Form Dialog */}
      <TaxFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedTax(null);
        }}
        onSubmit={handleFormSubmit}
        tax={selectedTax}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
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
          Delete Tax
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
            Are you sure you want to delete "{selectedTax?.name}"? This action cannot be undone.
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

export default TaxList;

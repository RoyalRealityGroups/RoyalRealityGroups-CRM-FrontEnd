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
  TextField,
  InputAdornment,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon, 
  Add as AddIcon,
  Close as CloseIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { itemTaxCompositionApi } from '../../../api/masters.api';
import ItemTaxCompositionFormDialog from '../../../components/masters/ItemTaxCompositionFormDialog';
import ItemTaxCompositionViewDialog from './ItemTaxCompositionViewDialog';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { formatDate } from '../../../utils/format';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import type { ItemTaxComposition, ItemTaxCompositionFormData, CompositionType } from '../../../types/masters.types';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../../utils/spacing';
import { exportApi } from '../../../api/export.api';

const ItemTaxCompositionList: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle('Product Tax Composition');

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [compositionTypeFilter, setCompositionTypeFilter] = useState<CompositionType | ''>('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedComposition, setSelectedComposition] = useState<ItemTaxComposition | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewComposition, setViewComposition] = useState<ItemTaxComposition | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Product Tax Composition', icon: <AccountTreeIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchQuery(searchInput);
        setPaginationModel(prev => ({ ...prev, page: 0 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  }, []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['itemTaxCompositions', paginationModel.page, paginationModel.pageSize, searchQuery, compositionTypeFilter],
    queryFn: () =>
      itemTaxCompositionApi.getItemTaxCompositions({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
        composition_type: compositionTypeFilter || undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: itemTaxCompositionApi.createItemTaxComposition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemTaxCompositions'] });
      setFormOpen(false);
      toastSuccess('Product tax composition created successfully!');
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to create product tax composition';
      if (error.response?.data) {
        const data = error.response.data;
        if (data.errors && typeof data.errors === 'object') {
          const firstError = Object.values(data.errors)[0];
          errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        } else if (data.message) {
          errorMessage = data.message;
        }
      }
      toastError(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ItemTaxCompositionFormData }) => 
      itemTaxCompositionApi.updateItemTaxComposition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemTaxCompositions'] });
      setFormOpen(false);
      setSelectedComposition(null);
      toastSuccess('Product tax composition updated successfully!');
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to update product tax composition';
      if (error.response?.data) {
        const data = error.response.data;
        if (data.errors && typeof data.errors === 'object') {
          const firstError = Object.values(data.errors)[0];
          errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        } else if (data.message) {
          errorMessage = data.message;
        }
      }
      toastError(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: itemTaxCompositionApi.deleteItemTaxComposition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemTaxCompositions'] });
      setDeleteDialogOpen(false);
      setSelectedComposition(null);
      toastSuccess('Product tax composition deleted successfully!');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete product tax composition');
    },
  });

  const handleAddClick = () => {
    setSelectedComposition(null);
    setFormOpen(true);
  };

  const handleViewClick = (composition: ItemTaxComposition) => {
    setViewComposition(composition);
    setViewDialogOpen(true);
  };

  const handleEditClick = (composition: ItemTaxComposition) => {
    setSelectedComposition(composition);
    setFormOpen(true);
  };

  const handleDeleteClick = (composition: ItemTaxComposition) => {
    setSelectedComposition(composition);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: ItemTaxCompositionFormData) => {
    if (selectedComposition) {
      await updateMutation.mutateAsync({ id: selectedComposition.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedComposition) {
      await deleteMutation.mutateAsync(selectedComposition.id);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportApi.genericExport('ItemTaxComposition');
      toastSuccess('Export downloaded successfully');
    } catch {
      toastError('Failed to export product tax compositions');
    } finally {
      setExporting(false);
    }
  };

  const handleBack = () => {
    navigate('/masters');
  };

  const columns: GridColDef<ItemTaxComposition>[] = [
    {
      field: 'sno',
      headerName: 'S.No',
      width: 70,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const index = data?.results?.findIndex((row: ItemTaxComposition) => row.id === params.row.id) ?? 0;
        return paginationModel.page * paginationModel.pageSize + index + 1;
      },
    },
    {
      field: 'item_name',
      headerName: 'Product',
      flex: 1.5,
      minWidth: 200,
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
      field: 'tax',
      headerName: 'Tax',
      flex: 1,
      minWidth: 150,
      valueGetter: (value, row) => row.tax.name,
    },
    {
      field: 'tax_rate',
      headerName: 'Tax Rate',
      width: 120,
      valueGetter: (value, row) => `${row.tax.tax_rate}%`,
    },
    {
      field: 'composition_type',
      headerName: 'Type',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.row.composition_type}
          size="small"
          color={params.row.composition_type === 'PRIMARY' ? 'primary' : 'secondary'}
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      field: 'is_cess',
      headerName: 'CESS',
      width: 100,
      renderCell: (params) => (
        params.row.tax.is_cess ? (
          <Chip label="CESS" size="small" color="warning" sx={{ fontWeight: 500 }} />
        ) : (
          <Chip label="GST" size="small" color="info" sx={{ fontWeight: 500 }} />
        )
      ),
    },
    {
      field: 'effective_from',
      headerName: 'Effective From',
      width: 140,
      valueFormatter: (value) => formatDate(value),
    },
    {
      field: 'effective_to',
      headerName: 'Effective To',
      width: 140,
      valueFormatter: (value) => value ? formatDate(value) : 'Current',
      renderCell: (params) => (
        params.row.effective_to ? (
          formatDate(params.row.effective_to)
        ) : (
          <Chip label="Current" size="small" color="success" variant="outlined" />
        )
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.6,
      minWidth: 100,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {hasPermission(user, 'change_itemtaxcomposition') && (
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
          {hasPermission(user, 'delete_itemtaxcomposition') && (
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
            title="Product Tax Composition"
            showBackButton
            onBack={handleBack}
            disableBox
          />
          
          {/* Right side - Search, Filter and Add button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              placeholder="Search by product or tax name..."
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
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={compositionTypeFilter}
                label="Type"
                onChange={(e) => {
                  setCompositionTypeFilter(e.target.value as CompositionType | '');
                  setPaginationModel(prev => ({ ...prev, page: 0 }));
                }}
                sx={{
                  backgroundColor: '#fff',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#006766',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#006766',
                  },
                }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="PRIMARY">PRIMARY</MenuItem>
                <MenuItem value="CESS">CESS</MenuItem>
              </Select>
            </FormControl>
            {hasPermission(user, 'export_itemtaxcomposition') && (
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
            {hasPermission(user, 'add_itemtaxcomposition') && (
              <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddClick}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add Composition
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
      <ItemTaxCompositionViewDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setViewComposition(null);
        }}
        composition={viewComposition}
      />

      {/* Form Dialog */}
      <ItemTaxCompositionFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedComposition(null);
        }}
        onSubmit={handleFormSubmit}
        composition={selectedComposition}
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
          Delete Product Tax Composition
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
            Are you sure you want to delete this product tax composition?
            {selectedComposition && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <strong>Product:</strong> {selectedComposition.item_name}<br />
                <strong>Tax:</strong> {selectedComposition.tax.name}<br />
                <strong>Type:</strong> {selectedComposition.composition_type}
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
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

export default ItemTaxCompositionList;

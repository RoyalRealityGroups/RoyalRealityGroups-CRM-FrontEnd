import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  MenuItem,
  Avatar,
  Popover,
  Badge,
  Divider,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon, 
  Add as AddIcon, 
  Close as CloseIcon,
  FilterList as FilterListIcon,
  FileUpload as FileUploadIcon,
  Visibility as VisibilityIcon 
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { itemApi, categoryApi, brandApi } from '../../../api/masters.api';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import InventoryIcon from '@mui/icons-material/Inventory';
import type { Item } from '../../../types/masters.types';
import { exportApi } from '../../../api/export.api';
import {
  PAGE_SPACING,
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../../utils/spacing';
import type { DropdownOption } from '../../../types/common.types';

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', ''].includes(normalized)) return false;
  }
  return Boolean(value);
};

const ItemList: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  // Set page title
  usePageTitle('Item Master');

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string |any>('');
  const [appliedCategoryFilter, setAppliedCategoryFilter] = useState<string | any>('');
  const [brandFilter, setBrandFilter] = useState<string | any>('');
  const [appliedBrandFilter, setAppliedBrandFilter] = useState<string | any>('');
  const [itemTypeFilter, setItemTypeFilter] = useState<number | undefined | any>(undefined);
  const [appliedItemTypeFilter, setAppliedItemTypeFilter] = useState<number | undefined | any>(undefined);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const filterOpen = Boolean(filterAnchorEl);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Product', icon: <InventoryIcon fontSize="small" /> },
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
  }, [searchInput, searchQuery]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  }, []);

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };


  const handleApplyFilters = () => {
    setAppliedCategoryFilter(categoryFilter);
    setAppliedBrandFilter(brandFilter);
    setAppliedItemTypeFilter(itemTypeFilter);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
  };

    const handleClearFilters = () => { setFilterAnchorEl(null);
    setCategoryFilter('');
    setAppliedCategoryFilter(null);
    setBrandFilter('');
    setAppliedBrandFilter(null);
    setItemTypeFilter(undefined);
    setAppliedItemTypeFilter('');
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const activeFilterCount = [categoryFilter, brandFilter, itemTypeFilter].filter(f => f !== '' && f !== undefined).length;

  // Fetch filter options
  const { data: categories } = useQuery({
    queryKey: ['categories', 'mini'],
    queryFn: () => categoryApi.getCategoriesMini(),
  });

  const { data: brands } = useQuery({
    queryKey: ['brands', 'mini'],
    queryFn: () => brandApi.getBrandsMini(),
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['items', paginationModel.page, paginationModel.pageSize, searchQuery, appliedCategoryFilter, appliedBrandFilter, appliedItemTypeFilter],
    queryFn: () =>
      itemApi.getItems({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
        category: appliedCategoryFilter || undefined,
        brand: appliedBrandFilter || undefined,
        item_type: appliedItemTypeFilter || undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  // Debug: Log the data to see what fields are returned
  useEffect(() => {
    if (data?.results && data.results.length > 0) {
    }
  }, [data]);

  const deleteMutation = useMutation({
    mutationFn: itemApi.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      toastSuccess('Item deleted successfully!');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete item');
    },
  });

  const handleAddClick = () => {
    navigate('/masters/items/add');
  };

  const handleViewClick = (item: Item) => {
    navigate(`/masters/items/view/${item.id}`);
  };

  const handleEditClick = (item: Item) => {
    navigate(`/masters/items/edit/${item.id}`);
  };

  const handleDeleteClick = (item: Item) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedItem) {
      deleteMutation.mutate(selectedItem.id);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportApi.genericExport('Item');
      toastSuccess('Export downloaded successfully');
    } catch {
      toastError('Failed to export items');
    } finally {
      setExporting(false);
    }
  };

  const handleBack = () => {
    navigate('/masters');
  };

  const rows = useMemo(() => {
    return (data?.results || []).map((item) => ({
      ...item,
      is_active: toBoolean(item.is_active),
    }));
  }, [data?.results]);

  const columns: GridColDef[] = [
    {
      field: 'sno',
      headerName: 'S.No',
      width: 70,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const index = data?.results?.findIndex((row: any) => row.id === params.row.id) ?? 0;
        return paginationModel.page * paginationModel.pageSize + index + 1;
      },
    },
    { field: 'code', headerName: 'Product Code', flex: 1, minWidth: 130 },
    { field: 'name', headerName: 'Product Name', flex: 1.8, minWidth: 200 },
    { field: 'company_name', headerName: 'Company', flex: 1, minWidth: 120 },
    { field: 'category_name', headerName: 'Category', flex: 1.2, minWidth: 150 },
    { 
      field: 'base_uom_name', 
      headerName: 'Base Unit', 
      flex: 0.8, 
      minWidth: 100,
    },
    {
      field: 'bag_weight',
      headerName: 'Bag Weight',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => {
        if (!params.value) return '-';
        const baseUomCode = params.row.base_uom_code || '';
        // Remove trailing zeros and decimal point if not needed
        const formattedValue = parseFloat(params.value).toString();
        return `${formattedValue} ${baseUomCode}`;
      },
    },
    {
      field: 'is_active',
      headerName: 'Status',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => {
        const isActive = toBoolean(params.row.is_active);
        return (
        <Chip
          label={isActive ? 'Active' : 'Inactive'}
          color={isActive ? 'success' : 'default'}
          size="small"
        />
      );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.7,
      minWidth: 100,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'center' }}>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => handleViewClick(params.row)} sx={{ color: 'info.main' }}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {hasPermission(user, 'change_item') && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => handleEditClick(params.row)} sx={{ color: 'primary.main' }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission(user, 'delete_item') && (
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => handleDeleteClick(params.row)} sx={{ color: 'error.main' }}>
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
            title="Product Master"
            showBackButton
            onBack={handleBack}
            disableBox
          />
          
          {/* Right side - Search, filters and Add button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search items..."
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
            
            {/* Filter Button */}
            <Tooltip title="Filter">
              <IconButton
                onClick={handleFilterClick}
                sx={{
                  backgroundColor: activeFilterCount > 0 ? 'primary.main' : '#fff',
                  color: activeFilterCount > 0 ? '#fff' : '#006766',
                  border: '1px solid',
                  borderColor: activeFilterCount > 0 ? 'primary.main' : 'rgba(0, 0, 0, 0.23)',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: activeFilterCount > 0 ? 'primary.dark' : 'rgba(0, 103, 102, 0.04)',
                  },
                }}
              >
                <Badge badgeContent={activeFilterCount} color="error">
                  <FilterListIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* Filter Popover */}
            <Popover
              open={filterOpen}
              anchorEl={filterAnchorEl}
              onClose={handleFilterClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              sx={{ mt: 1 }}
            >
              <Box sx={{ p: 2, minWidth: 300 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Filters
                  </Typography>
                  {activeFilterCount > 0 ? (
                    <Button size="small" onClick={handleClearFilters}>
                      Clear All
                    </Button>
                  ) : (
                    <IconButton size="small" onClick={handleFilterClose}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                {/* Item Type Filter */}
                {/* <TextField
                  select
                  label="Item Type"
                  value={itemTypeFilter ?? ''}
                  onChange={(e) => {
                    setItemTypeFilter(e.target.value ? Number(e.target.value) : undefined);
                  }}
                  size="small"
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="1">Material</MenuItem>
                  {/* <MenuItem value="2">Service</MenuItem> */}
                {/* </TextField> */} 
                
                {/* Category Filter */}
                <TextField
                  select
                  label="Category"
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                  }}
                  size="small"
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories?.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
                
                {/* Brand Filter */}
                <TextField
                  select
                  label="Brand"
                  value={brandFilter}
                  onChange={(e) => {
                    setBrandFilter(e.target.value);
                  }}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="">All Brands</MenuItem>
                  {brands?.map((brand) => (
                    <MenuItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </MenuItem>
                  ))}
                </TextField>                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button size="small" onClick={handleClearFilters} fullWidth variant="outlined">Clear</Button>
              <Button size="small" onClick={handleApplyFilters} fullWidth variant="contained">Apply</Button>
 </Box>

              </Box>
            </Popover>
            
            {hasPermission(user, 'export_item') && (
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
            {hasPermission(user, 'add_item') && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddClick}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Add New Product
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
              rows={rows}
              columns={columns}
              rowCount={data?.count || 0}
              loading={isLoading || isFetching}
              pageSizeOptions={[10, 20, 50, 100]}
              paginationModel={paginationModel}
              paginationMode="server"
              onPaginationModelChange={setPaginationModel}
              disableRowSelectionOnClick
              sx={{
                ...getDataGridStyles(),
                '& .MuiDataGrid-cell': {
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            />
          </Box>
        </Paper>
      </Box>

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
          Delete product
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
            Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
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

export default ItemList;

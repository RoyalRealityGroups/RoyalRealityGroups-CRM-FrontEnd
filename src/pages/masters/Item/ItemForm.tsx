import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  MenuItem,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Avatar,
} from '@mui/material';
import { Save as SaveIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../../components/common/ScreenHeader';
import ItemUOMConversionManager from '../../../components/masters/ItemUOMConversionManager';
import ItemTaxCompositionManager from '../../../components/masters/ItemTaxCompositionManager';

import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { generalSettingsApi, itemApi, categoryApi, brandApi, uomApi } from '../../../api/masters.api';
import apiClient from '../../../api/axios.config';
import SearchableDropdown from '../../../components/common/SearchableDropdown';
import SearchableDropdownWithCreate from '../../../components/common/SearchableDropdownWithCreate';
import { API_ENDPOINTS } from '../../../utils/constants';
import type { DropdownOption } from '../../../types/common.types';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import InventoryIcon from '@mui/icons-material/Inventory';
import type { ItemFormData, CategoryFormData, BrandFormData, UOMFormData } from '../../../types/masters.types';
import CategoryFormDialog from '../Category/CategoryFormDialog';
import BrandFormDialog from '../Brand/BrandFormDialog';
import UOMFormDialog from '../Uom/UOMFormDialog';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../../../utils/spacing';

interface FieldConfig {
  id: number;
  field_name: string;
  display_label: string;
  is_visible: boolean;
  is_required: boolean;
  is_readonly: boolean;
  display_order: number;
  section: string;
}

const ITEM_DEFAULT_VALUES: ItemFormData = {
  code: '',
  name: '',
  description: '',
  company: '',
  item_type: 1,
  product_type: 1,
  category: '',
  brand: '',
  bag_weight: undefined,
  base_uom: '',
  hsn_code: '',
  sac_code: '',
  tax_category: 1,
  cess_applicable: false,
  cost_price: undefined,
  selling_price: undefined,
  mrp: undefined,
  min_price: undefined,
  price_includes_tax: false,
  is_stockable: true,
  track_inventory: true,
  is_active: true,
  is_saleable: true,
  is_purchasable: true,
  is_featured: false,
  allow_discount: true,
  allow_negative_stock: false,
  sync_with_erp: false,
  weight_unit: 'kg',
};

const ItemForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const isEditMode = Boolean(id);

  usePageTitle(isEditMode ? 'Edit Product' : 'Add Product');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, FieldConfig>>({});
  const [pendingConversions, setPendingConversions] = useState<any[]>([]);
  const [pendingTaxCompositions, setPendingTaxCompositions] = useState<any[]>([]);

  // Refresh keys to force dropdown refetch after quick-create
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);
  const [brandRefreshKey, setBrandRefreshKey] = useState(0);
  const [uomRefreshKey, setUomRefreshKey] = useState(0);

  
  // State for dropdown selected values with names
  const [selectedCompany, setSelectedCompany] = useState<DropdownOption | null>(null);
  const [selectedBaseUom, setSelectedBaseUom] = useState<DropdownOption | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DropdownOption | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<DropdownOption | null>(null);

  // Quick create dialog states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [uomDialogOpen, setUomDialogOpen] = useState(false);
  const [isCreatingMaster, setIsCreatingMaster] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ItemFormData>({
    defaultValues: ITEM_DEFAULT_VALUES,
  });

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Product', path: '/masters/items', icon: <InventoryIcon fontSize="small" /> },
      { label: isEditMode ? 'Edit Product' : 'Add Product' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode]);

  // Fetch item data for edit mode
  const { data: itemData, isLoading: isLoadingItem } = useQuery({
    queryKey: ['item', id],
    queryFn: () => itemApi.getItem(id!),
    enabled: isEditMode,
  });

  // Fetch field configurations
  const { data: fieldConfigsData } = useQuery({
    queryKey: ['itemFieldConfigs'],
    queryFn: async () => {
      const response = await apiClient.get('/api/masters/item-field-config/');
      return response.data;
    },
  });

  const { data: generalSettings } = useQuery({
    queryKey: ['generalSettings'],
    queryFn: generalSettingsApi.getGeneralSettings,
  });

  // Convert field configs array to keyed object
  useEffect(() => {
    if (fieldConfigsData) {
      const configMap: Record<string, FieldConfig> = {};
      fieldConfigsData.forEach((config: FieldConfig) => {
        configMap[config.field_name] = config;
      });
      setFieldConfigs(configMap);
    }
  }, [fieldConfigsData]);

  // Helper functions for field configuration
  const isFieldVisible = (fieldName: string) => {
    if (fieldName === 'company' && isCompanyMandatoryBySetting) {
      return true;
    }
    return fieldConfigs[fieldName]?.is_visible ?? true;
  };

  const isFieldRequired = (fieldName: string) => {
    return fieldConfigs[fieldName]?.is_required ?? false;
  };

  const isFieldEnabled = (fieldName: string) => {
    // is_readonly = false means field is editable (enabled)
    // is_readonly = true means field is read-only (disabled)
    return !(fieldConfigs[fieldName]?.is_readonly ?? false);
  };

  const getFieldLabel = (fieldName: string, defaultLabel: string) => {
    const label = fieldConfigs[fieldName]?.display_label || defaultLabel;
    return label.replace(/\bItem\b/g, 'Product');
  };

  // Check if any field in a section is visible
  const isSectionVisible = (section: string) => {
    if (!fieldConfigsData) return true; // Show section if configs not loaded yet
    return fieldConfigsData.some((config: FieldConfig) => 
      config.section === section && config.is_visible
    );
  };

  const isCompanyMandatoryBySetting = true;

  // Populate form when item data is loaded
  useEffect(() => {
    if (itemData) {
      
      reset({
        code: itemData.code,
        name: itemData.name,
        description: itemData.description || '',
        company: itemData.company || '',
        item_type: itemData.item_type,
        product_type: itemData.product_type,
        category: itemData.category,
        brand: itemData.brand || '',
        bag_weight: itemData.bag_weight,
        base_uom: itemData.base_uom,
        hsn_code: itemData.hsn_code || '',
        sac_code: itemData.sac_code || '',
        tax_category: itemData.tax_category,
        cess_applicable: itemData.cess_applicable,
        cess_rate: itemData.cess_rate,
        cost_price: itemData.cost_price,
        selling_price: itemData.selling_price,
        mrp: itemData.mrp,
        min_price: itemData.min_price,
        price_includes_tax: itemData.price_includes_tax,
        is_stockable: itemData.is_stockable,
        track_inventory: itemData.track_inventory,
        min_stock_level: itemData.min_stock_level,
        max_stock_level: itemData.max_stock_level,
        reorder_level: itemData.reorder_level,
        reorder_quantity: itemData.reorder_quantity,
        weight: itemData.weight,
        weight_unit: itemData.weight_unit || 'kg',
        length: itemData.length,
        width: itemData.width,
        height: itemData.height,
        is_active: itemData.is_active,
        is_saleable: itemData.is_saleable,
        is_purchasable: itemData.is_purchasable,
        is_featured: itemData.is_featured,
        allow_discount: itemData.allow_discount,
        allow_negative_stock: itemData.allow_negative_stock,
        manufacturer: itemData.manufacturer || '',
        warranty_period: itemData.warranty_period,
        warranty_description: itemData.warranty_description || '',
        sku: itemData.sku || '',
        barcode: itemData.barcode || '',
        short_name: itemData.short_name || '',
        sync_with_erp: itemData.sync_with_erp,
      });
      
      // Set dropdown states with names
      if (itemData.company) {
        setSelectedCompany({ id: itemData.company, name: itemData.company_name || '' });
      }
      if (itemData.base_uom) {
        const data = itemData as any;
        setSelectedBaseUom({ id: itemData.base_uom, name: itemData.base_uom_name || '', code: data.base_uom_code });
      }
      if (itemData.category) {
        setSelectedCategory({ id: itemData.category, name: itemData.category_name || '' });
      }
      if (itemData.brand) {
        setSelectedBrand({ id: itemData.brand, name: itemData.brand_name || '' });
      }
      
      if (itemData.image) {
        setImagePreview(itemData.image);
      }
    }
  }, [itemData, reset]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: itemApi.createItem,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      
      toastSuccess('Product created successfully');
      setTimeout(() => {
        navigate('/masters/items');
      }, 1000);
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to create product';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.code) {
          errorMessage = Array.isArray(data.code) ? data.code[0] : data.code;
        }
      }
      toastError(errorMessage);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: ItemFormData) => itemApi.updateItem(id!, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      
      toastSuccess('Product updated successfully');
      setTimeout(() => {
        navigate('/masters/items');
      }, 1000);
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to update product';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.code) {
          errorMessage = Array.isArray(data.code) ? data.code[0] : data.code;
        }
      }
      toastError(errorMessage);
    },
  });

  const onSubmit = async (data: ItemFormData) => {
    try {
      // Add UOM conversions and tax mappings to the data payload
      const payload = {
        ...data,
        uom_conversions: pendingConversions,
        tax_compositions_data: pendingTaxCompositions
      };
      
      if (isEditMode) {
        await updateMutation.mutateAsync(payload as any);
      } else {
        await createMutation.mutateAsync(payload as any);
      }
    } catch (error) {
      // Error is handled in mutation's onError
    }
  };

  const handleBack = () => {
    navigate('/masters/items');
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, onChange: any) => {
    const file = event.target.files?.[0];
    if (file) {
      onChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick create handlers
  const handleCategoryCreate = async (data: CategoryFormData) => {
    setIsCreatingMaster(true);
    try {
      const newCategory = await categoryApi.createCategory(data);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSelectedCategory({ id: newCategory.id, name: newCategory.name });
      reset({ ...watch(), category: newCategory.id });
      setCategoryRefreshKey(prev => prev + 1); // Force dropdown refresh
      toastSuccess('Category created successfully');
      setCategoryDialogOpen(false);
    } catch (error: any) {
      let errorMessage = 'Failed to create category';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.name) {
          errorMessage = Array.isArray(data.name) ? data.name[0] : data.name;
        }
      }
      toastError(errorMessage);
    } finally {
      setIsCreatingMaster(false);
    }
  };

  const handleBrandCreate = async (data: BrandFormData) => {
    setIsCreatingMaster(true);
    try {
      const newBrand = await brandApi.createBrand(data);
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setSelectedBrand({ id: newBrand.id, name: newBrand.name });
      reset({ ...watch(), brand: newBrand.id });
      setBrandRefreshKey(prev => prev + 1); // Force dropdown refresh
      toastSuccess('Brand created successfully');
      setBrandDialogOpen(false);
    } catch (error: any) {
      let errorMessage = 'Failed to create brand';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.name) {
          errorMessage = Array.isArray(data.name) ? data.name[0] : data.name;
        }
      }
      toastError(errorMessage);
    } finally {
      setIsCreatingMaster(false);
    }
  };

  const handleUOMCreate = async (data: UOMFormData) => {
    setIsCreatingMaster(true);
    try {
      const newUOM = await uomApi.createUOM(data);
      queryClient.invalidateQueries({ queryKey: ['uoms'] });
      setSelectedBaseUom({ id: newUOM.id, name: newUOM.name, code: newUOM.code });
      reset({ ...watch(), base_uom: newUOM.id });
      setUomRefreshKey(prev => prev + 1); // Force dropdown refresh
      toastSuccess('UOM created successfully');
      setUomDialogOpen(false);
    } catch (error: any) {
      let errorMessage = 'Failed to create UOM';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.name) {
          errorMessage = Array.isArray(data.name) ? data.name[0] : data.name;
        }
      }
      toastError(errorMessage);
    } finally {
      setIsCreatingMaster(false);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingItem) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
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
          <ScreenHeader
            title={isEditMode ? 'Edit Product' : 'Add Product'}
            showBackButton
            onBack={handleBack}
            disableBox
          />
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="item-form"
              variant="contained"
              color="primary"
              size="small"
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Scrollable Content Area */}
      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ p: 3, borderRadius: 0 }}>
          <form id="item-form" onSubmit={handleSubmit(onSubmit)}>
            {/* Basic Information Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Basic Information
            </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Avatar src={imagePreview || undefined} sx={{ width: 100, height: 100 }} variant="rounded">
                        <CloudUploadIcon sx={{ fontSize: 40 }} />
                      </Avatar>
                      <Controller
                        name="image"
                        control={control}
                        render={({ field: { onChange, value, ...field } }) => (
                          <Button variant="outlined" component="label" size="small">
                            Upload Image
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handleImageChange(e, onChange)}
                              {...field}
                            />
                          </Button>
                        )}
                      />
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 8, md: 9 }}>
                    <Grid container spacing={3}>
                      {/* <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                          {getFieldLabel('code', 'Product Code')}
                        </Typography>
                        <Controller
                          name="code"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="e.g., ITEM001"
                              fullWidth
                              size="small"
                              error={!!errors.code}
                              helperText={errors.code?.message || 'Leave empty for auto-generation'}
                              disabled={isSubmitting || !isFieldEnabled('code')}
                            />
                          )}
                        />
                      </Grid> */}

                      {isFieldVisible('name') && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                          {getFieldLabel('name', 'Product Name')} {isFieldRequired('name') && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}
                        </Typography>
                        <Controller
                          name="name"
                          control={control}
                          rules={{ required: isFieldRequired('name') ? 'Name is required' : false }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              placeholder="Product name"
                              fullWidth
                              size="small"
                              error={!!errors.name}
                              helperText={errors.name?.message}
                              disabled={isSubmitting || !isFieldEnabled('name')}
                            />
                          )}
                        />
                      </Grid>
                      )}
                    </Grid>
                  </Grid>

                  {isFieldVisible('short_name') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('short_name', 'Short Name')} {isFieldRequired('short_name') && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="short_name"
                      control={control}
                      rules={{ required: isFieldRequired('short_name') ? 'Short name is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value || ''}
                          placeholder="Short name"
                          fullWidth
                          size="small"
                          error={!!errors.short_name}
                          helperText={errors.short_name?.message}
                          disabled={isSubmitting || !isFieldEnabled('short_name')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('item_type') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('item_type', 'Product Type')} {isFieldRequired('item_type') && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="item_type"
                      control={control}
                      rules={{ required: isFieldRequired('item_type') ? 'Item type is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          size="small"
                          error={!!errors.item_type}
                          helperText={errors.item_type?.message}
                          disabled={isSubmitting || !isFieldEnabled('item_type')}
                        >
                          <MenuItem value={1}>Material</MenuItem>
                          {/* <MenuItem value={2}>Service</MenuItem> */}
                        </TextField>
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('product_type') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('product_category_type', 'Product Category Type')} {isFieldRequired('product_category_type') && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="product_type"
                      control={control}
                      rules={{ required: isFieldRequired('product_type') ? 'Product type is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          size="small"
                          error={!!errors.product_type}
                          helperText={errors.product_type?.message}
                          disabled={isSubmitting || !isFieldEnabled('product_type')}
                        >
                          <MenuItem value={1}>Standard</MenuItem>
                          {/* <MenuItem value={2}>Variant</MenuItem>
                          <MenuItem value={3}>Combo</MenuItem> */}
                        </TextField>
                      )}
                    />
                  </Grid>
                  )}

                  {/* {isFieldVisible('sku') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('sku', 'SKU')} {isFieldRequired('sku') && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="sku"
                      control={control}
                      rules={{ required: isFieldRequired('sku') ? 'SKU is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value || ''}
                          placeholder="Stock Keeping Unit"
                          fullWidth
                          size="small"
                          error={!!errors.sku}
                          helperText={errors.sku?.message}
                          disabled={isSubmitting || !isFieldEnabled('sku')}
                        />
                      )}
                    />
                  </Grid>
                  )} */}

                  {isFieldVisible('barcode') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('barcode', 'Barcode')} {isFieldRequired('barcode') && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="barcode"
                      control={control}
                      rules={{ required: isFieldRequired('barcode') ? 'Barcode is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value || ''}
                          placeholder="Auto-generated (e.g., ITM-1)"
                          fullWidth
                          size="small"
                          error={!!errors.barcode}
                          helperText={errors.barcode?.message}
                          disabled={isSubmitting || !isFieldEnabled('barcode')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('company') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('company', 'Company')} {(isFieldRequired('company') || isCompanyMandatoryBySetting) && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="company"
                      control={control}
                      rules={{ required: (isFieldRequired('company') || isCompanyMandatoryBySetting) ? 'Company is required' : false }}
                      render={({ field }) => (
                        <SearchableDropdown
                          label=""
                          placeholder="Select Company"
                          apiEndpoint={API_ENDPOINTS.COMPANIES_DROPDOWN}
                          value={selectedCompany}
                          onChange={(value) => {
                            const singleValue = Array.isArray(value) ? null : value;
                            setSelectedCompany(singleValue);
                            field.onChange(singleValue?.id || '');
                          }}
                          error={!!errors.company}
                          helperText={errors.company?.message}
                          disabled={isSubmitting || !isFieldEnabled('company')}
                          required={isFieldRequired('company') || isCompanyMandatoryBySetting}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('description') && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('description', 'Description')} {isFieldRequired('description') && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="description"
                      control={control}
                      rules={{ required: isFieldRequired('description') ? 'Description is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          placeholder="Product description"
                          fullWidth
                          size="small"
                          multiline
                          rows={3}
                          error={!!errors.description}
                          helperText={errors.description?.message}
                          disabled={isSubmitting || !isFieldEnabled('description')}
                        />
                      )}
                    />
                  </Grid>
                  )}
                </Grid>

                {isSectionVisible('classification') && (
                <>
                <Divider sx={{ my: 4 }} />

                {/* Classification Section */}
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  Classification
                </Typography>
                <Grid container spacing={3}>
                  {isFieldVisible('category') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('category', 'Category')} {isFieldRequired('category') && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="category"
                      control={control}
                      rules={{ required: isFieldRequired('category') ? 'Category is required' : false }}
                      render={({ field }) => (
                        <SearchableDropdownWithCreate
                          label=""
                          placeholder="Select Category"
                          apiEndpoint={API_ENDPOINTS.CATEGORIES}
                          value={selectedCategory}
                          onChange={(value) => {
                            const singleValue = Array.isArray(value) ? null : value;
                            setSelectedCategory(singleValue);
                            field.onChange(singleValue?.id || '');
                          }}
                          onCreateClick={() => setCategoryDialogOpen(true)}
                          error={!!errors.category}
                          helperText={errors.category?.message}
                          disabled={isSubmitting || !isFieldEnabled('category')}
                          required={isFieldRequired('category')}
                          refreshKey={categoryRefreshKey}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('brand') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('brand', 'Brand')} {isFieldRequired('brand') && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="brand"
                      control={control}
                      rules={{ required: isFieldRequired('brand') ? 'Brand is required' : false }}
                      render={({ field }) => (
                        <SearchableDropdownWithCreate
                          label=""
                          placeholder="Select Brand"
                          apiEndpoint={API_ENDPOINTS.BRANDS}
                          value={selectedBrand}
                          onChange={(value) => {
                            const singleValue = Array.isArray(value) ? null : value;
                            setSelectedBrand(singleValue);
                            field.onChange(singleValue?.id || '');
                          }}
                          onCreateClick={() => setBrandDialogOpen(true)}
                          error={!!errors.brand}
                          helperText={errors.brand?.message}
                          disabled={isSubmitting || !isFieldEnabled('brand')}
                          required={isFieldRequired('brand')}
                          refreshKey={brandRefreshKey}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('base_uom') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('base_uom', 'Base UOM')} {isFieldRequired('base_uom') && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="base_uom"
                      control={control}
                      rules={{ required: isFieldRequired('base_uom') ? 'Base UOM is required' : false }}
                      render={({ field }) => (
                        <SearchableDropdownWithCreate
                          label=""
                          placeholder="Select Base UOM"
                          apiEndpoint={API_ENDPOINTS.UOMS}
                          value={selectedBaseUom}
                          onChange={(value) => {
                            const singleValue = Array.isArray(value) ? null : value;
                            setSelectedBaseUom(singleValue);
                            field.onChange(singleValue?.id || '');
                          }}
                          onCreateClick={() => setUomDialogOpen(true)}
                          error={!!errors.base_uom}
                          helperText={errors.base_uom?.message}
                          disabled={isSubmitting || !isFieldEnabled('base_uom')}
                          required={isFieldRequired('base_uom')}
                          refreshKey={uomRefreshKey}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('bag_weight') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('bag_weight', 'Bag Weight')} {isFieldRequired('bag_weight') && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="bag_weight"
                      control={control}
                      rules={{ required: isFieldRequired('bag_weight') ? 'Bag weight is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value ?? ''}
                          placeholder={`Enter bag weight${selectedBaseUom ? ` (in ${selectedBaseUom.name})` : ' (in base UOM)'}`}
                          fullWidth
                          size="small"
                          type="number"
                          error={!!errors.bag_weight}
                          helperText={errors.bag_weight?.message}
                          disabled={isSubmitting || !isFieldEnabled('bag_weight')}
                          inputProps={{ step: '0.001', min: '0' }}
                          InputProps={{
                            endAdornment: selectedBaseUom ? (
                              <InputAdornment position="end">
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                  {selectedBaseUom.code || selectedBaseUom.name}
                                </Typography>
                              </InputAdornment>
                            ) : undefined,
                          }}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('hsn_code') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('hsn_code', 'HSN Code')} {isFieldRequired('hsn_code') && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="hsn_code"
                      control={control}
                      rules={{ required: isFieldRequired('hsn_code') ? 'HSN Code is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          placeholder="Harmonized System Nomenclature"
                          fullWidth
                          size="small"
                          error={!!errors.hsn_code}
                          helperText={errors.hsn_code?.message}
                          disabled={isSubmitting || !isFieldEnabled('hsn_code')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('sac_code') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('sac_code', 'SAC Code')} {isFieldRequired('sac_code') && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="sac_code"
                      control={control}
                      rules={{ required: isFieldRequired('sac_code') ? 'SAC Code is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          placeholder="Auto-generated (e.g., ITM-1)"
                          fullWidth
                          size="small"
                          error={!!errors.sac_code}
                          helperText={errors.sac_code?.message}
                          disabled={isSubmitting || !isFieldEnabled('sac_code')}
                        />
                      )}
                    />
                  </Grid>
                  )}
                </Grid>
                </>
                )}

                {isSectionVisible('pricing') && (
                <>
                <Divider sx={{ my: 4 }} />

                {/* Pricing Section */}
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  Pricing
                </Typography>
                <Grid container spacing={3}>
                  {isFieldVisible('mrp') && (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('mrp', 'MRP')} {isFieldRequired('mrp') && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="mrp"
                      control={control}
                      rules={{ required: isFieldRequired('mrp') ? 'MRP is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value ?? ''}
                          type="number"
                          placeholder="Maximum Retail Price"
                          fullWidth
                          size="small"
                          inputProps={{ step: '0.01', min: 0 }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          error={!!errors.mrp}
                          helperText={errors.mrp?.message}
                          disabled={isSubmitting || !isFieldEnabled('mrp')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('selling_price') && (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('selling_price', 'Selling Price')}
                      {isFieldRequired('selling_price') && <Box component="span" sx={{ color: '#f44336', ml: 0.5 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="selling_price"
                      control={control}
                      rules={{ required: isFieldRequired('selling_price') ? 'Selling price is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value ?? ''}
                          type="number"
                          placeholder="Selling price"
                          fullWidth
                          size="small"
                          error={!!errors.selling_price}
                          helperText={errors.selling_price?.message}
                          inputProps={{ step: '0.01', min: 0 }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          disabled={isSubmitting || !isFieldEnabled('selling_price')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('cost_price') && (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('cost_price', 'Cost Price')}
                      {isFieldRequired('cost_price') && <Box component="span" sx={{ color: '#f44336', ml: 0.5 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="cost_price"
                      control={control}
                      rules={{ required: isFieldRequired('cost_price') ? 'Cost price is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value ?? ''}
                          type="number"
                          placeholder="Cost/Purchase price"
                          fullWidth
                          size="small"
                          error={!!errors.cost_price}
                          helperText={errors.cost_price?.message}
                          inputProps={{ step: '0.01', min: 0 }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          disabled={isSubmitting || !isFieldEnabled('cost_price')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('min_price') && (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('min_price', 'Minimum Price')}
                      {isFieldRequired('min_price') && <Box component="span" sx={{ color: '#f44336', ml: 0.5 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="min_price"
                      control={control}
                      rules={{ required: isFieldRequired('min_price') ? 'Minimum price is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value ?? ''}
                          type="number"
                          placeholder="Minimum selling price"
                          fullWidth
                          size="small"
                          error={!!errors.min_price}
                          helperText={errors.min_price?.message}
                          inputProps={{ step: '0.01', min: 0 }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          disabled={isSubmitting || !isFieldEnabled('min_price')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('price_includes_tax') && (
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="price_includes_tax"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              disabled={isSubmitting || !isFieldEnabled('price_includes_tax')}
                            />
                          }
                          label={getFieldLabel('price_includes_tax', 'Price Includes Tax')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {/* Tax Information Display (Edit Mode Only) */}
                  {isEditMode && itemData?.current_tax && (
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Current Tax
                        </Typography>
                        <Typography variant="body2">
                          {itemData.current_tax.name} ({itemData.current_tax.rate}%)
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
                </>
                )}

                {/* {isSectionVisible('stock') && (
                <>
                <Divider sx={{ my: 4 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  Stock Management
                </Typography>
                <Grid container spacing={3}>
                  {isFieldVisible('reorder_level') && (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('reorder_level', 'Reorder Level')}
                      {isFieldRequired('reorder_level') && <Box component="span" sx={{ color: '#f44336', ml: 0.5 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="reorder_level"
                      control={control}
                      rules={{ required: isFieldRequired('reorder_level') ? 'Reorder level is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value ?? ''}
                          type="number"
                          placeholder="Reorder point"
                          fullWidth
                          size="small"
                          error={!!errors.reorder_level}
                          helperText={errors.reorder_level?.message}
                          inputProps={{ step: '0.01', min: 0 }}
                          disabled={isSubmitting || !isFieldEnabled('reorder_level')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('reorder_quantity') && (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('reorder_quantity', 'Reorder Quantity')}
                      {isFieldRequired('reorder_quantity') && <Box component="span" sx={{ color: '#f44336', ml: 0.5 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="reorder_quantity"
                      control={control}
                      rules={{ required: isFieldRequired('reorder_quantity') ? 'Reorder quantity is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value ?? ''}
                          type="number"
                          placeholder="Reorder quantity"
                          fullWidth
                          size="small"
                          error={!!errors.reorder_quantity}
                          helperText={errors.reorder_quantity?.message}
                          inputProps={{ step: '0.01', min: 0 }}
                          disabled={isSubmitting || !isFieldEnabled('reorder_quantity')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('min_stock_level') && (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('min_stock_level', 'Min Stock Level')}
                      {isFieldRequired('min_stock_level') && <Box component="span" sx={{ color: '#f44336', ml: 0.5 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="min_stock_level"
                      control={control}
                      rules={{ required: isFieldRequired('min_stock_level') ? 'Min stock level is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          placeholder="Min stock level"
                          fullWidth
                          size="small"
                          error={!!errors.min_stock_level}
                          helperText={errors.min_stock_level?.message}
                          inputProps={{ step: '0.01', min: 0 }}
                          disabled={isSubmitting || !isFieldEnabled('min_stock_level')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('max_stock_level') && (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('max_stock_level', 'Max Stock Level')}
                      {isFieldRequired('max_stock_level') && <Box component="span" sx={{ color: '#f44336', ml: 0.5 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="max_stock_level"
                      control={control}
                      rules={{ required: isFieldRequired('max_stock_level') ? 'Max stock level is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          placeholder="Max stock level"
                          fullWidth
                          size="small"
                          error={!!errors.max_stock_level}
                          helperText={errors.max_stock_level?.message}
                          inputProps={{ step: '0.01', min: 0 }}
                          disabled={isSubmitting || !isFieldEnabled('max_stock_level')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('weight') && (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('weight', 'Weight')}
                      {isFieldRequired('weight') && <Box component="span" sx={{ color: '#f44336', ml: 0.5 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="weight"
                      control={control}
                      rules={{ required: isFieldRequired('weight') ? 'Weight is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          placeholder="Weight"
                          fullWidth
                          size="small"
                          error={!!errors.weight}
                          helperText={errors.weight?.message}
                          inputProps={{ step: '0.01', min: 0 }}
                          disabled={isSubmitting || !isFieldEnabled('weight')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('weight_unit') && (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {getFieldLabel('weight_unit', 'Weight Unit')}
                      {isFieldRequired('weight_unit') && <Box component="span" sx={{ color: '#f44336', ml: 0.5 }}>*</Box>}
                    </Typography>
                    <Controller
                      name="weight_unit"
                      control={control}
                      rules={{ required: isFieldRequired('weight_unit') ? 'Weight unit is required' : false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          size="small"
                          error={!!errors.weight_unit}
                          helperText={errors.weight_unit?.message}
                          disabled={isSubmitting || !isFieldEnabled('weight_unit')}
                        >
                          <MenuItem value="kg">kg</MenuItem>
                          <MenuItem value="g">g</MenuItem>
                          <MenuItem value="lbs">lbs</MenuItem>
                          <MenuItem value="oz">oz</MenuItem>
                        </TextField>
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('is_stockable') && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Controller
                      name="is_stockable"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              disabled={isSubmitting || !isFieldEnabled('is_stockable')}
                            />
                          }
                          label={getFieldLabel('is_stockable', 'Stockable')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('track_inventory') && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Controller
                      name="track_inventory"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              disabled={isSubmitting || !isFieldEnabled('track_inventory')}
                            />
                          }
                          label={getFieldLabel('track_inventory', 'Track Inventory')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('allow_negative_stock') && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Controller
                      name="allow_negative_stock"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              disabled={isSubmitting || !isFieldEnabled('allow_negative_stock')}
                            />
                          }
                          label={getFieldLabel('allow_negative_stock', 'Allow Negative Stock')}
                        />
                      )}
                    />
                  </Grid>
                  )}
                </Grid>
                </>
                )} */}

                {/* {isSectionVisible('settings') && (
                <>
                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  Settings
                </Typography>
                <Grid container spacing={3}>
                  {isFieldVisible('is_purchasable') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="is_purchasable"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              disabled={isSubmitting || !isFieldEnabled('is_purchasable')}
                            />
                          }
                          label={getFieldLabel('is_purchasable', 'Purchasable')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('is_saleable') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="is_saleable"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              disabled={isSubmitting || !isFieldEnabled('is_saleable')}
                            />
                          }
                          label={getFieldLabel('is_saleable', 'Saleable')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('is_featured') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="is_featured"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              disabled={isSubmitting || !isFieldEnabled('is_featured')}
                            />
                          }
                          label={getFieldLabel('is_featured', 'Featured')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('allow_discount') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="allow_discount"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              disabled={isSubmitting || !isFieldEnabled('allow_discount')}
                            />
                          }
                          label={getFieldLabel('allow_discount', 'Allow Discount')}
                        />
                      )}
                    />
                  </Grid>
                  )}

                  {isFieldVisible('is_active') && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller
                      name="is_active"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              disabled={isSubmitting || !isFieldEnabled('is_active')}
                            />
                          }
                          label={getFieldLabel('is_active', 'Active')}
                        />
                      )}
                    />
                  </Grid>
                  )}
                </Grid>
                </>
                )} */}

          </form>

          {/* Divider */}
          <Divider sx={{ my: 4 }} />

          {/* UOM Conversions Section */}
          <ItemUOMConversionManager 
            itemId={id}
            existingConversions={itemData?.uom_conversions || []}
            disabled={isSubmitting}
            onConversionsChange={setPendingConversions}
            initialConversions={pendingConversions}
            baseUOM={watch('base_uom')}
          />

          {/* Divider */}
          <Divider sx={{ my: 4 }} />

          {/* Tax Compositions Section */}
          <ItemTaxCompositionManager
            itemId={id}
            existingCompositions={(itemData as any)?.tax_compositions || []}
            disabled={isSubmitting}
            onCompositionsChange={setPendingTaxCompositions}
            initialCompositions={pendingTaxCompositions}
          />
        </Paper>
      </Box>

      {/* Quick Create Dialogs */}
      <CategoryFormDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        onSubmit={handleCategoryCreate}
        category={null}
        isSubmitting={isCreatingMaster}
      />

      <BrandFormDialog
        open={brandDialogOpen}
        onClose={() => setBrandDialogOpen(false)}
        onSubmit={handleBrandCreate}
        brand={null}
        isSubmitting={isCreatingMaster}
      />

      <UOMFormDialog
        open={uomDialogOpen}
        onClose={() => setUomDialogOpen(false)}
        onSubmit={handleUOMCreate}
        uom={null}
        loading={isCreatingMaster}
      />

    </Box>
  );
};

export default ItemForm;

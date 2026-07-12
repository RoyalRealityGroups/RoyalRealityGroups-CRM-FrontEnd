import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  Grid,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import InventoryIcon from '@mui/icons-material/Inventory';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { itemApi } from '../../../api/masters.api';
import apiClient from '../../../api/axios.config';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { getHeaderSectionStyles } from '../../../utils/spacing';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';
import type { Item } from '../../../types/masters.types';

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

const cellLabel = { fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', width: '20%' };
const cellValue = { border: '1px solid #e0e0e0', width: '30%' };

const BoolChip: React.FC<{ value?: boolean }> = ({ value }) => (
  <Chip
    icon={value ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
    label={value ? 'Yes' : 'No'}
    size="small"
    color={value ? 'success' : 'default'}
    variant="outlined"
  />
);

const formatCurrency = (val?: number | string | null) => {
  if (val === undefined || val === null || val === '') return '-';
  return `₹ ${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const ItemView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useSelector((state: RootState) => state.auth.user);
  const { error: toastError } = useToast();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, FieldConfig>>({});

  usePageTitle('View Product');

  const { data: item, isLoading, error } = useQuery<Item>({
    queryKey: ['item', id],
    queryFn: () => itemApi.getItem(id!),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: fieldConfigsData } = useQuery({
    queryKey: ['itemFieldConfigs'],
    queryFn: async () => {
      const response = await apiClient.get('/api/masters/item-field-config/');
      return response.data;
    },
  });

  useEffect(() => {
    if (fieldConfigsData) {
      const configMap: Record<string, FieldConfig> = {};
      fieldConfigsData.forEach((config: FieldConfig) => {
        configMap[config.field_name] = config;
      });
      setFieldConfigs(configMap);
    }
  }, [fieldConfigsData]);

  useEffect(() => {
    if (item) {
      setBreadcrumbs([
        { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
        { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
        { label: 'Product', path: '/masters/items', icon: <InventoryIcon fontSize="small" /> },
        { label: 'View', icon: <VisibilityIcon fontSize="small" /> },
      ]);
    }
    return () => setBreadcrumbs([]);
  }, [item, setBreadcrumbs]);

  const isFieldVisible = (fieldName: string) => fieldConfigs[fieldName]?.is_visible ?? true;

  const getFieldLabel = (fieldName: string, defaultLabel: string) => {
    const configLabel = fieldConfigs[fieldName]?.display_label;
    // If config label is same as another field's label, use the default instead
    if (fieldName === 'product_type' && configLabel && configLabel.replace(/\bItem\b/g, 'Product') === 'Product Type') {
      return defaultLabel;
    }
    const label = configLabel || defaultLabel;
    return label.replace(/\bItem\b/g, 'Product');
  };

  const isSectionVisible = (section: string) => {
    if (!fieldConfigsData) return true;
    return fieldConfigsData.some((config: FieldConfig) => config.section === section && config.is_visible);
  };

  const handleBack = () => navigate('/masters/items');
  const handleEdit = () => navigate(`/masters/items/edit/${id}`);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !item) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>Failed to load product details</Alert>
        <Button variant="contained" onClick={handleBack}>Back to List</Button>
      </Box>
    );
  }

  const canEdit = hasPermission(user, 'change_item');
  const uomConversions = item.uom_conversions || [];
  const taxCompositions = (item as any).tax_compositions || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f5f5f5', overflow: 'auto' }}>
      <Box sx={getHeaderSectionStyles()}>
        <ScreenHeader
          title={`Product - ${item.code}`}
          showBackButton
          onBack={handleBack}
          disableBox
        >
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {canEdit && (
              <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit} size="small">Edit</Button>
            )}
          </Box>
        </ScreenHeader>
      </Box>

      <Paper sx={{ maxWidth: 1200, mx: 'auto', p: 4, width: '100%' }}>
        {/* Header with image and title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          {item.image && (
            <Avatar src={item.image} variant="rounded" sx={{ width: 80, height: 80 }} />
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#006766', fontFamily: '"Space Grotesk", "Poppins", sans-serif' }}>
              {item.name}
            </Typography>
            {item.short_name && (
              <Typography variant="body2" color="text.secondary">{item.short_name}</Typography>
            )}
          </Box>
          <Chip
            label={item.is_active ? 'Active' : 'Inactive'}
            sx={{
              backgroundColor: item.is_active ? '#d4edda' : '#e2e3e5',
              color: item.is_active ? '#155724' : '#383d41',
              fontWeight: 700,
              fontSize: '1rem',
              height: 40,
              px: 2,
            }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Basic Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>Basic Information</Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={cellLabel}>{getFieldLabel('code', 'Product Code')}</TableCell>
                  <TableCell sx={cellValue}>{item.code}</TableCell>
                  <TableCell sx={cellLabel}>{getFieldLabel('name', 'Product Name')}</TableCell>
                  <TableCell sx={cellValue}>{item.name}</TableCell>
                </TableRow>
                <TableRow>
                  {isFieldVisible('item_type') && (
                    <>
                      <TableCell sx={cellLabel}>{getFieldLabel('item_type', 'Product Type')}</TableCell>
                      <TableCell sx={cellValue}>{item.item_type_display || '-'}</TableCell>
                    </>
                  )}
                  {isFieldVisible('product_type') && (
                    <>
                      <TableCell sx={cellLabel}>{getFieldLabel('product_type', 'Product Category Type')}</TableCell>
                      <TableCell sx={cellValue}>{item.product_type_display || '-'}</TableCell>
                    </>
                  )}
                </TableRow>
                <TableRow>
                  {isFieldVisible('sku') && (
                    <>
                      <TableCell sx={cellLabel}>{getFieldLabel('sku', 'SKU')}</TableCell>
                      <TableCell sx={cellValue}>{item.sku || '-'}</TableCell>
                    </>
                  )}
                  {isFieldVisible('barcode') && (
                    <>
                      <TableCell sx={cellLabel}>{getFieldLabel('barcode', 'Barcode')}</TableCell>
                      <TableCell sx={cellValue}>{item.barcode || '-'}</TableCell>
                    </>
                  )}
                </TableRow>
                {isFieldVisible('company') && (
                  <TableRow>
                    <TableCell sx={cellLabel}>{getFieldLabel('company', 'Company')}</TableCell>
                    <TableCell sx={cellValue}>{item.company_name || '-'}</TableCell>
                    <TableCell sx={cellLabel} />
                    <TableCell sx={cellValue} />
                  </TableRow>
                )}
                {isFieldVisible('description') && item.description && (
                  <TableRow>
                    <TableCell sx={cellLabel}>{getFieldLabel('description', 'Description')}</TableCell>
                    <TableCell colSpan={3} sx={cellValue}>{item.description}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Classification */}
        {isSectionVisible('classification') && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>Classification</Typography>
            <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    {isFieldVisible('category') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('category', 'Category')}</TableCell>
                        <TableCell sx={cellValue}>{item.category_name || '-'}</TableCell>
                      </>
                    )}
                    {isFieldVisible('brand') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('brand', 'Brand')}</TableCell>
                        <TableCell sx={cellValue}>{item.brand_name || '-'}</TableCell>
                      </>
                    )}
                  </TableRow>
                  <TableRow>
                    {isFieldVisible('base_uom') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('base_uom', 'Base UOM')}</TableCell>
                        <TableCell sx={cellValue}>{item.base_uom_name || '-'}</TableCell>
                      </>
                    )}
                    {isFieldVisible('bag_weight') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('bag_weight', 'Bag Weight')}</TableCell>
                        <TableCell sx={cellValue}>
                          {item.bag_weight ? `${item.bag_weight} ${item.base_uom_name || ''}` : '-'}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                  <TableRow>
                    {isFieldVisible('hsn_code') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('hsn_code', 'HSN Code')}</TableCell>
                        <TableCell sx={cellValue}>{item.hsn_code || '-'}</TableCell>
                      </>
                    )}
                    {isFieldVisible('sac_code') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('sac_code', 'SAC Code')}</TableCell>
                        <TableCell sx={cellValue}>{item.sac_code || '-'}</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Pricing */}
        {isSectionVisible('pricing') && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>Pricing</Typography>
            <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    {isFieldVisible('mrp') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('mrp', 'MRP')}</TableCell>
                        <TableCell sx={cellValue}>{formatCurrency(item.mrp)}</TableCell>
                      </>
                    )}
                    {isFieldVisible('selling_price') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('selling_price', 'Selling Price')}</TableCell>
                        <TableCell sx={cellValue}>{formatCurrency(item.selling_price)}</TableCell>
                      </>
                    )}
                  </TableRow>
                  <TableRow>
                    {isFieldVisible('cost_price') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('cost_price', 'Cost Price')}</TableCell>
                        <TableCell sx={cellValue}>{formatCurrency(item.cost_price)}</TableCell>
                      </>
                    )}
                    {isFieldVisible('min_price') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('min_price', 'Minimum Price')}</TableCell>
                        <TableCell sx={cellValue}>{formatCurrency(item.min_price)}</TableCell>
                      </>
                    )}
                  </TableRow>
                  {isFieldVisible('price_includes_tax') && (
                    <TableRow>
                      <TableCell sx={cellLabel}>{getFieldLabel('price_includes_tax', 'Price Includes Tax')}</TableCell>
                      <TableCell sx={cellValue}><BoolChip value={item.price_includes_tax} /></TableCell>
                      {item.current_tax && (
                        <>
                          <TableCell sx={cellLabel}>Current Tax</TableCell>
                          <TableCell sx={cellValue}>{item.current_tax.name} ({item.current_tax.rate}%)</TableCell>
                        </>
                      )}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Stock Management */}
        {isSectionVisible('stock') && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>Stock Management</Typography>
            <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    {isFieldVisible('reorder_level') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('reorder_level', 'Reorder Level')}</TableCell>
                        <TableCell sx={cellValue}>{item.reorder_level ?? '-'}</TableCell>
                      </>
                    )}
                    {isFieldVisible('reorder_quantity') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('reorder_quantity', 'Reorder Quantity')}</TableCell>
                        <TableCell sx={cellValue}>{item.reorder_quantity ?? '-'}</TableCell>
                      </>
                    )}
                  </TableRow>
                  <TableRow>
                    {isFieldVisible('min_stock_level') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('min_stock_level', 'Min Stock Level')}</TableCell>
                        <TableCell sx={cellValue}>{item.min_stock_level ?? '-'}</TableCell>
                      </>
                    )}
                    {isFieldVisible('max_stock_level') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('max_stock_level', 'Max Stock Level')}</TableCell>
                        <TableCell sx={cellValue}>{item.max_stock_level ?? '-'}</TableCell>
                      </>
                    )}
                  </TableRow>
                  <TableRow>
                    {isFieldVisible('weight') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('weight', 'Weight')}</TableCell>
                        <TableCell sx={cellValue}>
                          {item.weight ? `${item.weight} ${item.weight_unit || ''}` : '-'}
                        </TableCell>
                      </>
                    )}
                    <TableCell sx={cellLabel} />
                    <TableCell sx={cellValue} />
                  </TableRow>
                  <TableRow>
                    {isFieldVisible('is_stockable') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('is_stockable', 'Stockable')}</TableCell>
                        <TableCell sx={cellValue}><BoolChip value={item.is_stockable} /></TableCell>
                      </>
                    )}
                    {isFieldVisible('track_inventory') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('track_inventory', 'Track Inventory')}</TableCell>
                        <TableCell sx={cellValue}><BoolChip value={item.track_inventory} /></TableCell>
                      </>
                    )}
                  </TableRow>
                  {isFieldVisible('allow_negative_stock') && (
                    <TableRow>
                      <TableCell sx={cellLabel}>{getFieldLabel('allow_negative_stock', 'Allow Negative Stock')}</TableCell>
                      <TableCell sx={cellValue}><BoolChip value={item.allow_negative_stock} /></TableCell>
                      <TableCell sx={cellLabel} />
                      <TableCell sx={cellValue} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Settings */}
        {isSectionVisible('settings') && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>Settings</Typography>
            <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    {isFieldVisible('is_purchasable') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('is_purchasable', 'Purchasable')}</TableCell>
                        <TableCell sx={cellValue}><BoolChip value={item.is_purchasable} /></TableCell>
                      </>
                    )}
                    {isFieldVisible('is_saleable') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('is_saleable', 'Saleable')}</TableCell>
                        <TableCell sx={cellValue}><BoolChip value={item.is_saleable} /></TableCell>
                      </>
                    )}
                  </TableRow>
                  <TableRow>
                    {isFieldVisible('is_featured') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('is_featured', 'Featured')}</TableCell>
                        <TableCell sx={cellValue}><BoolChip value={item.is_featured} /></TableCell>
                      </>
                    )}
                    {isFieldVisible('allow_discount') && (
                      <>
                        <TableCell sx={cellLabel}>{getFieldLabel('allow_discount', 'Allow Discount')}</TableCell>
                        <TableCell sx={cellValue}><BoolChip value={item.allow_discount} /></TableCell>
                      </>
                    )}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* UOM Conversions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
            UOM Conversions ({uomConversions.length})
          </Typography>
          {uomConversions.length > 0 ? (
            <TableContainer>
              <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#006766' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>S.No</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Alternate UOM</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Conversion Factor</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Barcode</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uomConversions.map((c, i) => (
                    <TableRow key={c.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{i + 1}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{c.alternate_uom_name}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        1 {c.alternate_uom_name} = {c.conversion_factor} {item.base_uom_name}
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{c.barcode || '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        <Chip label={c.is_active ? 'Active' : 'Inactive'} size="small" color={c.is_active ? 'success' : 'default'} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">No UOM conversions defined</Typography>
            </Paper>
          )}
        </Box>

        {/* Tax Compositions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
            Tax Compositions ({taxCompositions.length})
          </Typography>
          {taxCompositions.length > 0 ? (
            <TableContainer>
              <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#006766' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>S.No</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Tax</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Rate</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Effective From</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Effective To</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {taxCompositions.map((t: any, i: number) => (
                    <TableRow key={t.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{i + 1}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{t.tax?.name || '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        <Chip label={t.composition_type_display || t.composition_type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{t.tax?.tax_rate != null ? `${t.tax.tax_rate}%` : '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        {t.effective_from ? format(new Date(t.effective_from), 'dd-MM-yyyy') : '-'}
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        {t.effective_to ? format(new Date(t.effective_to), 'dd-MM-yyyy') : 'Ongoing'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">No tax compositions defined</Typography>
            </Paper>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '2px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#666' }}>
            Created: {item.created_on ? format(new Date(item.created_on), 'dd-MM-yyyy, hh:mm a') : '-'}
            {item.modified_on && ` | Modified: ${format(new Date(item.modified_on), 'dd-MM-yyyy, hh:mm a')}`}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            Product: {item.code} - {item.name}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ItemView;

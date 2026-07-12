import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Select,
  MenuItem,
  Tooltip,
  Typography,
  CircularProgress,
  Autocomplete,
  createFilterOptions,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Info as InfoIcon,
  CardGiftcard as FreeItemIcon,
} from '@mui/icons-material';
import type { SalesOrderItem, CustomerType, PriceSource } from '../../../types/sales.types';
import type { DropdownOption } from '../../../types/common.types';
import { salesOrderApi } from '../../../api/sales.api';
import apiClient from '../../../api/axios.config';
import SearchableDropdown from '../../../components/common/SearchableDropdown';
import MediaImage from '../../../components/common/MediaImage';
import { useToast } from '../../../contexts/ToastContext';

interface SalesOrderItemGridProps {
  items: SalesOrderItem[];
  displayItems?: SalesOrderItem[];
  schemeDiscounts?: number[];
  showSchemeDiscount?: boolean;
  errors?: Record<string, string>;
  onChange: (items: SalesOrderItem[]) => void;
  customerId?: string;
  customerType?: CustomerType;
  taxType: 'EXCLUSIVE' | 'INCLUSIVE';
  companyId?: string;
  enforceCompanyItemFilter?: boolean;
  currentUser?: any;

}

const itemFilter = createFilterOptions<DropdownOption>({
  stringify: (option) => `${option.name || ''} ${option.code || ''}`.toLowerCase(),
});

const SalesOrderItemGrid: React.FC<SalesOrderItemGridProps> = ({
  items,
  displayItems,
  schemeDiscounts,
  showSchemeDiscount = false,
  errors = {},
  onChange,
  customerId,
  customerType,
  taxType,
  companyId,
  enforceCompanyItemFilter = false,
  currentUser,

}) => {
  const isChannelPartnerUser = Boolean(
    currentUser?.channel_partner_type && currentUser.channel_partner_type !== 'STAFF'
  );
  const { error: toastError } = useToast();
  const isValidUomName = (name?: string): boolean => {
    if (!name) return false;
    if (name.includes('_DEL_')) return false;
    return true;
  };

  const getDisplayUomName = (name?: string): string => {
    return isValidUomName(name) ? name! : '-';
  };

  const [loadingPrices, setLoadingPrices] = useState<Record<number, boolean>>({});
  const [itemOptions, setItemOptions] = useState<DropdownOption[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [uomOptions, setUomOptions] = useState<Record<number, { id: string; name: string; factor: number }[]>>({});
  const [isSameState, setIsSameState] = useState<boolean>(false);
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, DropdownOption[]>>({});

  useEffect(() => {
    setItemsByCategory({});
  }, [companyId, enforceCompanyItemFilter]);

  // Fetch state comparison when company and customer change
  useEffect(() => {
    const fetchStateComparison = async () => {
      if (!companyId || !customerId) {
        setIsSameState(false);
        return;
      }

      try {
        const [companyRes, customerRes] = await Promise.all([
          apiClient.get(`/api/masters/companies/${companyId}/`),
          apiClient.get(
            customerType === 'RETAILER'
              ? `/api/masters/retailers/${customerId}/`
              : customerType === 'DISTRIBUTOR'
              ? `/api/masters/distributors/${customerId}/`
              : `/api/masters/superstockists/${customerId}/`
          ),
        ]);

        const companyGst = companyRes.data.gst_number;
        const companyStateId = companyRes.data.state?.id || companyRes.data.state;
        const customerGst = customerRes.data.gstin;
        const customerStateId = customerRes.data.state;

        // Priority 1: Compare GST state codes
        if (companyGst && customerGst) {
          const companyStateCode = companyGst.substring(0, 2);
          const customerStateCode = customerGst.substring(0, 2);
          const sameState = companyStateCode === customerStateCode;
          setIsSameState(sameState);
        }
        // Priority 2: Compare physical states
        else if (companyStateId && customerStateId) {
          const sameState = companyStateId === customerStateId;
          setIsSameState(sameState);
        } else {
          setIsSameState(false);
        }
      } catch (error) {
        setIsSameState(false);
      }
    };

    fetchStateComparison();
  }, [companyId, customerId, customerType]);

  // Recalculate all items when tax type or state comparison changes
  useEffect(() => {
    if (items.length > 0) {
      const newItems = items.map((item) => ({ ...item }));
      newItems.forEach((_, index) => {
        calculateLineTotal(newItems, index);
      });
      onChange(newItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxType, isSameState]);

  const resetItemRow = (index: number) => {
    const newItems = [...items];
    newItems[index] = {
      category: '',
      item: '',
      item_code: '',
      item_name: '',
      hsn_code: '',
      uom_name: '',
      uom_factor: 1,
      quantity: 1,
      free_quantity: 0,
      pb_rate: 0,
      pb_rate_source: 'NOT_FOUND',
      rate: 0,
      discount_type: 'AMOUNT',
      discount_value: 0,
      discount_amount: 0,
      taxable_amount: 0,
      tax_percentage: 0,
      tax_amount: 0,
      cgst_rate: 0,
      cgst_amount: 0,
      sgst_rate: 0,
      sgst_amount: 0,
      igst_rate: 0,
      igst_amount: 0,
      cess_rate: 0,
      cess_amount: 0,
      line_total: 0,
    } as SalesOrderItem;

    // Clear any cached UOMs for this row
    setUomOptions((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });

    onChange(newItems);
  };

  // Fetch items by category
  const fetchItemsByCategory = async (categoryId: string) => {
    const cacheKey = enforceCompanyItemFilter ? `${categoryId}::${companyId || 'none'}` : categoryId;
    if (itemsByCategory[cacheKey]) {
      return itemsByCategory[cacheKey];
    }

    if (enforceCompanyItemFilter && !companyId) {
      return [];
    }
    
    setLoadingItems(true);
    try {
      const response = await apiClient.get('/api/masters/items/mini/', {
        params: {
          category: categoryId,
          is_active: true,
          company: enforceCompanyItemFilter ? companyId : undefined,
        }
      });
      const fetchedItems = response.data.results || response.data;
      setItemsByCategory(prev => ({ ...prev, [cacheKey]: fetchedItems }));
      return fetchedItems;
    } catch (error) {
      return [];
    } finally {
      setLoadingItems(false);
    }
  };

  // Seed UOM options for pre-loaded items (e.g., edit mode)
  useEffect(() => {
    setUomOptions((prev) => {
      const updated = { ...prev };
      items.forEach((item, idx) => {
        if (!updated[idx] && item.uom_name) {
          updated[idx] = [{ id: item.uom_name, name: item.uom_name, factor: 1 }];
        }
      });
      return updated;
    });
  }, [items]);

  const handleDeleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index).map((item) => ({ ...item }));
    newItems.forEach((_, i) => {
      calculateLineTotal(newItems, i);
    });
    onChange(newItems);
  };

  const handleCategoryChange = async (index: number, categoryOption: DropdownOption | null) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      category: categoryOption?.id as string || '',
      category_name: categoryOption?.name || '',
      item: '',
      item_code: '',
      item_name: '',
      hsn_code: '',
      uom_name: '',
      uom_factor: 1,
      pb_rate: 0,
      pb_rate_source: 'NOT_FOUND',
      rate: 0,
    };
    
    // Fetch items for this category
    if (categoryOption?.id) {
      await fetchItemsByCategory(categoryOption.id as string);
    }
    
    onChange(newItems);
  };

  const handleItemSelect = async (index: number, option: DropdownOption | null) => {
    if (!option) return;

    // Check for duplicate item + UOM combination
    const duplicate = items.find((item, i) =>
      i !== index && String(item.item) === String(option.id) && item.uom_name === ((option as any).uom_name || items[index]?.uom_name)
    );
    if (duplicate) {
      toastError(`This product already exists in Row ${items.indexOf(duplicate) + 1}. Please update the quantity instead.`);
      return;
    }

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      item: option.id as string,
      item_code: option.code,
      item_name: option.name,
      hsn_code: (option as any).hsn_code,
      uom_name: (option as any).uom_name,
      uom_factor: 1,
    };

    // Always fetch full item detail to populate UOMs (base + conversions) and tax info
    try {
      const detail = await apiClient.get(`/api/masters/items/${option.id}/`);
      const data = detail.data;

      const baseUom = data.base_uom_name
        ? { id: data.base_uom || data.base_uom_name, name: data.base_uom_name, factor: 1 }
        : (option as any).uom_name
        ? { id: (option as any).uom_name, name: (option as any).uom_name, factor: 1 }
        : null;
      const conversionOptions = Array.isArray(data.uom_conversions)
        ? data.uom_conversions.map((conv: any) => ({
            id: conv.alternate_uom || conv.alternate_uom_name,
            name: conv.alternate_uom_name,
            factor: conv.conversion_factor || 1,
          }))
        : [];
      const mergedList = [baseUom, ...conversionOptions].filter(Boolean) as { id: string; name: string; factor: number }[];
      const dedupedList: { id: string; name: string; factor: number }[] = [];
      const seen = new Set<string>();
      mergedList.forEach((u) => {
        const key = (u.id || u.name || '').toString();
        if (key && !seen.has(key)) {
          seen.add(key);
          dedupedList.push(u);
        }
      });
      if (dedupedList.length > 0) {
        setUomOptions((prev) => ({ ...prev, [index]: dedupedList }));
        newItems[index].uom_name = dedupedList[0].name;
        newItems[index].uom_factor = dedupedList[0].factor;
      }

      newItems[index] = {
        ...newItems[index],
        uom_name: data.uom?.name || data.uom_name || newItems[index].uom_name,
        uom_factor: newItems[index].uom_factor || 1,
        hsn_code: data.hsn_code || newItems[index].hsn_code,
        tax_percentage:
          data.current_tax?.rate ??
          data.tax_percentage ??
          data.tax_rate ??
          data.tax?.rate ??
          newItems[index].tax_percentage ??
          0,
      };

      // Autofill company from item detail
      newItems[index].company = data.company?.id ?? data.company_id ?? data.company ?? '';
      newItems[index].company_name = data.company?.name ?? data.company_name ?? '';
      newItems[index].item_image = data.image || '';
    } catch (err) {
    }

    // Fetch price if customer is selected
    if (customerId && customerType) {
      setLoadingPrices(prev => ({ ...prev, [index]: true }));
      try {
        const priceData = await salesOrderApi.getItemPrice(
          option.id as string,
          customerId,
          customerType
        );
        
        newItems[index] = {
          ...newItems[index],
          pb_rate: priceData.pb_rate ?? 0,
          pb_rate_source: priceData.source || 'NOT_FOUND',
          rate: priceData.pb_rate ?? 0,
        };
        
        // Fetch tax percentage
        // You might want to add a getTaxPercentage API call here
        newItems[index].tax_percentage =
          (option as any).tax_percentage ?? newItems[index].tax_percentage ?? 0;
        
      } catch (error) {
      } finally {
        setLoadingPrices(prev => ({ ...prev, [index]: false }));
      }
    }

    calculateLineTotal(newItems, index);
    onChange(newItems);
  };

  const handleUomChange = (index: number, uomId: string) => {
    const options = uomOptions[index] || [];
    const selected = options.find((opt) => opt.id === uomId);
    const newUomName = selected?.name || items[index].uom_name;

    // Check for duplicate item + UOM combination
    const duplicate = items.find((item, i) =>
      i !== index && String(item.item) === String(items[index].item) && item.uom_name === newUomName
    );
    if (duplicate) {
      toastError(`This product with the same UOM already exists in Row ${items.indexOf(duplicate) + 1}. Please update the quantity instead.`);
      return;
    }

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      uom_name: newUomName,
      uom_factor: selected?.factor || 1,
    };
    calculateLineTotal(newItems, index);
    onChange(newItems);
  };

  const handleFieldChange = (index: number, field: keyof SalesOrderItem, value: any) => {
    if (isChannelPartnerUser && (field === 'free_quantity' || field === 'discount_type' || field === 'discount_value')) {
      return;
    }
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    calculateLineTotal(newItems, index);
    onChange(newItems);
  };

  const calculateLineTotal = (items: SalesOrderItem[], index: number) => {
    const item = items[index];
    
    // Convert to numbers with fallbacks
    const quantity = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const discountValue = Number(item.discount_value) || 0;
    const taxRate = Number(item.tax_percentage) || 0;
    
    // Base amount
    const baseAmount = quantity * rate;
    
    // Calculate discount
    if (item.discount_type === 'PERCENTAGE') {
      const validPercent = Math.max(discountValue, 0);
      item.discount_value = validPercent;
      item.discount_amount = (baseAmount * validPercent) / 100;
    } else {
      const validAmount = Math.max(discountValue, 0);
      item.discount_value = validAmount;
      item.discount_amount = validAmount;
    }
    
    const netAmount = Math.max(baseAmount - item.discount_amount, 0);
    
    // Calculate based on tax type
    if (taxType === 'EXCLUSIVE') {
      // Tax Extra: net amount is taxable
      item.taxable_amount = netAmount;
      item.tax_amount = (netAmount * taxRate) / 100;
      item.line_total = netAmount + item.tax_amount;
    } else {
      // Tax Inclusive: net amount includes tax
      item.line_total = netAmount;
      item.taxable_amount = netAmount / (1 + taxRate / 100);
      item.tax_amount = netAmount - item.taxable_amount;
    }

    // Split tax into CGST/SGST/IGST based on state
    const taxableAmt = item.taxable_amount;
    
    
    if (isSameState) {
      // Intra-state: CGST + SGST (50-50 split)
      const halfRate = taxRate / 2;
      const halfAmount = (taxableAmt * halfRate) / 100;
      item.cgst_rate = halfRate;
      item.cgst_amount = halfAmount;
      item.sgst_rate = halfRate;
      item.sgst_amount = halfAmount;
      item.igst_rate = 0;
      item.igst_amount = 0;
    } else {
      // Inter-state: IGST (full rate)
      item.cgst_rate = 0;
      item.cgst_amount = 0;
      item.sgst_rate = 0;
      item.sgst_amount = 0;
      item.igst_rate = taxRate;
      item.igst_amount = (taxableAmt * taxRate) / 100;
    }
  };

  const getSourceColor = (source: PriceSource) => {
    switch (source) {
      case 'RETAILER':
      case 'DISTRIBUTOR':
      case 'SUPERSTOCKIST':
        return 'success.main';
      case 'AREA':
      case 'CITY':
        return 'info.main';
      case 'STATE':
        return 'warning.main';
      case 'BASE':
        return 'text.secondary';
      default:
        return 'error.main';
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: 400,
        display: 'flex',
        flexDirection: 'column',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {/* Scrollable Table */}
      <TableContainer
        sx={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <Table
          stickyHeader
          sx={{
            minWidth: 1800,
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  minWidth: 50,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                }}
              >
                S.No
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 60,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                  position: 'sticky',
                  left: 50,
                  zIndex: 3,
                }}
              >
                Image
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 150,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                  position: 'sticky',
                  left: 110,
                  zIndex: 3,
                }}
              >
                Category
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 150,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                  position: 'sticky',
                  left: 260,
                  zIndex: 3,
                }}
              >
                Product Code
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 200,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                }}
              >
                Product Name
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 200,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                }}
              >
                Company
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 100,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                }}
              >
                HSN Code
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 80,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                }}
              >
                UOM
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 100,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                }}
              >
                Quantity
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 100,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                }}
              >
                Free Qty
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 120,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  PB Rate
                  <Tooltip title="Price from Price Book (hover to see source)">
                    <InfoIcon fontSize="small" />
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 120,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                }}
              >
                Rate
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 100,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                }}
              >
                Disc Type
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 100,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                }}
              >
                Disc Value
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 120,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                }}
              >
                Disc Amount
              </TableCell>
              {showSchemeDiscount && (
                <TableCell
                  sx={{
                    minWidth: 130,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontWeight: 600,
                  }}
                >
                  Scheme Disc
                </TableCell>
              )}
              <TableCell
                sx={{
                  minWidth: 120,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                }}
              >
                Taxable Amt
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 80,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                }}
              >
                Tax %
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 120,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                }}
              >
                Tax Amount
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 120,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                }}
              >
                Line Total
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 80,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600,
                  position: 'sticky',
                  right: 0,
                  zIndex: 3,
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showSchemeDiscount ? 20 : 19} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                  <Typography variant="body2">
                    No Products added. Click "Add Product" to start.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => {
                const isFreeItem = Boolean(item.is_scheme_free_item);
                const displayItem = displayItems?.[index] || item;
                const schemeDiscount = schemeDiscounts?.[index] || 0;
                const lineBaseAmount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
                const hasDiscountError = (Number(item.discount_amount) || 0) > lineBaseAmount;
                const discountErrorText = errors[`discount_${index}`] || 'Discount amount cannot be greater than taxable amount';
                return (
                <TableRow
                  key={index}
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    bgcolor: index % 2 === 0 ? 'background.default' : 'background.paper',
                  }}
                >
                  {/* S.No - Sticky */}
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 0,
                      bgcolor: 'background.paper',
                      zIndex: 2,
                      fontWeight: 500,
                    }}
                  >
                    {index + 1}
                  </TableCell>

                  {/* Image - Sticky */}
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 50,
                      bgcolor: 'background.paper',
                      zIndex: 2,
                    }}
                  >
                    {item.item_image ? (
                      <MediaImage
                        src={item.item_image}
                        alt={item.item_name || 'Product'}
                        sx={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 0.5 }}
                      />
                    ) : (
                      <Box sx={{ width: 36, height: 36, bgcolor: 'grey.100', borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="caption" color="text.disabled">-</Typography>
                      </Box>
                    )}
                  </TableCell>

                  {/* Category - Sticky */}
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 110,
                      bgcolor: 'background.paper',
                      zIndex: 2,
                    }}
                  >
                    {isFreeItem ? (
                      <Typography variant="body2" color="text.disabled">{item.category_name || '-'}</Typography>
                    ) : (
                    <Box sx={{ minWidth: 180 }}>
                      <SearchableDropdown
                        label=""
                        apiEndpoint="/api/masters/categories/"
                        value={item.category && item.category_name ? { id: item.category, name: item.category_name } : null}
                        onChange={(value) => handleCategoryChange(index, value as DropdownOption | null)}
                        placeholder="Select Category"
                        additionalFilters={{ is_active: true }}
                        size="small"
                      />
                    </Box>
                    )}
                  </TableCell>

                  {/* Item Code - Sticky */}
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 260,
                      bgcolor: 'background.paper',
                      zIndex: 2,
                    }}
                  >
                    {isFreeItem ? (
                      <Typography variant="body2" color="text.disabled">{item.item_code || '-'}</Typography>
                    ) : (
                    <Autocomplete
                      size="small"
                      options={
                        item.category
                          ? (itemsByCategory[enforceCompanyItemFilter ? `${item.category}::${companyId || 'none'}` : item.category] || [])
                          : []
                      }
                      value={
                        item.item && item.item_code
                          ? { id: item.item, code: item.item_code, name: item.item_name || '' }
                          : null
                      }
                      disabled={!item.category || (enforceCompanyItemFilter && !companyId)}
                      onChange={(_, newValue) => {
                        if (!newValue) {
                          resetItemRow(index);
                          return;
                        }
                        // Check for duplicate item before selecting
                        const existingRow = items.findIndex((it, i) =>
                          i !== index && it.item && String(it.item) === String(newValue.id)
                        );
                        if (existingRow >= 0) {
                          toastError(`This product already exists in Row ${existingRow + 1}. Please update the quantity instead.`);
                          resetItemRow(index);
                          return;
                        }
                        handleItemSelect(index, newValue);
                      }}
                      getOptionLabel={(option) => {
                        if (!option) return '';
                        return option.code || option.name || '';
                      }}
                      filterOptions={itemFilter}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id as string}>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" fontWeight={600}>
                              {option.code || option.name}
                            </Typography>
                            {option.code && option.name && (
                              <Typography variant="caption" color="text.secondary">
                                {option.name}
                              </Typography>
                            )}
                          </Box>
                        </li>
                      )}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      loading={loadingItems}
                      sx={{ minWidth: 180 }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search by code or name"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loadingItems ? <CircularProgress size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                    )}
                  </TableCell>

                  {/* Item Name */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2" noWrap>
                        {item.item_name || '-'}
                      </Typography>
                      {isFreeItem && (
                        <Tooltip title="Scheme Free Item">
                          <FreeItemIcon fontSize="small" sx={{ color: 'success.main' }} />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>

                  {/* Company */}
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {item.company_name || '-'}
                    </Typography>
                  </TableCell>

                  {/* HSN Code */}
                  <TableCell>
                    <Typography variant="body2">{item.hsn_code || '-'}</Typography>
                  </TableCell>

                  {/* UOM */}
                  <TableCell>
                    {uomOptions[index] && uomOptions[index]!.filter((opt) => isValidUomName(opt.name)).length > 1 ? (
                      <TextField
                        select
                        size="small"
                        value={
                          uomOptions[index]!.find((opt) => isValidUomName(opt.name) && (opt.name === item.uom_name || opt.id === item.uom_name))?.id ||
                          item.uom_name ||
                          ''
                        }
                        onChange={(e) => handleUomChange(index, e.target.value)}
                        sx={{ minWidth: 120 }}
                      >
                        {uomOptions[index]!.filter((uom) => isValidUomName(uom.name)).map((uom) => (
                          <MenuItem key={uom.id} value={uom.id}>
                            {uom.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <Typography variant="body2">{getDisplayUomName(item.uom_name)}</Typography>
                    )}
                  </TableCell>

                  {/* Quantity */}
                  <TableCell>
                    {isFreeItem ? (
                      <Typography variant="body2" fontWeight={500}>{item.quantity}</Typography>
                    ) : (
                    <TextField
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleFieldChange(index, 'quantity', parseInt(e.target.value, 10) || 0)
                      }
                      size="small"
                      inputProps={{ min: 0, step: 1 }}
                      sx={{ 
                        width: 90,
                        '& input[type=number]': {
                          MozAppearance: 'textfield'
                        },
                        '& input[type=number]::-webkit-outer-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0
                        },
                        '& input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0
                        }
                      }}
                    />
                    )}
                  </TableCell>

                  {/* Free Quantity */}
                  <TableCell>
                    {isFreeItem ? (
                      <Typography variant="body2">-</Typography>
                    ) : (
                    <TextField
                      type="number"
                      value={item.free_quantity}
                      onChange={(e) =>
                        handleFieldChange(index, 'free_quantity', parseFloat(e.target.value) || 0)
                      }
                      size="small"
                      disabled={isChannelPartnerUser}
                      inputProps={{ min: 0, step: 0.001 }}
                      sx={{ 
                        width: 90,
                        '& input[type=number]': {
                          MozAppearance: 'textfield'
                        },
                        '& input[type=number]::-webkit-outer-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0
                        },
                        '& input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0
                        }
                      }}
                    />
                    )}
                  </TableCell>

                  {/* PB Rate with Tooltip */}
                  <TableCell>
                    {isFreeItem ? (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    ) : loadingPrices[index] ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Tooltip
                        title={`Price from: ${(item.pb_rate_source || 'NOT_FOUND').replace('_', ' ')}`}
                        arrow
                        placement="top"
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            cursor: 'help',
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ color: getSourceColor(item.pb_rate_source || 'NOT_FOUND') }}
                          >
                            ₹{Number(item.pb_rate || 0).toFixed(2)}
                          </Typography>
                          <InfoIcon fontSize="small" sx={{ color: 'action.active' }} />
                        </Box>
                      </Tooltip>
                    )}
                  </TableCell>

                  {/* Rate - Editable */}
                  <TableCell>
                    {isFreeItem ? (
                      <Typography variant="body2" fontWeight={500} color="success.main">₹0.00 (Free)</Typography>
                    ) : (
                    <>
                    <TextField
                      type="number"
                      value={item.rate}
                      onChange={(e) =>
                        handleFieldChange(index, 'rate', parseFloat(e.target.value) || 0)
                      }
                      size="small"
                      required={isChannelPartnerUser}
                      disabled={isChannelPartnerUser}
                      error={Number(item.rate || 0) < Number(item.pb_rate || 0)}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{
                        width: 110,
                        '& input': {
                          color: item.rate < item.pb_rate ? 'error.main' : 'inherit',
                        },
                        '& input[type=number]': {
                          MozAppearance: 'textfield'
                        },
                        '& input[type=number]::-webkit-outer-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0
                        },
                        '& input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0
                        }
                      }}
                    />
                    {Number(item.rate || 0) < Number(item.pb_rate || 0) && (
                      <Typography variant="caption" color="error">
                        Below PB Rate
                      </Typography>
                    )}
                    </>
                    )}
                  </TableCell>

                  {/* Discount Type */}
                  <TableCell>
                    {isFreeItem ? (
                      <Typography variant="body2">-</Typography>
                    ) : (
                    <Select
                      value={item.discount_type}
                      onChange={(e) =>
                        handleFieldChange(index, 'discount_type', e.target.value)
                      }
                      size="small"
                      disabled={isChannelPartnerUser}
                      sx={{ width: 90 }}
                    >
                      <MenuItem value="PERCENTAGE">%</MenuItem>
                      <MenuItem value="AMOUNT">₹</MenuItem>
                    </Select>
                    )}
                  </TableCell>

                  {/* Discount Value */}
                  <TableCell>
                    {isFreeItem ? (
                      <Typography variant="body2">-</Typography>
                    ) : (
                    <TextField
                      type="number"
                      value={item.discount_value}
                      onChange={(e) =>
                        handleFieldChange(index, 'discount_value', parseFloat(e.target.value) || 0)
                      }
                      size="small"
                      disabled={isChannelPartnerUser}
                      error={hasDiscountError || Boolean(errors[`discount_${index}`])}
                      helperText={hasDiscountError || Boolean(errors[`discount_${index}`]) ? discountErrorText : ''}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ 
                        width: 90,
                        '& input[type=number]': {
                          MozAppearance: 'textfield'
                        },
                        '& input[type=number]::-webkit-outer-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0
                        },
                        '& input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0
                        }
                      }}
                    />
                    )}
                  </TableCell>

                  {/* Discount Amount - Calculated */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      ₹{Number(displayItem.discount_amount || 0).toFixed(2)}
                    </Typography>
                  </TableCell>

                  {showSchemeDiscount && (
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} color="error">
                        ₹{Number(schemeDiscount || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                  )}

                  {/* Taxable Amount - Calculated */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      ₹{Number(displayItem.taxable_amount || 0).toFixed(2)}
                    </Typography>
                  </TableCell>

                  {/* Tax Percentage */}
                  <TableCell>
                    <Typography variant="body2">
                      {Number(item.tax_percentage || 0).toFixed(2)}%
                    </Typography>
                  </TableCell>

                  {/* Tax Amount - Calculated */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      ₹{Number(displayItem.tax_amount || 0).toFixed(2)}
                    </Typography>
                  </TableCell>

                  {/* Line Total - Calculated */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      ₹{Number(displayItem.line_total || 0).toFixed(2)}
                    </Typography>
                  </TableCell>

                  {/* Actions - Sticky on right */}
                  <TableCell
                    sx={{
                      position: 'sticky',
                      right: 0,
                      bgcolor: 'background.paper',
                      zIndex: 2,
                    }}
                  >
                    {!isFreeItem && (
                      <IconButton onClick={() => handleDeleteItem(index)} color="error" size="small">
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary Row - Fixed at bottom */}
     <Box
        sx={{
          p: 1.5,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'grey.50',
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: { xs: 1.5, sm: 3 },
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="body2">
          <strong>Total Products:</strong> {items.length}
        </Typography>
        <Typography variant="body2">
          <strong>Total Qty:</strong>{' '}
          {items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0).toFixed(3)}
        </Typography>
       
      </Box>
    </Box>
  );
};

export default SalesOrderItemGrid;

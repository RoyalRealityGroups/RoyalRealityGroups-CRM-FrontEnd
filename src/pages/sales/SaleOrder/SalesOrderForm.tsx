import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  MenuItem,
  Tooltip,
  Checkbox,
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Autocomplete,
} from '@mui/material';
import {
  Save as SaveIcon,
  Upload as UploadIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
  Receipt as ReceiptIcon,
  Info as InfoIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { Card, CardContent, CardActions } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { toDayjs } from '../../../utils/format';
import SearchableDropdown from '../../../components/common/SearchableDropdown';
import MediaImage from '../../../components/common/MediaImage';
import ScreenHeader from '../../../components/common/ScreenHeader';
import SalesOrderItemGrid from './SalesOrderItemGrid';
import PreviousInvoicesSection from '../Invoice/PreviousInvoicesSection';
import CreditSummarySection from '../CreditSummarySection';
import PendingSalesOrdersSection from './PendingSalesOrdersSection';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { usePageTitle } from '../../../hooks';
import type {
  SalesOrderItem,
  CustomerType,
  AvailableScheme,
  SalesOrderAppliedScheme,
  FrequentSalesItem,
} from '../../../types/sales.types';
import type { DropdownOption } from '../../../types/common.types';
import { salesOrderApi } from '../../../api/sales.api';
import apiClient from '../../../api/axios.config';
import { channelConfigApi, generalSettingsApi } from '../../../api/masters.api';
import { useToast } from '../../../contexts/ToastContext';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../../../utils/spacing';
import { useAppSelector } from '../../../store/hooks';

const SalesOrderForm: React.FC = () => {
  const { id } = useParams<{ id: string}>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const isEditMode = Boolean(id);
  const { success: toastSuccess, error: toastError } = useToast();
  const currentUser = useAppSelector((state) => state.auth.user);

  usePageTitle(isEditMode ? 'Edit Sales Order' : 'Create Sales Order');

  // Form state
  const [documentNo, setDocumentNo] = useState('');
  const [orderDate, setOrderDate] = useState<Dayjs>(dayjs());
  const [company, setCompany] = useState<DropdownOption | null>(null);
  const [taxType, setTaxType] = useState<'EXCLUSIVE' | 'INCLUSIVE'>('EXCLUSIVE');
  const [customer, setCustomer] = useState<DropdownOption | null>(null);
  const [customerType, setCustomerType] = useState<CustomerType | null>(null);
  const [creditDays, setCreditDays] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);
  const [billingAddress, setBillingAddress] = useState('');
  const [billingState, setBillingState] = useState<string | null>(null);
  const [billingCity, setBillingCity] = useState<string | null>(null);
  const [billingArea, setBillingArea] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingState, setShippingState] = useState<string | null>(null);
  const [shippingCity, setShippingCity] = useState<string | null>(null);
  const [shippingArea, setShippingArea] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('DRAFT');
  const [remarks, setRemarks] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [selectedAttachmentFiles, setSelectedAttachmentFiles] = useState<File[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [items, setItems] = useState<SalesOrderItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableSchemes, setAvailableSchemes] = useState<AvailableScheme[]>([]);
  const [selectedSchemeIds, setSelectedSchemeIds] = useState<string[]>([]);
  const [selectedSchemeIdsSet, setSelectedSchemeIdsSet] = useState<Set<string>>(new Set());
  const [isApplyingSchemes, setIsApplyingSchemes] = useState(false);
  const [isPreviewingSchemes, setIsPreviewingSchemes] = useState(false);
  const [selectedFrequentItemIds, setSelectedFrequentItemIds] = useState<Set<string>>(new Set());
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [pendingFrequentItemsToAdd, setPendingFrequentItemsToAdd] = useState<FrequentSalesItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  const [barcodeSuggestions, setBarcodeSuggestions] = useState<any[]>([]);
  const [loadingBarcodeSuggestions, setLoadingBarcodeSuggestions] = useState(false);
  const [barcodeAutoSearchTimer, setBarcodeAutoSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const readOnlyFieldSx = { '& .MuiInputBase-input': { bgcolor: 'grey.100' } };

  // Load existing order
  const { data: existingOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['salesOrder', id],
    queryFn: () => salesOrderApi.getById(id!),
    enabled: isEditMode,
  });

  // Fetch available schemes for edit mode using the order data
  const fetchEditModeSchemes = async () => {
    if (!existingOrder || !isEditMode) return null;
    
    const orderItems = (existingOrder.items || [])
      .filter((item: any) => !!item.item)
      .map((item: any) => ({
        item_id: item.item as string,
        category_id: item.category || null,
        quantity: Number(item.quantity || 0),
        item_amount: Number(item.line_total || (item.rate || 0) * (item.quantity || 0) || 0),
      }))
      .filter((item: any) => item.quantity > 0);

    if (orderItems.length === 0) return null;

    const payload = {
      customer_type: existingOrder.customer_type,
      customer_id: existingOrder.customer_type === 'RETAILER' ? existingOrder.retailer
        : existingOrder.customer_type === 'DISTRIBUTOR' ? existingOrder.distributor
        : existingOrder.superstockist,
      order_date: dayjs(existingOrder.order_date).format('YYYY-MM-DD'),
      items: orderItems,
    };

    return salesOrderApi.getApplicableSchemes(payload);
  };

  const {
    data: availableSchemesData,
    isLoading: isLoadingSchemes,
    refetch: refetchAvailableSchemes,
    error: schemesError,
  } = useQuery({
    queryKey: ['salesOrderAvailableSchemes', id, existingOrder?.items],
    queryFn: fetchEditModeSchemes,
    enabled: isEditMode && Boolean(id) && Boolean(existingOrder),
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
  });

  const { data: generalSettings } = useQuery({
    queryKey: ['generalSettings'],
    queryFn: generalSettingsApi.getGeneralSettings,
  });

  const {
    data: frequentItemsData,
    isLoading: isLoadingFrequentItems,
  } = useQuery({
    queryKey: ['salesOrderFrequentItems', customerType, customer?.id, company?.id, generalSettings?.company_scoped_item_enforcement],
    queryFn: () => salesOrderApi.getFrequentItems(customerType!, customer!.id as string, 12, 10, company?.id as string | undefined),
    enabled:
      !isEditMode &&
      Boolean(customerType && customer?.id) &&
      (!generalSettings?.company_scoped_item_enforcement || Boolean(company?.id)),
  });

  // Get channel config to filter customer types
  const { data: channelConfig, isLoading: isChannelConfigLoading, isError: isChannelConfigError } = useQuery({
    queryKey: ['channelConfig'],
    queryFn: channelConfigApi.getChannelConfig,
  });


  // Fetch attachments for edit mode
  const { data: attachmentsData, refetch: refetchAttachments } = useQuery({
    queryKey: ['salesOrderAttachments', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/sales/orders/${id}/attachments/`);
      return response.data;
    },
    enabled: isEditMode,
  });

  useEffect(() => {
    if (attachmentsData) {
      setAttachments(attachmentsData);
    }
  }, [attachmentsData]);

  // Populate form when editing
  useEffect(() => {
    if (existingOrder) {
      setDocumentNo(existingOrder.order_number);
      setOrderDate(dayjs(existingOrder.order_date));
      if (existingOrder.company) {
        setCompany({
          id: existingOrder.company,
          name: existingOrder.company_name || '',
        });
      }
      setTaxType(existingOrder.tax_type || 'EXCLUSIVE');
      
      // Set customer based on customer type
      const customerId = existingOrder.customer_type === 'RETAILER' ? existingOrder.retailer
        : existingOrder.customer_type === 'DISTRIBUTOR' ? existingOrder.distributor
        : existingOrder.customer_type === 'SUPERSTOCKIST' ? existingOrder.superstockist
        : null;
      
      if (customerId) {
        setCustomer({
          id: customerId,
          name: existingOrder.customer_name || '',
        });
      }
      setCustomerType(existingOrder.customer_type);
      setOrderStatus(existingOrder.status || 'DRAFT');
      setCreditDays(existingOrder.credit_days || 0);
      setCreditLimit(Number((existingOrder as any).credit_limit || 0));

      // Fetch customer details to get credit limit
      if (customerId && existingOrder.customer_type) {
        const endpoint = existingOrder.customer_type === 'RETAILER' ? `/api/masters/retailers/${customerId}/`
          : existingOrder.customer_type === 'DISTRIBUTOR' ? `/api/masters/distributors/${customerId}/`
          : `/api/masters/superstockists/${customerId}/`;
        apiClient.get(endpoint).then((res) => {
          setCreditLimit(Number(res.data.credit_limit || 0));
        }).catch(() => {});
      }
      setBillingAddress(existingOrder.billing_address || '');
      setBillingState(existingOrder.billing_state || null);
      setBillingCity(existingOrder.billing_city || null);
      setBillingArea(existingOrder.billing_area || null);
      setShippingAddress(existingOrder.shipping_address || '');
      setShippingState(existingOrder.shipping_state || null);
      setShippingCity(existingOrder.shipping_city || null);
      setShippingArea(existingOrder.shipping_area || null);
      setRemarks(existingOrder.remarks || '');

      // Load items and append free items from applied schemes
      const orderItems = existingOrder.items || [];
      const appliedFreeItems = (existingOrder.applied_schemes || [])
        .flatMap((s) => s.free_items || []);
      buildFreeItemLines(appliedFreeItems).then((freeLines) => {
        setItems([...orderItems, ...freeLines]);
      });
    }
  }, [existingOrder]);

  useEffect(() => {
    if (availableSchemesData) {
      if (availableSchemesData.applicable_schemes) {
        setAvailableSchemes(availableSchemesData.applicable_schemes);
      } else if (Array.isArray(availableSchemesData)) {
        // Handle case where API returns array directly
        setAvailableSchemes(availableSchemesData);
      } else {
        setAvailableSchemes([]);
      }
    }
  }, [availableSchemesData, isEditMode, isLoadingSchemes]);

  useEffect(() => {
    if (existingOrder?.applied_schemes) {
      const schemeIds = existingOrder.applied_schemes.map((scheme) => scheme.scheme);
      setSelectedSchemeIds(schemeIds);
      setSelectedSchemeIdsSet(new Set(schemeIds));
    } else if (isEditMode) {
      // Clear selections if no applied schemes
      setSelectedSchemeIds([]);
      setSelectedSchemeIdsSet(new Set());
    }
  }, [existingOrder?.applied_schemes, isEditMode]);

  useEffect(() => {
    const allowMultipleSchemes = generalSettings?.allow_multiple_schemes ?? true;
    if (!allowMultipleSchemes && selectedSchemeIds.length > 1) {
      const firstId = selectedSchemeIds[0];
      setSelectedSchemeIds([firstId]);
      setSelectedSchemeIdsSet(new Set([firstId]));
    }
  }, [generalSettings?.allow_multiple_schemes, selectedSchemeIds]);

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Sales', path: '/sales', icon: <FolderIcon fontSize="small" /> },
      { label: 'Sales Orders', path: '/sales/orders', icon: <ReceiptIcon fontSize="small" /> },
      { label: isEditMode ? 'Edit Sales Order' : 'New Sales Order' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode]);

  // Cleanup barcode auto-search timer on unmount
  useEffect(() => {
    return () => {
      if (barcodeAutoSearchTimer) {
        clearTimeout(barcodeAutoSearchTimer);
      }
    };
  }, [barcodeAutoSearchTimer]);

  const formatFreeItems = (itemsList: SalesOrderAppliedScheme['free_items'] | AvailableScheme['preview_free_items']) => {
    if (!itemsList || itemsList.length === 0) {
      return '-';
    }
    return itemsList
      .map((item) => `${item.item_name || item.item_id || 'Item'} x ${Number(item.quantity || 0)}`)
      .join(', ');
  };

  // Helper to get discount amount from scheme (with fallback to benefits)
  const getSchemeDiscountAmount = (scheme: any): number => {
    // First try preview_discount_amount
    if (scheme.preview_discount_amount && Number(scheme.preview_discount_amount) > 0) {
      return Number(scheme.preview_discount_amount);
    }
    
    // Fallback: calculate from benefits if available
    // Note: This is a rough estimate and may not reflect actual applicable discount
    if (scheme.benefits && Array.isArray(scheme.benefits)) {
      const benefitDiscount = scheme.benefits.reduce((sum: number, benefit: any) => {
        if (benefit.benefit_type === 'DISCOUNT_AMOUNT') {
          const discountValue = Number(benefit.discount_value) || 0;
          return sum + discountValue;
        }
        if (benefit.benefit_type === 'DISCOUNT_PERCENTAGE') {
          // Can't calculate percentage without knowing the base amount
          return sum;
        }
        return sum;
      }, 0);
      return benefitDiscount;
    }
    
    return 0;
  };

  // Helper to get free items from scheme benefits
  const getSchemeFreeItems = (scheme: any) => {
    // First try preview_free_items
    if (scheme.preview_free_items && scheme.preview_free_items.length > 0) {
      return scheme.preview_free_items;
    }
    
    // Fallback: extract from benefits
    if (scheme.benefits && Array.isArray(scheme.benefits)) {
      return scheme.benefits
        .filter((benefit: any) => benefit.benefit_type === 'FREE_ITEM' && benefit.free_item)
        .map((benefit: any) => ({
          item_id: benefit.free_item,
          item_name: benefit.free_item_name || '',
          quantity: Number(benefit.free_quantity) || 0,
        }));
    }
    
    return [];
  };

  const toggleSchemeSelection = (schemeId: string) => {
    const allowMultipleSchemes = generalSettings?.allow_multiple_schemes ?? true;
    
    setSelectedSchemeIds((prev) => {
      const next = prev.includes(schemeId)
        ? prev.filter((idValue) => idValue !== schemeId)
        : allowMultipleSchemes ? [...prev, schemeId] : [schemeId];
      return next;
    });

    // In create mode, sync free items based on selected schemes
    // Use setTimeout to ensure state is updated before processing
    if (!isEditMode) {
      setTimeout(() => {
        setSelectedSchemeIds((currentIds) => {
          const selectedSchemes = availableSchemes.filter((s) => currentIds.includes(s.id));
          const allFreeItems = selectedSchemes.flatMap((s) => s.preview_free_items || []);
          
          buildFreeItemLines(allFreeItems).then((freeLines) => {
            setItems((prevItems) => {
              const withoutOldFree = prevItems.filter((i) => !i.is_scheme_free_item);
              return [...withoutOldFree, ...freeLines];
            });
          });
          
          return currentIds;
        });
      }, 0);
    }
  };

  const buildFreeItemLines = async (freeItems: Array<{ item_id?: string; item_name?: string; quantity?: number }>): Promise<SalesOrderItem[]> => {
    const validItems = freeItems.filter((fi) => fi.item_id && (fi.quantity || 0) > 0);
    const lines: SalesOrderItem[] = [];
    for (const fi of validItems) {
      let itemCode = '';
      let categoryId = '';
      let categoryName = '';
      let hsnCode = '';
      let uomName = '';
      try {
        const detail = await apiClient.get(`/api/masters/items/${fi.item_id}/`);
        const d = detail.data;
        itemCode = d.code || '';
        categoryId = String(d.category?.id ?? d.category_id ?? d.category ?? '');
        categoryName = d.category?.name ?? d.category_name ?? '';
        hsnCode = d.hsn_code || '';
        uomName = d.base_uom_name || d.uom_name || '';
      } catch {
      }
      lines.push({
        item: fi.item_id!,
        item_code: itemCode,
        item_name: fi.item_name || '',
        category: categoryId,
        category_name: categoryName,
        hsn_code: hsnCode,
        uom_name: uomName,
        uom_factor: 1,
        quantity: Number(fi.quantity || 0),
        free_quantity: 0,
        pb_rate: 0,
        pb_rate_source: 'NOT_FOUND' as const,
        rate: 0,
        discount_type: 'AMOUNT' as const,
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
        is_scheme_free_item: true,
      });
    }
    return lines;
  };

  const addSchemeFreeItemsToGrid = async (schemes: { free_items?: Array<{ item_id?: string; item_name?: string; quantity?: number }> }[]) => {
    const allFreeItems = schemes.flatMap((s) => s.free_items || []);
    if (allFreeItems.length === 0) return;
    const freeLines = await buildFreeItemLines(allFreeItems);
    if (freeLines.length === 0) return;
    setItems((prev) => {
      const withoutOldFree = prev.filter((i) => !i.is_scheme_free_item);
      return [...withoutOldFree, ...freeLines];
    });
  };

  const handleApplySchemes = async () => {
    if (!id) return;
    
    try {
      setIsApplyingSchemes(true);
      
      if (selectedSchemeIds.length === 0) {
        // Removing all schemes
        const result = await salesOrderApi.applySchemes(id, []);
        toastSuccess('All schemes removed successfully.');
        
        // Remove free items from the grid
        setItems((prevItems) => prevItems.filter((i) => !i.is_scheme_free_item));
      } else {
        // Applying selected schemes
        const result = await salesOrderApi.applySchemes(id, selectedSchemeIds);
        toastSuccess('Schemes applied successfully.');
        
        // Add free items from applied schemes to the grid
        const appliedSchemes = result?.applied_schemes || [];
        if (appliedSchemes.length > 0) {
          await addSchemeFreeItemsToGrid(appliedSchemes);
        }
      }
      
      // Invalidate and refetch order data to get updated scheme information
      await queryClient.invalidateQueries({ queryKey: ['salesOrder', id] });
      await queryClient.refetchQueries({ queryKey: ['salesOrder', id] });
      
      // Refetch available schemes to update the list
      await refetchAvailableSchemes();
      
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.response?.data?.detail || error?.message || 'Failed to apply schemes.';
      toastError(errorMessage);
    } finally {
      setIsApplyingSchemes(false);
    }
  };

  const fetchPreviewSchemes = async (silent = false) => {
    if (!customerType || !customer?.id) {
      if (!silent) {
        toastError('Please select a customer.');
      }
      setAvailableSchemes([]);
      return;
    }
    const orderItems = items
      .filter((item) => !!item.item)
      .map((item) => ({
        item_id: item.item as string,
        category_id: item.category || null,
        quantity: Number(item.quantity || 0),
        item_amount: Number(item.line_total || (item.rate || 0) * (item.quantity || 0) || 0),
      }))
      .filter((item) => item.quantity > 0);

    if (orderItems.length === 0) {
      if (!silent) {
        toastError('Please add at least one product to preview schemes.');
      }
      setAvailableSchemes([]);
      return;
    }

    //const locationId = billingArea || billingCity || billingState || undefined;

    try {
      setIsPreviewingSchemes(true);
      const response = await salesOrderApi.getApplicableSchemes({
        customer_type: customerType,
        customer_id: customer.id as string,
       // company_id: company?.id as string,
        //location_id: locationId,
        order_date: orderDate.format('YYYY-MM-DD'),
        items: orderItems,
      });
      setAvailableSchemes(response.applicable_schemes || []);
    } catch (error) {
      if (!silent) {
        toastError('Failed to preview schemes.');
      }
    } finally {
      setIsPreviewingSchemes(false);
    }
  };

  const handlePreviewSchemes = async () => {
    await fetchPreviewSchemes(false);
  };

  // Track only regular (non-free) items to avoid clearing schemes when free items change
  const regularItemsSignature = useMemo(() => {
    const regularItems = items.filter((i) => !i.is_scheme_free_item);
    return JSON.stringify(
      regularItems.map((i) => ({
        item: i.item,
        quantity: i.quantity,
        rate: i.rate,
        discount_amount: i.discount_amount,
      }))
    );
  }, [items]);

  useEffect(() => {
    if (isEditMode) return;
    
    // Clear selected schemes when regular items change (not when free items are added)
    setSelectedSchemeIds([]);
    setSelectedSchemeIdsSet(new Set());
    
    const timer = window.setTimeout(() => {
      void fetchPreviewSchemes(true);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [
    isEditMode,
    company?.id,
    customerType,
    customer?.id,
    orderDate,
    billingArea,
    billingCity,
    billingState,
    regularItemsSignature, // Only trigger when regular items change
  ]);

  // Generate document number for new orders
  useEffect(() => {
    const generateDocNumber = async () => {
      if (!isEditMode && !documentNo) {
        try {
          const response = await salesOrderApi.generateDocumentNumber(company?.id);
          setDocumentNo(response.order_number);
        } catch (error) {
        }
      }
    };

    generateDocNumber();
  }, [isEditMode, documentNo]);

  // Regenerate document number when company changes (new orders only)
  useEffect(() => {
    const regenForCompany = async () => {
      if (isEditMode || !company?.id) return;
      try {
        const response = await salesOrderApi.generateDocumentNumber(company.id);
        setDocumentNo(response.order_number);
      } catch (error) {
      }
    };
    void regenForCompany();
  }, [isEditMode, company?.id]);

  // Auto-select company if only one available
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!isEditMode && !company) {
        try {
          const response = await apiClient.get('/api/usermanagement/dropdowns/companies/', { params: { page_size: 10 } });
          const companies = response.data.results || response.data;
          if (Array.isArray(companies) && companies.length === 1) {
            setCompany({ id: companies[0].id, name: companies[0].name });
          }
        } catch (error) {
        }
      }
    };

    fetchCompanies();
  }, [isEditMode, company]);

  // Auto-select customer type and customer based on logged-in user
  useEffect(() => {
    if (isEditMode || !currentUser) return;

    const userType = currentUser.channel_partner_type;

    // For distributor users
    if (userType === 'DISTRIBUTOR' && currentUser.distributor && currentUser.distributor_name) {
      setCustomerType('DISTRIBUTOR');
      setCustomer({
        id: currentUser.distributor_name.id,
        name: currentUser.distributor_name.name,
      });
      // Trigger customer details fetch
      handleCustomerChange({
        id: currentUser.distributor_name.id,
        name: currentUser.distributor_name.name,
      });
    }
    // For retailer users
    else if (userType === 'RETAILER' && currentUser.retailer && currentUser.retailer_name) {
      setCustomerType('RETAILER');
      setCustomer({
        id: currentUser.retailer_name.id,
        name: currentUser.retailer_name.name,
      });
      // Trigger customer details fetch
      handleCustomerChange({
        id: currentUser.retailer_name.id,
        name: currentUser.retailer_name.name,
      });
    }
  }, [isEditMode, currentUser]);

  // Fetch customer details when selected
  const handleCustomerChange = async (value: DropdownOption | null) => {
    setCustomer(value);
    
    // Clear items when customer changes
    setItems([]);
    setSelectedFrequentItemIds(new Set());
    // Clear schemes when customer changes
    setAvailableSchemes([]);
    setSelectedSchemeIds([]);
    setSelectedSchemeIdsSet(new Set());

    // Clear state when nothing selected
    if (!value) {
      setCreditDays(0);
      setBillingAddress('');
      setBillingState(null);
      setBillingCity(null);
      setBillingArea(null);
      setShippingAddress('');
      setShippingState(null);
      setShippingCity(null);
      setShippingArea(null);
      return;
    }

    // Prefer the explicitly selected customer type; fall back to option payload if present
    const effectiveType = customerType || (value as any)?.partner_type || (value as any)?.type || null;

    // Resolve which backend endpoint to hit for details based on partner type
    const resolveDetailEndpoint = () => {
      if (effectiveType === 'RETAILER') return `/api/masters/retailers/${value.id}/`;
      if (effectiveType === 'DISTRIBUTOR') return `/api/masters/distributors/${value.id}/`;
      if (effectiveType === 'SUPERSTOCKIST') return `/api/masters/superstockists/${value.id}/`;
      // Fallback to legacy combined endpoint if type not provided
      return `/api/masters/channel-partners/${value.id}/`;
    };

    try {
      const response = await apiClient.get(resolveDetailEndpoint());
      const customerData = response.data;

      // If backend returns a partner type, sync it (useful when option lacked the field)
      if (!customerType && customerData.partner_type) {
        setCustomerType(customerData.partner_type);
      }

      setCreditDays(customerData.credit_days || 0);
      setCreditLimit(customerData.credit_limit || 0);

      // Build billing/shipping addresses from entity fields with fallbacks to locations
      const buildAddress = (base: {
        address?: string;
        area_name?: string;
        city_name?: string;
        state_name?: string;
        pin_code?: string;
        pincode?: string;
      }) => {
        const parts = [base.address, base.area_name, base.city_name, base.state_name].filter(Boolean);
        const pin = base.pin_code || base.pincode;
        return parts.length ? `${parts.join(', ')}${pin ? ` - ${pin}` : ''}` : '';
      };

      const billingFromEntity = buildAddress({
        address: customerData.address,
        area_name: customerData.area_name,
        city_name: customerData.city_name,
        state_name: customerData.state_name,
        pincode: customerData.pincode,
        pin_code: customerData.pin_code,
      });

      const shippingFromEntity = buildAddress({
        address: customerData.shipping_address || customerData.address,
        area_name: customerData.shipping_area_name || customerData.area_name,
        city_name: customerData.shipping_city_name || customerData.city_name,
        state_name: customerData.shipping_state_name || customerData.state_name,
        pincode: customerData.shipping_pincode || customerData.pincode,
        pin_code: customerData.shipping_pin_code || customerData.pin_code,
      });

      const primaryLocation = customerData.locations?.find((loc: any) => loc.is_primary) || customerData.locations?.[0];
      const locationAddress = primaryLocation
        ? buildAddress({
            address: (primaryLocation as any).address,
            area_name: primaryLocation.area_name,
            city_name: primaryLocation.city_name,
            state_name: primaryLocation.state_name,
            pincode: (primaryLocation as any).pincode,
            pin_code: (primaryLocation as any).pin_code,
          })
        : '';

      const finalBilling = billingFromEntity || shippingFromEntity || locationAddress;
      const finalShipping = shippingFromEntity || billingFromEntity || locationAddress;

      if (finalBilling) setBillingAddress(finalBilling);
      if (finalShipping) setShippingAddress(finalShipping);

      // Set location IDs for billing
      setBillingState(customerData.state || primaryLocation?.state || null);
      setBillingCity(customerData.city || primaryLocation?.city || null);
      setBillingArea(customerData.area || primaryLocation?.area || null);

      // Set location IDs for shipping
      setShippingState(customerData.shipping_state || customerData.state || primaryLocation?.state || null);
      setShippingCity(customerData.shipping_city || customerData.city || primaryLocation?.city || null);
      setShippingArea(customerData.shipping_area || customerData.area || primaryLocation?.area || null);
    } catch (error) {
    }
  };

  // Calculate totals from raw item data using current taxType
  const calculateTotals = () => {
    const regularItems = items.filter((i) => !i.is_scheme_free_item);
    let baseAmount = 0;
    let totalDiscount = 0;
    let taxableAmount = 0;
    let totalTax = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let cessTotal = 0;
    let grandTotal = 0;

    regularItems.forEach((item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const itemBase = quantity * rate;
      const discountAmt = Number(item.discount_amount) || 0;
      const taxRate = Number(item.tax_percentage) || 0;
      const netAmount = Math.max(itemBase - discountAmt, 0);

      let itemTaxable = 0;
      let itemTax = 0;
      let itemLineTotal = 0;

      if (taxType === 'EXCLUSIVE') {
        itemTaxable = netAmount;
        itemTax = (netAmount * taxRate) / 100;
        itemLineTotal = itemTaxable + itemTax;
      } else {
        itemLineTotal = netAmount;
        itemTaxable = taxRate > 0 ? netAmount / (1 + taxRate / 100) : netAmount;
        itemTax = itemLineTotal - itemTaxable;
      }

      baseAmount += itemBase;
      totalDiscount += discountAmt;
      taxableAmount += itemTaxable;
      totalTax += itemTax;

      const cgstRate = Number(item.cgst_rate) || 0;
      const sgstRate = Number(item.sgst_rate) || 0;
      const igstRate = Number(item.igst_rate) || 0;
      const cessRate = Number(item.cess_rate) || 0;
      const rateTotal = cgstRate + sgstRate + igstRate + cessRate || taxRate || 1;

      if (igstRate > 0) {
        igstTotal += (itemTax * igstRate) / rateTotal;
      } else {
        if (cgstRate > 0) cgstTotal += (itemTax * cgstRate) / rateTotal;
        if (sgstRate > 0) sgstTotal += (itemTax * sgstRate) / rateTotal;
      }
      if (cessRate > 0) cessTotal += (itemTax * cessRate) / rateTotal;

      grandTotal += itemLineTotal;
    });

    return { baseAmount, totalDiscount, taxableAmount, totalTax, cgstTotal, sgstTotal, igstTotal, cessTotal, grandTotal };
  };

  const totals = calculateTotals();
  const selectedSchemeDiscount = availableSchemes
    .filter((scheme) => selectedSchemeIds.includes(scheme.id))
    .reduce((sum, scheme) => sum + getSchemeDiscountAmount(scheme), 0);
  const appliedSchemeDiscount = (existingOrder?.applied_schemes || []).reduce(
    (sum, scheme) => sum + (Number(scheme.discount_amount) || 0),
    0
  );
  // In edit mode, use selected scheme discount (from UI selection) instead of applied scheme discount
  // This allows users to see the effect of selecting/deselecting schemes before applying them
  const schemeDiscount = selectedSchemeDiscount;

  // Determine if selected schemes are quantity-based (discount on grand total only)
  const isQuantityBasedScheme = (() => {
    // Always use currently selected schemes (not applied schemes) for both create and edit modes
    const selected = availableSchemes.filter((s) => selectedSchemeIds.includes(s.id));
    return selected.length > 0 && selected.every(
      (s) => (s.scheme_type || '').toUpperCase() === 'QUANTITY'
    );
  })();
  // Show scheme discount for all scheme types (not just non-quantity schemes)
  const showSchemeDiscount = schemeDiscount > 0;
  const computeSchemeAdjustedItems = () => {
    const netAmounts = items.map((item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const baseAmount = quantity * rate;
      const itemDiscount = Number(item.discount_amount) || 0;
      return Math.max(baseAmount - itemDiscount, 0);
    });

    const totalNet = netAmounts.reduce((sum, val) => sum + val, 0);

    let taxableAmount = 0;
    let totalTax = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let cessTotal = 0;
    let grandTotal = 0;
    const adjustedItems = items.map((item) => ({ ...item }));
    const schemeDiscountsArr: number[] = new Array(items.length).fill(0);

    items.forEach((item, index) => {
      const netAmount = netAmounts[index];
      if (netAmount <= 0) return;
      // Apply scheme discount for all scheme types (including quantity-based)
      const schemeShare = schemeDiscount > 0
        ? (isEditMode && item.scheme_discount_amount
            ? Number(item.scheme_discount_amount)
            : schemeDiscount * (totalNet > 0 ? netAmount / totalNet : 0))
        : 0;
      const adjustedNet = Math.max(netAmount - schemeShare, 0);
      schemeDiscountsArr[index] = schemeShare;
      const taxRate = Number(item.tax_percentage) || 0;

      let itemTaxable = 0;
      let itemTax = 0;
      let itemLineTotal = 0;

      if (taxType === 'EXCLUSIVE') {
        itemTaxable = adjustedNet;
        itemTax = (itemTaxable * taxRate) / 100;
        itemLineTotal = itemTaxable + itemTax;
      } else {
        itemLineTotal = adjustedNet;
        itemTaxable = taxRate > 0 ? itemLineTotal / (1 + taxRate / 100) : itemLineTotal;
        itemTax = itemLineTotal - itemTaxable;
      }

      taxableAmount += itemTaxable;
      totalTax += itemTax;
      grandTotal += itemLineTotal;

      const cgstRate = Number(item.cgst_rate) || 0;
      const sgstRate = Number(item.sgst_rate) || 0;
      const igstRate = Number(item.igst_rate) || 0;
      const cessRate = Number(item.cess_rate) || 0;
      const rateTotal = cgstRate + sgstRate + igstRate + cessRate || taxRate || 1;

      let itemCgst = 0;
      let itemSgst = 0;
      let itemIgst = 0;
      let itemCess = 0;

      if (igstRate > 0) {
        itemIgst = (itemTax * igstRate) / rateTotal;
        igstTotal += itemIgst;
      } else {
        if (cgstRate > 0) {
          itemCgst = (itemTax * cgstRate) / rateTotal;
          cgstTotal += itemCgst;
        }
        if (sgstRate > 0) {
          itemSgst = (itemTax * sgstRate) / rateTotal;
          sgstTotal += itemSgst;
        }
      }
      if (cessRate > 0) {
        itemCess = (itemTax * cessRate) / rateTotal;
        cessTotal += itemCess;
      }

      adjustedItems[index] = {
        ...adjustedItems[index],
        taxable_amount: itemTaxable,
        tax_amount: itemTax,
        line_total: itemLineTotal,
        cgst_amount: itemCgst,
        sgst_amount: itemSgst,
        igst_amount: itemIgst,
        cess_amount: itemCess,
      };
    });

    return {
      items: adjustedItems,
      schemeDiscounts: schemeDiscount > 0 ? schemeDiscountsArr : null,
      taxableAmount,
      totalTax,
      cgstTotal,
      sgstTotal,
      igstTotal,
      cessTotal,
      grandTotal,
    };
  };

  const schemeAdjustedTotals = computeSchemeAdjustedItems();
 
  // Use the scheme-adjusted grand total directly (scheme discount already applied before tax)
  const displayGrandTotal = schemeAdjustedTotals.grandTotal;
  const lockSchemeSelection = displayGrandTotal <= 0 && selectedSchemeIds.length > 0;
  const frequentItems = frequentItemsData?.results || [];
  const selectedFrequentCount = selectedFrequentItemIds.size;
  const allFrequentSelected = frequentItems.length > 0 && selectedFrequentCount === frequentItems.length;

  const toggleFrequentItemSelection = (itemId: string, checked: boolean) => {
    const normalizedItemId = String(itemId);
    setSelectedFrequentItemIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(normalizedItemId);
      else next.delete(normalizedItemId);
      return next;
    });
  };

  const toggleSelectAllFrequentItems = (checked: boolean) => {
    if (!checked) {
      setSelectedFrequentItemIds(new Set());
      return;
    }
    setSelectedFrequentItemIds(new Set(frequentItems.map((itemValue) => String(itemValue.item))));
  };

  // Scheme selection helpers (similar to frequent items)
  const selectedSchemeCount = selectedSchemeIdsSet.size;
  const allSchemesSelected = availableSchemes.length > 0 && selectedSchemeCount === availableSchemes.length;

  const toggleSchemeSelectionCheckbox = (schemeId: string, checked: boolean) => {
    const allowMultipleSchemes = generalSettings?.allow_multiple_schemes ?? true;
    
    // Update both the Set and Array states in sync
    if (checked) {
      if (!allowMultipleSchemes) {
        // Single selection mode
        setSelectedSchemeIdsSet(new Set([schemeId]));
        setSelectedSchemeIds([schemeId]);
      } else {
        // Multiple selection mode
        setSelectedSchemeIdsSet((prev) => {
          const next = new Set(prev);
          next.add(schemeId);
          return next;
        });
        setSelectedSchemeIds((prev) => [...prev, schemeId]);
      }
    } else {
      // Unchecking
      setSelectedSchemeIdsSet((prev) => {
        const next = new Set(prev);
        next.delete(schemeId);
        return next;
      });
      setSelectedSchemeIds((prev) => prev.filter((id) => id !== schemeId));
    }

    // In create mode, sync free items based on selected schemes
    if (!isEditMode) {
      setTimeout(() => {
        setSelectedSchemeIds((currentIds) => {
          const selectedSchemes = availableSchemes.filter((s) => currentIds.includes(s.id));
          const allFreeItems = selectedSchemes.flatMap((s) => s.preview_free_items || []);
          
          buildFreeItemLines(allFreeItems).then((freeLines) => {
            setItems((prevItems) => {
              const withoutOldFree = prevItems.filter((i) => !i.is_scheme_free_item);
              return [...withoutOldFree, ...freeLines];
            });
          });
          
          return currentIds;
        });
      }, 0);
    }
  };

  const toggleSelectAllSchemes = (checked: boolean) => {
    const allowMultipleSchemes = generalSettings?.allow_multiple_schemes ?? true;
    
    if (!checked) {
      setSelectedSchemeIdsSet(new Set());
      setSelectedSchemeIds([]);
      
      // Clear free items in create mode
      if (!isEditMode) {
        setItems((prevItems) => prevItems.filter((i) => !i.is_scheme_free_item));
      }
      return;
    }

    if (!allowMultipleSchemes) {
      // Select only the first scheme if multiple selection is disabled
      const firstScheme = availableSchemes[0];
      if (firstScheme) {
        setSelectedSchemeIdsSet(new Set([firstScheme.id]));
        setSelectedSchemeIds([firstScheme.id]);
        
        // Add free items for first scheme in create mode
        if (!isEditMode) {
          const allFreeItems = firstScheme.preview_free_items || [];
          buildFreeItemLines(allFreeItems).then((freeLines) => {
            setItems((prevItems) => {
              const withoutOldFree = prevItems.filter((i) => !i.is_scheme_free_item);
              return [...withoutOldFree, ...freeLines];
            });
          });
        }
      }
      return;
    }

    // Select all schemes
    const allSchemeIds = availableSchemes.map((s) => s.id);
    setSelectedSchemeIdsSet(new Set(allSchemeIds));
    setSelectedSchemeIds(allSchemeIds);
    
    // Add free items for all schemes in create mode
    if (!isEditMode) {
      const allFreeItems = availableSchemes.flatMap((s) => s.preview_free_items || []);
      buildFreeItemLines(allFreeItems).then((freeLines) => {
        setItems((prevItems) => {
          const withoutOldFree = prevItems.filter((i) => !i.is_scheme_free_item);
          return [...withoutOldFree, ...freeLines];
        });
      });
    }
  };

  const getCustomerDetailEndpoint = (type: CustomerType, customerId: string) => {
    if (type === 'RETAILER') return `/api/masters/retailers/${customerId}/`;
    if (type === 'DISTRIBUTOR') return `/api/masters/distributors/${customerId}/`;
    return `/api/masters/superstockists/${customerId}/`;
  };

  const getIsSameStateForCurrentSelection = async (): Promise<boolean> => {
    if (!company?.id || !customer?.id || !customerType) return false;
    try {
      const [companyRes, customerRes] = await Promise.all([
        apiClient.get(`/api/masters/companies/${company.id}/`),
        apiClient.get(getCustomerDetailEndpoint(customerType, customer.id as string)),
      ]);
      const companyGst = companyRes.data.gst_number;
      const customerGst = customerRes.data.gstin;
      if (companyGst && customerGst) {
        return companyGst.substring(0, 2) === customerGst.substring(0, 2);
      }
      const companyStateId = companyRes.data.state?.id || companyRes.data.state;
      const customerStateId = customerRes.data.state?.id || customerRes.data.state;
      return Boolean(companyStateId && customerStateId && companyStateId === customerStateId);
    } catch {
      return false;
    }
  };

  const calculateAmountsForLine = (
    quantity: number,
    rate: number,
    discountType: 'PERCENTAGE' | 'AMOUNT',
    discountValue: number,
    taxPercentage: number,
    sameState: boolean
  ) => {
    const baseAmount = quantity * rate;
    const discountAmount = discountType === 'PERCENTAGE'
      ? (baseAmount * discountValue) / 100
      : discountValue;
    const netAmount = Math.max(baseAmount - discountAmount, 0);

    let taxableAmount = 0;
    let taxAmount = 0;
    let lineTotal = 0;
    if (taxType === 'EXCLUSIVE') {
      taxableAmount = netAmount;
      taxAmount = (netAmount * taxPercentage) / 100;
      lineTotal = taxableAmount + taxAmount;
    } else {
      lineTotal = netAmount;
      taxableAmount = taxPercentage > 0 ? netAmount / (1 + taxPercentage / 100) : netAmount;
      taxAmount = lineTotal - taxableAmount;
    }

    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    if (sameState) {
      cgstRate = taxPercentage / 2;
      sgstRate = taxPercentage / 2;
      cgstAmount = (taxableAmount * cgstRate) / 100;
      sgstAmount = (taxableAmount * sgstRate) / 100;
    } else {
      igstRate = taxPercentage;
      igstAmount = (taxableAmount * igstRate) / 100;
    }

    return {
      discountAmount,
      taxableAmount,
      taxAmount,
      lineTotal,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      cessRate: 0,
      cessAmount: 0,
    };
  };

  const buildLineItemFromFrequent = async (frequentItem: FrequentSalesItem, sameState: boolean): Promise<SalesOrderItem> => {
    const normalizedItemId = String(frequentItem.item || '');
    let categoryId = frequentItem.category ? String(frequentItem.category) : '';
    let categoryName = frequentItem.category_name || '';
    let taxPercentage = 0;
    let hsnCode = frequentItem.hsn_code || '';
    let uomName = frequentItem.uom_name || '';
    try {
      const detail = await apiClient.get(`/api/masters/items/${normalizedItemId}/`);
      const itemData = detail.data;
      taxPercentage = Number(
        itemData.current_tax?.rate ??
        itemData.tax_percentage ??
        itemData.tax_rate ??
        itemData.tax?.rate ??
        0
      );
      hsnCode = itemData.hsn_code || hsnCode;
      uomName = itemData.base_uom_name || itemData.uom_name || uomName;
      const itemCategoryId =
        itemData.category?.id ??
        itemData.category_id ??
        itemData.category ??
        '';
      const itemCategoryName =
        itemData.category?.name ??
        itemData.category_name ??
        '';
      if (itemCategoryId) {
        categoryId = String(itemCategoryId);
      }
      if (itemCategoryName) {
        categoryName = String(itemCategoryName);
      }
    } catch {
    }

    let pbRate = 0;
    let pbRateSource: any = 'NOT_FOUND';
    if (customer?.id && customerType) {
      try {
        const priceData = await salesOrderApi.getItemPrice(
          normalizedItemId,
          customer.id as string,
          customerType
        );
        pbRate = Number(priceData.pb_rate || 0);
        pbRateSource = priceData.source || 'NOT_FOUND';
      } catch {
      }
    }

    const quantity = 1;
    const discountType: 'PERCENTAGE' | 'AMOUNT' = 'AMOUNT';
    const discountValue = 0;
    const amounts = calculateAmountsForLine(
      quantity,
      pbRate,
      discountType,
      discountValue,
      taxPercentage,
      sameState
    );

    return {
      category: categoryId,
      category_name: categoryName,
      item: normalizedItemId,
      item_code: frequentItem.item_code,
      item_name: frequentItem.item_name,
      item_image: frequentItem.item_image || '',
      company: frequentItem.company || '',
      company_name: frequentItem.company_name || '',
      hsn_code: hsnCode,
      uom_name: uomName,
      uom_factor: 1,
      quantity,
      free_quantity: 0,
      pb_rate: pbRate,
      pb_rate_source: pbRateSource,
      rate: pbRate,
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount: amounts.discountAmount,
      taxable_amount: amounts.taxableAmount,
      tax_percentage: taxPercentage,
      tax_amount: amounts.taxAmount,
      cgst_rate: amounts.cgstRate,
      cgst_amount: amounts.cgstAmount,
      sgst_rate: amounts.sgstRate,
      sgst_amount: amounts.sgstAmount,
      igst_rate: amounts.igstRate,
      igst_amount: amounts.igstAmount,
      cess_rate: amounts.cessRate,
      cess_amount: amounts.cessAmount,
      line_total: amounts.lineTotal,
    };
  };

  const addFrequentItemsToGrid = async (
    selectedFrequentItems: FrequentSalesItem[],
    duplicateMode: 'update' | 'separate'
  ) => {
    if (selectedFrequentItems.length === 0) {
      toastError('Select at least one frequent item.');
      return;
    }
    if (!customer?.id || !customerType) {
      toastError('Please select customer first.');
      return;
    }

    const sameState = await getIsSameStateForCurrentSelection();
    const isEmptyLine = (line: SalesOrderItem) => {
      return !line.item;
    };
    // Remove any manual blank rows before adding frequent items.
    // This prevents empty rows from staying alongside frequent-added rows.
    const updatedItems = items.filter((line) => !isEmptyLine(line));

    for (const frequentItem of selectedFrequentItems) {
      const normalizedItemId = String(frequentItem.item || '');
      const existingIndex = updatedItems.findIndex((line) => String(line.item || '') === normalizedItemId);
      if (existingIndex >= 0 && duplicateMode === 'update') {
        const existingLine = updatedItems[existingIndex];
        const nextQuantity = Number(existingLine.quantity || 0) + 1;
        const discountType = existingLine.discount_type || 'AMOUNT';
        const discountValue = Number(existingLine.discount_value || 0);
        const taxPercentage = Number(existingLine.tax_percentage || 0);
        const rate = Number(existingLine.rate || 0);
        const amounts = calculateAmountsForLine(
          nextQuantity,
          rate,
          discountType,
          discountValue,
          taxPercentage,
          sameState
        );
        updatedItems[existingIndex] = {
          ...existingLine,
          quantity: nextQuantity,
          discount_amount: amounts.discountAmount,
          taxable_amount: amounts.taxableAmount,
          tax_amount: amounts.taxAmount,
          line_total: amounts.lineTotal,
          cgst_rate: amounts.cgstRate,
          cgst_amount: amounts.cgstAmount,
          sgst_rate: amounts.sgstRate,
          sgst_amount: amounts.sgstAmount,
          igst_rate: amounts.igstRate,
          igst_amount: amounts.igstAmount,
          cess_rate: amounts.cessRate,
          cess_amount: amounts.cessAmount,
        };
      } else {
        const newLine = await buildLineItemFromFrequent(frequentItem, sameState);
        updatedItems.push(newLine);
      }
    }

    setItems(updatedItems);
    setSelectedFrequentItemIds(new Set());
    toastSuccess('Selected frequent items added to order grid.');
  };

  const handleAddFrequentItemsClick = async () => {
    const selectedFrequentItems = frequentItems.filter((itemValue) =>
      selectedFrequentItemIds.has(String(itemValue.item))
    );
    if (selectedFrequentItems.length === 0) {
      toastError('Select at least one frequent item.');
      return;
    }
    const duplicateItems = selectedFrequentItems.filter(
      (frequentItem) => items.some((line) => line.item === frequentItem.item)
    );
    if (duplicateItems.length > 0) {
      setPendingFrequentItemsToAdd(selectedFrequentItems);
      setDuplicateDialogOpen(true);
      return;
    }
    await addFrequentItemsToGrid(selectedFrequentItems, 'separate');
  };

  const handleDuplicateDialogClose = () => {
    setDuplicateDialogOpen(false);
    setPendingFrequentItemsToAdd([]);
  };

  const handleDuplicateChoice = async (mode: 'update' | 'separate') => {
    setDuplicateDialogOpen(false);
    if (pendingFrequentItemsToAdd.length > 0) {
      await addFrequentItemsToGrid(pendingFrequentItemsToAdd, mode);
    }
    setPendingFrequentItemsToAdd([]);
  };

  // Barcode scanning handler
  const fetchBarcodeSuggestions = async (searchText: string) => {
    if (!searchText || searchText.length < 2) {
      setBarcodeSuggestions([]);
      return;
    }

    setLoadingBarcodeSuggestions(true);
    try {
      const response = await apiClient.get('/api/masters/items/mini/', {
        params: {
          search: searchText,
          is_active: true,
          is_saleable: true,
          company: company?.id,
        },
      });
      
      const items = response.data.results || response.data || [];
      // Filter items that have barcodes
      const itemsWithBarcodes = items.filter((item: any) => item.barcode);
      setBarcodeSuggestions(itemsWithBarcodes);
    } catch (error) {
      console.error('Failed to fetch barcode suggestions:', error);
      setBarcodeSuggestions([]);
    } finally {
      setLoadingBarcodeSuggestions(false);
    }
  };

  const handleBarcodeInputChange = (value: string) => {
    setBarcodeInput(value);
    
    // Clear previous auto-search timer
    if (barcodeAutoSearchTimer) {
      clearTimeout(barcodeAutoSearchTimer);
    }
    
    // Show suggestions for partial input (2+ characters)
    if (value && value.length >= 2) {
      fetchBarcodeSuggestions(value);
      
      // Auto-search for complete barcodes (8+ characters, typical barcode length)
      // This handles scanners that don't auto-press Enter
      if (value.length >= 8) {
        const timer = setTimeout(() => {
          // Check if the input looks like a complete barcode (numeric or alphanumeric)
          const isLikelyBarcode = /^[A-Z0-9]{8,}$/i.test(value.trim());
          if (isLikelyBarcode) {
            handleBarcodeSearch(value);
          }
        }, 500); // Wait 500ms after user stops typing
        setBarcodeAutoSearchTimer(timer);
      }
    } else {
      setBarcodeSuggestions([]);
    }
  };

  const handleBarcodeSearch = async (barcode: string) => {
    if (!barcode.trim()) return;
    
    if (!customer) {
      toastError('Please select a customer first');
      return;
    }

    if (generalSettings?.company_scoped_item_enforcement && !company) {
      toastError('Please select a company first');
      return;
    }

    setIsSearchingBarcode(true);
    try {
      const response = await apiClient.get('/api/masters/items/barcode-search/', {
        params: {
          barcode: barcode.trim(),
          company_id: company?.id,
        },
      });

      const itemData = response.data;
      
      // Check if item already exists in the order
      const existingItemIndex = items.findIndex(
        (item) => item.item === itemData.id
      );

      if (existingItemIndex !== -1) {
        // Item exists, increment quantity
        const updatedItems = [...items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: Number(updatedItems[existingItemIndex].quantity) + 1,
        };
        setItems(updatedItems);
        toastSuccess(`Quantity updated for ${itemData.name}`);
      } else {
        // Add new item
        const newItem: SalesOrderItem = {
          category: itemData.category || '',
          category_name: itemData.category_name || '',
          item: itemData.id,
          item_code: itemData.code,
          item_name: itemData.name,
          hsn_code: itemData.hsn_code || '',
          uom_name: itemData.matched_uom?.name || itemData.base_uom_name || '',
          uom_factor: itemData.matched_uom?.factor || 1,
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
        };
        
        setItems([...items, newItem]);
        toastSuccess(`${itemData.name} added to order`);
      }
      
      setBarcodeInput('');
      setBarcodeSuggestions([]);
    } catch (error: any) {
      if (error.response?.status === 404) {
        toastError('Product not found with this barcode');
      } else {
        toastError(error.response?.data?.error || 'Failed to search barcode');
      }
    } finally {
      setIsSearchingBarcode(false);
    }
  };

  const handleBarcodeSelect = async (selectedItem: any) => {
    if (!selectedItem) return;
    
    // Use the barcode from the selected item
    if (selectedItem.barcode) {
      await handleBarcodeSearch(selectedItem.barcode);
    }
  };

  const handleBarcodeKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleBarcodeSearch(barcodeInput);
    }
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!orderDate) newErrors.orderDate = 'Order date is required';
    if (!customerType) newErrors.customerType = 'Customer type is required';
    if (customerTypeDisabled) newErrors.customerType = 'No customer types are enabled in configuration';
    if (!customer) newErrors.customer = 'Customer is required';
    if (!billingState) newErrors.billingState = 'Billing state is required';
    if (!billingCity) newErrors.billingCity = 'Billing city is required';
    if (!shippingState) newErrors.shippingState = 'Shipping state is required';
    if (!shippingCity) newErrors.shippingCity = 'Shipping city is required';

    const regularItems = items.filter((i) => !i.is_scheme_free_item);
    if (regularItems.length === 0) newErrors.items = 'At least one item is required';

    regularItems.forEach((item, index) => {
      if (!item.item) newErrors[`item_${index}`] = 'Item is required';
      if (item.quantity <= 0) newErrors[`quantity_${index}`] = 'Quantity must be greater than 0';
      const lineBaseAmount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
      if ((Number(item.discount_amount) || 0) > lineBaseAmount) {
        newErrors[`discount_${index}`] = 'Discount amount cannot be greater than taxable amount';
      }
      // For channel partner users, rate is mandatory
      if (currentUser?.channel_partner_type && currentUser.channel_partner_type !== 'STAFF') {
        if (!item.rate || item.rate <= 0) newErrors[`rate_${index}`] = 'Rate is required for channel partner users';
      } else {
        if (item.rate <= 0) newErrors[`rate_${index}`] = 'Rate must be greater than 0';
      }
    });

    setErrors(newErrors);

    //old codebase
    // if (Object.keys(newErrors).length > 0) {
    //   const fieldLabels: Record<string, string> = {
    //     orderDate: 'Order Date',
    //     customerType: 'Customer Type',
    //     customer: 'Customer',
    //     billingState: 'Billing State',
    //     billingCity: 'Billing City',
    //     shippingState: 'Shipping State',
    //     shippingCity: 'Shipping City',
    //     items: 'Order Products',
    //   };
    //   const messages = Object.entries(newErrors).map(([key, msg]) => {
    //     if (fieldLabels[key]) return `${fieldLabels[key]}: ${msg}`;
    //     if (key.startsWith('item_')) return `Product Row ${parseInt(key.split('_')[1]) + 1}: ${msg}`;
    //     if (key.startsWith('quantity_')) return `Product Row ${parseInt(key.split('_')[1]) + 1}: ${msg}`;
    //     if (key.startsWith('rate_')) return `Product Row ${parseInt(key.split('_')[1]) + 1}: ${msg}`;
    //     if (key.startsWith('discount_')) return `Product Row ${parseInt(key.split('_')[1]) + 1}: ${msg}`;
    //     return msg;
    //   });
    //   toastError(messages.slice(0, 3).join(' | ') + (messages.length > 3 ? ` (+${messages.length - 3} more)` : ''));
    //   window.scrollTo({ top: 0, behavior: 'smooth' });
    // }

     if (Object.keys(newErrors).length > 0) {
      const errorCount = Object.keys(newErrors).length;
      const errorMessage = errorCount === 1 
        ? 'Please fill in the required field to continue'
        : `Please fill in all required fields (${errorCount} fields need attention)`;
      
      toastError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  
    return Object.keys(newErrors).length === 0;
  };

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      if (isEditMode) {
        return salesOrderApi.update(id!, formData);
      }
      return salesOrderApi.create(formData);
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrder', id] });
      // Invalidate pending sales orders and pending invoices to auto-refresh
      queryClient.invalidateQueries({ queryKey: ['pendingSalesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['pendingInvoices'] });
      if (!isEditMode && data.order_number) {
        setDocumentNo(data.order_number);
      }

      if (!isEditMode && data.id && selectedSchemeIds.length > 0) {
        try {
          const result = await salesOrderApi.applySchemes(data.id, selectedSchemeIds);
          toastSuccess('Order created and schemes applied successfully.');
          
          // Wait a bit to ensure backend processes the schemes
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Invalidate queries again to get updated data with schemes
          queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
          queryClient.invalidateQueries({ queryKey: ['salesOrder', data.id] });
        } catch (error: any) {
          toastError(`Order created but applying schemes failed: ${error.response?.data?.error || error.message}`);
        }
      } else if (!isEditMode) {
        toastSuccess('Order created successfully.');
      } else {
        toastSuccess('Order updated successfully.');
      }

      // Small delay before navigation to show toast
      await new Promise(resolve => setTimeout(resolve, 300));
      navigate('/sales/orders');
    },
    onError: (error: any) => {
      console.error('Sales order save error:', error.response?.data || error);
      let errorMessage = 'Failed to save sales order';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        } else if (typeof data === 'object') {
          // Extract first error from validation errors object
          const firstKey = Object.keys(data)[0];
          if (firstKey && data[firstKey]) {
            const fieldError = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
            errorMessage = fieldError;
          }
        }
      }
      toastError(errorMessage);
    },
  });

  const handleSubmit = (isDraft: boolean = false) => {
    if (!validate()) return;

    // Helper function to round to 2 decimal places
    const round2 = (num: number) => Math.round(num * 100) / 100;

    const formData = new FormData();
    
    // Include document number for new orders
    if (!isEditMode && documentNo) {
      formData.append('order_number', documentNo);
    }
    
    formData.append('order_date', orderDate.format('YYYY-MM-DD'));
    if (company) formData.append('company', company.id as string);
    formData.append('tax_type', taxType);
    formData.append('status', isDraft ? 'DRAFT' : 'CONFIRMED');
    
    // Map customer to correct field based on customer_type
    if (customerType === 'RETAILER') {
      formData.append('retailer', customer!.id as string);
    } else if (customerType === 'DISTRIBUTOR') {
      formData.append('distributor', customer!.id as string);
    } else if (customerType === 'SUPERSTOCKIST') {
      formData.append('superstockist', customer!.id as string);
    }
    
    formData.append('customer_type', customerType!);
    formData.append('credit_days', creditDays.toString());
    formData.append('billing_address', billingAddress);
    formData.append('billing_state', billingState!);
    formData.append('billing_city', billingCity!);
    if (billingArea) formData.append('billing_area', billingArea);
    formData.append('shipping_address', shippingAddress);
    formData.append('shipping_state', shippingState!);
    formData.append('shipping_city', shippingCity!);
    if (shippingArea) formData.append('shipping_area', shippingArea);
    
    // Use scheme-adjusted totals for the order summary
    // Calculate total discount including scheme discount
    const totalDiscountAmount = totals.totalDiscount + (showSchemeDiscount ? schemeDiscount : 0);
    
    formData.append('base_amount', round2(totals.baseAmount).toString());
    formData.append('discount_amount', round2(totalDiscountAmount).toString());
    formData.append('taxable_amount', round2(schemeAdjustedTotals.taxableAmount).toString());
    formData.append('tax_amount', round2(schemeAdjustedTotals.totalTax).toString());
    formData.append('grand_total', round2(displayGrandTotal).toString());

    // Tell backend to apply schemes if any are selected
    // In edit mode, always send scheme information to allow clearing schemes
    if (isEditMode) {
      formData.append('auto_apply_schemes', 'true');
      formData.append('selected_scheme_ids', JSON.stringify(selectedSchemeIds));
    } else if (selectedSchemeIds.length > 0) {
      // In create mode, only send if schemes are selected
      formData.append('auto_apply_schemes', 'true');
      formData.append('selected_scheme_ids', JSON.stringify(selectedSchemeIds));
    }

    if (remarks) formData.append('remarks', remarks);

    // Add multiple attachments for create mode
    if (!isEditMode && selectedAttachmentFiles.length > 0) {
      selectedAttachmentFiles.forEach((file, index) => {
        formData.append(`attachments`, file);
      });
    }

    // Map items with scheme-adjusted values (exclude free items - backend will add them)
    const itemsToSend = schemeAdjustedTotals.items
      .filter(item => !item.is_scheme_free_item) // Don't send free items, backend will create them
      .map((item, index) => {
      const schemeDiscountForItem = schemeAdjustedTotals.schemeDiscounts 
        ? schemeAdjustedTotals.schemeDiscounts[index] 
        : 0;
      
      return {
        category: item.category || null,
        item: item.item,
        company: item.company || null,
        quantity: item.quantity,
        free_quantity: item.free_quantity || 0,
        pb_rate: round2(item.pb_rate || 0),
        pb_rate_source: item.pb_rate_source || 'NOT_FOUND',
        rate: round2(item.rate),
        discount_type: item.discount_type,
        discount_value: round2(item.discount_value || 0),
        discount_amount: round2(item.discount_amount || 0),
        scheme_discount_amount: round2(schemeDiscountForItem),
        taxable_amount: round2(item.taxable_amount || 0),
        tax_percentage: round2(item.tax_percentage || 0),
        tax_amount: round2(item.tax_amount || 0),
        cgst_rate: round2(item.cgst_rate || 0),
        cgst_amount: round2(item.cgst_amount || 0),
        sgst_rate: round2(item.sgst_rate || 0),
        sgst_amount: round2(item.sgst_amount || 0),
        igst_rate: round2(item.igst_rate || 0),
        igst_amount: round2(item.igst_amount || 0),
        cess_rate: round2(item.cess_rate || 0),
        cess_amount: round2(item.cess_amount || 0),
        line_total: round2(item.line_total),
        is_scheme_item: Boolean(item.is_scheme_free_item),
      };
    });

    formData.append('items', JSON.stringify(itemsToSend));

    mutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedAttachmentFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Attachment handling functions for multiple attachments
  const handleUploadAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (!isEditMode) {
      // In create mode, store files locally
      setSelectedAttachmentFiles(prev => [...prev, ...Array.from(files)]);
      return;
    }

    // In edit mode, upload immediately
    setUploadingAttachment(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', '');

      try {
        await apiClient.post(`/api/sales/orders/${id}/upload_attachment/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch (error: any) {
      }
    }
    setUploadingAttachment(false);
    refetchAttachments();
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!id) return;
    try {
      await apiClient.delete(`/api/sales/orders/${id}/attachments/${attachmentId}/`);
      refetchAttachments();
    } catch (error: any) {
    }
  };

  if (isEditMode && isLoadingOrder) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const availableCustomerTypes = channelConfig ? [
    channelConfig.enable_distributor && 'DISTRIBUTOR',
    channelConfig.enable_superstockist && 'SUPERSTOCKIST',
    channelConfig.enable_retailer && 'RETAILER',
  ].filter(Boolean) : ['DISTRIBUTOR', 'SUPERSTOCKIST', 'RETAILER'];

  const customerTypeDisabled = isChannelConfigLoading || availableCustomerTypes.length === 0;

  // Determine if customer type should be disabled based on logged-in user
  const isCustomerTypeDisabled = () => {
    if (isEditMode) return false; // Allow editing in edit mode
    if (!currentUser) return customerTypeDisabled;
    
    const userType = currentUser.channel_partner_type;
    // Retailer users cannot change customer type
    if (userType === 'RETAILER') return true;
    // Distributor users can change to retailer only
    if (userType === 'DISTRIBUTOR') return false;
    // Staff users can change freely
    return customerTypeDisabled;
  };

  // Determine available customer types based on logged-in user
  const getAvailableCustomerTypes = () => {
    if (isEditMode) return availableCustomerTypes;
    if (!currentUser) return availableCustomerTypes;
    
    const userType = currentUser.channel_partner_type;
    // Retailer users can only see RETAILER
    if (userType === 'RETAILER') return ['RETAILER'];
    // Distributor users can see DISTRIBUTOR and RETAILER
    if (userType === 'DISTRIBUTOR') {
      return availableCustomerTypes.filter(type => type === 'DISTRIBUTOR' || type === 'RETAILER');
    }
    // Staff users can see all
    return availableCustomerTypes;
  };

  const filteredCustomerTypes = getAvailableCustomerTypes();
  const customerTypeOptions: DropdownOption[] = filteredCustomerTypes.map((type) => ({
    id: type,
    name: type === 'RETAILER' ? 'Retailer' : type === 'DISTRIBUTOR' ? 'Distributor' : 'Superstockist',
  }));

  // Determine customer API endpoint with distributor filtering
  const getCustomerApiEndpoint = () => {
    if (customerType === 'RETAILER') {
      return '/api/masters/retailers/mini/';
    } else if (customerType === 'DISTRIBUTOR') {
      return '/api/masters/distributors/mini/';
    } else if (customerType === 'SUPERSTOCKIST') {
      return '/api/masters/superstockists/mini/';
    }
    return '/api/masters/channel-partners/mini/';
  };

  // Get additional filters for customer dropdown
  const getCustomerAdditionalFilters = () => {
    const filters: any = customerType ? { partner_type: customerType } : undefined;
    
    // If logged-in user is distributor and selecting retailer, filter by distributor
    if (!isEditMode && currentUser?.channel_partner_type === 'DISTRIBUTOR' && 
        customerType === 'RETAILER' && currentUser.distributor) {
      return {
        ...filters,
        distributor: currentUser.distributor,
      };
    }
    
    return filters;
  };

  const customerApiEndpoint = getCustomerApiEndpoint();
  const customerAdditionalFilters = getCustomerAdditionalFilters();

  // Determine if customer dropdown should be disabled
  const isCustomerDisabled = () => {
    if (isEditMode) return false; // Allow editing in edit mode
    if (!customerType || customerTypeDisabled) return true;
    if (!currentUser) return false;
    
    const userType = currentUser.channel_partner_type;
    // Retailer users cannot change customer
    if (userType === 'RETAILER') return true;
    // Distributor users can change customer only when type is RETAILER
    if (userType === 'DISTRIBUTOR' && customerType === 'DISTRIBUTOR') return true;
    // Staff users can change freely
    return false;
  };

  // Require explicit customer type selection before listing customers
  const handleCustomerTypeChange = (value: CustomerType | null) => {
    setCustomerType(value);
    // Reset dependent fields when type changes
    setCustomer(null);
    setCreditDays(0);
    setBillingAddress('');
    setBillingState(null);
    setBillingCity(null);
    setBillingArea(null);
    setShippingAddress('');
    setShippingState(null);
    setShippingCity(null);
    setShippingArea(null);
    setItems([]);
    setSelectedFrequentItemIds(new Set());
    // Clear schemes when customer type changes
    setAvailableSchemes([]);
    setSelectedSchemeIds([]);
    setSelectedSchemeIdsSet(new Set());
    
    // Auto-select for channel partner users when switching back to their type
    if (currentUser && !isEditMode) {
      const userType = currentUser.channel_partner_type;
      
      if (value === 'DISTRIBUTOR' && userType === 'DISTRIBUTOR' && currentUser.distributor && currentUser.distributor_name) {
        const customerData = {
          id: currentUser.distributor_name.id,
          name: currentUser.distributor_name.name,
        };
        // Fetch customer details after state updates
        setTimeout(async () => {
          setCustomer(customerData);
          try {
            const response = await apiClient.get(`/api/masters/distributors/${customerData.id}/`);
            const data = response.data;
            setCreditDays(data.credit_days || 0);
            setCreditLimit(data.credit_limit || 0);
            
            // Set addresses
            const buildAddress = (base: any) => {
              const parts = [base.address, base.area_name, base.city_name, base.state_name].filter(Boolean);
              const pin = base.pin_code || base.pincode;
              return parts.length ? `${parts.join(', ')}${pin ? ` - ${pin}` : ''}` : '';
            };
            
            const billingAddr = buildAddress(data);
            const shippingAddr = buildAddress({
              address: data.shipping_address || data.address,
              area_name: data.shipping_area_name || data.area_name,
              city_name: data.shipping_city_name || data.city_name,
              state_name: data.shipping_state_name || data.state_name,
              pincode: data.shipping_pincode || data.pincode,
              pin_code: data.shipping_pin_code || data.pin_code,
            });
            
            setBillingAddress(billingAddr);
            setShippingAddress(shippingAddr);
            setBillingState(data.state || null);
            setBillingCity(data.city || null);
            setBillingArea(data.area || null);
            setShippingState(data.shipping_state || data.state || null);
            setShippingCity(data.shipping_city || data.city || null);
            setShippingArea(data.shipping_area || data.area || null);
          } catch (error) {
          }
        }, 0);
      } else if (value === 'RETAILER' && userType === 'RETAILER' && currentUser.retailer && currentUser.retailer_name) {
        const customerData = {
          id: currentUser.retailer_name.id,
          name: currentUser.retailer_name.name,
        };
        // Fetch customer details after state updates
        setTimeout(async () => {
          setCustomer(customerData);
          try {
            const response = await apiClient.get(`/api/masters/retailers/${customerData.id}/`);
            const data = response.data;
            setCreditDays(data.credit_days || 0);
            setCreditLimit(data.credit_limit || 0);
            
            // Set addresses
            const buildAddress = (base: any) => {
              const parts = [base.address, base.area_name, base.city_name, base.state_name].filter(Boolean);
              const pin = base.pin_code || base.pincode;
              return parts.length ? `${parts.join(', ')}${pin ? ` - ${pin}` : ''}` : '';
            };
            
            const billingAddr = buildAddress(data);
            const shippingAddr = buildAddress({
              address: data.shipping_address || data.address,
              area_name: data.shipping_area_name || data.area_name,
              city_name: data.shipping_city_name || data.city_name,
              state_name: data.shipping_state_name || data.state_name,
              pincode: data.shipping_pincode || data.pincode,
              pin_code: data.shipping_pin_code || data.pin_code,
            });
            
            setBillingAddress(billingAddr);
            setShippingAddress(shippingAddr);
            setBillingState(data.state || null);
            setBillingCity(data.city || null);
            setBillingArea(data.area || null);
            setShippingState(data.shipping_state || data.state || null);
            setShippingCity(data.shipping_city || data.city || null);
            setShippingArea(data.shipping_area || data.area || null);
          } catch (error) {
          }
        }, 0);
      }
    }
  };

  const handleBack = () => {
    navigate('/sales/orders');
  };

  const isSubmitting = mutation.isPending;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={getPageContainerStyles()}>
        {/* Fixed Header */}
        <Box sx={getHeaderSectionStyles()}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <ScreenHeader
              title={isEditMode ? 'Edit Sales Order' : 'Add Sales Order'}
              showBackButton
              onBack={handleBack}
              disableBox
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="outlined" color="secondary" size="small" onClick={handleBack} disabled={isSubmitting}>
                Cancel
              </Button>
              {(!isEditMode || orderStatus === 'DRAFT') && (
                <Button
                  type="button"
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(true)}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </Button>
              )}
              <Button
                type="button"
                variant="contained"
                color="primary"
                size="small"
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}
              >
                {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Scrollable Content Area */}
        <Box sx={getContentSectionStyles()}>
          <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 }, borderRadius: 0 }}>
            {mutation.isError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {mutation.error instanceof Error 
                  ? mutation.error.message 
                  : (mutation.error as any)?.response?.data?.detail 
                    || (mutation.error as any)?.response?.data?.message
                    || JSON.stringify((mutation.error as any)?.response?.data)
                    || 'Failed to save sales order'}
              </Alert>
            )}

            {Object.keys(errors).length > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Please fix the following fileds:</Typography>
                {Object.entries(errors).map(([key, msg]) => (
                  <Typography key={key} variant="body2">• {msg}</Typography>
                ))}
              </Alert>
            )}

            {/* Order Details Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Order Details
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Document No
                </Typography>
                <TextField
                  value={documentNo || (isEditMode ? 'Loading...' : 'Generating...')}
                  placeholder={isEditMode ? 'Loading...' : 'Generating...'}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={readOnlyFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Order Date <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <DatePicker
                  value={orderDate}
                  onChange={(date) => { const d = toDayjs(date); if (d) setOrderDate(d); }}
                  format="DD-MM-YYYY"
                  slotProps={{ textField: { fullWidth: true, size: 'small', error: Boolean(errors.orderDate), helperText: errors.orderDate } }}
                />
              </Grid>
              {(!currentUser?.channel_partner_type || currentUser.channel_partner_type === 'STAFF') && (
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Tax Type <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                  </Typography>
                  <TextField
                    select
                    value={taxType}
                    onChange={(e) => setTaxType(e.target.value as 'EXCLUSIVE' | 'INCLUSIVE')}
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="EXCLUSIVE">Exclusive</MenuItem>
                    <MenuItem value="INCLUSIVE">Inclusive</MenuItem>
                  </TextField>
                </Grid>
              )}
              
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Customer Type <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <SearchableDropdown
                  value={customerType ? customerTypeOptions.find((opt) => opt.id === customerType) || null : null}
                  onChange={(option) => {
                    const selected = Array.isArray(option) ? option[0] || null : option;
                    handleCustomerTypeChange((selected?.id as CustomerType) || null);
                  }}
                  apiEndpoint=""
                  staticOptions={customerTypeOptions}
                  label=""
                  placeholder="Select Customer Type"
                  error={Boolean(errors.customerType)}
                  helperText={errors.customerType || (isCustomerTypeDisabled() && currentUser?.channel_partner_type === 'RETAILER' ? 'Customer type is fixed for retailer users' : customerTypeDisabled ? 'Loading channel configuration...' : isChannelConfigError ? 'Channel configuration unavailable, showing all types' : '')}
                  disabled={isCustomerTypeDisabled() || isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Customer <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <SearchableDropdown
                  value={customer}
                  onChange={handleCustomerChange}
                  apiEndpoint={customerApiEndpoint}
                  label=""
                  placeholder="Select Customer"
                  error={Boolean(errors.customer)}
                  helperText={errors.customer || (isCustomerDisabled() && currentUser?.channel_partner_type === 'RETAILER' ? 'Customer is fixed for retailer users' : isCustomerDisabled() && currentUser?.channel_partner_type === 'DISTRIBUTOR' && customerType === 'DISTRIBUTOR' ? 'Logged-in distributor is auto-selected' : '')}
                  additionalFilters={customerAdditionalFilters}
                  disabled={isCustomerDisabled() || isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Credit Days
                </Typography>
                <TextField
                  type="number"
                  value={creditDays}
                  onChange={(e) => setCreditDays(parseInt(e.target.value) || 0)}
                  fullWidth
                  size="small"
                  sx={{
                    ...readOnlyFieldSx,
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
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Credit Limit
                </Typography>
                <TextField
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                  fullWidth
                  size="small"
                  sx={{
                    ...readOnlyFieldSx,
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
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>

            {/* Address Information Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, mt: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Address Information
              </Typography>
              {existingOrder?.state_info && (
                <Box
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: existingOrder.state_info.is_same_state ? 'success.light' : 'warning.light',
                    color: existingOrder.state_info.is_same_state ? 'success.dark' : 'warning.dark',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  {existingOrder.state_info.is_same_state ? '✓ Same State' : '⚠ Different State'}
                  <Tooltip
                    title={
                      <Box>
                        <Typography variant="caption" display="block" fontWeight={600}>Company State:</Typography>
                        <Typography variant="caption" display="block">{existingOrder.state_info.company.gst_state || existingOrder.state_info.company.physical_state || 'N/A'}</Typography>
                        <Typography variant="caption" display="block" fontWeight={600} mt={1}>Customer State:</Typography>
                        <Typography variant="caption" display="block">{existingOrder.state_info.customer.gst_state || existingOrder.state_info.customer.physical_state || 'N/A'}</Typography>
                        <Typography variant="caption" display="block" mt={1} fontStyle="italic">Method: {existingOrder.state_info.comparison_method}</Typography>
                      </Box>
                    }
                  >
                    <InfoIcon fontSize="small" sx={{ cursor: 'help' }} />
                  </Tooltip>
                </Box>
              )}
            </Box>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Billing Address
                </Typography>
                <TextField
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Shipping Address
                </Typography>
                <TextField
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>

            {/* Credit Summary Section */}
            <CreditSummarySection 
              customerType={customerType || null}
              customerId={customer?.id as string | null}
            />

            {/* Pending Sales Orders Section */}
            <PendingSalesOrdersSection 
              customerType={customerType || null}
              customerId={customer?.id as string | null}
            />

            {/* Previous Invoices Section */}
            <PreviousInvoicesSection 
              customerType={customerType || null}
              customerId={customer?.id as string | null}
            />

            {!isEditMode && customer?.id && customerType && (
              <Box sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    Frequently Ordered products (Last 12 Months)
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleAddFrequentItemsClick}
                    disabled={selectedFrequentCount === 0 || isLoadingFrequentItems || isSubmitting}
                  >
                    Add to Grid
                  </Button>
                </Box>

                {isLoadingFrequentItems && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      Loading frequent items...
                    </Typography>
                  </Box>
                )}

                {!isLoadingFrequentItems && frequentItems.length === 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {(generalSettings?.company_scoped_item_enforcement && company?.name)
                      ? `No frequently ordered items found for this customer in the selected company (${company.name}) in the last 12 months.`
                      : 'No frequently ordered items found for this customer in the last 12 months.'}
                  </Alert>
                )}

                {!isLoadingFrequentItems && frequentItems.length > 0 && (
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={allFrequentSelected}
                              indeterminate={selectedFrequentCount > 0 && !allFrequentSelected}
                              onChange={(e) => toggleSelectAllFrequentItems(e.target.checked)}
                            />
                          </TableCell>
                          <TableCell>Image</TableCell>
                          <TableCell>Product Code</TableCell>
                          <TableCell>Product Name</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Total Ordered Qty</TableCell>
                          <TableCell align="right">Order Count</TableCell>
                          <TableCell>Last Ordered</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {frequentItems.map((frequentItem) => (
                          <TableRow key={frequentItem.item} hover>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedFrequentItemIds.has(frequentItem.item)}
                                onChange={(e) => toggleFrequentItemSelection(frequentItem.item, e.target.checked)}
                              />
                            </TableCell>
                            <TableCell>
                              {frequentItem.item_image ? (
                                <MediaImage
                                  src={frequentItem.item_image}
                                  alt={frequentItem.item_name}
                                  sx={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 0.5 }}
                                />
                              ) : (
                                <Box sx={{ width: 36, height: 36, bgcolor: 'grey.100', borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography variant="caption" color="text.disabled">-</Typography>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell>{frequentItem.item_code}</TableCell>
                            <TableCell>{frequentItem.item_name}</TableCell>
                            <TableCell>{frequentItem.category_name || '-'}</TableCell>
                            <TableCell align="right">{Number(frequentItem.total_ordered_qty || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">{frequentItem.order_count || 0}</TableCell>
                            <TableCell>
                              {frequentItem.last_order_date ? dayjs(frequentItem.last_order_date).format('DD-MM-YYYY') : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* Line Items Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2, mt: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Order Products <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                {/* <Box sx={{ minWidth: 250 }}>
                  <SearchableDropdown
                    value={company}
                    onChange={(option) => setCompany(Array.isArray(option) ? option[0] || null : option)}
                    apiEndpoint="/api/usermanagement/dropdowns/companies/"
                    label=""
                    placeholder="Select Company *"
                    error={Boolean(errors.company)}
                    helperText={errors.company}
                  />
                </Box> */}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={barcodeSuggestions}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option.barcode || '';
                  }}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {option.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Code: {option.code}
                        </Typography>
                        <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                          Barcode: {option.barcode}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  inputValue={barcodeInput}
                  onInputChange={(event, newValue) => {
                    if (event && event.type !== 'click') {
                      handleBarcodeInputChange(newValue);
                    }
                  }}
                  onChange={(event, newValue) => {
                    if (typeof newValue === 'object' && newValue !== null) {
                      handleBarcodeSelect(newValue);
                    }
                  }}
                  loading={loadingBarcodeSuggestions}
                  disabled={!customer || isSubmitting || isSearchingBarcode}
                  sx={{ minWidth: 300 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Scan or enter barcode"
                      onKeyPress={handleBarcodeKeyPress}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingBarcodeSuggestions ? <CircularProgress size={20} /> : null}
                            {isSearchingBarcode ? <CircularProgress size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  noOptionsText={barcodeInput.length < 2 ? "Type at least 2 characters" : "No products found"}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setItems([...items, {
                    item: '',
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
                  }])}
                  disabled={!customer || isSubmitting}
                >
                  Add Product
                </Button>
              </Box>
            </Box>
            {errors.items && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.items}
              </Alert>
            )}
            <SalesOrderItemGrid
              items={items}
              displayItems={schemeAdjustedTotals.items || undefined}
              schemeDiscounts={schemeAdjustedTotals.schemeDiscounts || undefined}
              showSchemeDiscount={showSchemeDiscount}
              errors={errors}
              onChange={setItems}
              customerId={customer?.id as string}
              customerType={customerType || undefined}
              taxType={taxType}
              companyId={company?.id as string}
              enforceCompanyItemFilter={Boolean(generalSettings?.company_scoped_item_enforcement)}
              currentUser={currentUser}
            />

            {/* Schemes Section */}
            <Box sx={{ mt: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Schemes
                </Typography>
                {/* <Box sx={{ display: 'flex', gap: 1 }}>
                  {isEditMode && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => refetchAvailableSchemes()}
                      disabled={isLoadingSchemes || isSubmitting}
                    >
                      {isLoadingSchemes ? 'Refreshing...' : 'Refresh Schemes'}
                    </Button>
                  )}
                  {isEditMode ? (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleApplySchemes}
                      disabled={
                        isApplyingSchemes || 
                        isSubmitting ||
                        (() => {
                          // Disable if no changes from applied schemes
                          const appliedSchemeIds = (existingOrder?.applied_schemes || []).map(s => s.scheme);
                          const selectedSet = new Set(selectedSchemeIds);
                          const appliedSet = new Set(appliedSchemeIds);
                          const hasChanges = selectedSchemeIds.length !== appliedSchemeIds.length ||
                            selectedSchemeIds.some(id => !appliedSet.has(id)) ||
                            appliedSchemeIds.some(id => !selectedSet.has(id));
                          return !hasChanges;
                        })()
                      }
                    >
                      {isApplyingSchemes ? 'Applying...' : 'Apply Selected Schemes'}
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handlePreviewSchemes}
                      disabled={isPreviewingSchemes || isSubmitting}
                    >
                      {isPreviewingSchemes ? 'Previewing...' : 'Preview Schemes'}
                    </Button>
                  )}
                </Box> */}
              </Box>

              {!isEditMode && (
                <Alert severity="info">
                  Preview schemes based on the current form data. Save the order to apply selected schemes.
                </Alert>
              )}

              {/* {isEditMode && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Select schemes from the available list below and click "Apply Selected Schemes" to apply them to this order. 
                  Click "Refresh Schemes" to update the list based on current order items.
                </Alert>
              )} */}

              {/* {isEditMode && (() => {
             
                const appliedSchemeIds = (existingOrder?.applied_schemes || []).map(s => s.scheme);
                const selectedSet = new Set(selectedSchemeIds);
                const appliedSet = new Set(appliedSchemeIds);
                const hasChanges = selectedSchemeIds.length !== appliedSchemeIds.length ||
                  selectedSchemeIds.some(id => !appliedSet.has(id)) ||
                  appliedSchemeIds.some(id => !selectedSet.has(id));
                
                if (hasChanges) {
                  return (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Scheme selection has changed. Click "Apply Selected Schemes" to update the order with the new selection.
                      {selectedSchemeIds.length === 0 && appliedSchemeIds.length > 0 && 
                        " This will remove all currently applied schemes."}
                    </Alert>
                  );
                }
                return null;
              })()} */}

              {!(generalSettings?.allow_multiple_schemes ?? true) && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Multiple scheme selection is disabled. You can select only one scheme.
                </Alert>
              )}

              {isEditMode && isLoadingSchemes && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Loading available schemes...</Typography>
                </Box>
              )}

              {!isEditMode && isPreviewingSchemes && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Previewing schemes...</Typography>
                </Box>
              )}

              {availableSchemes.length === 0 && !isLoadingSchemes && !isPreviewingSchemes && (
                <Alert severity="info">
                  {isEditMode 
                    ? 'No applicable schemes found for this order. The order may not meet scheme conditions, or schemes may have expired.'
                    : 'No applicable schemes found. Add products and click "Preview Schemes" to see available offers.'}
                </Alert>
              )}

              {availableSchemes.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          {(generalSettings?.allow_multiple_schemes ?? true) ? (
                            <Checkbox
                              checked={allSchemesSelected}
                              indeterminate={selectedSchemeCount > 0 && !allSchemesSelected}
                              onChange={(e) => toggleSelectAllSchemes(e.target.checked)}
                              disabled={lockSchemeSelection || isSubmitting}
                            />
                          ) : (
                            <Box sx={{ width: 42 }} />
                          )}
                        </TableCell>
                        <TableCell>Code</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Preview Discount</TableCell>
                        <TableCell>Free Products</TableCell>
                        <TableCell align="right">Priority</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {availableSchemes.map((scheme) => (
                        <TableRow key={scheme.id} hover>
                          <TableCell padding="checkbox">
                            {(generalSettings?.allow_multiple_schemes ?? true) ? (
                              <Checkbox
                                checked={selectedSchemeIdsSet.has(scheme.id)}
                                onChange={(e) => toggleSchemeSelectionCheckbox(scheme.id, e.target.checked)}
                                disabled={lockSchemeSelection && !selectedSchemeIdsSet.has(scheme.id) || isSubmitting}
                              />
                            ) : (
                              <Radio
                                checked={selectedSchemeIdsSet.has(scheme.id)}
                                onChange={(e) => toggleSchemeSelectionCheckbox(scheme.id, e.target.checked)}
                                disabled={lockSchemeSelection && !selectedSchemeIdsSet.has(scheme.id) || isSubmitting}
                                name="sales-order-scheme-selection"
                                value={scheme.id}
                              />
                            )}
                          </TableCell>
                          <TableCell>{scheme.code}</TableCell>
                          <TableCell>{scheme.name}</TableCell>
                          <TableCell>{scheme.scheme_type_display}</TableCell>
                          <TableCell align="right">
                            ₹{getSchemeDiscountAmount(scheme).toFixed(2)}
                          </TableCell>
                          <TableCell>{formatFreeItems(getSchemeFreeItems(scheme))}</TableCell>
                          <TableCell align="right">{scheme.priority}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {lockSchemeSelection && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Grand total is zero after applying schemes. Unselect a scheme to choose others.
                </Alert>
              )}

              {isEditMode && existingOrder?.applied_schemes && existingOrder.applied_schemes.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                    Applied Schemes
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Code</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Discount</TableCell>
                          <TableCell>Free Products</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {existingOrder.applied_schemes.map((scheme) => (
                          <TableRow key={scheme.id}>
                            <TableCell>{scheme.scheme_code}</TableCell>
                            <TableCell>{scheme.scheme_name}</TableCell>
                            <TableCell>{scheme.scheme_type_display || scheme.scheme_type}</TableCell>
                            <TableCell align="right">
                              ₹{Number(scheme.discount_amount || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>{formatFreeItems(scheme.free_items)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>

            {/* Order Summary Section */}
            <Typography variant="h6" sx={{ mb: 2, mt: 4, fontWeight: 600, color: 'primary.main' }}>
              Order Summary
            </Typography>
            {(() => {
              const sBase = totals.baseAmount;
              const sProductDiscount = totals.totalDiscount;
              const sSchemeDiscount = schemeDiscount;
              const sTotalDiscount = sProductDiscount + sSchemeDiscount;
              const sSubtotalAfterDiscount = sBase - sTotalDiscount;
              const sTaxable = schemeAdjustedTotals.taxableAmount;
              const sTax = schemeAdjustedTotals.totalTax;
              const sCgst = schemeAdjustedTotals.cgstTotal;
              const sSgst = schemeAdjustedTotals.sgstTotal;
              const sIgst = schemeAdjustedTotals.igstTotal;
              const sCess = schemeAdjustedTotals.cessTotal;
              const sGrand = displayGrandTotal;
              return (
            <Box sx={{ maxWidth: { xs: '100%', sm: 400 }, ml: 'auto' }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" fontWeight={600}>Subtotal:</Typography>
                </Grid>
                <Grid size={{ xs: 6 }} sx={{ textAlign: "right" }}>
                  <Typography variant="body2" fontWeight={600}>₹{sBase.toFixed(2)}</Typography>
                </Grid>
                
                {sProductDiscount > 0 && (
                  <>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" sx={{ pl: 2 }}>Product Discount:</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }} sx={{ textAlign: "right" }}>
                      <Typography variant="body2" fontWeight={500} color="error">-₹{sProductDiscount.toFixed(2)}</Typography>
                    </Grid>
                  </>
                )}
                
                {sSchemeDiscount > 0 && (
                  <>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" sx={{ pl: 2 }}>
                        {isEditMode 
                          ? (existingOrder?.applied_schemes?.some(s => selectedSchemeIds.includes(s.scheme))
                              ? 'Scheme Discount:' 
                              : 'Scheme Discount (Preview):')
                          : 'Scheme Discount (Preview):'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }} sx={{ textAlign: "right" }}>
                      <Typography variant="body2" fontWeight={500} color="error">
                        -₹{sSchemeDiscount.toFixed(2)}
                      </Typography>
                    </Grid>
                  </>
                )}
                
                {(sProductDiscount > 0 || sSchemeDiscount > 0) && (
                  <>
                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 0.5 }} />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" fontWeight={600}>Taxable Amount:</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }} sx={{ textAlign: "right" }}>
                      <Typography variant="body2" fontWeight={600}>₹{sTaxable.toFixed(2)}</Typography>
                    </Grid>
                  </>
                )}
                
                {sCgst > 0 && (
                  <>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" sx={{ pl: 2 }}>CGST:</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }} sx={{ textAlign: "right" }}>
                      <Typography variant="body2" fontWeight={500}>₹{sCgst.toFixed(2)}</Typography>
                    </Grid>
                  </>
                )}
                {sSgst > 0 && (
                  <>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" sx={{ pl: 2 }}>SGST:</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }} sx={{ textAlign: "right" }}>
                      <Typography variant="body2" fontWeight={500}>₹{sSgst.toFixed(2)}</Typography>
                    </Grid>
                  </>
                )}
                {sIgst > 0 && (
                  <>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" sx={{ pl: 2 }}>IGST:</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }} sx={{ textAlign: "right" }}>
                      <Typography variant="body2" fontWeight={500}>₹{sIgst.toFixed(2)}</Typography>
                    </Grid>
                  </>
                )}
                {sCess > 0 && (
                  <>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" sx={{ pl: 2 }}>CESS:</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }} sx={{ textAlign: "right" }}>
                      <Typography variant="body2" fontWeight={500} color="warning.main">₹{sCess.toFixed(2)}</Typography>
                    </Grid>
                  </>
                )}
                
                {sTax > 0 && (
                  <>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" fontWeight={600}>Total Tax:</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }} sx={{ textAlign: "right" }}>
                      <Typography variant="body2" fontWeight={600}>₹{sTax.toFixed(2)}</Typography>
                    </Grid>
                  </>
                )}
                
                <Grid size={{ xs: 12 }}>
                  <Divider />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Grand Total:
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }} sx={{ textAlign: "right" }}>
                  <Typography variant="h6" fontWeight={600} color="primary">
                    ₹{sGrand.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
              );
            })()}

            {/* Additional Information Section */}
            <Typography variant="h6" sx={{ mb: 2, mt: 4, fontWeight: 600, color: 'primary.main' }}>
              Additional Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Remarks
                </Typography>
                <TextField
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter any additional notes or remarks"
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              {/* Attachments Section */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                  Attachments (Multiple allowed)
                </Typography>
                
                {/* Display existing attachments */}
                {attachments.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                      Uploaded Attachments
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {attachments.map((att: any) => (
                        <Box
                          key={att.id}
                          sx={{
                            p: 1.5,
                            bgcolor: 'grey.50',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid',
                            borderColor: 'grey.200',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                            <AttachFileIcon fontSize="small" sx={{ flexShrink: 0 }} />
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {att.original_filename || 'File'}
                              </Typography>
                              {att.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {att.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {att.file_url && (
                              <IconButton
                                size="small"
                                onClick={() => window.open(att.file_url, '_blank')}
                                sx={{ p: 0.5 }}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteAttachment(att.id)}
                              sx={{ p: 0.5 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Display selected files in create mode */}
                {!isEditMode && selectedAttachmentFiles.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', display: 'block', mb: 1 }}>
                      Files to Upload
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {selectedAttachmentFiles.map((file, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 1.5,
                            bgcolor: 'primary.50',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid',
                            borderColor: 'primary.200',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                            <AttachFileIcon fontSize="small" sx={{ color: 'primary.main', flexShrink: 0 }} />
                            <Typography variant="body2" color="primary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {file.name}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveFile(index)}
                            sx={{ p: 0.5 }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Upload button */}
                <Box>
                  <input
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    style={{ display: 'none' }}
                    id="attachment-file-input"
                    type="file"
                    multiple
                    onChange={handleUploadAttachment}
                  />
                  <label htmlFor="attachment-file-input">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadIcon />}
                      disabled={uploadingAttachment || isSubmitting}
                    >
                      Add Attachments
                    </Button>
                  </label>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Box>
      <Dialog open={duplicateDialogOpen} onClose={handleDuplicateDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Item Already Exists</DialogTitle>
        <DialogContent>
          <DialogContentText>
            One or more selected frequent items are already present in the order lines.
            Do you want to update quantity in existing lines or create separate lines?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDuplicateDialogClose}>Cancel</Button>
          <Button onClick={() => void handleDuplicateChoice('separate')} variant="outlined">
            Create Separate Line
          </Button>
          <Button onClick={() => void handleDuplicateChoice('update')} variant="contained">
            Update Quantity
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default SalesOrderForm;

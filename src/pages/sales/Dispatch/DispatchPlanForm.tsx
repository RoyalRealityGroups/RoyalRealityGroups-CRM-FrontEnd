import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Button,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  Card,
  CardContent,
  CardActions,
  Switch,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { toDayjs } from '../../../utils/format';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import ScreenHeader from '../../../components/common/ScreenHeader';
import SearchableDropdown from '../../../components/common/SearchableDropdown';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { getPageContainerStyles, getHeaderSectionStyles, getContentSectionStyles } from '../../../utils/spacing';
import { dispatchApi } from '../../../api/dispatch.api';
import { channelConfigApi, stateApi, cityApi, areaApi, retailerApi, distributorApi, superstockistApi, routeApi } from '../../../api/masters.api';
import apiClient from '../../../api/axios.config';
import { API_ENDPOINTS } from '../../../utils/constants';
import type { DispatchPlan, DispatchItemFormData, SalesOrderForDispatch } from '../../../types/dispatch.types';
import type { DropdownOption } from '../../../types/common.types';
import type { Route } from '../../../types/masters.types';
import { formatNumber } from '../../../utils/formatNumber';
import { useAppSelector } from '../../../store/hooks';
import {
  CONTACT_PHONE_MAX_LENGTH,
  CONTACT_PHONE_MIN_LENGTH,
  CONTACT_PHONE_REGEX,
  PHONE_FIELD_HELPER_TEXT,
  sanitizePhoneInput,
} from '../../../utils/validation';

const DispatchPlanForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);
  const currentUser = useAppSelector((state) => state.auth.user);

  usePageTitle(isEditMode ? 'Edit Dispatch Plan' : 'Create Dispatch Plan');

  // Form state
  const [dispatchNumber, setDispatchNumber] = useState('');
  const [dispatchDate, setDispatchDate] = useState<Dayjs>(dayjs());
  const [plannedDispatchDate, setPlannedDispatchDate] = useState<Dayjs>(dayjs());
  const [location, setLocation] = useState<DropdownOption | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleCapacity, setVehicleCapacity] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  const [route, setRoute] = useState<DropdownOption | null>(null);
  const [lrNo, setLrNo] = useState('');
  const [stockInsurance, setStockInsurance] = useState<string>('');
  const [status, setStatus] = useState('DRAFT');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<DispatchItemFormData[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<{[key: string]: File}>({});
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Selected items state for item-level selection
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Available orders state
  const [availableOrders, setAvailableOrders] = useState<SalesOrderForDispatch[]>([]);
  const [allLoadedOrders, setAllLoadedOrders] = useState<SalesOrderForDispatch[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [includeOtherCustomers, setIncludeOtherCustomers] = useState(false);
  const [orderFilters, setOrderFilters] = useState({
    customer_type: '',
    state: '',
    city: '',
    area: '',
    customer: '',
    show_items: true,
  });

  // Channel configuration
  const [channelConfig, setChannelConfig] = useState<{
    enable_superstockist: boolean;
    enable_distributor: boolean;
    enable_retailer: boolean;
  } | null>(null);
  const [filterState, setFilterState] = useState<DropdownOption | null>(null);
  const [filterCity, setFilterCity] = useState<DropdownOption | null>(null);
  const [filterArea, setFilterArea] = useState<DropdownOption | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<DropdownOption | null>(null);

  // Load existing dispatch plan
  const { data: existingPlan, isLoading: isLoadingPlan, error: planError } = useQuery({
    queryKey: ['dispatchPlan', id],
    queryFn: () => dispatchApi.getById(id!),
    enabled: isEditMode,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch attachments for edit mode
  const { data: attachmentsData, refetch: refetchAttachments } = useQuery({
    queryKey: ['dispatchPlanAttachments', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/dispatch/${id}/attachments/`);
      return response.data;
    },
    enabled: isEditMode,
  });

  const { data: routesListData } = useQuery({
    queryKey: ['routesListForDispatch'],
    queryFn: () => routeApi.getRoutes({ page: 1, page_size: 1000, is_active: true }),
  });
  const routesData: Route[] = routesListData?.results || [];

  useEffect(() => {
    if (attachmentsData) {
      setAttachments(attachmentsData);
    }
  }, [attachmentsData]);



  // Load available orders (show all pending by default)
  const shouldLoadAllRouteCustomers = Boolean(route?.id && selectedCustomer?.id && includeOtherCustomers);
  const requestOrderFilters = shouldLoadAllRouteCustomers
    ? { ...orderFilters, customer: '', customer_type: '' }
    : orderFilters;

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['availableOrders', requestOrderFilters, id, location?.id, route?.id, includeOtherCustomers, selectedCustomer?.id],
    queryFn: () => dispatchApi.getAvailableOrders({
      ...(isEditMode && id && { dispatch_plan_id: id }),
      ...(route?.id && { route_id: String(route.id) }),
      ...requestOrderFilters,
    }),
    enabled: isEditMode ? Boolean(id) : Boolean(location?.id && (route?.id || (orderFilters.customer_type && orderFilters.customer))),
  });

  const ordersLookup = useMemo(() => {
    const merged = [...allLoadedOrders, ...(ordersData?.results || []), ...availableOrders];
    const map = new Map<string, SalesOrderForDispatch>();
    merged.forEach(order => {
      if (order?.id && !map.has(order.id)) {
        map.set(order.id, order);
      }
    });
    return map;
  }, [allLoadedOrders, ordersData?.results, availableOrders]);

  const selectedOrderIds = useMemo(
    () => Array.from(new Set(items.map(item => item.sales_order))),
    [items]
  );

  const selectedOrderAreaIds = useMemo(() => {
    const areaIds = new Set<string>();
    selectedOrderIds.forEach(orderId => {
      const areaId = ordersLookup.get(orderId)?.shipping_area;
      if (areaId) {
        areaIds.add(areaId);
      }
    });
    return Array.from(areaIds);
  }, [selectedOrderIds, ordersLookup]);

  const filteredRoutes = useMemo(() => {
    if (selectedOrderAreaIds.length === 0) {
      return routesData;
    }
    return routesData.filter(routeOption =>
      routeOption.coverages?.some(coverage => selectedOrderAreaIds.includes(coverage.area))
    );
  }, [routesData, selectedOrderAreaIds]);

  const customerOptions = useMemo(() => {
    const source = route ? (ordersData?.results || []) : [];
    const filteredByType = source.filter(order =>
      !orderFilters.customer_type || order.customer_type === orderFilters.customer_type
    );
    const unique = new Map<string, { id: string; name: string }>();
    filteredByType.forEach(order => {
      if (order.customer_id && !unique.has(order.customer_id)) {
        unique.set(order.customer_id, { id: order.customer_id, name: order.customer_name });
      }
    });
    return Array.from(unique.values());
  }, [route, ordersData?.results, orderFilters.customer_type]);

  const availableCustomerTypes = useMemo(
    () =>
      [
        channelConfig?.enable_distributor ? 'DISTRIBUTOR' : null,
        channelConfig?.enable_superstockist ? 'SUPERSTOCKIST' : null,
        channelConfig?.enable_retailer ? 'RETAILER' : null,
      ].filter(Boolean) as string[],
    [channelConfig]
  );

  const getAvailableCustomerTypes = () => {
    if (!currentUser) return availableCustomerTypes;
    const userType = currentUser.channel_partner_type;
    if (userType === 'RETAILER') return ['RETAILER'].filter((type) => availableCustomerTypes.includes(type));
    if (userType === 'DISTRIBUTOR') {
      return availableCustomerTypes.filter((type) => type === 'DISTRIBUTOR' || type === 'RETAILER');
    }
    return availableCustomerTypes;
  };

  const enabledCustomerTypes = useMemo(
    () => getAvailableCustomerTypes(),
    [availableCustomerTypes, currentUser]
  );
  const customerTypeOptions: DropdownOption[] = useMemo(
    () =>
      enabledCustomerTypes.map((type) => ({
        id: type,
        name: type === 'RETAILER' ? 'Retailer' : type === 'DISTRIBUTOR' ? 'Distributor' : 'Superstockist',
      })),
    [enabledCustomerTypes]
  );

  const isCustomerTypeDisabled = () => {
    if (!currentUser) return false;
    return currentUser.channel_partner_type === 'RETAILER';
  };

  useEffect(() => {
    if (!enabledCustomerTypes.length) return;

    const userType = currentUser?.channel_partner_type;

    // Match Sales Order behavior:
    // - Retailer user: fixed to RETAILER
    // - Distributor user: default to DISTRIBUTOR (if enabled), otherwise first allowed
    // - Staff/super users: do not auto-select a customer type
    if (userType === 'RETAILER') {
      if (orderFilters.customer_type !== 'RETAILER') {
        setOrderFilters((prev) => ({ ...prev, customer_type: 'RETAILER' }));
      }
      return;
    }

    if (userType === 'DISTRIBUTOR') {
      if (!orderFilters.customer_type || !enabledCustomerTypes.includes(orderFilters.customer_type)) {
        const preferred = enabledCustomerTypes.includes('DISTRIBUTOR')
          ? 'DISTRIBUTOR'
          : enabledCustomerTypes[0];
        setOrderFilters((prev) => ({ ...prev, customer_type: preferred }));
      }
      return;
    }

    if (orderFilters.customer_type && !enabledCustomerTypes.includes(orderFilters.customer_type)) {
      setOrderFilters((prev) => ({ ...prev, customer_type: '' }));
    }
  }, [enabledCustomerTypes, orderFilters.customer_type, currentUser?.channel_partner_type]);

  // Load channel configuration and generate dispatch number
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load channel configuration
        const config = await channelConfigApi.getChannelConfig();
        setChannelConfig(config);

        // Generate dispatch number for new plans when location is selected
        if (!isEditMode && location) {
          const data = await dispatchApi.generateDispatchNumber(String(location.id));
          setDispatchNumber(data.dispatch_number);
        } else if (!isEditMode && !location) {
          setDispatchNumber('');
        }
      } catch (error) {
      }
    };
    loadInitialData();
  }, [isEditMode, location]);

  // Reset dependent filters when parent changes
  useEffect(() => {
    setFilterCity(null);
    setFilterArea(null);
    setSelectedCustomer(null);
    setOrderFilters(prev => ({ ...prev, city: '', area: '', customer: '' }));
  }, [filterState]);

  useEffect(() => {
    setFilterArea(null);
    setSelectedCustomer(null);
    setOrderFilters(prev => ({ ...prev, area: '', customer: '' }));
  }, [filterCity]);

  useEffect(() => {
    setSelectedCustomer(null);
    setOrderFilters(prev => ({ ...prev, customer: '' }));
  }, [filterArea]);

  // Reset customer when customer type changes
  useEffect(() => {
    setSelectedCustomer(null);
    setOrderFilters(prev => ({ ...prev, customer: '' }));
  }, [orderFilters.customer_type]);

  // Update order filters when geographical filters change
  useEffect(() => {
    setOrderFilters(prev => ({
      ...prev,
      state: filterState?.id ? String(filterState.id) : '',
      city: filterCity?.id ? String(filterCity.id) : '',
      area: filterArea?.id ? String(filterArea.id) : '',
    }));
  }, [filterState, filterCity, filterArea]);

  // Update customer filter when selected customer changes
  useEffect(() => {
    setOrderFilters(prev => ({
      ...prev,
      customer: selectedCustomer?.id ? String(selectedCustomer.id) : '',
    }));
  }, [selectedCustomer]);

  useEffect(() => {
    setIncludeOtherCustomers(false);
  }, [selectedCustomer?.id]);

  useEffect(() => {
    if (!route && selectedOrderAreaIds.length > 0 && filteredRoutes.length === 1) {
      const onlyRoute = filteredRoutes[0];
      setRoute({ id: onlyRoute.id, name: onlyRoute.name });
    }
  }, [route, selectedOrderAreaIds, filteredRoutes]);

  useEffect(() => {
    if (includeOtherCustomers || !selectedCustomer?.id) {
      return;
    }

    const selectedCustomerId = String(selectedCustomer.id);
    const selectedCustomerItems = items.filter(item => {
      const order = ordersLookup.get(item.sales_order);
      return order?.customer_id && String(order.customer_id) === selectedCustomerId;
    });

    if (selectedCustomerItems.length === items.length) {
      return;
    }

    const selectedOrderItemKeys = new Set(
      selectedCustomerItems
        .filter(item => item.sales_order_item)
        .map(item => `${item.sales_order}-${item.sales_order_item}`)
    );
    const selectedOrderIds = new Set(selectedCustomerItems.map(item => item.sales_order));

    setItems(selectedCustomerItems);
    setSelectedItems(selectedOrderItemKeys);
    setSelectedOrders(selectedOrderIds);
  }, [includeOtherCustomers, selectedCustomer?.id, items, ordersLookup]);

  // Reset form state when ID changes
  useEffect(() => {
    if (isEditMode) {
      // Reset all form state
      setDispatchNumber('');
      setDispatchDate(dayjs());
      setPlannedDispatchDate(dayjs());
      setLocation(null);
      setVehicleNumber('');
      setVehicleType('');
      setVehicleCapacity('');
      setDriverName('');
      setDriverPhone('');
      setDriverLicense('');
      setRoute(null);
      setLrNo('');
      setStockInsurance('');
      setStatus('DRAFT');
      setRemarks('');
      setItems([]);
      setSelectedOrders(new Set());
      setSelectedItems(new Set());
      setAllLoadedOrders([]);
      setAttachments([]);
      setAttachmentFiles({});
      setErrors({});
    } else {
      // Reset dispatch number for new plans
      setDispatchNumber('');
    }
  }, [id, isEditMode]);

  // Populate form when editing
  useEffect(() => {
    if (existingPlan) {
      setDispatchNumber(existingPlan.dispatch_number || '');
      setDispatchDate(dayjs(existingPlan.dispatch_date));
      setPlannedDispatchDate(dayjs(existingPlan.planned_dispatch_date));
      if (existingPlan.location) {
        setLocation({
          id: existingPlan.location,
          name: existingPlan.location_name || '',
        });
      }
      setVehicleNumber(existingPlan.vehicle_number || '');
      setVehicleType(existingPlan.vehicle_type || '');
      setVehicleCapacity(existingPlan.vehicle_capacity || '');
      setDriverName(existingPlan.driver_name || '');
      setDriverPhone(existingPlan.driver_phone || '');
      setDriverLicense(existingPlan.driver_license || '');
      if (existingPlan.route) {
        setRoute({
          id: existingPlan.route,
          name: existingPlan.route_name || '',
        });
      } else {
        setRoute(null);
      }
      setLrNo(existingPlan.lr_no || '');
      setStockInsurance(existingPlan.stock_insurance ? 'YES' : 'NO');
      setStatus(existingPlan.status || 'DRAFT');
      setRemarks(existingPlan.remarks || '');

      // Set attachments from detail response if available
      if ((existingPlan as any).attachments) {
        setAttachments((existingPlan as any).attachments);
      }

      if (existingPlan.items && existingPlan.items.length > 0) {
        // Extract customer type and customer from the first item
        const firstItem = existingPlan.items[0];
        if (firstItem.customer_type) {
          setOrderFilters(prev => ({ ...prev, customer_type: firstItem.customer_type || '' }));
        }
        if (firstItem.customer_name) {
          const customerId = (firstItem as any).customer_id || '';
          if (customerId) {
            setSelectedCustomer({ id: customerId, name: firstItem.customer_name });
            setOrderFilters(prev => ({ ...prev, customer: customerId }));
          }
        }
        // Populate state/city/area filters from shipping data
        const stateId = (firstItem as any).shipping_state_id || '';
        const stateName = firstItem.shipping_state_name || '';
        const cityId = (firstItem as any).shipping_city_id || '';
        const cityName = firstItem.shipping_city_name || '';
        const areaId = (firstItem as any).shipping_area_id || '';
        const areaName = (firstItem as any).shipping_area_name || '';
        if (stateId && stateName) {
          setFilterState({ id: stateId, name: stateName });
          setOrderFilters(prev => ({ ...prev, state: stateId }));
        }
        // Delay city/area to allow state filter to propagate
        setTimeout(() => {
          if (cityId && cityName) {
            setFilterCity({ id: cityId, name: cityName });
            setOrderFilters(prev => ({ ...prev, city: cityId }));
          }
          setTimeout(() => {
            if (areaId && areaName) {
              setFilterArea({ id: areaId, name: areaName });
              setOrderFilters(prev => ({ ...prev, area: areaId }));
            }
          }, 200);
        }, 200);

        // Convert dispatch items to form data
        const formItems = existingPlan.items.map(item => ({
          sales_order: item.sales_order,
          sales_order_item: item.sales_order_item || undefined,
          quantity_ordered: formatNumber(item.quantity_ordered),
          quantity_dispatched: formatNumber(item.quantity_dispatched),
          delivery_sequence: item.delivery_sequence || 1,
          loading_sequence: item.loading_sequence || 1,
          unloading_sequence: item.unloading_sequence || item.delivery_sequence || 1,
          estimated_delivery_time: item.estimated_delivery_time,
          delivery_notes: item.delivery_notes || '',
        }));
        setItems(formItems);
        
        // Set selected orders and items
        const orderIds = new Set<string>(existingPlan.items.map(item => item.sales_order));
        setSelectedOrders(orderIds);
        
        // Set selected items for item-level dispatch
        const itemKeys = new Set<string>(
          existingPlan.items
            .filter(item => item.sales_order_item)
            .map(item => `${item.sales_order}-${item.sales_order_item}`)
        );
        setSelectedItems(itemKeys);
      }
    }
  }, [existingPlan]);

  // Load sales order data for selected orders in edit mode
  useEffect(() => {
    const loadSelectedOrdersData = async () => {
      if (isEditMode && existingPlan && existingPlan.items && existingPlan.items.length > 0) {
        try {
          // Use available orders API with dispatch_plan_id to get selected orders
          const response = await dispatchApi.getAvailableOrders({
            dispatch_plan_id: id,
            ...(route?.id && { route_id: String(route.id) }),
            show_items: true,
          });
          
          if (response?.results) {
            // Merge shipping data from existingPlan.items into loaded orders
            const planItems = existingPlan.items || [];
            const enrichedResults = response.results.map((order: any) => {
              const matchingItem = planItems.find(pi => pi.sales_order === order.id);
              if (matchingItem) {
                return {
                  ...order,
                  shipping_state_name: order.shipping_state_name || matchingItem.shipping_state_name || '',
                  shipping_city_name: order.shipping_city_name || matchingItem.shipping_city_name || '',
                  shipping_area_name: order.shipping_area_name || (matchingItem as any).shipping_area_name || '',
                  shipping_address: order.shipping_address || matchingItem.shipping_address || '',
                  customer_name: order.customer_name || matchingItem.customer_name || '',
                  customer_type: order.customer_type || matchingItem.customer_type || '',
                };
              }
              return order;
            });
            setAllLoadedOrders(prev => {
              const existingIds = new Set(prev.map(o => o.id));
              const newOrders = enrichedResults.filter((o: any) => !existingIds.has(o.id));
              return [...prev, ...newOrders];
            });
            setAvailableOrders(enrichedResults);
          }
        } catch (error) {
        }
      }
    };
    
    loadSelectedOrdersData();
  }, [isEditMode, existingPlan, id, route?.id]);

  // Update available orders and maintain all loaded orders
  useEffect(() => {
    if (ordersData?.results) {
      setAvailableOrders(ordersData.results);
      
      // Merge with existing orders to maintain data for selected orders
      setAllLoadedOrders(prev => {
        const newOrders = ordersData.results;
        const existingIds = new Set(prev.map(o => o.id));
        const uniqueNewOrders = newOrders.filter(o => !existingIds.has(o.id));
        return [...prev, ...uniqueNewOrders];
      });
    }
  }, [ordersData]);

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Sales', path: '/sales' },
      { label: 'Dispatch Planning', path: '/sales/dispatch' },
      { label: isEditMode ? 'Edit Dispatch Plan' : 'New Dispatch Plan' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode]);

  // Get customer endpoint based on type
  const getCustomerEndpoint = () => {
    switch (orderFilters.customer_type) {
      case 'RETAILER':
        return API_ENDPOINTS.RETAILERS;
      case 'DISTRIBUTOR':
        return API_ENDPOINTS.DISTRIBUTORS;
      case 'SUPERSTOCKIST':
        return API_ENDPOINTS.SUPERSTOCKISTS;
      default:
        return '';
    }
  };

  // Get customer filters based on geographical selection
  const getCustomerFilters = () => {
    const filters: any = {};
    if (filterState) filters.state = filterState.id;
    if (filterCity) filters.city = filterCity.id;
    if (filterArea) filters.area = filterArea.id;
    return filters;
  };

  const handleRouteChange = (routeId: string) => {
    const selectedRoute = filteredRoutes.find(r => String(r.id) === routeId) || null;
    if (!selectedRoute) {
      setRoute(null);
      setFilterState(null);
      setFilterCity(null);
      setFilterArea(null);
      setSelectedCustomer(null);
      return;
    }

    if (items.length > 0) {
      const routeAreaSet = new Set(selectedRoute.coverages?.map(c => c.area) || []);
      const hasMismatchedSelectedOrders = selectedOrderIds.some(orderId => {
        const areaId = ordersLookup.get(orderId)?.shipping_area;
        return Boolean(areaId && !routeAreaSet.has(areaId));
      });

      if (hasMismatchedSelectedOrders) {
        const confirmed = window.confirm(
          'Some selected orders are from different route areas. Switch route and remove existing selected orders?'
        );
        if (!confirmed) {
          return;
        }
        setItems([]);
        setSelectedItems(new Set());
        setSelectedOrders(new Set());
      }
    }

    setRoute({ id: selectedRoute.id, name: selectedRoute.name });
    setIncludeOtherCustomers(false);
  };

  const uploadAttachments = async (planId: string) => {
    const entries = Object.entries(attachmentFiles).filter(
      ([, file]) => file && file instanceof File && file.size > 0
    );
    if (entries.length === 0) return;
    const results = await Promise.allSettled(
      entries.map(([type, file]) => dispatchApi.uploadAttachment(planId, file, type))
    );
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      toastError(`${failed.length} attachment(s) failed to upload`);
    }
  };

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditMode) {
        return dispatchApi.update(id!, data);
      }
      return dispatchApi.create(data);
    },
    onSuccess: async (response: any) => {
      const planId = isEditMode ? id! : response?.id;
      if (planId) {
        await uploadAttachments(planId);
      }
      queryClient.invalidateQueries({ queryKey: ['dispatchPlans'] });
      queryClient.invalidateQueries({ queryKey: ['dispatchPlan', id] });
      toastSuccess(`Dispatch plan ${isEditMode ? 'updated' : 'created'} successfully`);
      navigate('/sales/dispatch');
    },
    onError: (error: any) => {
      console.error('Dispatch plan save error:', error.response?.data || error);
      const data = error.response?.data;
      let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} dispatch plan`;
      if (data) {
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'object') {
          const messages = Object.entries(data).map(([key, val]) => {
            const v = Array.isArray(val) ? val.join(', ') : String(val);
            return `${key}: ${v}`;
          });
          if (messages.length > 0) errorMessage = messages.join('; ');
        }
      }
      toastError(errorMessage);
    },
  });

  const handleItemSelection = (orderId: string, itemId: string, selected: boolean) => {
    const itemKey = `${orderId}-${itemId}`;
    const newSelectedItems = new Set<string>(selectedItems);
    
    if (selected) {
      newSelectedItems.add(itemKey);
      const order = availableOrders.find(o => o.id === orderId);
      const item = order?.items?.find(i => i.id === itemId);
      if (order && item) {
        setItems(prev => {
          const newLoadingSeq = prev.length + 1;
          const added = [...prev, {
            sales_order: orderId,
            sales_order_item: itemId,
            quantity_ordered: item.remaining_quantity,
            quantity_dispatched: item.remaining_quantity,
            delivery_sequence: newLoadingSeq,
            loading_sequence: newLoadingSeq,
            unloading_sequence: 1,
            delivery_notes: '',
          }];
          const maxSeq = Math.max(...added.map(i => i.loading_sequence || 0));
          return added.map(i => ({ ...i, unloading_sequence: maxSeq + 1 - (i.loading_sequence || 1) }));
        });
      }
    } else {
      newSelectedItems.delete(itemKey);
      setItems(prev => {
        const filtered = prev.filter(item => !(item.sales_order === orderId && item.sales_order_item === itemId));
        if (filtered.length === 0) return filtered;
        const maxSeq = Math.max(...filtered.map(i => i.loading_sequence || 0));
        return filtered.map(i => ({ ...i, unloading_sequence: maxSeq + 1 - (i.loading_sequence || 1) }));
      });
    }
    setSelectedItems(newSelectedItems);
  };

  const handleOrderSelection = (orderId: string, selected: boolean) => {
    const newSelected = new Set<string>(selectedOrders);
    if (selected) {
      newSelected.add(orderId);
      const order = availableOrders.find(o => o.id === orderId);
      if (order) {
        setItems(prev => {
          const exists = prev.some(item => item.sales_order === orderId);
          if (exists) return prev;
          const newLoadingSeq = prev.length + 1;
          const added = [...prev, {
            sales_order: orderId,
            quantity_ordered: order.remaining_quantity,
            quantity_dispatched: order.remaining_quantity,
            delivery_sequence: newLoadingSeq,
            loading_sequence: newLoadingSeq,
            unloading_sequence: 1,
            delivery_notes: '',
          }];
          const maxSeq = Math.max(...added.map(i => i.loading_sequence || 0));
          return added.map(i => ({ ...i, unloading_sequence: maxSeq + 1 - (i.loading_sequence || 1) }));
        });
      }
    } else {
      newSelected.delete(orderId);
      setItems(prev => {
        const filtered = prev.filter(item => item.sales_order !== orderId);
        if (filtered.length === 0) return filtered;
        const maxSeq = Math.max(...filtered.map(i => i.loading_sequence || 0));
        return filtered.map(i => ({ ...i, unloading_sequence: maxSeq + 1 - (i.loading_sequence || 1) }));
      });
    }
    setSelectedOrders(newSelected);
  };

  const updateItemQuantity = (orderId: string, itemId: string | undefined, quantity: number) => {
    setItems(prev => prev.map(item => 
      item.sales_order === orderId && item.sales_order_item === itemId
        ? { ...item, quantity_dispatched: quantity }
        : item
    ));
    
    // Real-time validation
    const index = items.findIndex(i => i.sales_order === orderId && i.sales_order_item === itemId);
    if (index !== -1) {
      const item = items[index];
      const orderedQty = Number(item.quantity_ordered);
      setErrors(prev => {
        const newErrors = { ...prev };
        if (quantity <= 0) {
          newErrors[`quantity_${index}`] = 'Quantity must be greater than 0';
        } else if (quantity > orderedQty) {
          newErrors[`quantity_${index}`] = 'Dispatched quantity cannot exceed ordered quantity';
        } else {
          delete newErrors[`quantity_${index}`];
        }
        return newErrors;
      });
    }
  };

  const updateItemSequence = (orderId: string, field: 'loading_sequence' | 'unloading_sequence', value: number) => {
    setItems(prev => {
      const updated = prev.map(item =>
        item.sales_order === orderId
          ? { ...item, [field]: value }
          : item
      );
      if (field === 'loading_sequence') {
        const maxSeq = Math.max(...updated.map(i => i.loading_sequence || 0));
        return updated.map(i => ({
          ...i,
          unloading_sequence: maxSeq + 1 - (i.loading_sequence || 1),
        }));
      }
      return updated;
    });
  };

  const handleSelectAllItems = (orderId: string, selected: boolean) => {
    const order = availableOrders.find(o => o.id === orderId);
    if (!order?.items) return;
    
    const newSelectedItems = new Set<string>(selectedItems);
    
    if (selected) {
      const newItems: DispatchItemFormData[] = [];
      order.items.forEach(item => {
        newSelectedItems.add(`${orderId}-${item.id}`);
        newItems.push({
          sales_order: orderId,
          sales_order_item: item.id,
          quantity_ordered: item.remaining_quantity,
          quantity_dispatched: item.remaining_quantity,
          delivery_sequence: 1,
          loading_sequence: 1,
          unloading_sequence: 1,
          delivery_notes: '',
        });
      });
      setItems(prev => {
        const existingIds = new Set(prev.map(i => `${i.sales_order}-${i.sales_order_item}`));
        const toAdd = newItems.filter(i => !existingIds.has(`${i.sales_order}-${i.sales_order_item}`));
        let seq = prev.length;
        const added = [...prev, ...toAdd.map(i => ({ ...i, loading_sequence: ++seq, delivery_sequence: seq }))];
        const maxSeq = Math.max(...added.map(i => i.loading_sequence || 0));
        return added.map(i => ({ ...i, unloading_sequence: maxSeq + 1 - (i.loading_sequence || 1) }));
      });
    } else {
      order.items.forEach(item => {
        newSelectedItems.delete(`${orderId}-${item.id}`);
      });
      setItems(prev => {
        const filtered = prev.filter(i => i.sales_order !== orderId);
        if (filtered.length === 0) return filtered;
        const maxSeq = Math.max(...filtered.map(i => i.loading_sequence || 0));
        return filtered.map(i => ({ ...i, unloading_sequence: maxSeq + 1 - (i.loading_sequence || 1) }));
      });
    }
    
    setSelectedItems(newSelectedItems);
  };

  const removeItem = (orderId: string, itemId?: string) => {
    const recalcUnloading = (list: DispatchItemFormData[]) => {
      if (list.length === 0) return list;
      const maxSeq = Math.max(...list.map(i => i.loading_sequence || 0));
      return list.map(i => ({ ...i, unloading_sequence: maxSeq + 1 - (i.loading_sequence || 1) }));
    };
    if (itemId) {
      setItems(prev => recalcUnloading(prev.filter(item => !(item.sales_order === orderId && item.sales_order_item === itemId))));
      setSelectedItems(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(`${orderId}-${itemId}`);
        return newSelected;
      });
    } else {
      setItems(prev => recalcUnloading(prev.filter(item => item.sales_order !== orderId)));
      setSelectedOrders(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(orderId);
        return newSelected;
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, attachmentType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAttachmentFiles(prev => ({ ...prev, [attachmentType]: file }));
    toastSuccess('Attachment added');
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (isEditMode && id) {
      try {
        await apiClient.delete(`/api/dispatch/${id}/attachments/${attachmentId}/`);
        setAttachments((prev) => prev.filter((att: any) => att.id !== attachmentId));
        toastSuccess('Attachment removed successfully');
      } catch (error) {
        toastError('Failed to remove attachment');
      }
    } else {
      setAttachments((prev) => prev.filter((att: any) => att.id !== attachmentId));
    }
  };

  const getAttachmentsByType = (type: string) => {
    return attachments.filter((att: any) => att.attachment_type === type);
  };

  const renderAttachmentSection = (type: string, label: string, allowMultiple: boolean = false) => {
    const typeAttachments = getAttachmentsByType(type);
    const selectedFile = attachmentFiles[type];
    const canUpload = (allowMultiple || typeAttachments.length === 0) && !selectedFile;

    const isImageFile = (fileUrl: string) => {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif'];
      return imageExtensions.some(ext => fileUrl.toLowerCase().endsWith(ext));
    };

    return (
      <Box sx={{ mb: 0 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          {label}
        </Typography>
        <Box>
          {typeAttachments.map((att: any) => (
            <Card key={att.id}>
              {att.file_url && isImageFile(att.file_url) && (
                <Box
                  component="img"
                  src={att.file_url}
                  alt={att.attachment_type}
                  sx={{ width: '100%', height: 120, objectFit: 'cover' }}
                />
              )}
              <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachFileIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2" noWrap>
                    {att.original_filename || att.file.split('/').pop()}
                  </Typography>
                </Box>
                {att.description && (
                  <Typography variant="caption" color="text.secondary">
                    {att.description}
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
                <Button size="small" href={att.file_url} target="_blank">
                  View
                </Button>
                <IconButton size="small" color="error" onClick={() => handleDeleteAttachment(att.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          ))}
          {selectedFile && (
            <Card>
              {selectedFile.type.startsWith('image/') && (
                <Box
                  component="img"
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  sx={{ width: '100%', height: 120, objectFit: 'cover' }}
                />
              )}
              <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachFileIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2" noWrap>
                    {selectedFile.name}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                <IconButton size="small" color="error" onClick={() => setAttachmentFiles(prev => { const newFiles = {...prev}; delete newFiles[type]; return newFiles; })}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          )}
          {canUpload && (
            <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed', borderColor: 'divider' }}>
              <CardContent>
                <input
                  style={{ display: 'none' }}
                  id={`upload-${type}`}
                  type="file"
                  onChange={(e) => handleFileUpload(e, type)}
                  disabled={uploadingAttachment}
                />
                <label htmlFor={`upload-${type}`}>
                  <Button
                    component="span"
                    startIcon={<UploadIcon />}
                    disabled={uploadingAttachment}
                    size="small"
                  >
                    Upload
                  </Button>
                </label>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!dispatchDate) newErrors.dispatchDate = 'Dispatch date is required';
    if (!plannedDispatchDate) newErrors.plannedDispatchDate = 'Planned dispatch date is required';
    if (!isEditMode && !location) newErrors.location = 'Location is required';
    if (!stockInsurance) newErrors.stockInsurance = 'Stock insurance selection is required';
    if (items.length === 0) newErrors.items = 'At least one order is required';

    // Validate driver phone number if provided
    if (driverPhone && driverPhone.trim()) {
      const phone = driverPhone.trim();
      if (phone.length < CONTACT_PHONE_MIN_LENGTH) {
        newErrors.driverPhone = 'Phone number must be at least 10 digits';
      } else if (phone.length > CONTACT_PHONE_MAX_LENGTH) {
        newErrors.driverPhone = 'Phone number cannot exceed 15 characters';
      } else if (!CONTACT_PHONE_REGEX.test(phone)) {
        newErrors.driverPhone = 'Please enter a valid phone number (e.g., +91 9876543210 or 040-12345678)';
      }
    }

    items.forEach((item, index) => {
      const orderedQty = Number(item.quantity_ordered);
      const dispatchedQty = Number(item.quantity_dispatched);
      
      if (dispatchedQty <= 0) {
        newErrors[`quantity_${index}`] = 'Quantity must be greater than 0';
      }
      if (dispatchedQty > orderedQty) {
        newErrors[`quantity_${index}`] = 'Dispatched quantity cannot exceed ordered quantity';
      }
    });

    // Validate sequences
    const loadingSequences = items.map(item => item.loading_sequence).filter(Boolean);
    const unloadingSequences = items.map(item => item.unloading_sequence || item.delivery_sequence).filter(Boolean);
    
    const duplicateLoading = loadingSequences.filter((seq, index) => loadingSequences.indexOf(seq) !== index);
    const duplicateUnloading = unloadingSequences.filter((seq, index) => unloadingSequences.indexOf(seq) !== index);
    
    if (duplicateLoading.length > 0) {
      items.forEach((item, index) => {
        if (duplicateLoading.includes(item.loading_sequence)) {
          newErrors[`loading_seq_${index}`] = 'Duplicate loading sequence';
        }
      });
    }
    
    if (duplicateUnloading.length > 0) {
      items.forEach((item, index) => {
        const unloadingSeq = item.unloading_sequence || item.delivery_sequence;
        if (duplicateUnloading.includes(unloadingSeq)) {
          newErrors[`unloading_seq_${index}`] = 'Duplicate unloading sequence';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (isDraft: boolean = false) => {
    if (!validate()) {
      // Switch to Tab 0 to show validation errors
      setActiveTab(0);
      
      // Scroll to top to show error alert
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      return;
    }

    const formData = {
      dispatch_number: dispatchNumber,
      dispatch_date: dispatchDate.format('YYYY-MM-DD'),
      planned_dispatch_date: plannedDispatchDate.format('YYYY-MM-DD'),
      ...(location && { location: location.id }),
      vehicle_number: vehicleNumber,
      vehicle_type: vehicleType,
      vehicle_capacity: vehicleCapacity,
      driver_name: driverName,
      driver_phone: driverPhone,
      driver_license: driverLicense,
      ...(route && { route: route.id }),
      lr_no: lrNo,
      stock_insurance: stockInsurance === 'YES',
      status: isDraft ? 'DRAFT' : 'CONFIRMED',
      remarks,
      items,
    };

    mutation.mutate(formData as any);
  };

  const handleBack = () => {
    navigate('/sales/dispatch');
  };

  if (isEditMode && isLoadingPlan) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (isEditMode && planError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="error">
          Failed to load dispatch plan: {planError instanceof Error ? planError.message : 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={getPageContainerStyles()}>
        <Box sx={getHeaderSectionStyles()}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}>
            <ScreenHeader
              title={isEditMode ? 'Edit Dispatch Plan' : 'New Dispatch Plan'}
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
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              {(!isEditMode || status === 'DRAFT') && (
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
                  onClick={() => handleSubmit(true)}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Saving...' : 'Save as Draft'}
                </Button>
              )}
              <Button
                type="button"
                variant="contained"
                color="primary"
                size="small"
                startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
                onClick={() => handleSubmit(false)}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Saving...' : isEditMode ? 'Update Dispatch Plan' : 'Create Dispatch Plan'}
              </Button>
            </Box>
          </Box>
        </Box>

        <Box sx={getContentSectionStyles()}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tab label="Dispatch Details" />
            <Tab label="Attachments" />
          </Tabs>

          {activeTab === 0 && (
          <Paper sx={{ p: 3, borderRadius: 0 }}>
            {mutation.isError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {mutation.error instanceof Error ? mutation.error.message : 'Failed to save dispatch plan'}
              </Alert>
            )}

            {Object.keys(errors).length > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <strong>Please fix the following errors before submitting:</strong>
                <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
                  {Object.entries(errors)
                    .filter(([key]) => !key.startsWith('quantity_') && !key.startsWith('loading_seq_') && !key.startsWith('unloading_seq_'))
                    .map(([key, value]) => (
                      <li key={key}>{value}</li>
                    ))}
                  {Object.entries(errors).some(([key]) => key.startsWith('quantity_') || key.startsWith('loading_seq_') || key.startsWith('unloading_seq_')) && (
                    <li>Please check the products table for quantity and sequence errors</li>
                  )}
                </ul>
              </Alert>
            )}

            {/* Header Information */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Dispatch Information
            </Typography>
            <Grid container spacing={3} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Location <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <SearchableDropdown
                  value={location}
                  onChange={(option) => setLocation(Array.isArray(option) ? option[0] || null : option)}
                  apiEndpoint="/api/usermanagement/dropdowns/locations/"
                  label=""
                  placeholder="Select Location"
                  error={Boolean(errors.location)}
                  helperText={errors.location}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Dispatch Number
                </Typography>
                <TextField
                  value={dispatchNumber}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.100' } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Dispatch Date <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <DatePicker
                  value={dispatchDate}
                  onChange={(date) => { const d = toDayjs(date); if (d) setDispatchDate(d); }}
                  format="DD-MM-YYYY"
                  slotProps={{ 
                    textField: { 
                      fullWidth: true, 
                      size: 'small',
                      error: Boolean(errors.dispatchDate),
                      helperText: errors.dispatchDate
                    } 
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Planned Date <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <DatePicker
                  value={plannedDispatchDate}
                  onChange={(date) => { const d = toDayjs(date); if (d) setPlannedDispatchDate(d); }}
                  format="DD-MM-YYYY"
                  slotProps={{ 
                    textField: { 
                      fullWidth: true, 
                      size: 'small',
                      error: Boolean(errors.plannedDispatchDate),
                      helperText: errors.plannedDispatchDate
                    } 
                  }}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
              Order Filters
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 2.4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Route
                </Typography>
                <SearchableDropdown
                  label=""
                  apiEndpoint=""
                  staticOptions={filteredRoutes.map((r: any) => ({ id: String(r.id), name: r.name }))}
                  value={route}
                  onChange={(option) => {
                    const selected = Array.isArray(option) ? option[0] || null : option;
                    handleRouteChange(selected?.id ? String(selected.id) : '');
                  }}
                  placeholder="Select route"
                />
                {!route && selectedOrderAreaIds.length > 0 && filteredRoutes.length === 0 && (
                  <Typography variant="caption" color="error">
                    No matching routes found for selected order areas.
                  </Typography>
                )}
              </Grid>
              <Grid size={{ xs: 12, md: 2.4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  State
                </Typography>
                <SearchableDropdown
                  label=""
                  apiEndpoint={API_ENDPOINTS.STATES}
                  value={filterState}
                  onChange={(option) => {
                    setFilterState(Array.isArray(option) ? option[0] || null : option);
                  }}
                  placeholder="Select state"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2.4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  City
                </Typography>
                <SearchableDropdown
                  label=""
                  apiEndpoint={API_ENDPOINTS.CITIES}
                  value={filterCity}
                  onChange={(option) => {
                    setFilterCity(Array.isArray(option) ? option[0] || null : option);
                  }}
                  additionalFilters={filterState ? { state: filterState.id } : undefined}
                  disabled={!filterState}
                  placeholder={filterState ? "All cities" : "Select state first"}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2.4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Area
                </Typography>
                <SearchableDropdown
                  label=""
                  apiEndpoint={API_ENDPOINTS.AREAS}
                  value={filterArea}
                  onChange={(option) => {
                    setFilterArea(Array.isArray(option) ? option[0] || null : option);
                  }}
                  additionalFilters={{
                    ...(filterState && { state: filterState.id }),
                    ...(filterCity && { city: filterCity.id }),
                  }}
                  disabled={!filterCity}
                  placeholder={filterCity ? "All areas" : "Select city first"}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2.4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Customer Type
                </Typography>
                <SearchableDropdown
                  label=""
                  apiEndpoint=""
                  staticOptions={customerTypeOptions}
                  value={customerTypeOptions.find((opt) => opt.id === orderFilters.customer_type) || null}
                  onChange={(option) => {
                    const selected = Array.isArray(option) ? option[0] || null : option;
                    setOrderFilters(prev => ({ ...prev, customer_type: (selected?.id as string) || '' }));
                  }}
                  placeholder="Select customer type"
                  disabled={isCustomerTypeDisabled()}
                />
              </Grid>
              {orderFilters.customer_type && (
                <Grid size={{ xs: 12, md: 2.4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Select {orderFilters.customer_type.toLowerCase()}
                  </Typography>
                  {route ? (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={selectedCustomer?.id || ''}
                      onChange={(e) => {
                        const customer = customerOptions.find(c => c.id === e.target.value);
                        setSelectedCustomer(customer ? { id: customer.id, name: customer.name } : null);
                      }}
                      placeholder={`Select ${orderFilters.customer_type.toLowerCase()}`}
                    >
                      <MenuItem value="">All</MenuItem>
                      {customerOptions.map(option => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={getCustomerEndpoint()}
                      value={selectedCustomer}
                      onChange={(option) => {
                        const singleOption = Array.isArray(option) ? option[0] || null : option;
                        setSelectedCustomer(singleOption);
                      }}
                      additionalFilters={getCustomerFilters()}
                      placeholder={`Select ${orderFilters.customer_type.toLowerCase()}`}
                    />
                  )}
                </Grid>
              )}
            </Grid>

            {/* Vehicle & Route Details */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Vehicle & Route Details
            </Typography>
            <Grid container spacing={3} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Vehicle Number
                </Typography>
                <TextField
                  value={vehicleNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                    setVehicleNumber(value);
                  }}
                  placeholder="Enter vehicle number"
                  fullWidth
                  size="small"
                  error={Boolean(errors.vehicleNumber)}
                  helperText={errors.vehicleNumber}
                  inputProps={{
                    style: { textTransform: 'uppercase' }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Vehicle Type
                </Typography>
                <TextField
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  placeholder="e.g., Truck, Van, Tempo"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Vehicle Capacity
                </Typography>
                <TextField
                  value={vehicleCapacity}
                  onChange={(e) => setVehicleCapacity(e.target.value)}
                  placeholder="e.g., 5 Ton, 1000 KG"
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
            <Grid container spacing={3} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Driver Name
                </Typography>
                <TextField
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Enter driver name"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Phone Number
                </Typography>
                <TextField
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(sanitizePhoneInput(e.target.value))}
                  placeholder="Enter phone number"
                  fullWidth
                  size="small"
                  error={Boolean(errors.driverPhone)}
                  helperText={errors.driverPhone || PHONE_FIELD_HELPER_TEXT}
                  inputProps={{ maxLength: CONTACT_PHONE_MAX_LENGTH }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  License Number
                </Typography>
                <TextField
                  value={driverLicense}
                  onChange={(e) => setDriverLicense(e.target.value)}
                  placeholder="Enter license number"
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  LR No
                </Typography>
                <TextField
                  value={lrNo}
                  onChange={(e) => setLrNo(e.target.value)}
                  placeholder="Enter LR number"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Stock Insurance <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <TextField
                  select
                  value={stockInsurance}
                  onChange={(e) => setStockInsurance(e.target.value)}
                  fullWidth
                  size="small"
                  error={Boolean(errors.stockInsurance)}
                  helperText={errors.stockInsurance}
                >
                  <MenuItem value="">Select option</MenuItem>
                  <MenuItem value="YES">YES</MenuItem>
                  <MenuItem value="NO">NO</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* Available Orders */}
            {location && (
              <>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  Available Orders
                </Typography>

                {route && selectedCustomer && (
                  <Box sx={{ mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={includeOtherCustomers}
                          onChange={(e) => setIncludeOtherCustomers(e.target.checked)}
                          size="small"
                        />
                      }
                      label="Load pending orders from other customers in this route as well"
                    />
                  </Box>
                )}
                
                {!route && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="error" sx={{ fontStyle: 'italic' }}>
                      Select route and filters to load available orders
                    </Typography>
                  </Box>
                )}
                <TableContainer component={Paper} sx={{ mb: 4, height: 400, overflowX: 'auto', overflowY: 'auto' }}>
                  <Table size="small" stickyHeader sx={{ minWidth: 'max-content' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox" sx={{ whiteSpace: 'nowrap', minWidth: 60 }}>Select</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 100 }}>Order Date</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 130 }}>Order Number</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 150 }}>Customer</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 100 }}>Product Code</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 200 }}>Product Name</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 150 }}>Company</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 250 }}>Location</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', minWidth: 100 }}>Remaining Qty</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', minWidth: 100 }}>Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {isLoadingOrders ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            <CircularProgress size={24} />
                          </TableCell>
                        </TableRow>
                      ) : (
                        availableOrders.flatMap((order) =>
                          (order.items || []).map((item) => (
                            <TableRow key={`${order.id}-${item.id}`}>
                              <TableCell padding="checkbox" sx={{ whiteSpace: 'nowrap' }}>
                                <Checkbox
                                  checked={selectedItems.has(`${order.id}-${item.id}`)}
                                  onChange={(e) => handleItemSelection(order.id, item.id, e.target.checked)}
                                />
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(order.order_date).toLocaleDateString('en-GB').replace(/\//g, '-')}</TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>{order.order_number}</TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>{order.customer_name}</TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>{(item as any).code}</TableCell>
                               <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium" sx={{ whiteSpace: 'nowrap' }}>{item.item_name}</Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{item.item_code}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.company_name || '-'}</TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                {[order.shipping_area_name, order.shipping_city_name, order.shipping_state_name]
                                  .filter(Boolean)
                                  .join(', ')}
                              </TableCell>
                              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatNumber(item.remaining_quantity)}</TableCell>
                              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>₹{(item.remaining_quantity * item.unit_price).toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}


            {items.length > 0 && (
              <>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  Selected Orders ({items.length})
                </Typography>
                
                {/* Display Mode Toggle for Selected Orders */}
                <TableContainer component={Paper} sx={{ height: 300, overflowX: 'auto', overflowY: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 'max-content' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 60 }}>S.No</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 100 }}>Order Date</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 130 }}>Order Number</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 150 }}>Customer</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 100 }}>Product Code</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 200 }}>Product Name</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 150 }}>Company</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', minWidth: 100 }}>Ordered Qty</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', minWidth: 100 }}>Dispatch Qty</TableCell>
                        <TableCell align="center" sx={{ whiteSpace: 'nowrap', minWidth: 100 }}>Loading Seq</TableCell>
                        <TableCell align="center" sx={{ whiteSpace: 'nowrap', minWidth: 100 }}>Unloading Seq</TableCell>
                        <TableCell align="center" sx={{ whiteSpace: 'nowrap', minWidth: 80 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, index) => {
                        const order = ordersLookup.get(item.sales_order) || allLoadedOrders.find(o => o.id === item.sales_order);
                        const orderItem = order?.items?.find(i => i.id === item.sales_order_item)
                          || availableOrders.find(o => o.id === item.sales_order)?.items?.find(i => i.id === item.sales_order_item)
                          || ordersData?.results?.find(o => o.id === item.sales_order)?.items?.find(i => i.id === item.sales_order_item);
                        return (
                          <TableRow key={`${item.sales_order}-${item.sales_order_item || index}`}>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{index + 1}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{order ? new Date(order.order_date).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{order?.order_number}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{order?.customer_name}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{orderItem?.item_code || '-'}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{orderItem?.item_name || (item.sales_order_item ? 'Item Not Found' : 'Full Order')}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{orderItem?.company_name || '-'}</TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{item.quantity_ordered}</TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                              <TextField
                                type="number"
                                value={item.quantity_dispatched}
                                onChange={(e) => updateItemQuantity(item.sales_order, item.sales_order_item, Number(e.target.value))}
                                size="small"
                                sx={{ 
                                  width: 80,
                                  '& input[type=number]': { MozAppearance: 'textfield' },
                                  '& input[type=number]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                                  '& input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                                }}
                                inputProps={{ min: 1, max: item.quantity_ordered }}
                                error={Boolean(errors[`quantity_${index}`])}
                                helperText={errors[`quantity_${index}`]}
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                              <TextField
                                type="number"
                                value={item.loading_sequence}
                                onChange={(e) => updateItemSequence(item.sales_order, 'loading_sequence', Number(e.target.value))}
                                size="small"
                                sx={{ 
                                  width: 60,
                                  '& input[type=number]': { MozAppearance: 'textfield' },
                                  '& input[type=number]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                                  '& input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                                }}
                                inputProps={{ min: 1 }}
                                error={Boolean(errors[`loading_seq_${index}`])}
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                              <TextField
                                type="number"
                                value={item.unloading_sequence || item.delivery_sequence}
                                onChange={(e) => updateItemSequence(item.sales_order, 'unloading_sequence', Number(e.target.value))}
                                size="small"
                                sx={{ 
                                  width: 60,
                                  '& input[type=number]': { MozAppearance: 'textfield' },
                                  '& input[type=number]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                                  '& input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                                }}
                                inputProps={{ min: 1 }}
                                error={Boolean(errors[`unloading_seq_${index}`])}
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                              <IconButton
                                size="small"
                                onClick={() => removeItem(item.sales_order, item.sales_order_item)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* Remarks */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Additional Information
              </Typography>
              <TextField
                label="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                multiline
                rows={3}
                fullWidth
                size="small"
              />
            </Box>
          </Paper>
          )}

          {activeTab === 1 && (
          <Paper sx={{ p: 3, borderRadius: 0 }}>
            {Object.keys(errors).length > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                There are validation errors in Dispatch Details. Please fix them before submitting.
              </Alert>
            )}
            {/* Attachments Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Attachments
            </Typography>
              {uploadingAttachment && (
                <Box sx={{ mb: 2 }}>
                  <Alert severity="info">Uploading attachment...</Alert>
                </Box>
              )}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                {renderAttachmentSection('VEHICLE_RC', 'Vehicle RC')}
                {renderAttachmentSection('VEHICLE_INSURANCE', 'Vehicle Insurance')}
                {renderAttachmentSection('VEHICLE_PERMIT', 'Vehicle Permit')}
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                {renderAttachmentSection('VEHICLE_POLLUTION', 'Vehicle Pollution Certificate')}
                {renderAttachmentSection('DRIVER_LICENSE', 'Driver License')}
              </Box>
              {renderAttachmentSection('OTHER', 'Other Documents', true)}
          </Paper>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default DispatchPlanForm;

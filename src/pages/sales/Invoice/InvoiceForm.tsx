import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Save as SaveIcon,
  LocalShipping as DispatchIcon,
  ShoppingCart as OrderIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
  Receipt as ReceiptIcon,
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
import { invoiceApi } from '../../../api/invoice.api';
import type { DropdownOption } from '../../../types/common.types';
import type { SalesOrderForInvoice } from '../../../types/invoice.types';
import apiClient from '../../../api/axios.config';
import { useAppSelector } from '../../../store/hooks';

const InvoiceForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  usePageTitle(isEditMode ? 'Edit Invoice' : 'Create Invoice');
  const { success: toastSuccess, error: toastError } = useToast();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const currentUser = useAppSelector((state) => state.auth.user);

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Dayjs>(dayjs());
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [company, setCompany] = useState<DropdownOption | null>(null);
  const [location, setLocation] = useState<DropdownOption | null>(null);
  const [customerType, setCustomerType] = useState<'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST' | null>(null);
  const [customer, setCustomer] = useState<DropdownOption | null>(null);
  const [sourceType, setSourceType] = useState<'DISPATCH' | 'ORDER'>('DISPATCH');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [creditDays, setCreditDays] = useState<number>(0);
  const [creditLimit, setCreditLimit] = useState<number>(0);

  // // Load companies and auto-select if single
  // const { data: companiesData } = useQuery({
  //   queryKey: ['companies'],
  //   queryFn: () => apiClient.get('/api/usermanagement/dropdowns/companies/').then(res => res.data),
  // });

  // useEffect(() => {
  //   const companies = companiesData?.results || companiesData;
  //   if (Array.isArray(companies) && companies.length === 1 && !company) {
  //     setCompany({ id: companies[0].id, name: companies[0].name });
  //   }
  // }, [companiesData, company]);

  // // Load locations and auto-select if single
  // const { data: locationsData } = useQuery({
  //   queryKey: ['locations'],
  //   queryFn: () => apiClient.get('/api/usermanagement/dropdowns/locations/').then(res => res.data),
  // });

  // useEffect(() => {
  //   const locations = locationsData?.results || locationsData;
  //   if (Array.isArray(locations) && locations.length === 1 && !location) {
  //     setLocation({ id: locations[0].id, name: locations[0].name });
  //   }
  // }, [locationsData, location]);

  // Load existing invoice data in edit mode
  const { data: existingInvoice, isLoading: isLoadingInvoice } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceApi.getById(id!),
    enabled: isEditMode,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingInvoice && isEditMode) {
      // setInvoiceNumber(existingInvoice.invoice_number);
      setInvoiceDate(dayjs(existingInvoice.invoice_date));
      setDueDate(dayjs(existingInvoice.due_date));
      // setCompany({ id: existingInvoice.company, name: existingInvoice.company_name || '' });
      // setLocation({ id: existingInvoice.location, name: existingInvoice.location_name || '' });
      setSourceType(existingInvoice.source_type);
      setRemarks(existingInvoice.remarks || '');
      setSelectedOrder(existingInvoice.sales_order);
      
      // Set customer type and customer from sales order
      if (existingInvoice.customer_type) {
        setCustomerType(existingInvoice.customer_type);
      }
      if (existingInvoice.customer_id && existingInvoice.customer_name) {
        setCustomer({ id: existingInvoice.customer_id, name: existingInvoice.customer_name });
      }
    }
  }, [existingInvoice, isEditMode]);

  // Load channel config
  const { data: channelConfig } = useQuery({
    queryKey: ['channelConfig'],
    queryFn: () => apiClient.get('/api/masters/channel-config/').then(res => res.data),
  });

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Sales', path: '/sales', icon: <FolderIcon fontSize="small" /> },
      { label: 'Invoice', path: '/sales/invoice', icon: <ReceiptIcon fontSize="small" /> },
      { label: isEditMode ? 'Edit Invoice' : 'Create Invoice' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode]);

  // // Generate invoice number when location changes (only in create mode)
  // useEffect(() => {
  //   const generateInvoiceNumber = async () => {
  //     if (location && !isEditMode) {
  //       try {
  //         const data = await invoiceApi.generateInvoiceNumber(String(location.id));
  //         setInvoiceNumber(data.invoice_number);
  //       } catch (error) {
  //       }
  //     }
  //   };
  //   generateInvoiceNumber();
  // }, [location, isEditMode]);

  // Load available orders (both DISPATCH and ORDER types use same endpoint) - only in create mode
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['availableOrders', customer?.id, sourceType],
    queryFn: () => invoiceApi.getAvailableOrders({ 
      customer: customer?.id,
      customer_type: customerType,
      source_type: sourceType
    }),
    enabled: Boolean(customer?.id) && !isEditMode,
  });

  const availableOrders = ordersData?.results || [];

  // Get selected order details with items
  const { data: selectedOrderDetails } = useQuery({
    queryKey: ['orderDetails', selectedOrder, sourceType, isEditMode],
    queryFn: () => {
      if (isEditMode) {
        // In edit mode, use existing invoice items
        return existingInvoice;
      }
      return invoiceApi.getAvailableOrders({ 
        customer: customer?.id,
        customer_type: customerType,
        source_type: sourceType
      }).then(res => res.results?.find((o: any) => o.id === selectedOrder));
    },
    enabled: Boolean(selectedOrder),
  });

  // Fetch customer details when customer is selected
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (customer && customerType) {
        try {
          const endpoint = 
            customerType === 'RETAILER' ? `/api/masters/retailers/${customer.id}/` :
            customerType === 'DISTRIBUTOR' ? `/api/masters/distributors/${customer.id}/` :
            customerType === 'SUPERSTOCKIST' ? `/api/masters/superstockists/${customer.id}/` : null;
          
          if (endpoint) {
            const response = await apiClient.get(endpoint);
            setCreditDays(response.data.credit_days || 0);
            setCreditLimit(response.data.credit_limit || 0);
          }
        } catch (error) {
          setCreditDays(0);
          setCreditLimit(0);
        }
      } else {
        setCreditDays(0);
        setCreditLimit(0);
      }
    };
    fetchCustomerDetails();
  }, [customer, customerType]);

  // Auto-calculate due date when invoice date or credit days change
  useEffect(() => {
    if (invoiceDate && creditDays && !isEditMode) {
      const calculatedDueDate = invoiceDate.add(creditDays, 'day');
      setDueDate(calculatedDueDate);
    }
  }, [invoiceDate, creditDays, isEditMode]);

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
    }
    // For retailer users
    else if (userType === 'RETAILER' && currentUser.retailer && currentUser.retailer_name) {
      setCustomerType('RETAILER');
      setCustomer({
        id: currentUser.retailer_name.id,
        name: currentUser.retailer_name.name,
      });
    }
  }, [isEditMode, currentUser]);

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditMode) {
        return invoiceApi.update(id!, data);
      }
      if (sourceType === 'DISPATCH') {
        return invoiceApi.generateFromDispatch(data);
      }
      return invoiceApi.generateFromOrder(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Invalidate pending sales orders and pending invoices to auto-refresh
      queryClient.invalidateQueries({ queryKey: ['pendingSalesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['pendingInvoices'] });
      toastSuccess(isEditMode ? 'Invoice updated successfully' : 'Invoice created successfully');
      navigate('/sales/invoice');
    },
    onError: (error: any) => {
      const data = error.response?.data;
      let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} invoice`;
      if (data) {
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.sales_order || data.non_field_errors) {
          const fieldErrors = data.sales_order || data.non_field_errors;
          errorMessage = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
        }
      }
      // Improve message for draft invoice already exists
      if (errorMessage.toLowerCase().includes('draft') || errorMessage.toLowerCase().includes('already')) {
        errorMessage = `A draft invoice already exists for the selected sales order. Please edit the existing draft instead of creating a new one.`;
      }
      toastError(errorMessage);
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!invoiceDate) newErrors.invoiceDate = 'Invoice date is required';
    // if (!company) newErrors.company = 'Company is required';
    // if (!location) newErrors.location = 'Location is required';
    if (!customer) newErrors.customer = 'Customer is required';
    if (!selectedOrder) {
      newErrors.source = 'Please select a sales order';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (isDraft: boolean = false) => {
    if (!validate()) return;

    const formData = {
      // invoice_number: invoiceNumber,
      invoice_date: invoiceDate.format('YYYY-MM-DD'),
      due_date: dueDate?.format('YYYY-MM-DD'),
      // company: company!.id,
      // location: location!.id,
      remarks,
      sales_order: selectedOrder,
      status: isDraft ? 'DRAFT' : 'CONFIRMED',
    };

    mutation.mutate(formData);
  };

  const handleBack = () => {
    navigate('/sales/invoice');
  };

  // Determine if customer type should be disabled
  const isCustomerTypeDisabled = () => {
    if (isEditMode) return true;
    if (!currentUser) return false;
    
    const userType = currentUser.channel_partner_type;
    if (userType === 'RETAILER') return true;
    if (userType === 'DISTRIBUTOR') return false;
    // STAFF users can change freely
    return false;
  };

  // Get available customer types based on user
  const getAvailableCustomerTypes = () => {
    if (isEditMode) return [];
    
    const allTypes = [];
    if (channelConfig?.enable_retailer) allTypes.push('RETAILER');
    if (channelConfig?.enable_distributor) allTypes.push('DISTRIBUTOR');
    if (channelConfig?.enable_superstockist) allTypes.push('SUPERSTOCKIST');
    
    if (!currentUser) return allTypes;
    
    const userType = currentUser.channel_partner_type;
    if (userType === 'RETAILER') return ['RETAILER'];
    if (userType === 'DISTRIBUTOR') return allTypes.filter(t => t === 'DISTRIBUTOR' || t === 'RETAILER');
    // STAFF users see all enabled types
    return allTypes;
  };

  // Determine if customer dropdown should be disabled
  const isCustomerDisabled = () => {
    if (isEditMode) return true;
    if (!customerType) return true;
    if (!currentUser) return false;
    
    const userType = currentUser.channel_partner_type;
    if (userType === 'RETAILER') return true;
    if (userType === 'DISTRIBUTOR' && customerType === 'DISTRIBUTOR') return true;
    // STAFF users can change freely
    return false;
  };

  // Get customer API endpoint with filtering
  const getCustomerApiEndpoint = () => {
    if (customerType && !isEditMode) {
      return `/api/invoice/invoices/available-customers/?customer_type=${customerType}&source_type=${sourceType}`;
    }
    if (customerType === 'RETAILER') return '/api/masters/retailers/mini/';
    if (customerType === 'DISTRIBUTOR') return '/api/masters/distributors/mini/';
    if (customerType === 'SUPERSTOCKIST') return '/api/masters/superstockists/mini/';
    return '';
  };

  // Get additional filters for customer dropdown
  const getCustomerAdditionalFilters = () => {
    // Don't pass additional filters when using available-customers endpoint
    if (!isEditMode && customerType) {
      return undefined;
    }
    if (!isEditMode && currentUser?.channel_partner_type === 'DISTRIBUTOR' && 
        customerType === 'RETAILER' && currentUser.distributor) {
      return { distributor: currentUser.distributor };
    }
    return undefined;
  };

  // Handle customer type change with auto-selection
  const handleCustomerTypeChange = async (value: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST' | null) => {
    setCustomerType(value);
    setCustomer(null);
    setSelectedOrder(null);
    
    // Auto-select for channel partner users when switching back to their type
    if (currentUser && !isEditMode) {
      const userType = currentUser.channel_partner_type;
      
      if (value === 'DISTRIBUTOR' && userType === 'DISTRIBUTOR' && currentUser.distributor && currentUser.distributor_name) {
        const customerData = {
          id: currentUser.distributor_name.id,
          name: currentUser.distributor_name.name,
        };
        setTimeout(async () => {
          setCustomer(customerData);
          try {
            const response = await apiClient.get(`/api/masters/distributors/${customerData.id}/`);
            setCreditDays(response.data.credit_days || 0);
            setCreditLimit(response.data.credit_limit || 0);
          } catch (error) {
          }
        }, 0);
      } else if (value === 'RETAILER' && userType === 'RETAILER' && currentUser.retailer && currentUser.retailer_name) {
        const customerData = {
          id: currentUser.retailer_name.id,
          name: currentUser.retailer_name.name,
        };
        setTimeout(async () => {
          setCustomer(customerData);
          try {
            const response = await apiClient.get(`/api/masters/retailers/${customerData.id}/`);
            setCreditDays(response.data.credit_days || 0);
            setCreditLimit(response.data.credit_limit || 0);
          } catch (error) {
          }
        }, 0);
      }
    }
  };

  const filteredCustomerTypes = getAvailableCustomerTypes();
  const customerTypeOptions: DropdownOption[] = (
    isEditMode && customerType ? [customerType] : filteredCustomerTypes
  ).map((type) => ({
    id: type,
    name: type === 'RETAILER' ? 'Retailer' : type === 'DISTRIBUTOR' ? 'Distributor' : 'Superstockist',
  }));
  const customerApiEndpoint = getCustomerApiEndpoint();
  const customerAdditionalFilters = getCustomerAdditionalFilters();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={getPageContainerStyles()}>
        <Box sx={getHeaderSectionStyles()}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <ScreenHeader
              title={isEditMode ? 'Edit Invoice' : 'Create Invoice'}
              showBackButton
              onBack={handleBack}
              disableBox
            />
            
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
              {(!isEditMode || existingInvoice?.status === 'DRAFT') && (
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
                {mutation.isPending ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Invoice' : 'Create Invoice')}
              </Button>
            </Box>
          </Box>
        </Box>

        <Box sx={getContentSectionStyles()}>
          <Paper sx={{ p: 3, borderRadius: 0 }}>
            {mutation.isError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {mutation.error instanceof Error ? mutation.error.message : 'Failed to create invoice'}
              </Alert>
            )}

            {Object.keys(errors).length > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Please fix the errors before submitting
              </Alert>
            )}

            {/* Invoice Header */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Invoice Information
            </Typography>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              {/* <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  Company <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <SearchableDropdown
                  value={company}
                  onChange={(option) => {
                    setCompany(Array.isArray(option) ? option[0] || null : option);
                    setSelectedOrder(null);
                  }}
                  apiEndpoint="/api/usermanagement/dropdowns/companies/"
                  label=""
                  placeholder="Select Company"
                  error={Boolean(errors.company)}
                  helperText={errors.company}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  Location <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <SearchableDropdown
                  value={location}
                  onChange={(option) => {
                    setLocation(Array.isArray(option) ? option[0] || null : option);
                    setSelectedOrder(null);
                  }}
                  apiEndpoint="/api/usermanagement/dropdowns/locations/"
                  additionalFilters={company ? { company: company.id } : undefined}
                  disabled={!company}
                  label=""
                  placeholder={company ? "Select Location" : "Select company first"}
                  error={Boolean(errors.location)}
                  helperText={errors.location}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  Invoice Number
                </Typography>
                <TextField
                  value={invoiceNumber || 'Select location first'}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.100' } }}
                />
              </Grid> */}
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  Invoice Date <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <DatePicker
                  value={invoiceDate}
                  onChange={(date) => { const d = toDayjs(date); if (d) setInvoiceDate(d); }}
                  format="DD-MM-YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      error: Boolean(errors.invoiceDate),
                      helperText: errors.invoiceDate,
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  Source Type <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <TextField
                  select
                  value={sourceType}
                  onChange={(e) => {
                    setSourceType(e.target.value as 'DISPATCH' | 'ORDER');
                    setSelectedOrder(null);
                  }}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="DISPATCH">Dispatch</MenuItem>
                  <MenuItem value="ORDER">Order</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  Customer Type <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <SearchableDropdown
                  value={customerType ? customerTypeOptions.find((opt) => opt.id === customerType) || null : null}
                  onChange={(option) => {
                    const selected = Array.isArray(option) ? option[0] || null : option;
                    handleCustomerTypeChange((selected?.id as any) || null);
                  }}
                  apiEndpoint=""
                  staticOptions={customerTypeOptions}
                  label=""
                  placeholder="Select Customer Type"
                  disabled={isCustomerTypeDisabled()}
                  error={Boolean(errors.customerType)}
                  helperText={errors.customerType || (isCustomerTypeDisabled() && currentUser?.channel_partner_type === 'RETAILER' ? 'Customer type is fixed for retailer users' : '')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  Customer <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <SearchableDropdown
                  value={customer}
                  onChange={(option) => {
                    setCustomer(Array.isArray(option) ? option[0] || null : option);
                    setSelectedOrder(null);
                  }}
                  apiEndpoint={customerApiEndpoint}
                  additionalFilters={customerAdditionalFilters}
                  label=""
                  placeholder="Select Customer"
                  disabled={!customerType || isCustomerDisabled()}
                  error={Boolean(errors.customer)}
                  helperText={errors.customer || (isCustomerDisabled() && currentUser?.channel_partner_type === 'RETAILER' ? 'Customer is fixed for retailer users' : isCustomerDisabled() && currentUser?.channel_partner_type === 'DISTRIBUTOR' && customerType === 'DISTRIBUTOR' ? 'Logged-in distributor is auto-selected' : '')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  Tax Type
                </Typography>
                <TextField
                  value={isEditMode && existingInvoice?.tax_type ? existingInvoice.tax_type : (selectedOrderDetails?.tax_type || '')}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.100' } }}
                  placeholder="-"
                />
              </Grid>
              {customer && (
                <>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                      Credit Days
                    </Typography>
                    <TextField
                      value={creditDays || ''}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                      sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.100' } }}
                      placeholder="-"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                      Credit Limit
                    </Typography>
                    <TextField
                      value={creditLimit ? `₹${Number(creditLimit).toFixed(2)}` : ''}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                      sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.100' } }}
                      placeholder="-"
                    />
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  Due Date <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <DatePicker
                  value={dueDate}
                  onChange={(date) => { const d = toDayjs(date); if (d) setDueDate(d); }}
                  format="DD-MM-YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      error: Boolean(errors.dueDate),
                      helperText: errors.dueDate,
                    },
                  }}
                />
              </Grid>
            </Grid>

            {/* Billing & Shipping Address */}
            {selectedOrderDetails && (
              <>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  Address Information
                </Typography>
                <Grid container spacing={2.5} sx={{ mb: 4 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                      Billing Address
                    </Typography>
                    <TextField
                      value={selectedOrderDetails.billing_address || '-'}
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      InputProps={{ readOnly: true }}
                      sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.100' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                      Shipping Address
                    </Typography>
                    <TextField
                      value={selectedOrderDetails.shipping_address || '-'}
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      InputProps={{ readOnly: true }}
                      sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.100' } }}
                    />
                  </Grid>
                </Grid>
              </>
            )}

            {/* Source Selection - Only show in create mode */}
            {customer && !isEditMode && (
              <>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  Select Sales Order
                </Typography>

                {errors.source && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.source}
                  </Alert>
                )}

                <TableContainer component={Paper} sx={{ mb: 4, maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox" sx={{ width: 60, verticalAlign: 'middle' }}>Select</TableCell>
                        <TableCell sx={{ minWidth: 120, verticalAlign: 'middle' }}>Order Date</TableCell>
                        <TableCell sx={{ minWidth: 140, verticalAlign: 'middle' }}>Order Number</TableCell>
                        {sourceType === 'DISPATCH' && (
                          <TableCell sx={{ minWidth: 140, verticalAlign: 'middle' }}>Dispatch Number</TableCell>
                        )}
                        <TableCell sx={{ minWidth: 180, verticalAlign: 'middle' }}>Customer</TableCell>
                        <TableCell sx={{ minWidth: 120, verticalAlign: 'middle' }}>Customer Type</TableCell>
                        <TableCell align="right" sx={{ minWidth: 110, verticalAlign: 'middle' }}>Quantity</TableCell>
                        <TableCell align="right" sx={{ minWidth: 130, verticalAlign: 'middle' }}>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {isLoadingOrders ? (
                        <TableRow>
                          <TableCell colSpan={sourceType === 'DISPATCH' ? 8 : 7} align="center" sx={{ verticalAlign: 'middle' }}>
                            <CircularProgress size={24} />
                          </TableCell>
                        </TableRow>
                      ) : availableOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={sourceType === 'DISPATCH' ? 8 : 7} align="center" sx={{ verticalAlign: 'middle' }}>
                            <Typography variant="body2" color="text.secondary">
                              No sales orders available for invoicing
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        availableOrders.map((order: SalesOrderForInvoice) => (
                          <TableRow
                            key={order.id}
                            hover
                            onClick={() => setSelectedOrder(order.id)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell padding="checkbox" sx={{ verticalAlign: 'middle' }}>
                              <Radio
                                checked={selectedOrder === order.id}
                                onChange={() => setSelectedOrder(order.id)}
                              />
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'middle' }}>{new Date(order.order_date).toLocaleDateString('en-GB').replace(/\//g, '-')}</TableCell>
                            <TableCell sx={{ verticalAlign: 'middle' }}>{order.order_number}</TableCell>
                            {sourceType === 'DISPATCH' && (
                              <TableCell sx={{ verticalAlign: 'middle' }}>{Array.isArray(order.dispatch_number) ? order.dispatch_number.join(', ') : order.dispatch_number || '-'}</TableCell>
                            )}
                            <TableCell sx={{ verticalAlign: 'middle' }}>{order.customer_name}</TableCell>
                            <TableCell sx={{ verticalAlign: 'middle' }}>{order.customer_type}</TableCell>
                            <TableCell align="right" sx={{ verticalAlign: 'middle' }}>{order.total_quantity}</TableCell>
                            <TableCell align="right" sx={{ verticalAlign: 'middle' }}>₹{Number(order.grand_total).toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* Selected Items Display */}
            {selectedOrderDetails && (
              <>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  Items to be Invoiced
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#006766' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 600, verticalAlign: 'middle' }}>S.No</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, verticalAlign: 'middle' }}>Category</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, verticalAlign: 'middle' }}>Item Code</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, verticalAlign: 'middle' }}>Item Name</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, verticalAlign: 'middle' }}>HSN Code</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, verticalAlign: 'middle' }}>Unit</TableCell>
                        {sourceType === 'DISPATCH' && !isEditMode && (
                          <TableCell align="right" sx={{ color: 'white', fontWeight: 600, verticalAlign: 'middle' }}>Ordered Qty</TableCell>
                        )}
                        <TableCell align="right" sx={{ color: 'white', fontWeight: 600, verticalAlign: 'middle' }}>
                          {sourceType === 'DISPATCH' && !isEditMode ? 'Dispatched Qty' : 'Quantity'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'white', fontWeight: 600, verticalAlign: 'middle' }}>Rate</TableCell>
                        <TableCell align="right" sx={{ color: 'white', fontWeight: 600, verticalAlign: 'middle' }}>Discount</TableCell>
                        <TableCell align="right" sx={{ color: 'white', fontWeight: 600, verticalAlign: 'middle' }}>Taxable Amt</TableCell>
                        <TableCell align="right" sx={{ color: 'white', fontWeight: 600, verticalAlign: 'middle' }}>Tax Rate</TableCell>
                        <TableCell align="right" sx={{ color: 'white', fontWeight: 600, verticalAlign: 'middle' }}>Tax Amt</TableCell>
                        <TableCell align="right" sx={{ color: 'white', fontWeight: 600, verticalAlign: 'middle' }}>Line Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrderDetails?.items?.map((item: any, index: number) => {
                        const taxRate = Number(item.cgst_rate || 0) + Number(item.sgst_rate || 0) + Number(item.igst_rate || 0);
                        return (
                          <TableRow key={index}>
                            <TableCell sx={{ verticalAlign: 'middle' }}>{index + 1}</TableCell>
                            <TableCell sx={{ verticalAlign: 'middle' }}>{item.category_name || '-'}</TableCell>
                            <TableCell sx={{ verticalAlign: 'middle' }}>{item.item_code}</TableCell>
                            <TableCell sx={{ verticalAlign: 'middle' }}>{item.item_name}</TableCell>
                            <TableCell sx={{ verticalAlign: 'middle' }}>{item.hsn_code || '-'}</TableCell>
                            <TableCell sx={{ verticalAlign: 'middle' }}>{item.unit_name || '-'}</TableCell>
                            {sourceType === 'DISPATCH' && !isEditMode && (
                              <TableCell align="right" sx={{ verticalAlign: 'middle' }}>{Number(item.quantity).toFixed(2)}</TableCell>
                            )}
                            <TableCell align="right" sx={{ verticalAlign: 'middle' }}>
                              {Number(sourceType === 'DISPATCH' && !isEditMode ? item.dispatched_quantity : item.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell align="right" sx={{ verticalAlign: 'middle' }}>₹{Number(item.rate || 0).toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ verticalAlign: 'middle' }}>₹{Number(item.discount_amount || 0).toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ verticalAlign: 'middle' }}>₹{Number(item.taxable_amount || 0).toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ verticalAlign: 'middle' }}>{taxRate.toFixed(2)}%</TableCell>
                            <TableCell align="right" sx={{ verticalAlign: 'middle' }}>₹{Number(item.tax_amount || 0).toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, verticalAlign: 'middle' }}>₹{Number(item.line_total || 0).toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Order Summary */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
                  <Box sx={{ minWidth: 300 }}>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Subtotal</TableCell>
                          <TableCell align="right">
                            ₹{selectedOrderDetails?.items?.reduce((sum: number, item: any) => sum + Number(item.taxable_amount || 0), 0).toFixed(2) || '0.00'}
                          </TableCell>
                        </TableRow>
                        {selectedOrderDetails?.items?.some((item: any) => Number(item.cgst_amount || 0) > 0) && (
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>CGST</TableCell>
                            <TableCell align="right">
                              ₹{selectedOrderDetails?.items?.reduce((sum: number, item: any) => sum + Number(item.cgst_amount || 0), 0).toFixed(2) || '0.00'}
                            </TableCell>
                          </TableRow>
                        )}
                        {selectedOrderDetails?.items?.some((item: any) => Number(item.sgst_amount || 0) > 0) && (
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>SGST</TableCell>
                            <TableCell align="right">
                              ₹{selectedOrderDetails?.items?.reduce((sum: number, item: any) => sum + Number(item.sgst_amount || 0), 0).toFixed(2) || '0.00'}
                            </TableCell>
                          </TableRow>
                        )}
                        {selectedOrderDetails?.items?.some((item: any) => Number(item.igst_amount || 0) > 0) && (
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>IGST</TableCell>
                            <TableCell align="right">
                              ₹{selectedOrderDetails?.items?.reduce((sum: number, item: any) => sum + Number(item.igst_amount || 0), 0).toFixed(2) || '0.00'}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Tax Amount</TableCell>
                          <TableCell align="right">
                            ₹{selectedOrderDetails?.items?.reduce((sum: number, item: any) => sum + Number(item.tax_amount || 0), 0).toFixed(2) || '0.00'}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5' }}>Grand Total</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#006766' }}>
                            ₹{selectedOrderDetails?.items?.reduce((sum: number, item: any) => sum + Number(item.line_total || 0), 0).toFixed(2) || '0.00'}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              </>
            )}

            {/* Remarks */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Additional Information
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
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
            </Grid>
          </Paper>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default InvoiceForm;

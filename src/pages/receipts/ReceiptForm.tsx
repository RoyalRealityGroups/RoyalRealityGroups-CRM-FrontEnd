import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Paper, Button, Typography, TextField, MenuItem, Grid, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Save as SaveIcon, Home as HomeIcon, Folder as FolderIcon, Receipt as ReceiptIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { toDayjs } from '../../utils/format';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import ScreenHeader from '../../components/common/ScreenHeader';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { getPageContainerStyles, getHeaderSectionStyles, getContentSectionStyles } from '../../utils/spacing';
import { receiptApi } from '../../api/receipt.api';
import type { DropdownOption } from '../../types/common.types';
import type { PendingInvoice } from '../../types/receipt.types';
import apiClient from '../../api/axios.config';
import { channelConfigApi } from '../../api/masters.api';
import { useAppSelector } from '../../store/hooks';

const ReceiptForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  usePageTitle(isEditMode ? 'Edit Receipt' : 'Create Receipt');
  const { success: toastSuccess, error: toastError } = useToast();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const currentUser = useAppSelector((state) => state.auth.user);

  const [receiptDate, setReceiptDate] = useState<Dayjs>(dayjs());
  const [paymentDate, setPaymentDate] = useState<Dayjs>(dayjs());
  const [paymentMode, setPaymentMode] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [company, setCompany] = useState<DropdownOption | null>(null);
  const [location, setLocation] = useState<DropdownOption | null>(null);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [customerType, setCustomerType] = useState<'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST' | null>(null);
  const [customer, setCustomer] = useState<DropdownOption | null>(null);
  const [customerCreditBalance, setCustomerCreditBalance] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [allocations, setAllocations] = useState<{ invoice: string; allocated_amount: string; selected: boolean }[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [creditToUse, setCreditToUse] = useState<string>('');
  const [useCreditChecked, setUseCreditChecked] = useState(false);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);
  const [allocationsLoaded, setAllocationsLoaded] = useState(false);
  const [originalCreditUsed, setOriginalCreditUsed] = useState<number>(0);
  const [originalAuthorizedStatus, setOriginalAuthorizedStatus] = useState<number | null>(null);
  const { data: channelConfig, isLoading: isChannelConfigLoading, isError: isChannelConfigError } = useQuery({
    queryKey: ['channelConfig'],
    queryFn: channelConfigApi.getChannelConfig,
  });

  // Load existing receipt data in edit mode
  useEffect(() => {
    const loadReceipt = async () => {
      if (!isEditMode || !id) return;
      
      setIsLoadingReceipt(true);
      try {
        const receipt = await receiptApi.getById(id);
        
        // Set basic fields
        setReceiptDate(dayjs(receipt.receipt_date));
        setPaymentDate(dayjs(receipt.payment_date));
        setPaymentMode(receipt.payment_mode);
        setReferenceNumber(receipt.reference_number || '');
        setBankName(receipt.bank_name || '');
        setTotalAmount(String(receipt.total_amount));
        setRemarks(receipt.remarks || '');
        setReceiptNumber(receipt.receipt_number);
        
        // Calculate original credit used from credit utilizations
        const creditUsedInReceipt = receipt.credit_utilizations?.reduce(
          (sum: number, util: any) => sum + Number(util.utilized_amount), 
          0
        ) || 0;
        setOriginalCreditUsed(creditUsedInReceipt);
        if (creditUsedInReceipt > 0) {
          setUseCreditChecked(true);
        }
        
        // Store original authorized status
        setOriginalAuthorizedStatus(receipt.authorized_status || 0);
        
        // Set company and location
        if (receipt.company) {
          setCompany({ id: String(receipt.company), name: receipt.company_name });
        }
        if (receipt.location) {
          setLocation({ id: String(receipt.location), name: receipt.location_name });
        }
        
        // Set customer
        setCustomerType(receipt.customer_type);
        if (receipt.customer_type === 'RETAILER' && receipt.retailer) {
          setCustomer({ id: String(receipt.retailer), name: receipt.customer_name });
        } else if (receipt.customer_type === 'DISTRIBUTOR' && receipt.distributor) {
          setCustomer({ id: String(receipt.distributor), name: receipt.customer_name });
        } else if (receipt.customer_type === 'SUPERSTOCKIST' && receipt.superstockist) {
          setCustomer({ id: String(receipt.superstockist), name: receipt.customer_name });
        }
        
      } catch (error) {
        toastError('Failed to load receipt data');
      } finally {
        setIsLoadingReceipt(false);
      }
    };
    
    loadReceipt();
  }, [isEditMode, id, toastError]);

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => apiClient.get('/api/usermanagement/dropdowns/companies/').then(res => res.data),
  });

  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiClient.get('/api/usermanagement/dropdowns/locations/').then(res => res.data),
  });

  useEffect(() => {
    const companies = companiesData?.results || companiesData;
    if (Array.isArray(companies) && companies.length === 1 && !company && !isEditMode) {
      setCompany({ id: companies[0].id, name: companies[0].name });
    }
  }, [companiesData, company, isEditMode]);

  useEffect(() => {
    const locations = locationsData?.results || locationsData;
    if (Array.isArray(locations) && locations.length === 1 && !location && !isEditMode) {
      setLocation({ id: locations[0].id, name: locations[0].name });
    }
  }, [locationsData, location, isEditMode]);

  // Generate receipt number when location changes (only in create mode)
  useEffect(() => {
    const generateNumber = async () => {
      if (location && !isEditMode && !receiptNumber) {
        try {
          const data = await receiptApi.generateReceiptNumber(String(location.id));
          setReceiptNumber(data.receipt_number);
        } catch (error) {
        }
      }
    };
    generateNumber();
  }, [location, isEditMode, receiptNumber]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Sales', path: '/sales', icon: <FolderIcon fontSize="small" /> },
      { label: 'Receipts', path: '/receipts', icon: <ReceiptIcon fontSize="small" /> },
      { label: isEditMode ? 'Edit Receipt' : 'Create Receipt' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode]);

  const { data: pendingInvoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['pendingInvoices', customerType, customer?.id, isEditMode, id],
    queryFn: async () => {
      const invoices = await receiptApi.getPendingInvoices(customerType!, customer!.id as string);
      
      // In edit mode, also fetch the receipt to get allocated invoices
      if (isEditMode && id) {
        const receipt = await receiptApi.getById(id);
        
        // Add allocated invoices that might not be in pending list
        const allocatedInvoices = receipt.allocations?.map((a: any) => ({
          id: a.invoice,
          invoice_number: a.invoice_number,
          invoice_date: a.invoice_date,
          grand_total: Number(a.invoice_amount),
          balance_amount: Number(a.invoice_balance) + Number(a.allocated_amount),
          paid_amount: 0
        })) || [];
        
        // Merge: use allocated invoices and add any new pending ones
        const mergedMap = new Map();
        allocatedInvoices.forEach(inv => mergedMap.set(inv.id, inv));
        invoices.forEach(inv => {
          if (!mergedMap.has(inv.id)) {
            mergedMap.set(inv.id, inv);
          }
        });
        
        return Array.from(mergedMap.values());
      }
      
      return invoices;
    },
    enabled: Boolean(customerType && customer?.id),
  });

  // Fetch customer credit balance
  useQuery({
    queryKey: ['customerCredit', customerType, customer?.id, receiptDate.format('YYYY-MM-DD'), id],
    queryFn: async () => {
      const data = await receiptApi.getCustomerCreditBalance(
        customerType!, 
        customer!.id as string,
        receiptDate.format('YYYY-MM-DD'),
        isEditMode ? id : undefined
      );
      // In edit mode, add back the credit that was used in this receipt
      const availableCredit = data.total_available + (isEditMode ? originalCreditUsed : 0);
      setCustomerCreditBalance(availableCredit);
      return data;
    },
    enabled: Boolean(customerType && customer?.id),
  });

  const { data: customerLedgerSummary, isLoading: customerLedgerSummaryLoading } = useQuery({
    queryKey: ['customerLedgerSummary', customerType, customer?.id, receiptDate.format('YYYY-MM-DD')],
    queryFn: () => receiptApi.getCustomerLedgerSummary(
      customerType!,
      customer!.id as string,
      undefined,
      receiptDate.format('YYYY-MM-DD'),
    ),
    enabled: Boolean(customerType && customer?.id),
  });

  const invoicesList = (Array.isArray(pendingInvoices) ? pendingInvoices : []).filter(
    (inv: any) => Number(inv.balance_amount || 0) > 0
  );

  useEffect(() => {
  }, [invoicesList.length, customer, customerType, receiptDate]);

  // Auto-select customer type and customer based on logged-in user
  useEffect(() => {
    if (isEditMode || !currentUser) return;

    const userType = currentUser.channel_partner_type;

    if (userType === 'DISTRIBUTOR' && currentUser.distributor && currentUser.distributor_name) {
      setCustomerType('DISTRIBUTOR');
      setCustomer({
        id: currentUser.distributor_name.id,
        name: currentUser.distributor_name.name,
      });
    } else if (userType === 'RETAILER' && currentUser.retailer && currentUser.retailer_name) {
      setCustomerType('RETAILER');
      setCustomer({
        id: currentUser.retailer_name.id,
        name: currentUser.retailer_name.name,
      });
    }
  }, [isEditMode, currentUser]);

  const availableCustomerTypes = channelConfig ? [
    channelConfig.enable_distributor && 'DISTRIBUTOR',
    channelConfig.enable_superstockist && 'SUPERSTOCKIST',
    channelConfig.enable_retailer && 'RETAILER',
  ].filter(Boolean) : ['DISTRIBUTOR', 'SUPERSTOCKIST', 'RETAILER'];

  const customerTypeDisabled = isChannelConfigLoading || availableCustomerTypes.length === 0;

  const isCustomerTypeDisabled = () => {
    if (isEditMode) return false;
    if (!currentUser) return customerTypeDisabled;

    const userType = currentUser.channel_partner_type;
    if (userType === 'RETAILER') return true;
    if (userType === 'DISTRIBUTOR') return false;
    return customerTypeDisabled;
  };

  const getAvailableCustomerTypes = () => {
    if (isEditMode) return availableCustomerTypes as ('RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST')[];
    if (!currentUser) return availableCustomerTypes as ('RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST')[];

    const userType = currentUser.channel_partner_type;
    if (userType === 'RETAILER') return ['RETAILER'];
    if (userType === 'DISTRIBUTOR') {
      return (availableCustomerTypes as ('RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST')[])
        .filter((type) => type === 'DISTRIBUTOR' || type === 'RETAILER');
    }
    return availableCustomerTypes as ('RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST')[];
  };

  const filteredCustomerTypes = getAvailableCustomerTypes();
  const customerTypeOptions: DropdownOption[] = filteredCustomerTypes.map((type) => ({
    id: type,
    name: type === 'RETAILER' ? 'Retailer' : type === 'DISTRIBUTOR' ? 'Distributor' : 'Superstockist',
  }));

  const getCustomerApiEndpoint = () => {
    if (customerType === 'RETAILER') return '/api/masters/retailers/mini/';
    if (customerType === 'DISTRIBUTOR') return '/api/masters/distributors/mini/';
    if (customerType === 'SUPERSTOCKIST') return '/api/masters/superstockists/mini/';
    return '/api/masters/channel-partners/mini/';
  };

  const getCustomerAdditionalFilters = () => {
    const filters: any = customerType ? { partner_type: customerType } : undefined;

    if (!isEditMode && currentUser?.channel_partner_type === 'DISTRIBUTOR'
      && customerType === 'RETAILER' && currentUser.distributor) {
      return {
        ...filters,
        distributor: currentUser.distributor,
      };
    }

    return filters;
  };

  const customerApiEndpoint = getCustomerApiEndpoint();
  const customerAdditionalFilters = getCustomerAdditionalFilters();

  const isCustomerDisabled = () => {
    if (isEditMode) return false;
    if (!customerType || customerTypeDisabled) return true;
    if (!currentUser) return false;

    const userType = currentUser.channel_partner_type;
    if (userType === 'RETAILER') return true;
    if (userType === 'DISTRIBUTOR' && customerType === 'DISTRIBUTOR') return true;
    return false;
  };

  const handleCustomerTypeChange = (value: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST' | null) => {
    setCustomerType(value);
    setCustomer(null);
    setAllocations([]);
    setAllocationsLoaded(false);
    setCustomerCreditBalance(0);
    setUseCreditChecked(false);
    queryClient.removeQueries({ queryKey: ['pendingInvoices'] });
    queryClient.removeQueries({ queryKey: ['customerCredit'] });
    queryClient.removeQueries({ queryKey: ['customerLedgerSummary'] });

    if (currentUser && !isEditMode) {
      const userType = currentUser.channel_partner_type;

      if (value === 'DISTRIBUTOR' && userType === 'DISTRIBUTOR' && currentUser.distributor && currentUser.distributor_name) {
        setCustomer({
          id: currentUser.distributor_name.id,
          name: currentUser.distributor_name.name,
        });
      } else if (value === 'RETAILER' && userType === 'RETAILER' && currentUser.retailer && currentUser.retailer_name) {
        setCustomer({
          id: currentUser.retailer_name.id,
          name: currentUser.retailer_name.name,
        });
      }
    }
  };

  const handleCustomerChange = (value: DropdownOption | null) => {
    setCustomer(value);
    setAllocations([]);
    setAllocationsLoaded(false);
    setCustomerCreditBalance(0);
    setUseCreditChecked(false);
    queryClient.removeQueries({ queryKey: ['pendingInvoices'] });
    queryClient.removeQueries({ queryKey: ['customerCredit'] });
    queryClient.removeQueries({ queryKey: ['customerLedgerSummary'] });
  };

  // Load allocations after invoices are fetched in edit mode
  useEffect(() => {
    const loadAllocations = async () => {
      if (!isEditMode || !id || invoicesList.length === 0 || allocationsLoaded) return;
      
      try {
        const receipt = await receiptApi.getById(id);
        
        // Map existing allocations to invoice list
        const newAllocations = invoicesList.map(inv => {
          const existingAlloc = receipt.allocations?.find((a: any) => a.invoice === inv.id);
          return {
            invoice: inv.id,
            allocated_amount: existingAlloc ? String(existingAlloc.allocated_amount) : '',
            selected: false
          };
        });
        
        setAllocations(newAllocations);
        setAllocationsLoaded(true);
      } catch (error) {
      }
    };
    
    loadAllocations();
  }, [isEditMode, id, invoicesList.length, allocationsLoaded]);

  useEffect(() => {
    if (invoicesList.length > 0 && allocations.length === 0 && !isEditMode) {
      setAllocations(invoicesList.map(inv => ({ invoice: inv.id, allocated_amount: '', selected: false })));
    }
  }, [invoicesList, isEditMode]);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      if (isEditMode) {
        formData.append('_method', 'PUT');
        return receiptApi.update(id!, formData);
      }
      return receiptApi.create(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toastSuccess(isEditMode ? 'Receipt updated successfully' : 'Receipt created successfully');
      navigate('/receipts');
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'create'} receipt`;
      toastError(errorMsg);
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!company) newErrors.company = 'Company is required';
    if (!location) newErrors.location = 'Location is required';
    if (!customerType) newErrors.customerType = 'Customer type is required';
    if (!customer) newErrors.customer = 'Customer is required';
    
    // Only require payment mode and total amount if cash payment is needed
    const needsCashPayment = !useCreditChecked || cashUsed > 0;
    
    if (needsCashPayment) {
      if (!paymentMode) newErrors.paymentMode = 'Payment mode is required';
      if (!totalAmount || Number(totalAmount) <= 0) newErrors.totalAmount = 'Valid total amount is required';
    }
    
    const validAllocations = allocations.filter(a => a.allocated_amount && Number(a.allocated_amount) > 0);
    if (validAllocations.length === 0) newErrors.allocations = 'At least one invoice allocation is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (saveAsDraft: boolean = false) => {
    if (!validate()) return;

    const totalPaymentCapacity = Number(totalAmount || 0) + creditUsed;
    const adjustmentAmt = totalPaymentCapacity - totalAllocated;
    
    // If saving as draft, skip confirmation dialog
    if (saveAsDraft) {
      submitReceipt(true);
      return;
    }
    
    // Show confirmation dialog if there's adjustment amount
    if (Math.abs(adjustmentAmt) > 0.01) {
      setShowConfirmDialog(true);
    } else {
      submitReceipt(false);
    }
  };

  const submitReceipt = (isDraft: boolean = false) => {
    const formData = new FormData();
    formData.append('receipt_date', receiptDate.format('YYYY-MM-DD'));
    formData.append('payment_date', paymentDate.format('YYYY-MM-DD'));
    
    // Set authorized_status: 0 for draft, keep original for edit
    if (isDraft) {
      formData.append('authorized_status', '0');
    }
    
    // If only using credit, set payment mode to CREDIT and total_amount to 0
    if (useCreditChecked && cashUsed === 0) {
      formData.append('payment_mode', 'CREDIT');
      formData.append('total_amount', '0');
    } else {
      formData.append('payment_mode', paymentMode);
      formData.append('total_amount', totalAmount);
    }
    
    if (referenceNumber) formData.append('reference_number', referenceNumber);
    if (bankName) formData.append('bank_name', bankName);
    formData.append('company', company!.id as string);
    formData.append('location', location!.id as string);
    formData.append('customer_type', customerType!);
    
    if (customerType === 'RETAILER') formData.append('retailer', customer!.id as string);
    else if (customerType === 'DISTRIBUTOR') formData.append('distributor', customer!.id as string);
    else if (customerType === 'SUPERSTOCKIST') formData.append('superstockist', customer!.id as string);
    
    if (useCreditChecked && creditUsed > 0) {
      formData.append('credit_amount', creditUsed.toFixed(2));
    }
    if (remarks) formData.append('remarks', remarks);

    const validAllocations = allocations.filter(a => a.allocated_amount && Number(a.allocated_amount) > 0).map(({ invoice, allocated_amount }) => ({ invoice, allocated_amount }));
    formData.append('allocations', JSON.stringify(validAllocations));

    attachments.forEach((file, index) => {
      formData.append(`attachments[${index}]file`, file);
      formData.append(`attachments[${index}]attachment_type`, 'OTHER');
    });

    mutation.mutate(formData);
  };

  const handleAllocationChange = (index: number, value: string) => {
    const numValue = Number(value);
    const invoice = invoicesList[index];
    
    if (numValue > invoice.balance_amount) {
      toastError(`Allocated amount cannot exceed invoice balance of ₹${invoice.balance_amount.toFixed(2)}`);
      return;
    }
    
    const newAllocations = [...allocations];
    newAllocations[index].allocated_amount = value;
    setAllocations(newAllocations);
  };

  const handleCheckboxChange = (index: number) => {
    const newAllocations = [...allocations];
    newAllocations[index].selected = !newAllocations[index].selected;
    setAllocations(newAllocations);
    allocateToSelected(newAllocations);
  };

  const handleSelectAll = (checked: boolean) => {
    const newAllocations = allocations.map(a => ({ ...a, selected: checked }));
    setAllocations(newAllocations);
    allocateToSelected(newAllocations);
  };

  const allocateToSelected = (allocs: typeof allocations) => {
    if (!totalAmount && !useCreditChecked) return;
    
    const selectedIndices = allocs.map((a, i) => a.selected ? i : -1).filter(i => i !== -1);
    if (selectedIndices.length === 0) return;
    
    let remainingCash = Number(totalAmount || 0);
    let remainingCredit = useCreditChecked ? customerCreditBalance : 0;
    const newAllocations = [...allocs];
    
    // Reset all allocations
    newAllocations.forEach(a => a.allocated_amount = '');
    
    // Allocate to selected invoices (credit first, then cash)
    for (const idx of selectedIndices) {
      if (remainingCash <= 0 && remainingCredit <= 0) break;
      
      const inv = invoicesList[idx];
      let allocate = 0;
      
      // Use credit first
      if (remainingCredit > 0) {
        const creditToUse = Math.min(remainingCredit, inv.balance_amount);
        allocate += creditToUse;
        remainingCredit -= creditToUse;
      }
      
      // Then use cash if needed
      if (allocate < inv.balance_amount && remainingCash > 0) {
        const cashToUse = Math.min(remainingCash, inv.balance_amount - allocate);
        allocate += cashToUse;
        remainingCash -= cashToUse;
      }
      
      if (allocate > 0) {
        newAllocations[idx].allocated_amount = allocate.toFixed(2);
      }
    }
    
    setAllocations(newAllocations);
  };

  const handleAutoAllocate = () => {
    if (!totalAmount && !useCreditChecked) return;
    
    let remainingCash = Number(totalAmount || 0);
    let remainingCredit = useCreditChecked ? customerCreditBalance : 0;
    
    const newAllocations = invoicesList.map(inv => {
      if (remainingCash <= 0 && remainingCredit <= 0) {
        return { invoice: inv.id, allocated_amount: '', selected: false };
      }
      
      let allocate = 0;
      
      // Use credit first
      if (remainingCredit > 0) {
        const creditToUse = Math.min(remainingCredit, inv.balance_amount);
        allocate += creditToUse;
        remainingCredit -= creditToUse;
      }
      
      // Then use cash if needed
      if (allocate < inv.balance_amount && remainingCash > 0) {
        const cashToUse = Math.min(remainingCash, inv.balance_amount - allocate);
        allocate += cashToUse;
        remainingCash -= cashToUse;
      }
      
      return { 
        invoice: inv.id, 
        allocated_amount: allocate > 0 ? allocate.toFixed(2) : '', 
        selected: false 
      };
    });
    
    setAllocations(newAllocations);
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + (Number(a.allocated_amount) || 0), 0);
  const creditUsed = useCreditChecked ? Math.min(customerCreditBalance, totalAllocated) : 0;
  const cashUsed = totalAllocated - creditUsed;
  const adjustmentAmount = Number(totalAmount || 0) - cashUsed;
  const formatCurrency = (amount: number) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={getPageContainerStyles()}>
        <Box sx={getHeaderSectionStyles()}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <ScreenHeader
              title={isEditMode ? 'Edit Receipt' : 'Create Receipt'}
              showBackButton
              onBack={() => navigate('/receipts')}
              disableBox
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button variant="outlined" color="secondary" size="small" onClick={() => navigate('/receipts')} disabled={mutation.isPending}>
                Cancel
              </Button>
              {(originalAuthorizedStatus === null || originalAuthorizedStatus === 0) && (
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => handleSubmit(true)}
                  disabled={mutation.isPending}
                >
                  Save as Draft
                </Button>
              )}
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
                onClick={() => handleSubmit(false)}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Receipt' : 'Create Receipt')}
              </Button>
            </Box>
          </Box>
        </Box>

        <Box sx={getContentSectionStyles()}>
          {isLoadingReceipt ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
          <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 }, borderRadius: 0 }}>
            {Object.keys(errors).length > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Please fix the errors before submitting
              </Alert>
            )}

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Receipt Information
            </Typography>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                  Company <Box component="span" sx={{ color: '#f44336' }}>*</Box>
                </Typography>
                <SearchableDropdown
                  value={company}
                  onChange={(option) => setCompany(Array.isArray(option) ? option[0] || null : option)}
                  apiEndpoint="/api/usermanagement/dropdowns/companies/"
                  label=""
                  placeholder="Select Company"
                  error={Boolean(errors.company)}
                  helperText={errors.company}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                  Location <Box component="span" sx={{ color: '#f44336' }}>*</Box>
                </Typography>
                <SearchableDropdown
                  value={location}
                  onChange={(option) => setLocation(Array.isArray(option) ? option[0] || null : option)}
                  apiEndpoint="/api/usermanagement/dropdowns/locations/"
                  additionalFilters={company ? { company: company.id } : undefined}
                  disabled={!company}
                  label=""
                  placeholder="Select Location"
                  error={Boolean(errors.location)}
                  helperText={errors.location}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                  Receipt Number
                </Typography>
                <TextField
                  value={receiptNumber || 'Select location first'}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.100' } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                  Receipt Date <Box component="span" sx={{ color: '#f44336' }}>*</Box>
                </Typography>
                <DatePicker
                  value={receiptDate}
                  onChange={(date) => { const d = toDayjs(date); if (d) setReceiptDate(d); }}
                  format="DD-MM-YYYY"
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                  Payment Date <Box component="span" sx={{ color: '#f44336' }}>*</Box>
                </Typography>
                <DatePicker
                  value={paymentDate}
                  onChange={(date) => { const d = toDayjs(date); if (d) setPaymentDate(d); }}
                  format="DD-MM-YYYY"
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                  Payment Mode {(!useCreditChecked || cashUsed > 0) && <Box component="span" sx={{ color: '#f44336' }}>*</Box>}
                </Typography>
                <TextField
                  select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  fullWidth
                  size="small"
                  error={Boolean(errors.paymentMode)}
                  helperText={errors.paymentMode}
                >
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="CHEQUE">Cheque</MenuItem>
                  <MenuItem value="NEFT">NEFT</MenuItem>
                  <MenuItem value="RTGS">RTGS</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="CARD">Card</MenuItem>
                </TextField>
              </Grid>
              {paymentMode && paymentMode !== 'CASH' && (
                <>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                      Reference Number
                    </Typography>
                    <TextField value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} fullWidth size="small" placeholder="Cheque/Transaction No" />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                      Bank Name
                    </Typography>
                    <TextField value={bankName} onChange={(e) => setBankName(e.target.value)} fullWidth size="small" placeholder="Bank Name" />
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                  Total Amount {(!useCreditChecked || cashUsed > 0) && <Box component="span" sx={{ color: '#f44336' }}>*</Box>}
                </Typography>
                <TextField
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  fullWidth
                  size="small"
                  error={Boolean(errors.totalAmount)}
                  helperText={errors.totalAmount}
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                  }}
                  sx={{
                    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                    '& input[type=number]': {
                      MozAppearance: 'textfield',
                    },
                  }}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Customer Information
            </Typography>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                  Customer Type <Box component="span" sx={{ color: '#f44336' }}>*</Box>
                </Typography>
                <SearchableDropdown
                  value={customerType ? customerTypeOptions.find((opt) => opt.id === customerType) || null : null}
                  onChange={(option) => {
                    const selected = Array.isArray(option) ? option[0] || null : option;
                    handleCustomerTypeChange((selected?.id as 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST') || null);
                  }}
                  apiEndpoint=""
                  staticOptions={customerTypeOptions}
                  label=""
                  placeholder="Select Customer Type"
                  disabled={isCustomerTypeDisabled()}
                  error={Boolean(errors.customerType)}
                  helperText={
                    errors.customerType
                    || (isCustomerTypeDisabled() && currentUser?.channel_partner_type === 'RETAILER'
                      ? 'Customer type is fixed for retailer users'
                      : customerTypeDisabled
                        ? 'Loading channel configuration...'
                        : isChannelConfigError
                          ? 'Channel configuration unavailable, showing all types'
                          : '')
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                  Customer <Box component="span" sx={{ color: '#f44336' }}>*</Box>
                </Typography>
                <SearchableDropdown
                  value={customer}
                  onChange={(option) => handleCustomerChange(Array.isArray(option) ? option[0] || null : option)}
                  apiEndpoint={customerApiEndpoint}
                  additionalFilters={customerAdditionalFilters}
                  disabled={isCustomerDisabled()}
                  label=""
                  placeholder="Select Customer"
                  error={Boolean(errors.customer)}
                  helperText={
                    errors.customer
                    || (isCustomerDisabled() && currentUser?.channel_partner_type === 'RETAILER'
                      ? 'Customer is fixed for retailer users'
                      : isCustomerDisabled()
                        && currentUser?.channel_partner_type === 'DISTRIBUTOR'
                        && customerType === 'DISTRIBUTOR'
                        ? 'Logged-in distributor is auto-selected'
                        : '')
                  }
                />
              </Grid>
            </Grid>

            {customer && (
              <Paper sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 1.5 }}>
                  Customer Ledger Snapshot
                </Typography>
                {customerLedgerSummaryLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : customerLedgerSummary ? (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Opening</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(customerLedgerSummary.opening_balance)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Debit</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(customerLedgerSummary.period_debit)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Credit</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(customerLedgerSummary.period_credit)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Closing</Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: customerLedgerSummary.closing_balance > 0 ? 'warning.main' : 'success.main' }}
                      >
                        {formatCurrency(customerLedgerSummary.closing_balance)}
                      </Typography>
                    </Grid>
                  </Grid>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No ledger data available.
                  </Typography>
                )}
              </Paper>
            )}

            {invoicesList && invoicesList.length > 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    Pending Invoices
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {customerCreditBalance > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <input
                          type="checkbox"
                          checked={useCreditChecked}
                          onChange={(e) => {
                            setUseCreditChecked(e.target.checked);
                            // Re-allocate when credit checkbox changes
                            if (allocations.some(a => a.selected)) {
                              allocateToSelected(allocations);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                          Use Available Credit: ₹{customerCreditBalance.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    <Button variant="outlined" size="small" onClick={handleAutoAllocate} disabled={!totalAmount && !useCreditChecked}>
                      Auto Allocate
                    </Button>
                  </Box>
                </Box>
                
                {errors.allocations && <Alert severity="error" sx={{ mb: 2 }}>{errors.allocations}</Alert>}

                <Box sx={{ display: 'flex', flexDirection: 'column', height: 400, mb: 2 }}>
                  <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox" sx={{ backgroundColor: '#006766' }}>
                            <input
                              type="checkbox"
                              checked={allocations.every(a => a.selected)}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              style={{ cursor: 'pointer' }}
                            />
                          </TableCell>
                          <TableCell sx={{ backgroundColor: '#006766', color: 'white', fontWeight: 600 }}>S.No</TableCell>
                          <TableCell sx={{ backgroundColor: '#006766', color: 'white', fontWeight: 600 }}>Invoice Number</TableCell>
                          <TableCell sx={{ backgroundColor: '#006766', color: 'white', fontWeight: 600 }}>Invoice Date</TableCell>
                          <TableCell align="right" sx={{ backgroundColor: '#006766', color: 'white', fontWeight: 600 }}>Invoice Amount</TableCell>
                          <TableCell align="right" sx={{ backgroundColor: '#006766', color: 'white', fontWeight: 600 }}>Balance</TableCell>
                          <TableCell align="right" sx={{ backgroundColor: '#006766', color: 'white', fontWeight: 600 }}>Allocate Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoicesList.map((inv: PendingInvoice, index: number) => (
                          <TableRow key={inv.id}>
                            <TableCell padding="checkbox">
                              <input
                                type="checkbox"
                                checked={allocations[index]?.selected || false}
                                onChange={() => handleCheckboxChange(index)}
                                style={{ cursor: 'pointer' }}
                              />
                            </TableCell>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{inv.invoice_number}</TableCell>
                            <TableCell>{new Date(inv.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-')}</TableCell>
                            <TableCell align="right">₹{inv.grand_total.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{inv.balance_amount.toFixed(2)}</TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                value={allocations[index]?.allocated_amount || ''}
                                onChange={(e) => handleAllocationChange(index, e.target.value)}
                                size="small"
                                sx={{ width: 120 }}
                                inputProps={{ min: 0, max: inv.balance_amount, step: 0.01 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Paper sx={{ p: 2, borderTop: '2px solid #006766' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Total Allocated: ₹{totalAllocated.toFixed(2)}
                      </Typography>
                      {creditUsed > 0 && (
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                          (Credit: ₹{creditUsed.toFixed(2)} + Cash: ₹{cashUsed.toFixed(2)})
                        </Typography>
                      )}
                      <Typography variant="body1" sx={{ fontWeight: 600, color: adjustmentAmount < 0 ? 'error.main' : adjustmentAmount > 0 ? 'warning.main' : 'text.primary' }}>
                        Adjustment: ₹{adjustmentAmount.toFixed(2)}
                      </Typography>
                    </Box>
                    {adjustmentAmount > 0 && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Excess cash amount of ₹{adjustmentAmount.toFixed(2)} will be stored as customer credit for future use.
                      </Alert>
                    )}
                    {adjustmentAmount < 0 && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        Cash payment is short by ₹{Math.abs(adjustmentAmount).toFixed(2)}. Please add more to Total Amount.
                      </Alert>
                    )}
                    {useCreditChecked && creditUsed > 0 && (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        Using ₹{creditUsed.toFixed(2)} from available credit. {cashUsed > 0 ? `Remaining ₹${cashUsed.toFixed(2)} from cash payment.` : ''}
                      </Alert>
                    )}
                  </Paper>
                </Box>
              </>
            )}

            {loadingInvoices && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {customer && !loadingInvoices && invoicesList.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No pending invoices found for this customer
              </Alert>
            )}

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Additional Information
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                  Attachments
                </Typography>
                <Button variant="outlined" component="label" size="small">
                  Upload Files
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files) {
                        setAttachments([...attachments, ...Array.from(e.target.files)]);
                      }
                    }}
                  />
                </Button>
                {attachments.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {attachments.map((file, index) => (
                      <Chip
                        key={index}
                        label={file.name}
                        onDelete={() => setAttachments(attachments.filter((_, i) => i !== index))}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                  Remarks
                </Typography>
                <TextField
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter any additional notes"
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>
          )}
        </Box>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Confirm Adjustment Amount</DialogTitle>
          <DialogContent>
            {(() => {
              const totalPaymentCapacity = Number(totalAmount || 0) + creditUsed;
              const dialogAdjustment = totalPaymentCapacity - totalAllocated;
              
              return (
                <>
                  {dialogAdjustment > 0 ? (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      There is an excess payment of <strong>₹{dialogAdjustment.toFixed(2)}</strong>.
                      This amount will be stored as customer credit for future use.
                    </Alert>
                  ) : (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      Allocated amount exceeds total payment by <strong>₹{Math.abs(dialogAdjustment).toFixed(2)}</strong>.
                      Please adjust your allocations or increase the total amount.
                    </Alert>
                  )}
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Do you want to proceed with this receipt?
                  </Typography>
                </>
              );
            })()}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowConfirmDialog(false)} color="secondary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowConfirmDialog(false);
                submitReceipt();
              }}
              variant="contained"
              color="primary"
              disabled={(() => {
                const totalPaymentCapacity = Number(totalAmount || 0) + creditUsed;
                const dialogAdjustment = totalPaymentCapacity - totalAllocated;
                return dialogAdjustment < 0;
              })()}
            >
              Confirm & Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ReceiptForm;

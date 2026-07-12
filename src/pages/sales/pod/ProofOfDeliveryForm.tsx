import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Button,
  Typography,
  TextField,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  MenuItem,
  IconButton,
  Card,
  CardMedia,
  CardActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
  Verified as VerifiedIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
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
import { podApi } from '../../../api/pod.api';
import type { DropdownOption } from '../../../types/common.types';
import apiClient from '../../../api/axios.config';
import { useAppSelector } from '../../../store/hooks';
import {
  CONTACT_PHONE_MAX_LENGTH,
  CONTACT_PHONE_MIN_LENGTH,
  CONTACT_PHONE_REGEX,
  PHONE_FIELD_HELPER_TEXT,
  sanitizePhoneInput,
} from '../../../utils/validation';

const ProofOfDeliveryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  usePageTitle(isEditMode ? 'Edit POD' : 'Create POD');
  const { success: toastSuccess, error: toastError } = useToast();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const currentUser = useAppSelector((state) => state.auth.user);

  // Form state
  const [podNumber, setPodNumber] = useState('');
  const [podDate, setPodDate] = useState<Dayjs>(dayjs());
  const [customerType, setCustomerType] = useState<'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST' | null>(null);
  const [customer, setCustomer] = useState<DropdownOption | null>(null);
  const [invoice, setInvoice] = useState<DropdownOption | null>(null);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [deliveredBy, setDeliveredBy] = useState('');
  const [deliveredDate, setDeliveredDate] = useState<Dayjs | null>(null);
  const [remarks, setRemarks] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileDescriptions, setFileDescriptions] = useState<string[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Invoice details (read-only)
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);

  // Load channel config
  const { data: channelConfig } = useQuery({
    queryKey: ['channelConfig'],
    queryFn: () => apiClient.get('/api/masters/channel-config/').then(res => res.data),
  });

  // Auto-select customer type and customer for channel partner users
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

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Sales', path: '/sales', icon: <FolderIcon fontSize="small" /> },
      { label: 'Proof of Delivery', path: '/sales/pod', icon: <VerifiedIcon fontSize="small" /> },
      { label: isEditMode ? 'Edit POD' : 'Create POD' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode]);

  // Generate POD number (only in create mode)
  useEffect(() => {
    const generatePODNumber = async () => {
      if (!isEditMode && !podNumber) {
        try {
          const response = await apiClient.get('/api/delivery/proofs/generate-pod-number/');
          setPodNumber(response.data.pod_number);
        } catch (error) {
        }
      }
    };
    generatePODNumber();
  }, [isEditMode, podNumber]);

  // Load existing POD data in edit mode
  const { data: existingPOD, isLoading: isLoadingPOD } = useQuery({
    queryKey: ['pod', id],
    queryFn: () => podApi.getById(id!),
    enabled: isEditMode,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingPOD && isEditMode) {
      setPodNumber(existingPOD.pod_number);
      setPodDate(dayjs(existingPOD.pod_date));
      setCustomerType(existingPOD.customer_type);
      setCustomer({ id: existingPOD.customer_id, name: existingPOD.customer_name });
      setInvoice({ id: existingPOD.invoice, name: existingPOD.invoice_number });
      setReceiverName(existingPOD.receiver_name || '');
      setReceiverPhone(existingPOD.receiver_phone || '');
      setDeliveredBy(existingPOD.delivered_by || '');
      setDeliveredDate(existingPOD.delivered_date ? dayjs(existingPOD.delivered_date) : null);
      setRemarks(existingPOD.remarks || '');
      setInvoiceDetails(existingPOD);
      setExistingFiles(existingPOD.files || []);
    }
  }, [existingPOD, isEditMode]);

  // Fetch invoice details when invoice is selected
  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (invoice && !isEditMode) {
        try {
          const response = await apiClient.get(`/api/invoice/invoices/${invoice.id}/`);
          setInvoiceDetails(response.data);
        } catch (error) {
        }
      }
    };
    fetchInvoiceDetails();
  }, [invoice, isEditMode]);

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      if (isEditMode) {
        return podApi.update(id!, formData);
      }
      return podApi.create(formData);
    },
    onSuccess: (updatedPOD) => {
      queryClient.invalidateQueries({ queryKey: ['pods'] });
      if (id) {
        queryClient.setQueryData(['pod', id], updatedPOD);
        queryClient.invalidateQueries({ queryKey: ['pod', id] });
      }
      toastSuccess(isEditMode ? 'POD updated successfully' : 'POD created successfully');
      navigate('/sales/pod');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} POD`);
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerType) newErrors.customerType = 'Customer type is required';
    if (!customer) newErrors.customer = 'Customer is required';
    if (!invoice) newErrors.invoice = 'Invoice is required';
    if (receiverPhone && receiverPhone.trim()) {
      const phone = receiverPhone.trim();
      if (phone.length < CONTACT_PHONE_MIN_LENGTH) {
        newErrors.receiverPhone = 'Phone number must be at least 10 digits';
      } else if (phone.length > CONTACT_PHONE_MAX_LENGTH) {
        newErrors.receiverPhone = 'Phone number cannot exceed 15 characters';
      } else if (!CONTACT_PHONE_REGEX.test(phone)) {
        newErrors.receiverPhone = 'Please enter a valid phone number (e.g., +91 9876543210 or 040-12345678)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append('pod_number', podNumber);
    formData.append('invoice', invoice!.id as string);
    formData.append('sales_order', invoiceDetails.sales_order);
    formData.append('customer_type', customerType!);
    formData.append('customer_id', customer!.id as string);
    formData.append('pod_date', podDate.format('YYYY-MM-DD'));
    formData.append('receiver_name', receiverName);
    formData.append('receiver_phone', receiverPhone);
    formData.append('delivered_by', deliveredBy);
    if (deliveredDate) {
      formData.append('delivered_date', deliveredDate.format('YYYY-MM-DD'));
    }
    formData.append('remarks', remarks);
    formData.append('status', 'SUCCESS');

    files.forEach((file) => {
      formData.append('files', file);
    });
    fileDescriptions.forEach((desc) => {
      formData.append('file_descriptions', desc);
    });

    mutation.mutate(formData);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
    setFileDescriptions(prev => [...prev, ...newFiles.map(() => '')]);
    
    // Generate previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileDescriptions(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const deleteExistingFileMutation = useMutation({
    mutationFn: ({ podId, fileId }: { podId: string; fileId: string }) => podApi.deleteFile(podId, fileId),
    onSuccess: () => {
      toastSuccess('Attachment deleted successfully');
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['pod', id] });
      }
      setExistingFiles(prev => prev.filter((f) => f.id !== deleteTargetFileId));
      setDeleteTargetFileId(null);
      setDeleteExistingDialogOpen(false);
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete attachment');
    },
  });

  const [deleteExistingDialogOpen, setDeleteExistingDialogOpen] = useState(false);
  const [deleteTargetFileId, setDeleteTargetFileId] = useState<string | null>(null);

  const handleDeleteExistingAttachment = () => {
    if (!id || !deleteTargetFileId) return;
    deleteExistingFileMutation.mutate({ podId: id, fileId: deleteTargetFileId });
  };

  const handleBack = () => {
    navigate('/sales/pod');
  };

  const getAvailableCustomerTypes = () => {
    const allTypes: Array<'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST'> = [];
    if (channelConfig?.enable_retailer) allTypes.push('RETAILER');
    if (channelConfig?.enable_distributor) allTypes.push('DISTRIBUTOR');
    if (channelConfig?.enable_superstockist) allTypes.push('SUPERSTOCKIST');
    if (!currentUser) return allTypes;

    const userType = currentUser.channel_partner_type;
    if (userType === 'RETAILER') return ['RETAILER'];
    if (userType === 'DISTRIBUTOR') return allTypes.filter((t) => t === 'DISTRIBUTOR' || t === 'RETAILER');
    return allTypes;
  };

  const isCustomerTypeDisabled = () => {
    if (isEditMode) return true;
    if (!currentUser) return false;
    return currentUser.channel_partner_type === 'RETAILER';
  };

  const isCustomerDisabled = () => {
    if (isEditMode) return true;
    if (!customerType) return true;
    if (!currentUser) return false;
    if (currentUser.channel_partner_type === 'RETAILER') return true;
    if (currentUser.channel_partner_type === 'DISTRIBUTOR' && customerType === 'DISTRIBUTOR') return true;
    return false;
  };

  const handleCustomerTypeChange = (value: 'RETAILER' | 'DISTRIBUTOR' | 'SUPERSTOCKIST' | null) => {
    setCustomerType(value);
    setCustomer(null);
    setInvoice(null);
    setInvoiceDetails(null);

    if (!currentUser || isEditMode) return;
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
  };

  const filteredCustomerTypes = getAvailableCustomerTypes();
  const customerTypeOptions: DropdownOption[] = filteredCustomerTypes.map((type) => ({
    id: type,
    name: type === 'RETAILER' ? 'Retailer' : type === 'DISTRIBUTOR' ? 'Distributor' : 'Superstockist',
  }));

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={getPageContainerStyles()}>
        <Box sx={getHeaderSectionStyles()}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <ScreenHeader
              title={isEditMode ? 'Edit Proof of Delivery' : 'Create Proof of Delivery'}
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
              <Button
                type="button"
                variant="contained"
                color="primary"
                size="small"
                startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
                onClick={handleSubmit}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update POD' : 'Save POD')}
              </Button>
            </Box>
          </Box>
        </Box>

        <Box sx={getContentSectionStyles()}>
          <Paper sx={{ p: 3, borderRadius: 0 }}>
            {mutation.isError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {mutation.error instanceof Error ? mutation.error.message : 'Failed to save POD'}
              </Alert>
            )}

            {Object.keys(errors).length > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Please fix the errors before submitting
              </Alert>
            )}

            {/* POD Header */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              POD Information
            </Typography>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  POD Number
                </Typography>
                <TextField
                  value={podNumber || 'Generating...'}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.100' } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  POD Date <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <DatePicker
                  value={podDate}
                  onChange={(date) => { const d = toDayjs(date); if (d) setPodDate(d); }}
                  format="DD-MM-YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
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
                  helperText={
                    errors.customerType ||
                    (isCustomerTypeDisabled() && currentUser?.channel_partner_type === 'RETAILER'
                      ? 'Customer type is fixed for retailer users'
                      : '')
                  }
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
                    setInvoice(null);
                    setInvoiceDetails(null);
                  }}
                  apiEndpoint={
                    customerType
                      ? `/api/delivery/proofs/available-customers/?customer_type=${customerType}`
                      : ''
                  }
                  label=""
                  placeholder="Select Customer"
                  disabled={isCustomerDisabled()}
                  error={Boolean(errors.customer)}
                  helperText={
                    errors.customer ||
                    (isCustomerDisabled() && currentUser?.channel_partner_type === 'RETAILER'
                      ? 'Customer is fixed for retailer users'
                      : isCustomerDisabled() &&
                        currentUser?.channel_partner_type === 'DISTRIBUTOR' &&
                        customerType === 'DISTRIBUTOR'
                        ? 'Logged-in distributor is auto-selected'
                        : '')
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  Invoice <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <SearchableDropdown
                  value={invoice}
                  onChange={(option) => setInvoice(Array.isArray(option) ? option[0] || null : option)}
                  apiEndpoint="/api/invoice/invoices/"
                  labelKey="invoice_number"
                  label=""
                  placeholder="Select Invoice"
                  disabled={!customer || isEditMode}
                  error={Boolean(errors.invoice)}
                  helperText={errors.invoice}
                  additionalFilters={customer && customerType ? { 
                    [`sales_order__${customerType.toLowerCase()}`]: customer.id,
                    pod_status: 'PENDING'
                  } : {}}
                />
              </Grid>
            </Grid>

            {/* Invoice Details (Read-only) */}
            {invoiceDetails && (
              <>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  Invoice Details
                </Typography>
                <Grid container spacing={2.5} sx={{ mb: 4 }}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                      Invoice No
                    </Typography>
                    <TextField
                      value={invoiceDetails.invoice_number || '-'}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                      sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.100' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                      Invoice Date
                    </Typography>
                    <TextField
                      value={invoiceDetails.invoice_date ? dayjs(invoiceDetails.invoice_date).format('DD-MM-YYYY') : '-'}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                      sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.100' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                      Customer Name
                    </Typography>
                    <TextField
                      value={customer?.name || '-'}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                      sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.100' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                      Sales Order No
                    </Typography>
                    <TextField
                      value={invoiceDetails.order_number || '-'}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                      sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.100' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                      Sales Order Date
                    </Typography>
                    <TextField
                      value={invoiceDetails.order_date ? dayjs(invoiceDetails.order_date).format('DD-MM-YYYY') : '-'}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                      sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.100' } }}
                    />
                  </Grid>
                <Grid size={{ xs: 12, md: 4.5 }}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                    Billing Address
                  </Typography>
                  <TextField
                    value={invoiceDetails.billing_address || '-'}
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.100' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4.5 }}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                    Shipping Address
                  </Typography>
                  <TextField
                    value={invoiceDetails.shipping_address || '-'}
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

            {/* Delivery Details - All in one line */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Delivery Details
            </Typography>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  Receiver Name
                </Typography>
                <TextField
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  fullWidth
                  size="small"
                  error={Boolean(errors.receiverName)}
                  helperText={errors.receiverName}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  Receiver Phone
                </Typography>
                <TextField
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(sanitizePhoneInput(e.target.value))}
                  fullWidth
                  size="small"
                  error={Boolean(errors.receiverPhone)}
                  helperText={errors.receiverPhone || PHONE_FIELD_HELPER_TEXT}
                  inputProps={{ maxLength: CONTACT_PHONE_MAX_LENGTH }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  Delivered By
                </Typography>
                <TextField
                  value={deliveredBy}
                  onChange={(e) => setDeliveredBy(e.target.value)}
                  fullWidth
                  size="small"
                  error={Boolean(errors.deliveredBy)}
                  helperText={errors.deliveredBy}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  Delivered Date
                </Typography>
                <DatePicker
                  value={deliveredDate}
                  onChange={(date) => setDeliveredDate(toDayjs(date))}
                  format="DD-MM-YYYY"
                  maxDate={dayjs()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                  Remarks
                </Typography>
                <TextField
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>

            {/* Attachments */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Attachments
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
              >
                Upload Files
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={handleFileChange}
                />
              </Button>
            </Box>
            <Grid container spacing={2}>
              {existingFiles.map((file, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={`existing-${index}`}>
                  <Card>
                    {file.file && file.file.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) && (
                      <CardMedia
                        component="img"
                        height="140"
                        image={file.file_url || file.file}
                        alt={file.description || 'Attachment'}
                      />
                    )}
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2" noWrap>
                        {file.original_filename || (file.file ? file.file.split('/').pop() : 'File')}
                      </Typography>
                      {file.description && (
                        <Typography variant="caption" color="text.secondary">
                          {file.description}
                        </Typography>
                      )}
                    </Box>
                    <CardActions>
                      {isEditMode && file.id && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setDeleteTargetFileId(file.id);
                            setDeleteExistingDialogOpen(true);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                      <Button
                        size="small"
                        href={file.file_url || file.file}
                        target="_blank"
                        download
                      >
                        Download
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
              {files.map((file, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                  <Card>
                    {filePreviews[index] && file.type.startsWith('image/') && (
                      <CardMedia
                        component="img"
                        height="140"
                        image={filePreviews[index]}
                        alt={file.name}
                      />
                    )}
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2" noWrap>{file.name}</Typography>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Description"
                        value={fileDescriptions[index]}
                        onChange={(e) => {
                          const newDescs = [...fileDescriptions];
                          newDescs[index] = e.target.value;
                          setFileDescriptions(newDescs);
                        }}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                    <CardActions>
                      <IconButton size="small" color="error" onClick={() => removeFile(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      </Box>
      <Dialog
        open={deleteExistingDialogOpen}
        onClose={() => {
          if (!deleteExistingFileMutation.isPending) {
            setDeleteExistingDialogOpen(false);
            setDeleteTargetFileId(null);
          }
        }}
      >
        <DialogTitle>Delete Attachment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this attachment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteExistingDialogOpen(false);
              setDeleteTargetFileId(null);
            }}
            disabled={deleteExistingFileMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteExistingAttachment}
            color="error"
            disabled={deleteExistingFileMutation.isPending}
          >
            {deleteExistingFileMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ProofOfDeliveryForm;

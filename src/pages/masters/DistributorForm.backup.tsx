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
  Switch,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  IconButton,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Save as SaveIcon, Delete as DeleteIcon, Upload as UploadIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import ScreenHeader from '../../components/common/ScreenHeader';
import ChannelPartnerGuard from '../../components/guards/ChannelPartnerGuard';
import LocationCascadeSelector from '../../components/masters/LocationCascadeSelector';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import { distributorApi } from '../../api/masters.api';
import { API_ENDPOINTS } from '../../utils/constants';
import apiClient from '../../api/axios.config';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import type { DistributorFormData } from '../../types/masters.types';
import type { DropdownOption } from '../../types/common.types';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../../utils/spacing';

const DistributorForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const isEditMode = Boolean(id);

  usePageTitle(isEditMode ? 'Edit Distributor' : 'Add Distributor');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DistributorFormData>({
    defaultValues: {
      code: '',
      name: '',
      company_id: '',
      superstockist_id: '',
      contact_person: '',
      phone: '',
      email: '',
      mobile: '',
      contact_person_2: '',
      phone_2: '',
      email_2: '',
      mobile_2: '',
      state_id: '',
      city_id: '',
      area_id: '',
      address: '',
      pincode: '',
      shipping_same_as_billing: true,
      shipping_state_id: '',
      shipping_city_id: '',
      shipping_area_id: '',
      shipping_address: '',
      shipping_pincode: '',
      gstin: '',
      pan: '',
      aadhar: '',
      bank_account_number: '',
      bank_name: '',
      bank_branch: '',
      bank_ifsc: '',
      bank_account_type: '',
      google_location: '',
      credit_limit: 0,
      credit_days: 0,
      is_active: true,
      effective_from: '',
      effective_to: '',
      erp_code: '',
    },
  });

  const [selectedCompany, setSelectedCompany] = useState<DropdownOption | null>(null);
  const [selectedState, setSelectedState] = useState<DropdownOption | null>(null);
  const [selectedCity, setSelectedCity] = useState<DropdownOption | null>(null);
  const [selectedArea, setSelectedArea] = useState<DropdownOption | null>(null);
  const [selectedShippingState, setSelectedShippingState] = useState<DropdownOption | null>(null);
  const [selectedShippingCity, setSelectedShippingCity] = useState<DropdownOption | null>(null);
  const [selectedShippingArea, setSelectedShippingArea] = useState<DropdownOption | null>(null);
  const [selectedSuperstockist, setSelectedSuperstockist] = useState<DropdownOption | null>(null);

  // Watch shipping_same_as_billing checkbox
  const shippingSameAsBilling = watch('shipping_same_as_billing');
  const billingStateId = watch('state_id');
  const billingCityId = watch('city_id');
  const billingAreaId = watch('area_id');
  const billingAddress = watch('address');
  const billingPincode = watch('pincode');

  // Autofill shipping address when checkbox is checked
  useEffect(() => {
    if (shippingSameAsBilling) {
      setValue('shipping_state_id', billingStateId);
      setValue('shipping_city_id', billingCityId);
      setValue('shipping_area_id', billingAreaId);
      setValue('shipping_address', billingAddress);
      setValue('shipping_pincode', billingPincode);
      setSelectedShippingState(selectedState);
      setSelectedShippingCity(selectedCity);
      setSelectedShippingArea(selectedArea);
    }
  }, [shippingSameAsBilling, billingStateId, billingCityId, billingAreaId, billingAddress, billingPincode, selectedState, selectedCity, selectedArea, setValue]);
  const [selectedLocationStates, setSelectedLocationStates] = useState<string[]>([]);
  const [selectedLocationCities, setSelectedLocationCities] = useState<string[]>([]);
  const [selectedLocationAreas, setSelectedLocationAreas] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Distributor', path: '/masters/distributor', icon: <LocalShippingIcon fontSize="small" /> },
      { label: isEditMode ? 'Edit Distributor' : 'Add Distributor' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode]);

  // Fetch channel configuration
  const { data: channelConfig } = useQuery({
    queryKey: ['channelConfig'],
    queryFn: async () => {
      const response = await apiClient.get('/api/masters/channel-config/');
      return {
        enable_superstockist: response.data.enable_superstockist || false,
        enforce_channel_hierarchy: response.data.enforce_channel_hierarchy || false,
      };
    },
  });

  // Fetch distributor data for edit mode
  const { data: distributorData, isLoading: isLoadingDistributor } = useQuery({
    queryKey: ['distributor', id],
    queryFn: () => distributorApi.getDistributor(id!),
    enabled: isEditMode,
  });

  // Fetch attachments for edit mode
  const { data: attachmentsData, refetch: refetchAttachments } = useQuery({
    queryKey: ['distributorAttachments', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/masters/distributors/${id}/attachments/`);
      return response.data;
    },
    enabled: isEditMode,
  });

  useEffect(() => {
    if (attachmentsData) {
      setAttachments(attachmentsData);
    }
  }, [attachmentsData]);

  // Populate form when distributor data is loaded
  useEffect(() => {
    if (distributorData) {
      const data = distributorData as any;
      reset({
        code: distributorData.code || '',
        name: distributorData.name || '',
        company_id: distributorData.company || '',
        superstockist_id: distributorData.superstockist || '',
        contact_person: distributorData.contact_person || '',
        phone: distributorData.phone || '',
        email: distributorData.email || '',
        mobile: distributorData.mobile || '',
        contact_person_2: distributorData.contact_person_2 || '',
        phone_2: distributorData.phone_2 || '',
        email_2: distributorData.email_2 || '',
        mobile_2: distributorData.mobile_2 || '',
        state_id: data.state_id || distributorData.state || '',
        city_id: data.city_id || distributorData.city || '',
        area_id: data.area_id || distributorData.area || '',
        address: distributorData.address || '',
        pincode: distributorData.pincode || '',
        shipping_same_as_billing: distributorData.shipping_same_as_billing ?? true,
        shipping_state_id: data.shipping_state_id || distributorData.shipping_state || '',
        shipping_city_id: data.shipping_city_id || distributorData.shipping_city || '',
        shipping_area_id: data.shipping_area_id || distributorData.shipping_area || '',
        shipping_address: distributorData.shipping_address || '',
        shipping_pincode: distributorData.shipping_pincode || '',
        gstin: distributorData.gstin || '',
        pan: distributorData.pan || '',
        aadhar: distributorData.aadhar || '',
        bank_account_number: distributorData.bank_account_number || '',
        bank_name: distributorData.bank_name || '',
        bank_branch: distributorData.bank_branch || '',
        bank_ifsc: distributorData.bank_ifsc || '',
        bank_account_type: distributorData.bank_account_type || '',
        google_location: distributorData.google_location || '',
        credit_limit: distributorData.credit_limit ? parseFloat(distributorData.credit_limit) : 0,
        credit_days: distributorData.credit_days || 0,
        is_active: distributorData.is_active,
        effective_from: distributorData.effective_from || '',
        effective_to: distributorData.effective_to || '',
        erp_code: distributorData.erp_code || '',
      });
      setSelectedCompany(
        (data.company_id || distributorData.company) && distributorData.company_name
          ? { id: data.company_id || distributorData.company, name: distributorData.company_name }
          : null
      );
      setSelectedState(
        (data.state_id || distributorData.state) && distributorData.state_name
          ? { id: data.state_id || distributorData.state, name: distributorData.state_name }
          : null
      );
      setSelectedCity(
        (data.city_id || distributorData.city) && distributorData.city_name
          ? { id: data.city_id || distributorData.city, name: distributorData.city_name }
          : null
      );
      setSelectedArea(
        (data.area_id || distributorData.area) && distributorData.area_name
          ? { id: data.area_id || distributorData.area, name: distributorData.area_name }
          : null
      );
      setSelectedShippingState(
        (data.shipping_state_id || distributorData.shipping_state) && distributorData.shipping_state_name
          ? { id: data.shipping_state_id || distributorData.shipping_state, name: distributorData.shipping_state_name }
          : null
      );
      setSelectedShippingCity(
        (data.shipping_city_id || distributorData.shipping_city) && distributorData.shipping_city_name
          ? { id: data.shipping_city_id || distributorData.shipping_city, name: distributorData.shipping_city_name }
          : null
      );
      setSelectedShippingArea(
        (data.shipping_area_id || distributorData.shipping_area) && distributorData.shipping_area_name
          ? { id: data.shipping_area_id || distributorData.shipping_area, name: distributorData.shipping_area_name }
          : null
      );
      setSelectedSuperstockist(
        (data.superstockist_id || distributorData.superstockist) && distributorData.superstockist_name
          ? { id: data.superstockist_id || distributorData.superstockist, name: distributorData.superstockist_name }
          : null
      );
      
      // Load existing coverage areas from the main response
      if (distributorData.locations && distributorData.locations.length > 0) {
        const states: string[] = [];
        const cities: string[] = [];
        const areas: string[] = [];
        
        distributorData.locations.forEach((loc: any) => {
          if (loc.state && !states.includes(loc.state.toString())) states.push(loc.state.toString());
          if (loc.city && !cities.includes(loc.city.toString())) cities.push(loc.city.toString());
          if (loc.area && !areas.includes(loc.area.toString())) areas.push(loc.area.toString());
        });
        
        setSelectedLocationStates(states);
        setSelectedLocationCities(cities);
        setSelectedLocationAreas(areas);
      }
    }
  }, [distributorData, reset, id]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: distributorApi.createDistributor,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      queryClient.invalidateQueries({ queryKey: ['channelConfig'] });
      toastSuccess('Distributor created successfully');
      setTimeout(() => {
        navigate('/masters/distributor');
      }, 1000);
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to create distributor';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.code) {
          errorMessage = Array.isArray(data.code) ? data.code[0] : data.code;
        }
      }
      toastError(errorMessage);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: DistributorFormData) => distributorApi.updateDistributor(id!, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      queryClient.invalidateQueries({ queryKey: ['distributor', id] });
      queryClient.invalidateQueries({ queryKey: ['channelConfig'] });
      toastSuccess('Distributor updated successfully');
      setTimeout(() => {
        navigate('/masters/distributor');
      }, 1000);
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to update distributor';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.code) {
          errorMessage = Array.isArray(data.code) ? data.code[0] : data.code;
        }
      }
      toastError(errorMessage);
    },
  });

  const onSubmit = async (data: DistributorFormData) => {
    
    // Validate coverage areas
    if (selectedLocationStates.length === 0 && selectedLocationCities.length === 0 && selectedLocationAreas.length === 0) {
      toastError('At least one coverage area must be selected');
      setActiveTab(1);
      return;
    }
    
    // Clean up the data - convert empty strings to null for optional fields
    const cleanedData = {
      ...data,
      superstockist_id: data.superstockist_id || null,
      city_id: data.city_id || null,
      area_id: data.area_id || null,
      shipping_state_id: data.shipping_state_id || null,
      shipping_city_id: data.shipping_city_id || null,
      shipping_area_id: data.shipping_area_id || null,
      effective_from: data.effective_from || null,
      effective_to: data.effective_to || null,
      gstin: data.gstin?.trim() || undefined,
      pan: data.pan?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      mobile: data.mobile?.trim() || undefined,
      email: data.email?.trim() || undefined,
    };
    
    // Add locations to the form data (UUIDs as strings)
    const formDataWithLocations = {
      ...cleanedData,
      location_states: selectedLocationStates,
      location_cities: selectedLocationCities,
      location_areas: selectedLocationAreas,
    };
    
    
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync(formDataWithLocations);
      } else {
        await createMutation.mutateAsync(formDataWithLocations);
      }
    } catch (error) {
      // Error is handled by mutation's onError callback
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, attachmentType: string) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    setUploadingAttachment(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('attachment_type', attachmentType);

    try {
      await apiClient.post(`/api/masters/distributors/${id}/attachments/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toastSuccess('Attachment uploaded successfully');
      refetchAttachments();
    } catch (error: any) {
      toastError(error.response?.data?.detail || 'Failed to upload attachment');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!id) return;
    try {
      await apiClient.delete(`/api/masters/distributors/${id}/delete_attachment/`, {
        data: { attachment_id: attachmentId },
      });
      toastSuccess('Attachment deleted successfully');
      refetchAttachments();
    } catch (error: any) {
      toastError(error.response?.data?.detail || 'Failed to delete attachment');
    }
  };

  const getAttachmentsByType = (type: string) => {
    return attachments.filter((att: any) => att.attachment_type === type);
  };

  const renderAttachmentSection = (type: string, label: string, allowMultiple: boolean = false) => {
    const typeAttachments = getAttachmentsByType(type);
    const canUpload = allowMultiple || typeAttachments.length === 0;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          {label}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {typeAttachments.map((att: any) => (
            <Card key={att.id} sx={{ width: 200 }}>
              <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachFileIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2" noWrap>
                    {att.file.split('/').pop()}
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
          {canUpload && (
            <Card sx={{ width: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed', borderColor: 'divider' }}>
              <CardContent>
                <input
                  accept="image/*,.pdf"
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

  const handleBack = () => {
    navigate('/masters/distributor');
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingDistributor) {
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
            title={isEditMode ? 'Edit Distributor' : 'Add Distributor'}
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
              form="distributor-form"
              variant="contained"
              color="primary"
              size="small"
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Scrollable Content Area */}
      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ borderRadius: 0 }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(_e, newValue) => setActiveTab(newValue)}>
              <Tab label="General Information" />
              <Tab label="Coverage Areas" />
              <Tab label="Attachments" disabled={!isEditMode} />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <form id="distributor-form" onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ p: 3 }}>
              {/* Tab 1: General Information */}
              {activeTab === 0 && (
                <Box>
                  {/* Basic Information Section */}
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                    Basic Information
                  </Typography>
            <Grid container spacing={3}>
              {/* Code */}
              {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Code <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="code"
                  control={control}
                  rules={{
                    required: 'Code is required',
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., DIS001"
                      fullWidth
                      size="small"
                      error={!!errors.code}
                      helperText={errors.code?.message || 'Leave empty for auto-generation'}
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
              </Grid> */}

              {/* Name */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: 'Name is required',
                    maxLength: {
                      value: 200,
                      message: 'Name must not exceed 200 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., ABC Distributors"
                      fullWidth
                      size="small"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Company */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Company <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="company_id"
                  control={control}
                  rules={{ required: 'Company is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.COMPANIES_DROPDOWN}
                      value={selectedCompany}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedCompany(selectedOption);
                        onChange(selectedOption?.id || '');
                      }}
                      error={!!errors.company_id}
                      helperText={errors.company_id?.message}
                      disabled={isSubmitting}
                      placeholder="Select a company"
                    />
                  )}
                />
              </Grid>

              {/* Superstockist - Only show if enabled */}
              {channelConfig?.enable_superstockist && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                  >
                    Superstockist
                    {channelConfig?.enforce_channel_hierarchy && channelConfig?.enable_superstockist && (
                      <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}> *</Box>
                    )}
                  </Typography>
                  <Controller
                    name="superstockist_id"
                    control={control}
                    rules={{
                      required: channelConfig?.enforce_channel_hierarchy && channelConfig?.enable_superstockist
                        ? 'Superstockist is required when hierarchy is enforced'
                        : false,
                    }}
                    render={({ field: { onChange } }) => (
                      <SearchableDropdown
                        label=""
                        apiEndpoint={API_ENDPOINTS.SUPERSTOCKISTS}
                        value={selectedSuperstockist}
                        onChange={(selectedOption: DropdownOption | null) => {
                          setSelectedSuperstockist(selectedOption);
                          onChange(selectedOption?.id || '');
                        }}
                        error={!!errors.superstockist_id}
                        helperText={errors.superstockist_id?.message}
                        disabled={isSubmitting}
                        placeholder={channelConfig?.enforce_channel_hierarchy && channelConfig?.enable_superstockist ? "Select a superstockist" : "Select a superstockist (optional)"}
                      />
                    )}
                  />
                </Grid>
              )}

              {/* State */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  State <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="state_id"
                  control={control}
                  rules={{ required: 'State is required' }}
                  render={({ field }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.STATES}
                      value={selectedState}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedState(selectedOption);
                        field.onChange(selectedOption?.id || '');
                        // Clear city and area when state changes
                        setSelectedCity(null);
                        setSelectedArea(null);
                        setValue('city_id', '');
                        setValue('area_id', '');
                      }}
                      error={!!errors.state_id}
                      helperText={errors.state_id?.message}
                      disabled={isSubmitting}
                      placeholder="Select a state"
                    />
                  )}
                />
              </Grid>

              {/* City */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  City <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="city_id"
                  control={control}
                  rules={{ required: 'City is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.CITIES}
                      value={selectedCity}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedCity(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear area when city changes
                        setSelectedArea(null);
                      }}
                      additionalFilters={selectedState ? { state: selectedState.id } : undefined}
                      disabled={isSubmitting || !selectedState}
                      placeholder={selectedState ? "Select a city" : "Select state first"}
                      error={Boolean(errors.city_id)}
                      helperText={errors.city_id?.message}
                      required
                    />
                  )}
                />
              </Grid>

              {/* Area */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Area
                </Typography>
                <Controller
                  name="area_id"
                  control={control}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.AREAS}
                      value={selectedArea}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedArea(selectedOption);
                        onChange(selectedOption?.id || '');
                      }}
                      additionalFilters={selectedCity ? { city: selectedCity.id } : undefined}
                      disabled={isSubmitting || !selectedCity}
                      placeholder={selectedCity ? "Select a village/town" : "Select city first"}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Contact Information Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Contact Information
            </Typography>
            <Grid container spacing={3}>
              {/* Contact Person */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Contact Person
                </Typography>
                <Controller
                  name="contact_person"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., John Doe"
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Phone */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Phone
                </Typography>
                <Controller
                  name="phone"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[0-9]{10,15}$/,
                      message: 'Phone must be 10-15 digits',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        field.onChange(value);
                      }}
                      placeholder="e.g., 04012345678"
                      fullWidth
                      size="small"
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                      disabled={isSubmitting}
                      inputProps={{ inputMode: 'numeric' }}
                    />
                  )}
                />
              </Grid>

              {/* Mobile */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Mobile
                </Typography>
                <Controller
                  name="mobile"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[6-9][0-9]{9}$/,
                      message: 'Mobile must be 10 digits starting with 6-9',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        field.onChange(value);
                      }}
                      placeholder="e.g., 9876543210"
                      fullWidth
                      size="small"
                      error={!!errors.mobile}
                      helperText={errors.mobile?.message}
                      disabled={isSubmitting}
                      inputProps={{ inputMode: 'numeric' }}
                    />
                  )}
                />
              </Grid>

              {/* Email */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Email
                </Typography>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., contact@example.com"
                      fullWidth
                      size="small"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Contact Person 2 */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Contact Person 2
                </Typography>
                <Controller
                  name="contact_person_2"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., Jane Smith"
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Phone 2 */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Phone 2
                </Typography>
                <Controller
                  name="phone_2"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[0-9]{10,15}$/,
                      message: 'Phone must be 10-15 digits',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        field.onChange(value);
                      }}
                      placeholder="e.g., 04012345678"
                      fullWidth
                      size="small"
                      error={!!errors.phone_2}
                      helperText={errors.phone_2?.message}
                      disabled={isSubmitting}
                      inputProps={{ inputMode: 'numeric' }}
                    />
                  )}
                />
              </Grid>

              {/* Email 2 */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Email 2
                </Typography>
                <Controller
                  name="email_2"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., contact2@example.com"
                      fullWidth
                      size="small"
                      type="email"
                      error={!!errors.email_2}
                      helperText={errors.email_2?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Mobile 2 */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Mobile 2
                </Typography>
                <Controller
                  name="mobile_2"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[6-9][0-9]{9}$/,
                      message: 'Mobile must be 10 digits starting with 6-9',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        field.onChange(value);
                      }}
                      placeholder="e.g., 9876543210"
                      fullWidth
                      size="small"
                      error={!!errors.mobile_2}
                      helperText={errors.mobile_2?.message}
                      disabled={isSubmitting}
                      inputProps={{ inputMode: 'numeric' }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Billing Address Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Billing Address
            </Typography>
            <Grid container spacing={3}>
              {/* Billing Address */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Address
                </Typography>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Enter full billing address"
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Billing Pincode */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Pincode
                </Typography>
                <Controller
                  name="pincode"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[0-9]{6}$/,
                      message: 'Pincode must be 6 digits',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        field.onChange(value);
                      }}
                      placeholder="e.g., 500001"
                      fullWidth
                      size="small"
                      error={!!errors.pincode}
                      helperText={errors.pincode?.message}
                      disabled={isSubmitting}
                      inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Shipping Address Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Shipping Address
            </Typography>
            
            {/* Same as Billing Address Checkbox */}
            <Box sx={{ mb: 2 }}>
              <Controller
                name="shipping_same_as_billing"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        disabled={isSubmitting}
                      />
                    }
                    label="Same as Billing Address"
                  />
                )}
              />
            </Box>

            <Grid container spacing={3}>
              {/* Shipping State */}
              <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Shipping State
                </Typography>
                <Controller
                  name="shipping_state_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.STATES}
                      value={selectedShippingState}
                      onChange={(newValue) => {
                        const singleValue = Array.isArray(newValue) ? null : newValue;
                        setSelectedShippingState(singleValue);
                        field.onChange(singleValue?.id || '');
                        // Clear city and area when state changes
                        setSelectedShippingCity(null);
                        setSelectedShippingArea(null);
                      }}
                      disabled={isSubmitting || watch('shipping_same_as_billing')}
                      placeholder="Select a state"
                    />
                  )}
                />
              </Grid>

              {/* Shipping City */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Shipping City
                </Typography>
                <Controller
                  name="shipping_city_id"
                  control={control}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.CITIES}
                      value={selectedShippingCity}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedShippingCity(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear area when city changes
                        setSelectedShippingArea(null);
                      }}
                      additionalFilters={selectedShippingState ? { state: selectedShippingState.id } : undefined}
                      disabled={isSubmitting || watch('shipping_same_as_billing') || !selectedShippingState}
                      placeholder={selectedShippingState ? "Select a city" : "Select state first"}
                    />
                  )}
                />
              </Grid>

              {/* Shipping Village/Town */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Shipping Village/Town
                </Typography>
                <Controller
                  name="shipping_area_id"
                  control={control}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.AREAS}
                      value={selectedShippingArea}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedShippingArea(selectedOption);
                        onChange(selectedOption?.id || '');
                      }}
                      additionalFilters={selectedShippingCity ? { city: selectedShippingCity.id } : undefined}
                      disabled={isSubmitting || watch('shipping_same_as_billing') || !selectedShippingCity}
                      placeholder={selectedShippingCity ? "Select a village/town" : "Select city first"}
                    />
                  )}
                />
              </Grid>

              {/* Shipping Address */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Address
                </Typography>
                <Controller
                  name="shipping_address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Enter full shipping address"
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      disabled={isSubmitting || watch('shipping_same_as_billing')}
                    />
                  )}
                />
              </Grid>

              {/* Shipping Pincode */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Pincode
                </Typography>
                <Controller
                  name="shipping_pincode"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[0-9]{6}$/,
                      message: 'Pincode must be 6 digits',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        field.onChange(value);
                      }}
                      placeholder="e.g., 500001"
                      fullWidth
                      size="small"
                      error={!!errors.shipping_pincode}
                      helperText={errors.shipping_pincode?.message}
                      disabled={isSubmitting || watch('shipping_same_as_billing')}
                      inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Financial Information Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Financial Information
            </Typography>
            <Grid container spacing={3}>
              {/* GSTIN */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  GSTIN
                </Typography>
                <Controller
                  name="gstin"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                      message: 'Invalid GSTIN format',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., 29ABCDE1234F1Z5"
                      fullWidth
                      size="small"
                      error={!!errors.gstin}
                      helperText={errors.gstin?.message}
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      inputProps={{ maxLength: 15 }}
                    />
                  )}
                />
              </Grid>

              {/* PAN */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  PAN
                </Typography>
                <Controller
                  name="pan"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                      message: 'Invalid PAN format',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., ABCDE1234F"
                      fullWidth
                      size="small"
                      error={!!errors.pan}
                      helperText={errors.pan?.message}
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      inputProps={{ maxLength: 10 }}
                    />
                  )}
                />
              </Grid>

              {/* Aadhar */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Aadhar Number
                </Typography>
                <Controller
                  name="aadhar"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[0-9]{12}$/,
                      message: 'Aadhar must be 12 digits',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        field.onChange(value);
                      }}
                      placeholder="e.g., 123456789012"
                      fullWidth
                      size="small"
                      error={!!errors.aadhar}
                      helperText={errors.aadhar?.message}
                      disabled={isSubmitting}
                      inputProps={{ inputMode: 'numeric', maxLength: 12 }}
                    />
                  )}
                />
              </Grid>

              {/* Credit Limit */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Credit Limit (₹)
                </Typography>
                <Controller
                  name="credit_limit"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., 100000"
                      fullWidth
                      size="small"
                      type="number"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Credit Days */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Credit Days
                </Typography>
                <Controller
                  name="credit_days"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., 30"
                      fullWidth
                      size="small"
                      type="number"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Bank Details Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Bank Details
            </Typography>
            <Grid container spacing={3}>
              {/* Bank Account Number */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Account Number
                </Typography>
                <Controller
                  name="bank_account_number"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., 1234567890"
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Bank Name */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Bank Name
                </Typography>
                <Controller
                  name="bank_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., State Bank of India"
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Bank Branch */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Branch
                </Typography>
                <Controller
                  name="bank_branch"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., Main Branch"
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* IFSC Code */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  IFSC Code
                </Typography>
                <Controller
                  name="bank_ifsc"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                      message: 'Invalid IFSC format',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., SBIN0001234"
                      fullWidth
                      size="small"
                      error={!!errors.bank_ifsc}
                      helperText={errors.bank_ifsc?.message}
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      inputProps={{ maxLength: 11 }}
                    />
                  )}
                />
              </Grid>

              {/* Account Type */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Account Type
                </Typography>
                <Controller
                  name="bank_account_type"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                      SelectProps={{ native: true }}
                    >
                      <option value="">Select Type</option>
                      <option value="SAVINGS">Savings</option>
                      <option value="CURRENT">Current</option>
                    </TextField>
                  )}
                />
              </Grid>

              {/* Google Location */}
              <Grid size={{ xs: 12, sm: 6, md: 9 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Google Location
                </Typography>
                <Controller
                  name="google_location"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., https://maps.google.com/?q=..."
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Status & Other Information Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Status & Other Information
            </Typography>
            <Grid container spacing={3}>
              {/* Active Status */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      }
                      label="Active"
                    />
                  )}
                />
              </Grid>

              {/* Effective From */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Effective From
                </Typography>
                <Controller
                  name="effective_from"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      format="DD-MM-YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                      disabled={isSubmitting}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          InputLabelProps: { shrink: true },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Effective To */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Effective To
                </Typography>
                <Controller
                  name="effective_to"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      format="DD-MM-YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : null)}
                      disabled={isSubmitting}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          InputLabelProps: { shrink: true },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* ERP Code */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  ERP Code
                </Typography>
                <Controller
                  name="erp_code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., ERP001"
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>
              </Grid>
                </Box>
              )}

              {/* Tab 2: Coverage Areas */}
              {activeTab === 1 && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Select the states, cities, and areas this distributor operates in
                  </Typography>
                  <LocationCascadeSelector
                    selectedStates={selectedLocationStates}
                    selectedCities={selectedLocationCities}
                    selectedAreas={selectedLocationAreas}
                    onSelectionChange={(selection) => {
                      setSelectedLocationStates(selection.states);
                      setSelectedLocationCities(selection.cities);
                      setSelectedLocationAreas(selection.areas);
                    }}
                  />
                  {(selectedLocationStates.length > 0 || selectedLocationCities.length > 0 || selectedLocationAreas.length > 0) && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {selectedLocationStates.length} states, {selectedLocationCities.length} cities, {selectedLocationAreas.length} areas selected
                      </Typography>
                    </Box>
                )}
              </Box>
            )}

              {/* Tab 3: Attachments */}
              {activeTab === 2 && (
                <Box>
                  {uploadingAttachment && (
                    <Box sx={{ mb: 2 }}>
                      <Alert severity="info">Uploading attachment...</Alert>
                    </Box>
                  )}
                  {renderAttachmentSection('AADHAR', 'Aadhar Card')}
                  {renderAttachmentSection('PAN', 'PAN Card')}
                  {renderAttachmentSection('AGREEMENT', 'Agreement')}
                  {renderAttachmentSection('SHOP_PICTURE', 'Shop Picture')}
                  {renderAttachmentSection('CANCELLED_CHEQUE', 'Cancelled Cheque')}
                  {renderAttachmentSection('OWNER_PICTURE', 'Owner Picture')}
                  {renderAttachmentSection('OTHER', 'Other Documents', true)}
                </Box>
              )}
          </Box>
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

const DistributorFormWithGuard: React.FC = () => (
  <ChannelPartnerGuard partnerType="distributor">
    <DistributorForm />
  </ChannelPartnerGuard>
);

export default DistributorFormWithGuard;

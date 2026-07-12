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
  MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Save as SaveIcon, Delete as DeleteIcon, Upload as UploadIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { toDateString } from '../../../utils/format';
import SearchableDropdown from '../../../components/common/SearchableDropdown';
import ScreenHeader from '../../../components/common/ScreenHeader';
import ChannelPartnerGuard from '../../../components/guards/ChannelPartnerGuard';
import LocationCascadeSelector from '../../../components/masters/LocationCascadeSelector';
import LocationContactDialog from '../../../components/masters/LocationContactDialog';
import type { LocationContactFormData } from '../../../components/masters/LocationContactDialog';
import LocationContactTable from '../../../components/masters/LocationContactTable';
import type { LocationContact } from '../../../components/masters/LocationContactTable';
import AddIcon from '@mui/icons-material/Add';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { superstockistApi } from '../../../api/masters.api';
import { API_ENDPOINTS } from '../../../utils/constants';
import apiClient from '../../../api/axios.config';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import BusinessIcon from '@mui/icons-material/Business';
import type { SuperstockistFormData } from '../../../types/masters.types';
import type { DropdownOption } from '../../../types/common.types';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../../../utils/spacing';
import { generateClientId } from '../../../utils/id';

const SuperstockistForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const isEditMode = Boolean(id);

  usePageTitle(isEditMode ? 'Edit Superstockist' : 'Add Superstockist');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SuperstockistFormData>({
    defaultValues: {
      code: '',
      name: '',
      company_id: '',
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
  const [selectedLocationStates, setSelectedLocationStates] = useState<string[]>([]);
  const [selectedLocationCities, setSelectedLocationCities] = useState<string[]>([]);
  const [selectedLocationAreas, setSelectedLocationAreas] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<{[key: string]: File}>({});
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<LocationContact | null>(null);
  const [tempContacts, setTempContacts] = useState<LocationContact[]>([]);

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

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Superstockist', path: '/masters/superstockist', icon: <BusinessIcon fontSize="small" /> },
      { label: isEditMode ? 'Edit Superstockist' : 'Add Superstockist' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode]);

  // Fetch superstockist data for edit mode
  const { data: superstockistData, isLoading: isLoadingSuperstockist } = useQuery({
    queryKey: ['superstockist', id],
    queryFn: () => superstockistApi.getSuperstockist(id!),
    enabled: isEditMode,
  });

  // Fetch attachments for edit mode
  const { data: attachmentsData, refetch: refetchAttachments } = useQuery({
    queryKey: ['superstockistAttachments', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/masters/superstockists/${id}/attachments/`);
      return response.data;
    },
    enabled: isEditMode,
  });

  // Fetch contacts for edit mode
  const { data: contactsData } = useQuery({
    queryKey: ['superstockistContacts', id],
    queryFn: () => superstockistApi.getContacts(id!),
    enabled: isEditMode && !!id,
  });

  const contacts = contactsData?.results || contactsData || [];

  const createContactMutation = useMutation({
    mutationFn: (data: LocationContactFormData) => superstockistApi.createContact(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superstockistContacts', id] });
      toastSuccess('Contact added successfully');
    },
    onError: () => toastError('Failed to add contact'),
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ contactId, data }: { contactId: string; data: LocationContactFormData }) =>
      superstockistApi.updateContact(id!, contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superstockistContacts', id] });
      toastSuccess('Contact updated successfully');
    },
    onError: () => toastError('Failed to update contact'),
  });

  const deleteContactMutation = useMutation({
    mutationFn: (contactId: string) => superstockistApi.deleteContact(id!, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superstockistContacts', id] });
      toastSuccess('Contact deleted successfully');
    },
    onError: () => toastError('Failed to delete contact'),
  });

  useEffect(() => {
    if (attachmentsData) {
      setAttachments(attachmentsData);
    }
  }, [attachmentsData]);

  // Populate form when superstockist data is loaded
  useEffect(() => {
    if (superstockistData) {
      const data = superstockistData as any;
      reset({
        code: superstockistData.code || '',
        name: superstockistData.name || '',
        company_id: data.company_id || superstockistData.company || '',
        state_id: data.state_id || superstockistData.state || '',
        city_id: data.city_id || superstockistData.city || '',
        area_id: data.area_id || superstockistData.area || '',
        address: superstockistData.address || '',
        pincode: superstockistData.pincode || '',
        shipping_same_as_billing: superstockistData.shipping_same_as_billing ?? true,
        shipping_state_id: data.shipping_state_id || superstockistData.shipping_state || '',
        shipping_city_id: data.shipping_city_id || superstockistData.shipping_city || '',
        shipping_area_id: data.shipping_area_id || superstockistData.shipping_area || '',
        shipping_address: superstockistData.shipping_address || '',
        shipping_pincode: superstockistData.shipping_pincode || '',
        gstin: superstockistData.gstin || '',
        pan: superstockistData.pan || '',
        aadhar: superstockistData.aadhar || '',
        bank_account_number: superstockistData.bank_account_number || '',
        bank_name: superstockistData.bank_name || '',
        bank_branch: superstockistData.bank_branch || '',
        bank_ifsc: superstockistData.bank_ifsc || '',
        bank_account_type: superstockistData.bank_account_type || '',
        google_location: superstockistData.google_location || '',
        credit_limit: superstockistData.credit_limit ? parseFloat(superstockistData.credit_limit) : 0,
        credit_days: superstockistData.credit_days || 0,
        is_active: superstockistData.is_active,
        effective_from: superstockistData.effective_from || '',
        effective_to: superstockistData.effective_to || '',
        erp_code: superstockistData.erp_code || '',
      });
      setSelectedCompany(
        (data.company_id || superstockistData.company) && superstockistData.company_name 
          ? { id: data.company_id || superstockistData.company, name: superstockistData.company_name } 
          : null
      );
      setSelectedState(
        (data.state_id || superstockistData.state) && superstockistData.state_name
          ? { id: data.state_id || superstockistData.state, name: superstockistData.state_name }
          : null
      );
      setSelectedCity(
        (data.city_id || superstockistData.city) && superstockistData.city_name
          ? { id: data.city_id || superstockistData.city, name: superstockistData.city_name }
          : null
      );
      setSelectedArea(
        (data.area_id || superstockistData.area) && superstockistData.area_name
          ? { id: data.area_id || superstockistData.area, name: superstockistData.area_name }
          : null
      );
      setSelectedShippingState(
        (data.shipping_state_id || superstockistData.shipping_state) && superstockistData.shipping_state_name
          ? { id: data.shipping_state_id || superstockistData.shipping_state, name: superstockistData.shipping_state_name }
          : null
      );
      setSelectedShippingCity(
        (data.shipping_city_id || superstockistData.shipping_city) && superstockistData.shipping_city_name
          ? { id: data.shipping_city_id || superstockistData.shipping_city, name: superstockistData.shipping_city_name }
          : null
      );
      setSelectedShippingArea(
        (data.shipping_area_id || superstockistData.shipping_area) && superstockistData.shipping_area_name
          ? { id: data.shipping_area_id || superstockistData.shipping_area, name: superstockistData.shipping_area_name }
          : null
      );
      
      // Load existing coverage areas from the main response
      if (superstockistData.locations && superstockistData.locations.length > 0) {
        const states: string[] = [];
        const cities: string[] = [];
        const areas: string[] = [];
        
        superstockistData.locations.forEach((loc: any) => {
          if (loc.state && !states.includes(loc.state)) states.push(loc.state);
          if (loc.city && !cities.includes(loc.city)) cities.push(loc.city);
          if (loc.area && !areas.includes(loc.area)) areas.push(loc.area);
        });
        
        setSelectedLocationStates(states);
        setSelectedLocationCities(cities);
        setSelectedLocationAreas(areas);
      }
    }
  }, [superstockistData, reset, id]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: superstockistApi.createSuperstockist,
    onSuccess: async (newSuperstockist) => {
      // Create contacts if any
      if (tempContacts.length > 0) {
        await Promise.all(
          tempContacts.map(contact => 
            superstockistApi.createContact(newSuperstockist.id, contact)
          )
        );
      }
      queryClient.invalidateQueries({ queryKey: ['superstockists'] });
      toastSuccess('Superstockist created successfully');
      setTimeout(() => {
        navigate('/masters/superstockist');
      }, 1000);
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to create superstockist';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.errors) {
          const fieldErrors = Object.entries(data.errors)
            .map(([field, errors]: [string, any]) => {
              const errorList = Array.isArray(errors) ? errors : [errors];
              return `${field}: ${errorList.join(', ')}`;
            })
            .join('\n');
          errorMessage = `Validation failed:\n${fieldErrors}`;
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
    mutationFn: (data: SuperstockistFormData) => superstockistApi.updateSuperstockist(id!, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['superstockists'] });
      queryClient.invalidateQueries({ queryKey: ['superstockist', id] });
      toastSuccess('Superstockist updated successfully');
      setTimeout(() => {
        navigate('/masters/superstockist');
      }, 1000);
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to update superstockist';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.errors) {
          const fieldErrors = Object.entries(data.errors)
            .map(([field, errors]: [string, any]) => {
              const errorList = Array.isArray(errors) ? errors : [errors];
              return `${field}: ${errorList.join(', ')}`;
            })
            .join('\n');
          errorMessage = `Validation failed:\n${fieldErrors}`;
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, attachmentType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isEditMode) {
      setAttachmentFiles(prev => ({ ...prev, [attachmentType]: file }));
      toastSuccess('Attachment added');
      return;
    }

    setUploadingAttachment(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('attachment_type', attachmentType);

    try {
      await apiClient.post(`/api/masters/superstockists/${id}/upload_attachment/`, formData, {
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
      await apiClient.delete(`/api/masters/superstockists/${id}/attachments/${attachmentId}/`);
      toastSuccess('Attachment deleted successfully');
      refetchAttachments();
    } catch (error: any) {
      toastError(error.response?.data?.detail || 'Failed to delete attachment');
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setContactDialogOpen(true);
  };

  const handleEditContact = (contact: LocationContact) => {
    setEditingContact(contact);
    setContactDialogOpen(true);
  };

  const handleDeleteContact = (contactId: string) => {
    if (isEditMode) {
      deleteContactMutation.mutate(contactId);
    } else {
      setTempContacts(prev => prev.filter(c => c.id !== contactId));
    }
  };

  const handleContactSubmit = async (data: LocationContactFormData) => {
    if (isEditMode) {
      if (editingContact) {
        await updateContactMutation.mutateAsync({ contactId: editingContact.id, data });
      } else {
        await createContactMutation.mutateAsync(data);
      }
    } else {
      if (editingContact) {
        setTempContacts(prev => prev.map(c => 
          c.id === editingContact.id ? { ...c, ...data } : c
        ));
      } else {
        setTempContacts(prev => [...prev, { id: generateClientId(), ...data }]);
      }
    }
    setContactDialogOpen(false);
    setEditingContact(null);
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

  const onSubmit = async (data: SuperstockistFormData) => {
    
    // Validate coverage areas
    if (selectedLocationStates.length === 0 && selectedLocationCities.length === 0 && selectedLocationAreas.length === 0) {
      toastError('At least one coverage area must be selected');
      setActiveTab(1);
      return;
    }
    
    // Clean up the data - convert empty strings to undefined for optional fields
    const cleanedData = {
      ...data,
      city_id: data.city_id || undefined,
      area_id: data.area_id || undefined,
      shipping_state_id: data.shipping_state_id || undefined,
      shipping_city_id: data.shipping_city_id || undefined,
      shipping_area_id: data.shipping_area_id || undefined,
      effective_from: data.effective_from || undefined,
      effective_to: data.effective_to || undefined,
      gstin: data.gstin?.trim() || undefined,
      pan: data.pan?.trim() || undefined,
    };
    
    // Add locations to the form data (UUIDs as strings)
    const formDataWithLocations = {
      ...cleanedData,
      location_states: selectedLocationStates,
      location_cities: selectedLocationCities,
      location_areas: selectedLocationAreas,
    };
    
    
    const hasAttachments = Object.values(attachmentFiles).some(file => file && file.size > 0);
    
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync(formDataWithLocations as any);
      } else {
        if (hasAttachments) {
          const formData = new FormData();
          formData.append('data', JSON.stringify(formDataWithLocations));
          // Only append files that are valid File objects with size > 0
          Object.entries(attachmentFiles).forEach(([type, file]) => {
            if (file && file instanceof File && file.size > 0) {
              formData.append(type.toLowerCase(), file);
            }
          });
          await createMutation.mutateAsync(formData as any);
        } else {
          await createMutation.mutateAsync(formDataWithLocations as any);
        }
      }
    } catch (error) {
    }
  };

  const handleBack = () => {
    navigate('/masters/superstockist');
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingSuperstockist) {
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
            title={isEditMode ? 'Edit Superstockist' : 'Add Superstockist'}
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
              form="superstockist-form"
              variant="contained"
              color="primary"
              size="small"
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(onSubmit)();
              }}
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
              <Tab label="Attachments" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <form id="superstockist-form" onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ p: 3, position: 'relative' }}>
              {/* Tab 1: General Information */}
              <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
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
                  Code
                </Typography>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., SS001"
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
                  render={({ field: { onChange } }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.STATES}
                      value={selectedState}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedState(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear city and area when state changes
                        setSelectedCity(null);
                        setSelectedArea(null);
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
                  Area <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="area_id"
                  control={control}
                  rules={{ required: 'Area is required' }}
                  render={({ field: { onChange }, fieldState: { error } }) => (
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
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Contact Information Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Contact Information
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddContact}
                size="small"
              >
                Add Contact
              </Button>
            </Box>
            
            <LocationContactTable
              contacts={isEditMode ? contacts : tempContacts}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
              isLoading={isEditMode && (createContactMutation.isPending || updateContactMutation.isPending || deleteContactMutation.isPending)}
            />

            <Divider sx={{ my: 3 }} />

            {/* Billing Address Section */}
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
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
                    >
                      <MenuItem value="">Select Type</MenuItem>
                      <MenuItem value="SAVINGS">Savings</MenuItem>
                      <MenuItem value="CURRENT">Current</MenuItem>
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
                      onChange={(date) => field.onChange(toDateString(date) || '')}
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
                      onChange={(date) => field.onChange(toDateString(date) || null)}
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
              </Box>

              {/* Tab 2: Coverage Areas */}
              <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Select the states, cities, and areas this superstockist operates in
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
                </Box>

              {/* Tab 3: Attachments */}
              <Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
                <Box>
                  {uploadingAttachment && (
                    <Box sx={{ mb: 2 }}>
                      <Alert severity="info">Uploading attachment...</Alert>
                    </Box>
                  )}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                    {renderAttachmentSection('AADHAR', 'Aadhar Card')}
                    {renderAttachmentSection('PAN', 'PAN Card')}
                    {renderAttachmentSection('AGREEMENT', 'Agreement')}
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                    {renderAttachmentSection('SHOP_PICTURE', 'Shop Picture')}
                    {renderAttachmentSection('CANCELLED_CHEQUE', 'Cancelled Cheque')}
                    {renderAttachmentSection('OWNER_PICTURE', 'Owner Picture')}
                  </Box>
                  {renderAttachmentSection('OTHER', 'Other Documents', true)}
                </Box>
              </Box>
            </Box>
          </form>
        </Paper>
      </Box>

      <LocationContactDialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        onSubmit={handleContactSubmit}
        initialData={editingContact}
        isSubmitting={isEditMode && (createContactMutation.isPending || updateContactMutation.isPending)}
      />
    </Box>
  );
};

const SuperstockistFormWithGuard: React.FC = () => (
  <ChannelPartnerGuard partnerType="superstockist">
    <SuperstockistForm />
  </ChannelPartnerGuard>
);

export default SuperstockistFormWithGuard;

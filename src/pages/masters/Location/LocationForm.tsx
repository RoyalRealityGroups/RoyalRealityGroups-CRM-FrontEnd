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
} from '@mui/material';
import { Save as SaveIcon, Add as AddIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SearchableDropdown from '../../../components/common/SearchableDropdown';
import SearchableDropdownWithCreate from '../../../components/common/SearchableDropdownWithCreate';
import ScreenHeader from '../../../components/common/ScreenHeader';
import LocationContactDialog from '../../../components/masters/LocationContactDialog';
import type { LocationContactFormData } from '../../../components/masters/LocationContactDialog';
import LocationContactTable from '../../../components/masters/LocationContactTable';
import type { LocationContact } from '../../../components/masters/LocationContactTable';
import CountryFormDialog from '../Country/CountryFormDialog';
import StateFormDialog from '../State/StateFormDialog';
import DistrictFormDialog from '../District/DistrictFormDialog';
import MandalFormDialog from '../Mandal/MandalFormDialog';
import CityFormDialog from '../City/CityFormDialog';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { locationApi, countryApi, stateApi, districtApi, mandalApi, cityApi } from '../../../api/masters.api';
import { API_ENDPOINTS } from '../../../utils/constants';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import PlaceIcon from '@mui/icons-material/Place';
import type { LocationFormData } from '../../../types/masters.types';
import type { DropdownOption } from '../../../types/common.types';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../../../utils/spacing';

const LocationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const isEditMode = Boolean(id);

  usePageTitle(isEditMode ? 'Edit Location' : 'Add Location');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LocationFormData>({
    defaultValues: {
      code: '',
      name: '',
      company_ids: [],
      country_id: '',
      state_id: '',
      district_id: '',
      mandal_id: '',
      city_id: '',
      address: '',
      pincode: '',
      erp_code: '',
      erp_id: '',
    },
  });

  const [selectedCompany, setSelectedCompany] = useState<DropdownOption | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<DropdownOption | null>(null);
  const [selectedState, setSelectedState] = useState<DropdownOption | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DropdownOption | null>(null);
  const [selectedMandal, setSelectedMandal] = useState<DropdownOption | null>(null);
  const [selectedCity, setSelectedCity] = useState<DropdownOption | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<LocationContact | null>(null);
  const [tempContacts, setTempContacts] = useState<LocationContact[]>([]);
  const [editingTempIndex, setEditingTempIndex] = useState<number | null>(null);

  // Form dialog states
  const [countryFormOpen, setCountryFormOpen] = useState(false);
  const [stateFormOpen, setStateFormOpen] = useState(false);
  const [districtFormOpen, setDistrictFormOpen] = useState(false);
  const [mandalFormOpen, setMandalFormOpen] = useState(false);
  const [cityFormOpen, setCityFormOpen] = useState(false);

  const watchCountry = watch('country_id');
  const watchState = watch('state_id');
  const watchDistrict = watch('district_id');
  const watchMandal = watch('mandal_id');

  // Fetch contacts for edit mode
  const { data: contactsData, isLoading: isLoadingContacts } = useQuery({
    queryKey: ['location-contacts', id],
    queryFn: () => locationApi.getContacts(id!),
    enabled: isEditMode,
  });

  const contacts = (contactsData as any)?.results || contactsData || [];

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Location', path: '/masters/location', icon: <PlaceIcon fontSize="small" /> },
      { label: isEditMode ? 'Edit Location' : 'Add Location' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode]);

  // Fetch location data for edit mode
  const { data: locationData, isLoading: isLoadingLocation } = useQuery({
    queryKey: ['location', id],
    queryFn: () => locationApi.getLocation(id!),
    enabled: isEditMode,
  });

  // Populate form when location data is loaded
  useEffect(() => {
    if (locationData) {
      reset({
        code: locationData.code || '',
        name: locationData.name || '',
        company_ids: (locationData.companies || []).map((company) => company.id),
        country_id: locationData.country?.id || '',
        state_id: locationData.state?.id || '',
        district_id: locationData.district?.id || '',
        mandal_id: locationData.mandal?.id || '',
        city_id: locationData.city?.id || '',
        address: locationData.address || '',
        pincode: locationData.pincode || '',
        erp_code: locationData.erp_code || '',
        erp_id: locationData.erp_id || '',
      });
      setSelectedCompany(
        locationData.companies?.[0] ? { id: locationData.companies[0].id, name: locationData.companies[0].name } : null
      );
      setSelectedCountry(
        locationData.country ? { id: locationData.country.id, name: locationData.country.name } : null
      );
      setSelectedState(
        locationData.state ? { id: locationData.state.id, name: locationData.state.name } : null
      );
      setSelectedDistrict(
        locationData.district ? { id: locationData.district.id, name: locationData.district.name } : null
      );
      setSelectedMandal(
        locationData.mandal ? { id: locationData.mandal.id, name: locationData.mandal.name } : null
      );
      setSelectedCity(
        locationData.city ? { id: locationData.city.id, name: locationData.city.name } : null
      );
    }
  }, [locationData, reset]);

  // Reset state when country changes (only in add mode or when user manually changes)
  useEffect(() => {
    if (!isEditMode && watchCountry && selectedState && selectedState.id) {
      // Only reset if country actually changed
      setValue('state_id', '');
      setSelectedState(null);
      setValue('district_id', '');
      setSelectedDistrict(null);
      setValue('mandal_id', '');
      setSelectedMandal(null);
      setValue('city_id', '');
      setSelectedCity(null);
    }
  }, [watchCountry]);

  // Reset district, mandal, city when state changes
  useEffect(() => {
    if (!isEditMode && watchState && selectedDistrict && selectedDistrict.id) {
      setValue('district_id', '');
      setSelectedDistrict(null);
      setValue('mandal_id', '');
      setSelectedMandal(null);
      setValue('city_id', '');
      setSelectedCity(null);
    }
  }, [watchState]);

  // Reset mandal, city when district changes
  useEffect(() => {
    if (!isEditMode && watchDistrict && selectedMandal && selectedMandal.id) {
      setValue('mandal_id', '');
      setSelectedMandal(null);
      setValue('city_id', '');
      setSelectedCity(null);
    }
  }, [watchDistrict]);

  // Reset city when mandal changes
  useEffect(() => {
    if (!isEditMode && watchMandal && selectedCity && selectedCity.id) {
      setValue('city_id', '');
      setSelectedCity(null);
    }
  }, [watchMandal]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: locationApi.createLocation,
    onSuccess: async (newLocation) => {
      // Create contacts if any
      if (tempContacts.length > 0) {
        try {
          await Promise.all(
            tempContacts.map(contact => 
              locationApi.createContact(newLocation.id, {
                contact_person: contact.contact_person,
                phone: contact.phone,
                email: contact.email,
                designation: contact.designation,
                is_primary: contact.is_primary,
              })
            )
          );
        } catch (error) {
          toastError('Location created but failed to add some contacts');
        }
      }
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toastSuccess('Location created successfully');
      setTimeout(() => {
        navigate('/masters/location');
      }, 1000);
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to create location';
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
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        } else if (data.code) {
          errorMessage = Array.isArray(data.code) ? data.code[0] : data.code;
        }
      }
      toastError(errorMessage);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: LocationFormData) => locationApi.updateLocation(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location', id] });
      toastSuccess('Location updated successfully');
      setTimeout(() => {
        navigate('/masters/location');
      }, 1000);
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to update location';
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
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        } else if (data.code) {
          errorMessage = Array.isArray(data.code) ? data.code[0] : data.code;
        }
      }
      toastError(errorMessage);
    },
  });

  const onSubmit = async (data: LocationFormData) => {
    if (isEditMode) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleBack = () => {
    navigate('/masters/location');
  };

  // Contact mutations
  const createContactMutation = useMutation({
    mutationFn: (data: LocationContactFormData) => locationApi.createContact(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location-contacts', id] });
      queryClient.refetchQueries({ queryKey: ['location-contacts', id] });
      toastSuccess('Contact added successfully');
      setContactDialogOpen(false);
      setEditingContact(null);
    },
    onError: () => toastError('Failed to add contact'),
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ contactId, data }: { contactId: string; data: LocationContactFormData }) =>
      locationApi.updateContact(id!, contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location-contacts', id] });
      queryClient.refetchQueries({ queryKey: ['location-contacts', id] });
      toastSuccess('Contact updated successfully');
      setContactDialogOpen(false);
      setEditingContact(null);
    },
    onError: () => toastError('Failed to update contact'),
  });

  const deleteContactMutation = useMutation({
    mutationFn: (contactId: string) => locationApi.deleteContact(id!, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location-contacts', id] });
      queryClient.refetchQueries({ queryKey: ['location-contacts', id] });
      toastSuccess('Contact deleted successfully');
    },
    onError: () => toastError('Failed to delete contact'),
  });

  // Geographic master creation mutations
  const createCountryMutation = useMutation({
    mutationFn: countryApi.createCountry,
    onSuccess: (newCountry) => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      setSelectedCountry({ id: newCountry.id, name: newCountry.name });
      setValue('country_id', newCountry.id);
      setCountryFormOpen(false);
    },
  });

  const createStateMutation = useMutation({
    mutationFn: stateApi.createState,
    onSuccess: (newState) => {
      queryClient.invalidateQueries({ queryKey: ['states'] });
      setSelectedState({ id: newState.id, name: newState.name });
      setValue('state_id', newState.id);
      setStateFormOpen(false);
    },
  });

  const createDistrictMutation = useMutation({
    mutationFn: districtApi.createDistrict,
    onSuccess: (newDistrict) => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      setSelectedDistrict({ id: newDistrict.id, name: newDistrict.name });
      setValue('district_id', newDistrict.id);
      setDistrictFormOpen(false);
    },
  });

  const createMandalMutation = useMutation({
    mutationFn: mandalApi.createMandal,
    onSuccess: (newMandal) => {
      queryClient.invalidateQueries({ queryKey: ['mandals'] });
      setSelectedMandal({ id: newMandal.id, name: newMandal.name });
      setValue('mandal_id', newMandal.id);
      setMandalFormOpen(false);
    },
  });

  const createCityMutation = useMutation({
    mutationFn: cityApi.createCity,
    onSuccess: (newCity) => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      setSelectedCity({ id: newCity.id, name: newCity.name });
      setValue('city_id', newCity.id);
      setCityFormOpen(false);
    },
  });

  const handleAddContact = () => {
    setEditingContact(null);
    setEditingTempIndex(null);
    setContactDialogOpen(true);
  };

  const handleEditContact = (contact: LocationContact) => {
    if (isEditMode) {
      setEditingContact(contact);
      setEditingTempIndex(null);
    } else {
      const index = tempContacts.findIndex(c => c.id === contact.id);
      setEditingTempIndex(index);
      setEditingContact(contact);
    }
    setContactDialogOpen(true);
  };

  const handleDeleteContact = (contactId: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      if (isEditMode) {
        deleteContactMutation.mutate(contactId);
      } else {
        setTempContacts(prev => prev.filter(c => c.id !== contactId));
      }
    }
  };

  const handleContactSubmit = (data: LocationContactFormData) => {
    if (isEditMode) {
      if (editingContact) {
        updateContactMutation.mutate({ contactId: editingContact.id, data });
      } else {
        createContactMutation.mutate(data);
      }
    } else {
      if (editingTempIndex !== null) {
        setTempContacts(prev => prev.map((c, i) => 
          i === editingTempIndex ? { ...c, ...data } : c
        ));
      } else {
        setTempContacts(prev => [...prev, { id: Date.now().toString(), ...data }]);
      }
      setContactDialogOpen(false);
      setEditingContact(null);
      setEditingTempIndex(null);
    }
  };

  // Geographic master creation handlers
  const handleCountryCreate = async (data: any) => {
    await createCountryMutation.mutateAsync(data);
  };

  const handleStateCreate = async (data: any) => {
    await createStateMutation.mutateAsync(data);
  };

  const handleDistrictCreate = async (data: any) => {
    await createDistrictMutation.mutateAsync(data);
  };

  const handleMandalCreate = async (data: any) => {
    await createMandalMutation.mutateAsync(data);
  };

  const handleCityCreate = async (data: any) => {
    await createCityMutation.mutateAsync(data);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingLocation) {
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
            title={isEditMode ? 'Edit Location' : 'Add Location'}
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
              form="location-form"
              variant="contained"
              color="primary"
              size="small"
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Location' : 'Create Location'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Scrollable Content Area */}
      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ p: 3, borderRadius: 0 }}>
          <form id="location-form" onSubmit={handleSubmit(onSubmit)}>
            {/* Basic Information Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Basic Information
            </Typography>
            <Grid container spacing={3}>
              {/* Location Code */}
              {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Location Code
                </Typography>
                <Controller
                  name="code"
                  control={control}

                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Leave empty for auto-generation"
                      fullWidth
                      size="small"
                      error={!!errors.code}
                      helperText={errors.code?.message || 'Auto-generated if left empty'}
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
              </Grid> */}

              {/* Location Name */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Location Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: 'Location name is required',
                    validate: (value) => value?.trim() ? true : 'Location name cannot be empty or contain only spaces',
                    maxLength: {
                      value: 100,
                      message: 'Name must not exceed 100 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Enter location name"
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
                  name="company_ids"
                  control={control}
                  rules={{ required: 'Company is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.COMPANIES_DROPDOWN}
                      value={selectedCompany}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedCompany(selectedOption);
                        onChange(selectedOption ? [String(selectedOption.id)] : []);
                      }}
                      error={!!errors.company_ids}
                      helperText={errors.company_ids?.message}
                      disabled={isSubmitting}
                      placeholder="Select a company"
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Location Details Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Location Details
            </Typography>
            <Grid container spacing={3}>
              {/* Country */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Country <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="country_id"
                  control={control}
                  rules={{ required: 'Country is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.COUNTRIES}
                      value={selectedCountry}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedCountry(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear dependent fields
                        setSelectedState(null);
                        setSelectedDistrict(null);
                        setSelectedMandal(null);
                        setSelectedCity(null);
                        setValue('state_id', '');
                        setValue('district_id', '');
                        setValue('mandal_id', '');
                        setValue('city_id', '');
                      }}
                      onCreateClick={() => setCountryFormOpen(true)}
                      error={!!errors.country_id}
                      helperText={errors.country_id?.message}
                      disabled={isSubmitting}
                      placeholder="Select a country"
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
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.STATES}
                      value={selectedState}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedState(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear dependent fields
                        setSelectedDistrict(null);
                        setSelectedMandal(null);
                        setSelectedCity(null);
                        setValue('district_id', '');
                        setValue('mandal_id', '');
                        setValue('city_id', '');
                      }}
                      onCreateClick={() => setStateFormOpen(true)}
                      additionalFilters={watchCountry ? { country: watchCountry } : undefined}
                      error={!!errors.state_id}
                      helperText={errors.state_id?.message}
                      disabled={isSubmitting || !watchCountry}
                      placeholder={watchCountry ? "Select a state" : "Select country first"}
                    />
                  )}
                />
              </Grid>

              {/* District */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  District <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="district_id"
                  control={control}
                  rules={{ required: 'District is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.DISTRICTS}
                      value={selectedDistrict}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedDistrict(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear dependent fields
                        setSelectedMandal(null);
                        setSelectedCity(null);
                        setValue('mandal_id', '');
                        setValue('city_id', '');
                      }}
                      onCreateClick={() => setDistrictFormOpen(true)}
                      additionalFilters={watchState ? { state: watchState } : undefined}
                      error={!!errors.district_id}
                      helperText={errors.district_id?.message}
                      disabled={isSubmitting || !watchState}
                      placeholder={watchState ? "Select a district" : "Select state first"}
                    />
                  )}
                />
              </Grid>

              {/* Mandal */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Mandal <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="mandal_id"
                  control={control}
                  rules={{ required: 'Mandal is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.MANDALS}
                      value={selectedMandal}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedMandal(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear dependent field
                        setSelectedCity(null);
                        setValue('city_id', '');
                      }}
                      onCreateClick={() => setMandalFormOpen(true)}
                      additionalFilters={watchDistrict ? { district: watchDistrict } : undefined}
                      error={!!errors.mandal_id}
                      helperText={errors.mandal_id?.message}
                      disabled={isSubmitting || !watchDistrict}
                      placeholder={watchDistrict ? "Select a mandal" : "Select district first"}
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
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.CITIES}
                      value={selectedCity}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedCity(selectedOption);
                        onChange(selectedOption?.id || '');
                      }}
                      onCreateClick={() => setCityFormOpen(true)}
                      additionalFilters={watchMandal ? { mandal: watchMandal } : undefined}
                      error={!!errors.city_id}
                      helperText={errors.city_id?.message}
                      disabled={isSubmitting || !watchMandal}
                      placeholder={watchMandal ? "Select a city" : "Select mandal first"}
                    />
                  )}
                />
              </Grid>

              {/* Address */}
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
                  rules={{
                    maxLength: {
                      value: 500,
                      message: 'Address must not exceed 500 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Enter full address"
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      error={!!errors.address}
                      helperText={errors.address?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Pincode */}
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
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., 500001"
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
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
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddContact}
                disabled={isSubmitting}
              >
                Add Contact
              </Button>
            </Box>
            <LocationContactTable
              contacts={isEditMode ? contacts : tempContacts}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
              isLoading={isEditMode ? (isLoadingContacts || deleteContactMutation.isPending) : false}
            />

            <Divider sx={{ my: 3 }} />

            {/* ERP Integration Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              ERP Integration
            </Typography>
            <Grid container spacing={3}>
              {/* ERP Code */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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

              {/* ERP ID */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  ERP ID
                </Typography>
                <Controller
                  name="erp_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., 12345"
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>

      {/* Contact Dialog */}
      <LocationContactDialog
        open={contactDialogOpen}
        onClose={() => {
          setContactDialogOpen(false);
          setEditingContact(null);
        }}
        onSubmit={handleContactSubmit}
        initialData={editingContact}
        isSubmitting={createContactMutation.isPending || updateContactMutation.isPending}
      />

      {/* Geographic Master Form Dialogs */}
      <CountryFormDialog
        open={countryFormOpen}
        onClose={() => setCountryFormOpen(false)}
        onSubmit={handleCountryCreate}
        loading={createCountryMutation.isPending}
      />

      <StateFormDialog
        open={stateFormOpen}
        onClose={() => setStateFormOpen(false)}
        onSubmit={handleStateCreate}
        loading={createStateMutation.isPending}
        prefilledCountryId={selectedCountry?.id ? String(selectedCountry.id) : undefined}
      />

      <DistrictFormDialog
        open={districtFormOpen}
        onClose={() => setDistrictFormOpen(false)}
        onSubmit={handleDistrictCreate}
        loading={createDistrictMutation.isPending}
        prefilledCountryId={selectedCountry?.id ? String(selectedCountry.id) : undefined}
        prefilledStateId={selectedState?.id ? String(selectedState.id) : undefined}
      />

      <MandalFormDialog
        open={mandalFormOpen}
        onClose={() => setMandalFormOpen(false)}
        onSubmit={handleMandalCreate}
        loading={createMandalMutation.isPending}
        prefilledCountryId={selectedCountry?.id ? String(selectedCountry.id) : undefined}
        prefilledStateId={selectedState?.id ? String(selectedState.id) : undefined}
        prefilledDistrictId={selectedDistrict?.id ? String(selectedDistrict.id) : undefined}
      />

      <CityFormDialog
        open={cityFormOpen}
        onClose={() => setCityFormOpen(false)}
        onSubmit={handleCityCreate}
        loading={createCityMutation.isPending}
        prefilledCountryId={selectedCountry?.id ? String(selectedCountry.id) : undefined}
        prefilledStateId={selectedState?.id ? String(selectedState.id) : undefined}
        prefilledDistrictId={selectedDistrict?.id ? String(selectedDistrict.id) : undefined}
        prefilledMandalId={selectedMandal?.id ? String(selectedMandal.id) : undefined}
      />
    </Box>
  );
};

export default LocationForm;

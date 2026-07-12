import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  IconButton,
  Typography,
  Grid,
  Avatar,
} from '@mui/material';
import { Close as CloseIcon, CloudUpload as CloudUploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import SearchableDropdownWithCreate from '../../../components/common/SearchableDropdownWithCreate';
import StateFormDialog from '../State/StateFormDialog';
import DistrictFormDialog from '../District/DistrictFormDialog';
import MandalFormDialog from '../Mandal/MandalFormDialog';
import CityFormDialog from '../City/CityFormDialog';
import { API_ENDPOINTS } from '../../../utils/constants';
import { stateApi, districtApi, mandalApi, cityApi } from '../../../api/masters.api';
import type { Company, CompanyFormData, StateFormData, DistrictFormData, MandalFormData, CityFormData } from '../../../types/masters.types';
import type { DropdownOption } from '../../../types/common.types';
import { CONTACT_EMAIL_REGEX, CONTACT_PHONE_MAX_LENGTH, CONTACT_PHONE_MIN_LENGTH, CONTACT_PHONE_REGEX, PHONE_FIELD_HELPER_TEXT, sanitizePhoneInput } from '../../../utils/validation';

interface CompanyFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  company?: Company | null;
  loading?: boolean;
}

const CompanyFormDialog: React.FC<CompanyFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  company,
  loading = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CompanyFormData>({
    defaultValues: {
      code: '',
      name: '',
      email: '',
      phone: '',
      state_id: '',
      district_id: '',
      mandal_id: '',
      city_id: '',
      address: '',
      pan_number: '',
      gst_number: '',
      logo: null,
    },
  });

  const [selectedState, setSelectedState] = useState<DropdownOption | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DropdownOption | null>(null);
  const [selectedMandal, setSelectedMandal] = useState<DropdownOption | null>(null);
  const [selectedCity, setSelectedCity] = useState<DropdownOption | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stateFormOpen, setStateFormOpen] = useState(false);
  const [districtFormOpen, setDistrictFormOpen] = useState(false);
  const [mandalFormOpen, setMandalFormOpen] = useState(false);
  const [cityFormOpen, setCityFormOpen] = useState(false);
  const queryClient = useQueryClient();

  const stateId = watch('state_id');
  const districtId = watch('district_id');
  const mandalId = watch('mandal_id');

  // State creation mutation
  const createStateMutation = useMutation({
    mutationFn: (data: StateFormData) => stateApi.createState(data),
    onSuccess: (newState) => {
      queryClient.invalidateQueries({ queryKey: ['states'] });
      setSelectedState({ id: newState.id, name: newState.name });
      control._formValues.state_id = newState.id;
      setStateFormOpen(false);
    },
  });

  // District creation mutation
  const createDistrictMutation = useMutation({
    mutationFn: (data: DistrictFormData) => districtApi.createDistrict(data),
    onSuccess: (newDistrict) => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      setSelectedDistrict({ id: newDistrict.id, name: newDistrict.name });
      control._formValues.district_id = newDistrict.id;
      setDistrictFormOpen(false);
    },
  });

  // Mandal creation mutation
  const createMandalMutation = useMutation({
    mutationFn: (data: MandalFormData) => mandalApi.createMandal(data),
    onSuccess: (newMandal) => {
      queryClient.invalidateQueries({ queryKey: ['mandals'] });
      setSelectedMandal({ id: newMandal.id, name: newMandal.name });
      control._formValues.mandal_id = newMandal.id;
      setMandalFormOpen(false);
    },
  });

  // City creation mutation
  const createCityMutation = useMutation({
    mutationFn: (data: CityFormData) => cityApi.createCity(data),
    onSuccess: (newCity) => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      setSelectedCity({ id: newCity.id, name: newCity.name });
      control._formValues.city_id = newCity.id;
      setCityFormOpen(false);
    },
  });

  // Reset form when dialog opens/closes or company changes
  useEffect(() => {
    if (open) {
      reset({
        code: company?.code || '',
        name: company?.name || '',
        email: company?.email || '',
        phone: company?.phone || '',
        state_id: company?.state?.id || '',
        district_id: '',
        mandal_id: '',
        city_id: company?.city?.id || '',
        address: company?.address || '',
        pan_number: company?.pan_number || '',
        gst_number: company?.gst_number || '',
        logo: null,
      });
      setSelectedState(
        company?.state ? { id: company.state.id, name: company.state.name } : null
      );
      setSelectedDistrict(null);
      setSelectedMandal(null);
      setSelectedCity(
        company?.city ? { id: company.city.id, name: company.city.name } : null
      );
      setLogoPreview(company?.logo || null);
      setLogoFile(null);
    }
  }, [open, company, reset]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        return;
      }
      setLogoFile(file);
      setValue('logo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setValue('logo', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = async (data: CompanyFormData) => {
    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedMandal(null);
    setSelectedCity(null);
    setLogoPreview(null);
    setLogoFile(null);
    setStateFormOpen(false);
    setDistrictFormOpen(false);
    setMandalFormOpen(false);
    setCityFormOpen(false);
    onClose();
  };

  const handleStateCreate = async (data: StateFormData) => {
    return new Promise<void>((resolve) => {
      createStateMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  const handleDistrictCreate = async (data: DistrictFormData) => {
    return new Promise<void>((resolve) => {
      createDistrictMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  const handleMandalCreate = async (data: MandalFormData) => {
    return new Promise<void>((resolve) => {
      createMandalMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  const handleCityCreate = async (data: CityFormData) => {
    return new Promise<void>((resolve) => {
      createCityMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={(_event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
        handleClose();
      }}
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {company ? 'Edit Company' : 'Add Company'}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          size="small"
          disabled={loading}
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent sx={{ py: 1 }}>
          <Grid container spacing={2}>
            {/* Company Code Field */}
            {/* <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Company Code
                </Typography>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Leave empty for auto-generation"
                      fullWidth
                      error={!!errors.code}
                      helperText={errors.code?.message || 'Leave empty for auto-generation'}
                      disabled={loading}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid> */}

            {/* Company Name Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Company Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: 'Company name is required',
                    maxLength: {
                      value: 200,
                      message: 'Company name must not exceed 200 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., Acme Corporation"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      disabled={loading}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* Email Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
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
                      value: CONTACT_EMAIL_REGEX,
                      message: 'Please enter a valid email address (e.g., john@company.com)',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., contact@company.com"
                      fullWidth
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      disabled={loading}
                      inputProps={{
                        inputMode: 'email',
                      }}
                      onKeyPress={(e) => {
                        // Prevent spaces in email
                        if (e.key === ' ') {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        // Remove spaces and convert to lowercase
                        const value = e.target.value.replace(/\s/g, '').toLowerCase();
                        field.onChange(value);
                      }}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* Phone Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Phone No
                </Typography>
                <Controller
                  name="phone"
                  control={control}
                  rules={{
                    pattern: {
                      value: CONTACT_PHONE_REGEX,
                      message: 'Please enter a valid phone number (e.g., +91 9876543210 or 040-12345678)',
                    },
                    minLength: {
                      value: CONTACT_PHONE_MIN_LENGTH,
                      message: 'Phone number must be at least 10 digits',
                    },
                    maxLength: {
                      value: CONTACT_PHONE_MAX_LENGTH,
                      message: 'Phone number cannot exceed 15 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., 9876543210"
                      fullWidth
                      error={!!errors.phone}
                      helperText={errors.phone?.message || PHONE_FIELD_HELPER_TEXT}
                      disabled={loading}
                      inputProps={{
                        maxLength: CONTACT_PHONE_MAX_LENGTH,
                      }}
                      onChange={(e) => {
                        const value = sanitizePhoneInput(e.target.value);
                        field.onChange(value);
                      }}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* PAN Number Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  PAN Number
                </Typography>
                <Controller
                  name="pan_number"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                      message: 'Invalid PAN format (e.g., ABCDE1234F)',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., ABCDE1234F"
                      fullWidth
                      error={!!errors.pan_number}
                      helperText={errors.pan_number?.message}
                      disabled={loading}
                      inputProps={{
                        maxLength: 10,
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9A-Za-z]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
                        field.onChange(value);
                      }}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* GST Number Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  GST Number
                </Typography>
                <Controller
                  name="gst_number"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                      message: 'Invalid GST number format (e.g., 27AAAPA1234A1Z6)',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., 27AAAPA1234A1Z6"
                      fullWidth
                      error={!!errors.gst_number}
                      helperText={errors.gst_number?.message}
                      disabled={loading}
                      inputProps={{
                        maxLength: 15,
                      }}
                      onKeyPress={(e) => {
                        // Only allow alphanumeric characters
                        if (!/[0-9A-Za-z]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        // Remove non-alphanumeric and convert to uppercase
                        const value = e.target.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
                        field.onChange(value);
                      }}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* State Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  State <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="state_id"
                  control={control}
                  rules={{
                    required: 'State is required',
                  }}
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
                        setValue('district_id', '', { shouldValidate: false });
                        setValue('mandal_id', '', { shouldValidate: false });
                        setValue('city_id', '', { shouldValidate: false });
                      }}
                      onCreateClick={() => setStateFormOpen(true)}
                      error={!!errors.state_id}
                      helperText={errors.state_id?.message}
                      disabled={loading}
                      placeholder="Select a state"
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* District Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  District <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="district_id"
                  control={control}
                  rules={{
                    required: 'District is required',
                  }}
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
                        setValue('mandal_id', '', { shouldValidate: false });
                        setValue('city_id', '', { shouldValidate: false });
                      }}
                      onCreateClick={() => setDistrictFormOpen(true)}
                      additionalFilters={stateId ? { state: stateId } : undefined}
                      error={!!errors.district_id}
                      helperText={errors.district_id?.message}
                      disabled={loading || !stateId}
                      placeholder={stateId ? "Select a district" : "Select state first"}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* Mandal Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Mandal <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="mandal_id"
                  control={control}
                  rules={{
                    required: 'Mandal is required',
                  }}
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
                        setValue('city_id', '', { shouldValidate: false });
                      }}
                      onCreateClick={() => setMandalFormOpen(true)}
                      additionalFilters={districtId ? { district: districtId } : undefined}
                      error={!!errors.mandal_id}
                      helperText={errors.mandal_id?.message}
                      disabled={loading || !districtId}
                      placeholder={districtId ? "Select a mandal" : "Select district first"}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* City Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  City <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="city_id"
                  control={control}
                  rules={{
                    required: 'City is required',
                  }}
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
                      additionalFilters={mandalId ? { mandal: mandalId } : undefined}
                      error={!!errors.city_id}
                      helperText={errors.city_id?.message}
                      disabled={loading || !mandalId}
                      placeholder={mandalId ? "Select a city" : "Select mandal first"}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* Address Field */}
            <Grid size={{ xs: 12 }}>
              <Box>
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
                      placeholder="Enter company address"
                      fullWidth
                      multiline
                      rows={2}
                      error={!!errors.address}
                      helperText={errors.address?.message}
                      disabled={loading}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* Logo Field */}
            <Grid size={{ xs: 12 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Company Logo
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {logoPreview ? (
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={logoPreview}
                        alt="Company Logo"
                        variant="rounded"
                        sx={{ width: 60, height: 60 }}
                      />
                      <IconButton
                        size="small"
                        onClick={handleRemoveLogo}
                        disabled={loading}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: 'error.main',
                          color: 'white',
                          '&:hover': { backgroundColor: 'error.dark' },
                          width: 24,
                          height: 24,
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        border: '2px dashed',
                        borderColor: 'grey.300',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'grey.50',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        No Logo
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      style={{ display: 'none' }}
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        disabled={loading}
                        startIcon={<CloudUploadIcon />}
                        size="small"
                      >
                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                    </label>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Max file size: 2MB. Formats: JPG, PNG, GIF
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'flex-end' }}>
          <Button 
            onClick={handleClose} 
            disabled={loading}
            variant="outlined"
            color="secondary"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Saving...' : company ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>

      {/* State Creation Dialog */}
      <StateFormDialog
        open={stateFormOpen}
        onClose={() => setStateFormOpen(false)}
        onSubmit={handleStateCreate}
        loading={createStateMutation.isPending}
      />

      {/* District Creation Dialog */}
      <DistrictFormDialog
        open={districtFormOpen}
        onClose={() => setDistrictFormOpen(false)}
        onSubmit={handleDistrictCreate}
        loading={createDistrictMutation.isPending}
        prefilledStateId={selectedState?.id ? String(selectedState.id) : undefined}
      />

      {/* Mandal Creation Dialog */}
      <MandalFormDialog
        open={mandalFormOpen}
        onClose={() => setMandalFormOpen(false)}
        onSubmit={handleMandalCreate}
        loading={createMandalMutation.isPending}
        prefilledStateId={selectedState?.id ? String(selectedState.id) : undefined}
        prefilledDistrictId={selectedDistrict?.id ? String(selectedDistrict.id) : undefined}
      />

      {/* City Creation Dialog */}
      <CityFormDialog
        open={cityFormOpen}
        onClose={() => setCityFormOpen(false)}
        onSubmit={handleCityCreate}
        loading={createCityMutation.isPending}
        prefilledStateId={selectedState?.id ? String(selectedState.id) : undefined}
        prefilledDistrictId={selectedDistrict?.id ? String(selectedDistrict.id) : undefined}
        prefilledMandalId={selectedMandal?.id ? String(selectedMandal.id) : undefined}
      />
    </Dialog>
  );
};

export default CompanyFormDialog;

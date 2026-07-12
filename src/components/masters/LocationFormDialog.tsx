import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import SearchableDropdown from '../common/SearchableDropdown';
import { API_ENDPOINTS } from '../../utils/constants';
import type { Location, LocationFormData } from '../../types/masters.types';
import type { DropdownOption } from '../../types/common.types';

interface LocationFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LocationFormData) => Promise<void>;
  location?: Location | null;
  loading?: boolean;
}

const LocationFormDialog: React.FC<LocationFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  location,
  loading = false,
}) => {
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
      city_id: '',
      state_id: '',
      country_id: '',
      address: '',
      pincode: '',
      erp_code: '',
      erp_id: '',
    },
  });

  const [selectedCompanies, setSelectedCompanies] = useState<DropdownOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<DropdownOption | null>(null);
  const [selectedState, setSelectedState] = useState<DropdownOption | null>(null);
  const [selectedCity, setSelectedCity] = useState<DropdownOption | null>(null);

  const watchCountry = watch('country_id');
  const watchState = watch('state_id');

  // Reset form when dialog opens/closes or location changes
  useEffect(() => {
    if (open) {
      reset({
        code: location?.code || '',
        name: location?.name || '',
        company_ids: (location?.companies || []).map((company) => company.id),
        city_id: location?.city?.id || '',
        state_id: location?.state?.id || '',
        country_id: location?.country?.id || '',
        address: location?.address || '',
        pincode: location?.pincode || '',
        erp_code: location?.erp_code || '',
        erp_id: location?.erp_id || '',
      });
      setSelectedCompanies(
        (location?.companies || []).map((company) => ({ id: company.id, name: company.name }))
      );
      setSelectedCountry(
        location?.country ? { id: location.country.id, name: location.country.name } : null
      );
      setSelectedState(
        location?.state ? { id: location.state.id, name: location.state.name } : null
      );
      setSelectedCity(
        location?.city ? { id: location.city.id, name: location.city.name } : null
      );
    }
  }, [open, location, reset]);

  // Reset state when country changes
  useEffect(() => {
    if (!location && watchCountry && selectedState) {
      setValue('state_id', '');
      setSelectedState(null);
      setValue('city_id', '');
      setSelectedCity(null);
    }
  }, [watchCountry, location]);

  // Reset city when state changes
  useEffect(() => {
    if (!location && watchState && selectedCity) {
      setValue('city_id', '');
      setSelectedCity(null);
    }
  }, [watchState, location]);

  const handleFormSubmit = async (data: LocationFormData) => {
    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    setSelectedCompanies([]);
    setSelectedCountry(null);
    setSelectedState(null);
    setSelectedCity(null);
    onClose();
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
        {location ? 'Edit Location' : 'Add Location'}
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
            {/* Location Code Field */}
            {/* <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
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

            {/* Location Name Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
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
                    maxLength: {
                      value: 100,
                      message: 'Location name must not exceed 100 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., Main Warehouse"
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

            {/* Company Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Company
                </Typography>
                <Controller
                  name="company_ids"
                  control={control}
                  rules={{ required: 'At least one company is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.COMPANIES_DROPDOWN}
                      value={selectedCompanies}
                      onChange={(selectedOption) => {
                        const options = Array.isArray(selectedOption)
                          ? selectedOption
                          : selectedOption
                            ? [selectedOption]
                            : [];
                        setSelectedCompanies(options);
                        onChange(options.map((option) => String(option.id)));
                      }}
                      error={!!errors.company_ids}
                      helperText={errors.company_ids?.message}
                      disabled={loading}
                      placeholder="Select one or more companies"
                      multiple
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* Country Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
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
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.COUNTRIES}
                      value={selectedCountry}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedCountry(selectedOption);
                        onChange(selectedOption?.id || '');
                      }}
                      error={!!errors.country_id}
                      helperText={errors.country_id?.message}
                      disabled={loading}
                      placeholder="Select a country"
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
                  rules={{ required: 'State is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.STATES}
                      value={selectedState}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedState(selectedOption);
                        onChange(selectedOption?.id || '');
                      }}
                      additionalFilters={watchCountry ? { country: watchCountry } : undefined}
                      error={!!errors.state_id}
                      helperText={errors.state_id?.message}
                      disabled={loading || !watchCountry}
                      placeholder="Select a state"
                    />
                  )}
                />
                {!watchCountry && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Please select a country first
                  </Typography>
                )}
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
                  rules={{ required: 'City is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.CITIES}
                      value={selectedCity}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedCity(selectedOption);
                        onChange(selectedOption?.id || '');
                      }}
                      additionalFilters={watchState ? { state: watchState } : undefined}
                      error={!!errors.city_id}
                      helperText={errors.city_id?.message}
                      disabled={loading || !watchState}
                      placeholder="Select a city"
                    />
                  )}
                />
                {!watchState && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Please select a state first
                  </Typography>
                )}
              </Box>
            </Grid>

            {/* Pincode Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
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
                      disabled={loading}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* ERP Code Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
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
                      disabled={loading}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* ERP ID Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
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
                      disabled={loading}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
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
                      placeholder="Enter full address"
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
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default LocationFormDialog;

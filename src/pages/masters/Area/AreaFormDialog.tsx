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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '../../../utils/constants';
import type { Area, AreaFormData, CountryFormData, StateFormData, DistrictFormData, MandalFormData, CityFormData } from '../../../types/masters.types';
import type { DropdownOption } from '../../../types/common.types';
import SearchableDropdownWithCreate from '../../../components/common/SearchableDropdownWithCreate';
import CountryFormDialog from '../Country/CountryFormDialog';
import StateFormDialog from '../State/StateFormDialog';
import DistrictFormDialog from '../District/DistrictFormDialog';
import MandalFormDialog from '../Mandal/MandalFormDialog';
import CityFormDialog from '../City/CityFormDialog';
import { countryApi, stateApi, districtApi, mandalApi, cityApi } from '../../../api/masters.api';

interface AreaFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AreaFormData) => Promise<void>;
  area?: Area | null;
  loading?: boolean;
  prefilledCountryId?: string;
  prefilledStateId?: string;
  prefilledDistrictId?: string;
  prefilledMandalId?: string;
  prefilledCityId?: string;
}

const AreaFormDialog: React.FC<AreaFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  area,
  loading = false,
  prefilledCountryId,
  prefilledStateId,
  prefilledDistrictId,
  prefilledMandalId,
  prefilledCityId,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AreaFormData>({
    defaultValues: {
      name: '',
      country_id: '',
      state_id: '',
      district_id: '',
      mandal_id: '',
      city_id: '',
      pincode: '',
      is_active: true,
    },
  });

  const [selectedCountry, setSelectedCountry] = useState<DropdownOption | null>(null);
  const [selectedState, setSelectedState] = useState<DropdownOption | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DropdownOption | null>(null);
  const [selectedMandal, setSelectedMandal] = useState<DropdownOption | null>(null);
  const [selectedCity, setSelectedCity] = useState<DropdownOption | null>(null);
  const [countryFormOpen, setCountryFormOpen] = useState(false);
  const [stateFormOpen, setStateFormOpen] = useState(false);
  const [districtFormOpen, setDistrictFormOpen] = useState(false);
  const [mandalFormOpen, setMandalFormOpen] = useState(false);
  const [cityFormOpen, setCityFormOpen] = useState(false);
  const queryClient = useQueryClient();

  // Country creation mutation
  const createCountryMutation = useMutation({
    mutationFn: (data: CountryFormData) => countryApi.createCountry(data),
    onSuccess: (newCountry) => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      setSelectedCountry({ id: newCountry.id, name: newCountry.name });
      setValue('country_id', newCountry.id, { shouldValidate: true, shouldDirty: true });
      setCountryFormOpen(false);
    },
  });
  // State creation mutation
  const createStateMutation = useMutation({
    mutationFn: (data: StateFormData) => stateApi.createState(data),
    onSuccess: (newState) => {
      queryClient.invalidateQueries({ queryKey: ['states'] });
      setSelectedState({ id: newState.id, name: newState.name });
      setValue('state_id', newState.id, { shouldValidate: true, shouldDirty: true });
      setStateFormOpen(false);
    },
  });
  // District creation mutation
  const createDistrictMutation = useMutation({
    mutationFn: (data: DistrictFormData) => districtApi.createDistrict(data),
    onSuccess: (newDistrict) => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      setSelectedDistrict({ id: newDistrict.id, name: newDistrict.name });
      setValue('district_id', newDistrict.id, { shouldValidate: true, shouldDirty: true });
      setDistrictFormOpen(false);
    },
  });
  // Mandal creation mutation
  const createMandalMutation = useMutation({
    mutationFn: (data: MandalFormData) => mandalApi.createMandal(data),
    onSuccess: (newMandal) => {
      queryClient.invalidateQueries({ queryKey: ['mandals'] });
      setSelectedMandal({ id: newMandal.id, name: newMandal.name });
      setValue('mandal_id', newMandal.id, { shouldValidate: true, shouldDirty: true });
      setMandalFormOpen(false);
    },
  });
  // City creation mutation
  const createCityMutation = useMutation({
    mutationFn: (data: CityFormData) => cityApi.createCity(data),
    onSuccess: (newCity) => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      setSelectedCity({ id: newCity.id, name: newCity.name });
      setValue('city_id', newCity.id, { shouldValidate: true, shouldDirty: true });
      setCityFormOpen(false);
    },
  });

  const countryId = watch('country_id');
  const stateId = watch('state_id');
  const districtId = watch('district_id');
  const mandalId = watch('mandal_id');

  // Reset form when dialog opens/closes or area changes
  useEffect(() => {
    if (open) {
      reset({
        code: area?.code || '',
        name: area?.name || '',
        country_id: area?.country?.id || prefilledCountryId || '',
        state_id: area?.state?.id || prefilledStateId || '',
        district_id: area?.district?.id || prefilledDistrictId || '',
        mandal_id: area?.mandal?.id || prefilledMandalId || '',
        city_id: area?.city?.id || prefilledCityId || '',
        pincode: area?.pincode || '',
      });
      setSelectedCountry(
        area?.country ? { id: area.country.id, name: area.country.name } : null
      );
      setSelectedState(
        area?.state ? { id: area.state.id, name: area.state.name } : null
      );
      setSelectedDistrict(
        area?.district ? { id: area.district.id, name: area.district.name } : null
      );
      setSelectedMandal(
        area?.mandal ? { id: area.mandal.id, name: area.mandal.name } : null
      );
      setSelectedCity(
        area?.city ? { id: area.city.id, name: area.city.name } : null
      );
    }
  }, [open, area, reset, prefilledCountryId, prefilledStateId, prefilledDistrictId, prefilledMandalId, prefilledCityId]);

  const handleFormSubmit = async (data: AreaFormData) => {
    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    setSelectedCountry(null);
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedMandal(null);
    setSelectedCity(null);
    setCountryFormOpen(false);
    setStateFormOpen(false);
    setDistrictFormOpen(false);
    setMandalFormOpen(false);
    setCityFormOpen(false);
    onClose();
  };

  const handleCountryCreate = async (data: CountryFormData) => {
    await createCountryMutation.mutateAsync(data);
  };

  const handleStateCreate = async (data: StateFormData) => {
    await createStateMutation.mutateAsync(data);
  };

  const handleDistrictCreate = async (data: DistrictFormData) => {
    await createDistrictMutation.mutateAsync(data);
  };

  const handleMandalCreate = async (data: MandalFormData) => {
    await createMandalMutation.mutateAsync(data);
  };

  const handleCityCreate = async (data: CityFormData) => {
    await createCityMutation.mutateAsync(data);
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
        {area ? 'Edit Village/Town' : 'Add Village/Town'}
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
            {/* Village/Town Code Field */}
            {/* <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Village/Town Code
                </Typography>
                <Controller
                  name="code"
                  control={control}
                  rules={{
                    maxLength: {
                      value: 10,
                      message: 'Village/Town code must not exceed 10 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Leave empty for auto-generation"
                      fullWidth
                      error={!!errors.code}
                      helperText={errors.code?.message || 'Maximum 10 characters. Leave empty for auto-generation'}
                      disabled={loading}
                      inputProps={{ maxLength: 10 }}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid> */}

            {/* Village/Town Name Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Village/Town Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: 'Village/Town name is required',
                    maxLength: {
                      value: 100,
                      message: 'Village/Town name must not exceed 100 characters',
                    },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      placeholder="Enter village/town name"
                      fullWidth
                      error={!!error || field.value?.length >= 100}
                      helperText={
                        field.value?.length >= 100 
                          ? 'Village/Town name must not exceed 100 characters' 
                          : error?.message
                      }
                      disabled={loading}
                      inputProps={{ maxLength: 100 }}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 100) {
                          field.onChange(value);
                        }
                      }}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* Country Dropdown */}
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
                        setValue('state_id', '', { shouldValidate: false });
                        setValue('district_id', '', { shouldValidate: false });
                        setValue('mandal_id', '', { shouldValidate: false });
                        setValue('city_id', '', { shouldValidate: false });
                      }}
                      onCreateClick={() => setCountryFormOpen(true)}
                      placeholder="Select country"
                      error={!!errors.country_id}
                      helperText={errors.country_id?.message}
                      disabled={loading}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* State Dropdown */}
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
                      additionalFilters={countryId ? { country: countryId } : undefined}
                      placeholder={countryId ? "Select state" : "Select country first"}
                      error={!!errors.state_id}
                      helperText={errors.state_id?.message}
                      disabled={loading || !countryId}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* District Dropdown */}
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
                        setValue('mandal_id', '', { shouldValidate: false });
                        setValue('city_id', '', { shouldValidate: false });
                      }}
                      onCreateClick={() => setDistrictFormOpen(true)}
                      additionalFilters={stateId ? { state: stateId } : undefined}
                      placeholder={stateId ? "Select district" : "Select state first"}
                      error={!!errors.district_id}
                      helperText={errors.district_id?.message}
                      disabled={loading || !stateId}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* Mandal Dropdown */}
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
                        setValue('city_id', '', { shouldValidate: false });
                      }}
                      onCreateClick={() => setMandalFormOpen(true)}
                      additionalFilters={districtId ? { district: districtId } : undefined}
                      placeholder={districtId ? "Select mandal" : "Select district first"}
                      error={!!errors.mandal_id}
                      helperText={errors.mandal_id?.message}
                      disabled={loading || !districtId}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* City Dropdown - Shows only cities under selected Mandal */}
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
                      placeholder={mandalId ? "Select city under this mandal" : "Select mandal first"}
                      error={!!errors.city_id}
                      helperText={errors.city_id?.message}
                      disabled={loading || !mandalId}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* PIN Code Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  PIN Code
                </Typography>
                <Controller
                  name="pincode"
                  control={control}
                  rules={{
                    maxLength: {
                      value: 6,
                      message: 'PIN Code must not exceed 6 digits',
                    },
                    pattern: {
                      value: /^[0-9]{0,6}$/,
                      message: 'PIN Code must contain only digits (max 6)',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      placeholder="e.g., 500001"
                      fullWidth
                      error={!!errors.pincode}
                      helperText={errors.pincode?.message || 'Maximum 6 digits allowed'}
                      disabled={loading}
                      inputProps={{ maxLength: 6 }}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                        field.onChange(val);
                      }}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} disabled={loading} variant="outlined" color="secondary">
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

      {/* Country Creation Dialog */}
      <CountryFormDialog
        open={countryFormOpen}
        onClose={() => setCountryFormOpen(false)}
        onSubmit={handleCountryCreate}
        loading={createCountryMutation.isPending}
      />

      {/* State Creation Dialog */}
      <StateFormDialog
        open={stateFormOpen}
        onClose={() => setStateFormOpen(false)}
        onSubmit={handleStateCreate}
        loading={createStateMutation.isPending}
        prefilledCountryId={selectedCountry?.id ? String(selectedCountry.id) : undefined}
      />

      {/* District Creation Dialog */}
      <DistrictFormDialog
        open={districtFormOpen}
        onClose={() => setDistrictFormOpen(false)}
        onSubmit={handleDistrictCreate}
        loading={createDistrictMutation.isPending}
        prefilledCountryId={selectedCountry?.id ? String(selectedCountry.id) : undefined}
        prefilledStateId={selectedState?.id ? String(selectedState.id) : undefined}
      />

      {/* Mandal Creation Dialog */}
      <MandalFormDialog
        open={mandalFormOpen}
        onClose={() => setMandalFormOpen(false)}
        onSubmit={handleMandalCreate}
        loading={createMandalMutation.isPending}
        prefilledCountryId={selectedCountry?.id ? String(selectedCountry.id) : undefined}
        prefilledStateId={selectedState?.id ? String(selectedState.id) : undefined}
        prefilledDistrictId={selectedDistrict?.id ? String(selectedDistrict.id) : undefined}
      />

      {/* City Creation Dialog */}
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
    </Dialog>
  );
};

export default AreaFormDialog;

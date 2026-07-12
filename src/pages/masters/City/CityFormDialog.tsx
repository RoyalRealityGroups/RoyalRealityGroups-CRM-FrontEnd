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
import SearchableDropdownWithCreate from '../../../components/common/SearchableDropdownWithCreate';
import CountryFormDialog from '../Country/CountryFormDialog';
import StateFormDialog from '../State/StateFormDialog';
import DistrictFormDialog from '../District/DistrictFormDialog';
import MandalFormDialog from '../Mandal/MandalFormDialog';
import { API_ENDPOINTS } from '../../../utils/constants';
import { countryApi, stateApi, districtApi, mandalApi } from '../../../api/masters.api';
import type { City, CityFormData, CountryFormData, StateFormData, DistrictFormData, MandalFormData } from '../../../types/masters.types';
import type { DropdownOption } from '../../../types/common.types';

interface CityFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CityFormData) => Promise<void>;
  city?: City | null;
  loading?: boolean;
  prefilledCountryId?: string;
  prefilledStateId?: string;
  prefilledDistrictId?: string;
  prefilledMandalId?: string;
}

const CityFormDialog: React.FC<CityFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  city,
  loading = false,
  prefilledCountryId,
  prefilledStateId,
  prefilledDistrictId,
  prefilledMandalId,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CityFormData>({
    defaultValues: {
      code: '',
      name: '',
      state_id: '',
      country_id: '',
      district_id: '',
      mandal_id: '',
      pincode: '',
    },
  });

  const [selectedCountry, setSelectedCountry] = useState<DropdownOption | null>(null);
  const [selectedState, setSelectedState] = useState<DropdownOption | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DropdownOption | null>(null);
  const [selectedMandal, setSelectedMandal] = useState<DropdownOption | null>(null);
  const [countryFormOpen, setCountryFormOpen] = useState(false);
  const [stateFormOpen, setStateFormOpen] = useState(false);
  const [districtFormOpen, setDistrictFormOpen] = useState(false);
  const [mandalFormOpen, setMandalFormOpen] = useState(false);
  const [isCountryPrefilledFromHierarchy, setIsCountryPrefilledFromHierarchy] = useState(false);
  const [isStatePrefilledFromHierarchy, setIsStatePrefilledFromHierarchy] = useState(false);
  const [isDistrictPrefilledFromMandal, setIsDistrictPrefilledFromMandal] = useState(false);
  const queryClient = useQueryClient();

  // Country creation mutation
  const createCountryMutation = useMutation({
    mutationFn: (data: CountryFormData) => countryApi.createCountry(data),
    onSuccess: (newCountry) => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      setSelectedCountry({ id: newCountry.id, name: newCountry.name });
       setValue('country_id', String(newCountry.id));
      setCountryFormOpen(false);
    },
  });

  // State creation mutation
  const createStateMutation = useMutation({
    mutationFn: (data: StateFormData) => stateApi.createState(data),
    onSuccess: (newState) => {
      queryClient.invalidateQueries({ queryKey: ['states'] });
      setSelectedState({ id: newState.id, name: newState.name });
     setValue('state_id', String(newState.id));
      setStateFormOpen(false);
    },
  });

  // District creation mutation
  const createDistrictMutation = useMutation({
    mutationFn: (data: DistrictFormData) => districtApi.createDistrict(data),
    onSuccess: (newDistrict) => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      setSelectedDistrict({ id: newDistrict.id, name: newDistrict.name });
       setValue('district_id', String(newDistrict.id));
      setDistrictFormOpen(false);
    },
  });

  // Mandal creation mutation
  const createMandalMutation = useMutation({
    mutationFn: (data: MandalFormData) => mandalApi.createMandal(data),
    onSuccess: (newMandal) => {
      queryClient.invalidateQueries({ queryKey: ['mandals'] });
      setSelectedMandal({ id: newMandal.id, name: newMandal.name });
      setValue('mandal_id', String(newMandal.id));
      setMandalFormOpen(false);
    },
  });

  // Fetch prefilled mandal data when prefilledMandalId is provided
  useEffect(() => {
    const fetchPrefilledMandal = async () => {
      if (prefilledMandalId && !city) {
        try {
          const mandalData = await mandalApi.getMandal(prefilledMandalId);
          setSelectedMandal({ id: mandalData.id, name: mandalData.name });
          setValue('mandal_id', String(mandalData.id));
          
          // Also set district, state, and country if available
          if (mandalData.district) {
            setSelectedDistrict({ id: mandalData.district.id, name: mandalData.district.name });
            setValue('district_id', String(mandalData.district.id));
            setIsDistrictPrefilledFromMandal(true);
          }
          if (mandalData.state) {
            setSelectedState({ id: mandalData.state.id, name: mandalData.state.name });
            setValue('state_id', String(mandalData.state.id));
            setIsStatePrefilledFromHierarchy(true);
            
            if (mandalData.state.country) {
              setSelectedCountry({ id: mandalData.state.country.id, name: mandalData.state.country.name });
              setValue('country_id', String(mandalData.state.country.id));
              setIsCountryPrefilledFromHierarchy(true);
            }
          }
        } catch (error) {
          console.error('Error fetching prefilled mandal:', error);
        }
      } else if (prefilledDistrictId && !prefilledMandalId && !city) {
        // Fetch district if only district is prefilled
        try {
          const districtData = await districtApi.getDistrict(prefilledDistrictId);
          setSelectedDistrict({ id: districtData.id, name: districtData.name });
          setValue('district_id', String(districtData.id));
          setIsDistrictPrefilledFromMandal(false);
          
          if (districtData.state) {
            setSelectedState({ id: districtData.state.id, name: districtData.state.name });
            setValue('state_id', String(districtData.state.id));
            setIsStatePrefilledFromHierarchy(true);
            
            if (districtData.state.country) {
              setSelectedCountry({ id: districtData.state.country.id, name: districtData.state.country.name });
              setValue('country_id', String(districtData.state.country.id));
              setIsCountryPrefilledFromHierarchy(true);
            }
          }
        } catch (error) {
          console.error('Error fetching prefilled district:', error);
        }
      } else if (prefilledStateId && !prefilledDistrictId && !prefilledMandalId && !city) {
        // Fetch state if only state is prefilled
        try {
          const stateData = await stateApi.getState(prefilledStateId);
          setSelectedState({ id: stateData.id, name: stateData.name });
          setValue('state_id', String(stateData.id));
          setIsStatePrefilledFromHierarchy(false);
          setIsDistrictPrefilledFromMandal(false);
          
          if (stateData.country) {
            setSelectedCountry({ id: stateData.country.id, name: stateData.country.name });
            setValue('country_id', String(stateData.country.id));
            setIsCountryPrefilledFromHierarchy(true);
          }
        } catch (error) {
          console.error('Error fetching prefilled state:', error);
        }
      } else {
        setIsCountryPrefilledFromHierarchy(false);
        setIsStatePrefilledFromHierarchy(false);
        setIsDistrictPrefilledFromMandal(false);
      }
    };

    if (open) {
      fetchPrefilledMandal();
    } else {
      setIsCountryPrefilledFromHierarchy(false);
      setIsStatePrefilledFromHierarchy(false);
      setIsDistrictPrefilledFromMandal(false);
    }
  }, [open, prefilledMandalId, prefilledDistrictId, prefilledStateId, city, setValue]);

  const countryId = watch('country_id');
  const stateId = watch('state_id');
  const districtId = watch('district_id');

  // Reset form when dialog opens/closes or city changes
  useEffect(() => {
    if (open) {
      const countryId = city?.state?.country?.id || prefilledCountryId || '';
      const stateId = city?.state?.id || prefilledStateId || '';
      const districtId = city?.district?.id || prefilledDistrictId || '';
      const mandalId = city?.mandal?.id || prefilledMandalId || '';
      
      reset({
        code: city?.code || '',
        name: city?.name || '',
        state_id: stateId,
        country_id: countryId,
        district_id: districtId,
        mandal_id: mandalId,
        pincode: city?.pincode || '',
      });
      
      setSelectedCountry(
        city?.state?.country ? { id: city.state.country.id, name: city.state.country.name } : null
      );
      setSelectedState(
        city?.state ? { id: city.state.id, name: city.state.name } : null
      );
      setSelectedDistrict(
        city?.district ? { id: city.district.id, name: city.district.name } : null
      );
      setSelectedMandal(
        city?.mandal ? { id: city.mandal.id, name: city.mandal.name } : null
      );
    }
  }, [open, city, reset, prefilledCountryId, prefilledStateId, prefilledDistrictId, prefilledMandalId]);

  const handleFormSubmit = async (data: CityFormData) => {
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
    setCountryFormOpen(false);
    setStateFormOpen(false);
    setDistrictFormOpen(false);
    setMandalFormOpen(false);
    onClose();
  };

  const handleCountryCreate = async (data: CountryFormData) => {
    return new Promise<void>((resolve) => {
      createCountryMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
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
        {city ? 'Edit City' : 'Add City'}
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
            {/* City Code Field */}
            {/* <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  City Code
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

            {/* City Name Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  City Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: 'City name is required',
                    maxLength: {
                      value: 100,
                      message: 'City name must not exceed 100 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., Hyderabad, Bangalore, New York"
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
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.COUNTRIES}
                      value={selectedCountry}
                      onChange={(selectedOption: DropdownOption | null) => {
                        console.log('Country changed:', selectedOption);
                        setSelectedCountry(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear dependent fields
                        setSelectedState(null);
                        setSelectedDistrict(null);
                        setSelectedMandal(null);
                        setValue('state_id', '', { shouldValidate: false });
                        setValue('district_id', '', { shouldValidate: false });
                        setValue('mandal_id', '', { shouldValidate: false });
                        console.log('Cleared state, district, mandal after country change');
                      }}
                      onCreateClick={() => setCountryFormOpen(true)}
                      error={!!errors.country_id}
                      helperText={errors.country_id?.message || ((prefilledCountryId || isCountryPrefilledFromHierarchy) ? 'Pre-filled from parent form (read-only)' : '')}
                      disabled={loading || !!prefilledCountryId || isCountryPrefilledFromHierarchy}
                      placeholder="Select a country"
                      showCreateButton={!prefilledCountryId && !isCountryPrefilledFromHierarchy}
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
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.STATES}
                      value={selectedState}
                      onChange={(selectedOption: DropdownOption | null) => {
                        console.log('State changed:', selectedOption);
                        setSelectedState(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear dependent fields
                        setSelectedDistrict(null);
                        setSelectedMandal(null);
                        setValue('district_id', '', { shouldValidate: false });
                        setValue('mandal_id', '', { shouldValidate: false });
                        console.log('Cleared district, mandal after state change');
                      }}
                      onCreateClick={() => setStateFormOpen(true)}
                      additionalFilters={countryId ? { country: countryId } : undefined}
                      error={!!errors.state_id}
                      helperText={errors.state_id?.message || ((prefilledStateId || isStatePrefilledFromHierarchy) ? 'Pre-filled from parent form (read-only)' : '')}
                      disabled={loading || !countryId || !!prefilledStateId || isStatePrefilledFromHierarchy}
                      placeholder={countryId ? "Select a state" : "Select country first"}
                      showCreateButton={!prefilledStateId && !isStatePrefilledFromHierarchy}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* District Field (Required) */}
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
                  render={({ field: { onChange, value } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.DISTRICTS}
                      value={selectedDistrict}
                      onChange={(selectedOption: DropdownOption | null) => {
                        console.log('District changed:', selectedOption);
                        setSelectedDistrict(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear dependent field immediately
                        setSelectedMandal(null);
                        setValue('mandal_id', '', { shouldValidate: false });
                        console.log('Mandal cleared after district change');
                      }}
                      onCreateClick={() => setDistrictFormOpen(true)}
                      additionalFilters={stateId ? { state: stateId } : undefined}
                      error={!!errors.district_id}
                      helperText={errors.district_id?.message || ((prefilledDistrictId || isDistrictPrefilledFromMandal) ? 'Pre-filled from parent form (read-only)' : '')}
                      disabled={loading || !stateId || !!prefilledDistrictId || isDistrictPrefilledFromMandal}
                      placeholder={stateId ? "Select a district" : "Select state first"}
                      showCreateButton={!prefilledDistrictId && !isDistrictPrefilledFromMandal}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* Mandal Field (Required) */}
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
                      }}
                      onCreateClick={() => setMandalFormOpen(true)}
                      additionalFilters={districtId ? { district: districtId } : undefined}
                      error={!!errors.mandal_id}
                      helperText={errors.mandal_id?.message || (prefilledMandalId ? 'Pre-filled from parent form (read-only)' : '')}
                      disabled={loading || !districtId || !!prefilledMandalId}
                      placeholder={districtId ? "Select a mandal" : "Select district first"}
                      showCreateButton={!prefilledMandalId}
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
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      placeholder="e.g., 500001"
                      fullWidth
                      error={!!errors.pincode}
                      helperText={errors.pincode?.message}
                      disabled={loading}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
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
    </Dialog>
  );
};

export default CityFormDialog;

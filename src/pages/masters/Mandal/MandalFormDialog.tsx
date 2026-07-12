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
import { API_ENDPOINTS } from '../../../utils/constants';
import { countryApi, stateApi, districtApi } from '../../../api/masters.api';
import type { Mandal, MandalFormData, CountryFormData, StateFormData, DistrictFormData } from '../../../types/masters.types';
import type { DropdownOption } from '../../../types/common.types';

interface MandalFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MandalFormData) => Promise<void>;
  mandal?: Mandal | null;
  loading?: boolean;
  prefilledCountryId?: string;
  prefilledStateId?: string;
  prefilledDistrictId?: string;
}

const MandalFormDialog: React.FC<MandalFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  mandal,
  loading = false,
  prefilledCountryId,
  prefilledStateId,
  prefilledDistrictId,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<MandalFormData>({
    defaultValues: {
      code: '',
      name: '',
      district_id: '',
      state_id: '',
      country_id: '',
    },
  });

  const [selectedCountry, setSelectedCountry] = useState<DropdownOption | null>(null);
  const [selectedState, setSelectedState] = useState<DropdownOption | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DropdownOption | null>(null);
  const [countryFormOpen, setCountryFormOpen] = useState(false);
  const [stateFormOpen, setStateFormOpen] = useState(false);
  const [districtFormOpen, setDistrictFormOpen] = useState(false);
  const [isStatePrefilledFromDistrict, setIsStatePrefilledFromDistrict] = useState(false);
  const [isCountryPrefilledFromHierarchy, setIsCountryPrefilledFromHierarchy] = useState(false);
  const queryClient = useQueryClient();

  // Fetch prefilled district data when prefilledDistrictId is provided
  useEffect(() => {
    const fetchPrefilledDistrict = async () => {
      if (prefilledDistrictId && !mandal) {
        try {
          const districtData = await districtApi.getDistrict(prefilledDistrictId);
          setSelectedDistrict({ id: districtData.id, name: districtData.name });
          setValue('district_id', String(districtData.id));
          
          // Also set state and country if available
          if (districtData.state) {
            setSelectedState({ id: districtData.state.id, name: districtData.state.name });
            setValue('state_id', String(districtData.state.id));
            setIsStatePrefilledFromDistrict(true);
            
            if (districtData.state.country) {
              setSelectedCountry({ id: districtData.state.country.id, name: districtData.state.country.name });
              setValue('country_id', String(districtData.state.country.id));
              setIsCountryPrefilledFromHierarchy(true);
            }
          }
        } catch (error) {
          console.error('Error fetching prefilled district:', error);
        }
      } else if (prefilledStateId && !prefilledDistrictId && !mandal) {
        // Fetch state if only state is prefilled
        try {
          const stateData = await stateApi.getState(prefilledStateId);
          setSelectedState({ id: stateData.id, name: stateData.name });
          setValue('state_id', String(stateData.id));
          setIsStatePrefilledFromDistrict(false);
          
          if (stateData.country) {
            setSelectedCountry({ id: stateData.country.id, name: stateData.country.name });
            setValue('country_id', String(stateData.country.id));
            setIsCountryPrefilledFromHierarchy(true);
          }
        } catch (error) {
          console.error('Error fetching prefilled state:', error);
        }
      } else {
        setIsStatePrefilledFromDistrict(false);
        setIsCountryPrefilledFromHierarchy(false);
      }
    };

    if (open) {
      fetchPrefilledDistrict();
    } else {
      setIsStatePrefilledFromDistrict(false);
      setIsCountryPrefilledFromHierarchy(false);
    }
  }, [open, prefilledDistrictId, prefilledStateId, mandal, setValue]);

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

  // Reset form when dialog opens/closes or mandal changes
  useEffect(() => {
    if (open) {
      const countryId = mandal?.country?.id || mandal?.state?.country?.id || prefilledCountryId || '';
      const stateId = mandal?.state?.id || prefilledStateId || '';
      const districtId = mandal?.district?.id || prefilledDistrictId || '';
      
      reset({
        code: mandal?.code || '',
        name: mandal?.name || '',
        district_id: districtId,
        state_id: stateId,
        country_id: countryId,
      });
      
      setSelectedDistrict(
        mandal?.district ? { id: mandal.district.id, name: mandal.district.name, code: mandal.district.code } : null
      );
      setSelectedState(
        mandal?.state ? { id: mandal.state.id, name: mandal.state.name, code: mandal.state.code } : null
      );
      setSelectedCountry(
        mandal?.country ? { id: mandal.country.id, name: mandal.country.name, code: mandal.country.code } : 
        mandal?.state?.country ? { id: mandal.state.country.id, name: mandal.state.country.name, code: mandal.state.country.code } : null
      );
    }
  }, [open, mandal, reset, prefilledCountryId, prefilledStateId, prefilledDistrictId]);

  const handleFormSubmit = async (data: MandalFormData) => {
    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    setSelectedCountry(null);
    setSelectedState(null);
    setSelectedDistrict(null);
    setCountryFormOpen(false);
    setStateFormOpen(false);
    setDistrictFormOpen(false);
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
        {mandal ? 'Edit Mandal' : 'Add Mandal'}
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
            {/* Mandal Code Field */}
            {/* <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Mandal Code
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
                      autoFocus
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid> */}

            {/* Mandal Name Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Mandal Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: 'Mandal name is required',
                    maxLength: {
                      value: 100,
                      message: 'Mandal name must not exceed 100 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., Serilingampally, Kukatpally, Malkajgiri"
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

            {/* Country Dropdown */}
            <Grid size={{ xs: 12, sm: 4 }}>
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
                  rules={{
                    required: 'Country is required',
                  }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.COUNTRIES}
                      value={selectedCountry}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedCountry(selectedOption);
                        onChange(selectedOption?.id || '');
                      }}
                      onCreateClick={() => setCountryFormOpen(true)}
                      error={!!errors.country_id}
                      helperText={errors.country_id?.message || ((prefilledCountryId || isCountryPrefilledFromHierarchy) ? 'Pre-filled from parent form (read-only)' : '')}
                      disabled={loading || !!prefilledCountryId || isCountryPrefilledFromHierarchy}
                      placeholder="Select country"
                      showCreateButton={!prefilledCountryId && !isCountryPrefilledFromHierarchy}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* State Dropdown */}
            <Grid size={{ xs: 12, sm: 4 }}>
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
                      key={`state-${selectedCountry?.id || 'none'}-${selectedState?.id || 'none'}`}
                      label=""
                      apiEndpoint={API_ENDPOINTS.STATES}
                      value={selectedState}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedState(selectedOption);
                        onChange(selectedOption?.id || '');
                      }}
                      onCreateClick={() => setStateFormOpen(true)}
                      error={!!errors.state_id}
                      helperText={errors.state_id?.message || ((prefilledStateId || isStatePrefilledFromDistrict) ? 'Pre-filled from parent form (read-only)' : '')}
                      disabled={loading || (!selectedCountry && !selectedState) || !!prefilledStateId || isStatePrefilledFromDistrict}
                      placeholder={selectedCountry || selectedState ? "Select state" : "Select country first"}
                      additionalFilters={selectedCountry ? { country: selectedCountry.id } : undefined}
                      showCreateButton={!prefilledStateId && !isStatePrefilledFromDistrict}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* District Dropdown */}
            <Grid size={{ xs: 12, sm: 4 }}>
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
                      key={`district-${selectedState?.id || 'none'}-${selectedDistrict?.id || 'none'}`}
                      label=""
                      apiEndpoint={API_ENDPOINTS.DISTRICTS}
                      value={selectedDistrict}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedDistrict(selectedOption);
                        onChange(selectedOption?.id || '');
                      }}
                      onCreateClick={() => setDistrictFormOpen(true)}
                      error={!!errors.district_id}
                      helperText={errors.district_id?.message || (prefilledDistrictId ? 'Pre-filled from parent form (read-only)' : '')}
                      disabled={loading || (!selectedState && !selectedDistrict) || !!prefilledDistrictId}
                      placeholder={selectedState || selectedDistrict ? "Select district" : "Select state first"}
                      additionalFilters={selectedState ? { state: selectedState.id } : undefined}
                      showCreateButton={!prefilledDistrictId}
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
    </Dialog>
  );
};

export default MandalFormDialog;

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
import { API_ENDPOINTS } from '../../../utils/constants';
import { countryApi, stateApi } from '../../../api/masters.api';
import type { District, DistrictFormData, CountryFormData, StateFormData } from '../../../types/masters.types';
import type { DropdownOption } from '../../../types/common.types';

interface DistrictFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DistrictFormData) => Promise<void>;
  district?: District | null;
  loading?: boolean;
  prefilledCountryId?: string;
  prefilledStateId?: string;
}

const DistrictFormDialog: React.FC<DistrictFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  district,
  loading = false,
  prefilledCountryId,
  prefilledStateId,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<DistrictFormData>({
    defaultValues: {
      code: '',
      name: '',
      state_id: '',
      country_id: '',
    },
  });

  const [selectedCountry, setSelectedCountry] = useState<DropdownOption | null>(null);
  const [selectedState, setSelectedState] = useState<DropdownOption | null>(null);
  const [countryFormOpen, setCountryFormOpen] = useState(false);
  const [stateFormOpen, setStateFormOpen] = useState(false);
  const [isCountryPrefilledFromState, setIsCountryPrefilledFromState] = useState(false);
  const queryClient = useQueryClient();

  // Fetch prefilled state data when prefilledStateId is provided
  useEffect(() => {
    const fetchPrefilledState = async () => {
      if (prefilledStateId && !district) {
        try {
          const stateData = await stateApi.getState(prefilledStateId);
          setSelectedState({ id: stateData.id, name: stateData.name });
          setValue('state_id', stateData.id);
          
          // Also set country if available
          if (stateData.country) {
            setSelectedCountry({ id: stateData.country.id, name: stateData.country.name });
            setValue('country_id', stateData.country.id);
            setIsCountryPrefilledFromState(true);
          }
        } catch (error) {
          console.error('Error fetching prefilled state:', error);
        }
      } else {
        setIsCountryPrefilledFromState(false);
      }
    };

    if (open) {
      fetchPrefilledState();
    } else {
      setIsCountryPrefilledFromState(false);
    }
  }, [open, prefilledStateId, district, setValue]);

  // Country creation mutation
  const createCountryMutation = useMutation({
    mutationFn: (data: CountryFormData) => countryApi.createCountry(data),
    onSuccess: (newCountry) => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      setSelectedCountry({ id: newCountry.id, name: newCountry.name });
      control._formValues.country_id = newCountry.id;
      setCountryFormOpen(false);
    },
  });

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

  // Reset form when dialog opens/closes or district changes
  useEffect(() => {
    if (open) {
      const countryId = district?.country?.id || district?.state?.country?.id || prefilledCountryId || '';
      const stateId = district?.state?.id || prefilledStateId || '';
      
      reset({
        code: district?.code || '',
        name: district?.name || '',
        state_id: stateId,
        country_id: countryId,
      });
      
      // Set selected state
      if (district?.state) {
        setSelectedState({ id: district.state.id, name: district.state.name, code: district.state.code });
      } else {
        setSelectedState(null);
      }
      
      // Set selected country
      if (district?.country) {
        setSelectedCountry({ id: district.country.id, name: district.country.name, code: district.country.code });
      } else if (district?.state?.country) {
        setSelectedCountry({ id: district.state.country.id, name: district.state.country.name, code: district.state.country.code });
      } else {
        setSelectedCountry(null);
      }
    }
  }, [open, district, reset, prefilledCountryId, prefilledStateId]);

  const handleFormSubmit = async (data: DistrictFormData) => {
    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    setSelectedCountry(null);
    setSelectedState(null);
    setCountryFormOpen(false);
    setStateFormOpen(false);
    onClose();
  };

  const handleCountryCreate = async (data: CountryFormData) => {
    await createCountryMutation.mutateAsync(data);
  };

  const handleStateCreate = async (data: StateFormData) => {
    await createStateMutation.mutateAsync(data);
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
        {district ? 'Edit District' : 'Add District'}
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
            {/* District Code Field */}
            {/* <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  District Code
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

            {/* District Name Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  District Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: 'District name is required',
                    maxLength: {
                      value: 100,
                      message: 'District name must not exceed 100 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., Hyderabad, Rangareddy, Medak"
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
                      helperText={errors.country_id?.message || ((prefilledCountryId || isCountryPrefilledFromState) ? 'Pre-filled from parent form (read-only)' : '')}
                      disabled={loading || !!prefilledCountryId || isCountryPrefilledFromState}
                      placeholder="Select a country first"
                      showCreateButton={!prefilledCountryId && !isCountryPrefilledFromState}
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
                      helperText={errors.state_id?.message || (prefilledStateId ? 'Pre-filled from parent form (read-only)' : '')}
                      disabled={loading || (!selectedCountry && !selectedState) || !!prefilledStateId}
                      placeholder={selectedCountry || selectedState ? "Select a state" : "Select country first"}
                      additionalFilters={selectedCountry ? { country: selectedCountry.id } : undefined}
                      showCreateButton={!prefilledStateId}
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
    </Dialog>
  );
};

export default DistrictFormDialog;

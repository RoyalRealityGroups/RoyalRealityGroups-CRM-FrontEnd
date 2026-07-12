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
import CountryFormDialog from '../../masters/Country/CountryFormDialog';
import { API_ENDPOINTS } from '../../../utils/constants';
import { countryApi } from '../../../api/masters.api';
import type { State, StateFormData, CountryFormData } from '../../../types/masters.types';
import type { DropdownOption } from '../../../types/common.types';

interface StateFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: StateFormData) => Promise<void>;
  state?: State | null;
  loading?: boolean;
  prefilledCountryId?: string;
}

const StateFormDialog: React.FC<StateFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  state,
  loading = false,
  prefilledCountryId,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<StateFormData>({
    defaultValues: {
      code: '',
      name: '',
      gst_code: '',
      country_id: '',
    },
  });

  const [selectedCountry, setSelectedCountry] = useState<DropdownOption | null>(null);
  const [countryFormOpen, setCountryFormOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch prefilled country data when prefilledCountryId is provided
  useEffect(() => {
    const fetchPrefilledCountry = async () => {
      if (prefilledCountryId && !state) {
        try {
          const countryData = await countryApi.getCountry(prefilledCountryId);
          setSelectedCountry({ id: countryData.id, name: countryData.name });
          setValue('country_id', countryData.id);
        } catch (error) {
          console.error('Error fetching prefilled country:', error);
        }
      }
    };

    if (open) {
      fetchPrefilledCountry();
    }
  }, [open, prefilledCountryId, state]);

  // Country creation mutation
  const createCountryMutation = useMutation({
    mutationFn: (data: CountryFormData) => countryApi.createCountry(data),
    onSuccess: (newCountry) => {
      // Invalidate countries query to refresh the dropdown
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      
      // Set the newly created country as selected
      setSelectedCountry({ id: newCountry.id, name: newCountry.name });
      setValue('country_id', newCountry.id);
      
      // Close the country form dialog
      setCountryFormOpen(false);
    },
  });

  // Reset form when dialog opens/closes or state changes
  useEffect(() => {
    if (open) {
      const countryId = state?.country?.id || prefilledCountryId || '';
      
      reset({
        code: state?.code || '',
        name: state?.name || '',
        gst_code: state?.gst_code || '',
        country_id: countryId,
      });
      
      setSelectedCountry(
        state?.country ? { id: state.country.id, name: state.country.name } : null
      );
    }
  }, [open, state, reset, prefilledCountryId]);

  const handleFormSubmit = async (data: StateFormData) => {
    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    setSelectedCountry(null);
    setCountryFormOpen(false);
    onClose();
  };

  const handleCountryCreate = async (data: CountryFormData) => {
    await createCountryMutation.mutateAsync(data);
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
        {state ? 'Edit State' : 'Add State'}
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
            {/* State Code Field */}
            {/* <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  State Code
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

            {/* State Name Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  State Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: 'State name is required',
                    maxLength: {
                      value: 100,
                      message: 'State name must not exceed 100 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., California, Texas, New York"
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

            {/* GST Code Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  GST Code
                </Typography>
                <Controller
                  name="gst_code"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[0-9]{1,2}$/,
                      message: 'GST code must be 1-2 digits (e.g., 01, 33)',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., 01, 02, 33"
                      fullWidth
                      error={!!errors.gst_code}
                      helperText={errors.gst_code?.message || 'Enter the GST state code (optional)'}
                      disabled={loading}
                      inputProps={{ maxLength: 2 }}
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
                      helperText={errors.country_id?.message || (prefilledCountryId ? 'Pre-filled from parent form (read-only)' : '')}
                      disabled={loading || !!prefilledCountryId}
                      placeholder="Select a country"
                      showCreateButton={!prefilledCountryId}
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
    </Dialog>
  );
};

export default StateFormDialog;

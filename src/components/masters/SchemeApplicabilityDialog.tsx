import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import SearchableDropdown from '../common/SearchableDropdown';
import { API_ENDPOINTS } from '../../utils/constants';
import type { DropdownOption } from '../../types/common.types';
import type { SchemeApplicability } from '../../types/masters.types';

interface SchemeApplicabilityDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (applicability: Partial<SchemeApplicability>) => void;
  applicability?: Partial<SchemeApplicability>;
}

const CUSTOMER_TYPES: Array<DropdownOption> = [
  { id: 'ALL', name: 'All' },
  { id: 'RETAILER', name: 'Retailer' },
  { id: 'DISTRIBUTOR', name: 'Distributor' },
  { id: 'SUPERSTOCKIST', name: 'Superstockist' },
];

const SchemeApplicabilityDialog: React.FC<SchemeApplicabilityDialogProps> = ({
  open,
  onClose,
  onSave,
  applicability,
}) => {
  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<Partial<SchemeApplicability>>({
    defaultValues: applicability || {
      apply_to_all: true,
    },
  });

  const customerType = watch('customer_type');
  const applyToAll = watch('apply_to_all');
  const [selectedStateOption, setSelectedStateOption] = useState<DropdownOption | null>(null);
  const [selectedCityOption, setSelectedCityOption] = useState<DropdownOption | null>(null);
  const [selectedAreaOption, setSelectedAreaOption] = useState<DropdownOption | null>(null);
  const [selectedSuperstockistOption, setSelectedSuperstockistOption] = useState<DropdownOption | null>(null);
  const [selectedDistributorOption, setSelectedDistributorOption] = useState<DropdownOption | null>(null);
  const [selectedRetailerOption, setSelectedRetailerOption] = useState<DropdownOption | null>(null);

  useEffect(() => {
    if (!open) return;
    if (applicability) {
      reset(applicability);
      setSelectedStateOption(
        applicability.state
          ? { id: applicability.state, name: applicability.state_name || '' }
          : null
      );
      setSelectedCityOption(
        applicability.city
          ? { id: applicability.city, name: applicability.city_name || '' }
          : null
      );
      setSelectedAreaOption(
        applicability.area
          ? { id: applicability.area, name: applicability.area_name || '' }
          : null
      );
      setSelectedSuperstockistOption(
        applicability.superstockist
          ? { id: applicability.superstockist, name: applicability.superstockist_name || '' }
          : null
      );
      setSelectedDistributorOption(
        applicability.distributor
          ? { id: applicability.distributor, name: applicability.distributor_name || '' }
          : null
      );
      setSelectedRetailerOption(
        applicability.retailer
          ? { id: applicability.retailer, name: applicability.retailer_name || '' }
          : null
      );
      return;
    }

    reset({
      customer_type: undefined,
      apply_to_all: true,
      state: undefined,
      city: undefined,
      area: undefined,
      superstockist: undefined,
      distributor: undefined,
      retailer: undefined,
    });
    setSelectedStateOption(null);
    setSelectedCityOption(null);
    setSelectedAreaOption(null);
    setSelectedSuperstockistOption(null);
    setSelectedDistributorOption(null);
    setSelectedRetailerOption(null);
  }, [applicability, open, reset]);

  const handleFormSubmit = (data: Partial<SchemeApplicability>) => {
    const enrichedData: Partial<SchemeApplicability> = {
      ...data,
      state_name: selectedStateOption?.name,
      city_name: selectedCityOption?.name,
      area_name: selectedAreaOption?.name,
      superstockist_name: selectedSuperstockistOption?.name,
      distributor_name: selectedDistributorOption?.name,
      retailer_name: selectedRetailerOption?.name,
    };
    onSave(enrichedData);
    onClose();
  };

  const handleClose = () => {
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
        {applicability ? 'Edit Applicability' : 'Add Applicability'}
        <IconButton aria-label="close" onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent sx={{ py: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                Customer Type <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
              </Typography>
              <Controller
                name="customer_type"
                control={control}
                rules={{ required: 'Customer type is required' }}
                render={({ field }) => (
                  <SearchableDropdown
                    label=""
                    apiEndpoint=""
                    staticOptions={CUSTOMER_TYPES}
                    value={CUSTOMER_TYPES.find(t => t.id === field.value) || null}
                    onChange={(option: DropdownOption | null) => field.onChange(option?.id)}
                    error={!!errors.customer_type}
                    helperText={errors.customer_type?.message}
                    placeholder="Select customer type"
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="apply_to_all"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Apply to all matching customers"
                  />
                )}
              />
            </Grid>

            {!applyToAll && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    State
                  </Typography>
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <SearchableDropdown
                        label=""
                        apiEndpoint={API_ENDPOINTS.STATES}
                        value={selectedStateOption}
                        onChange={(option: DropdownOption | null) => {
                          setSelectedStateOption(option);
                          field.onChange(option?.id);
                        }}
                        placeholder="Select state"
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    City
                  </Typography>
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <SearchableDropdown
                        label=""
                        apiEndpoint={API_ENDPOINTS.CITIES}
                        value={selectedCityOption}
                        onChange={(option: DropdownOption | null) => {
                          setSelectedCityOption(option);
                          field.onChange(option?.id);
                        }}
                        placeholder="Select city"
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Area
                  </Typography>
                  <Controller
                    name="area"
                    control={control}
                    render={({ field }) => (
                      <SearchableDropdown
                        label=""
                        apiEndpoint={API_ENDPOINTS.AREAS}
                        value={selectedAreaOption}
                        onChange={(option: DropdownOption | null) => {
                          setSelectedAreaOption(option);
                          field.onChange(option?.id);
                        }}
                        placeholder="Select village/town"
                      />
                    )}
                  />
                </Grid>

                {customerType === 'SUPERSTOCKIST' && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      Superstockist
                    </Typography>
                    <Controller
                      name="superstockist"
                      control={control}
                      render={({ field }) => (
                        <SearchableDropdown
                          label=""
                          apiEndpoint={API_ENDPOINTS.SUPERSTOCKISTS}
                          value={selectedSuperstockistOption}
                          onChange={(option: DropdownOption | null) => {
                            setSelectedSuperstockistOption(option);
                            field.onChange(option?.id);
                          }}
                          placeholder="Select superstockist"
                        />
                      )}
                    />
                  </Grid>
                )}

                {customerType === 'DISTRIBUTOR' && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      Distributor
                    </Typography>
                    <Controller
                      name="distributor"
                      control={control}
                      render={({ field }) => (
                        <SearchableDropdown
                          label=""
                          apiEndpoint={API_ENDPOINTS.DISTRIBUTORS}
                          value={selectedDistributorOption}
                          onChange={(option: DropdownOption | null) => {
                            setSelectedDistributorOption(option);
                            field.onChange(option?.id);
                          }}
                          placeholder="Select distributor"
                        />
                      )}
                    />
                  </Grid>
                )}

                {customerType === 'RETAILER' && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      Retailer
                    </Typography>
                    <Controller
                      name="retailer"
                      control={control}
                      render={({ field }) => (
                        <SearchableDropdown
                          label=""
                          apiEndpoint={API_ENDPOINTS.RETAILERS}
                          value={selectedRetailerOption}
                          onChange={(option: DropdownOption | null) => {
                            setSelectedRetailerOption(option);
                            field.onChange(option?.id);
                          }}
                          placeholder="Select retailer"
                        />
                      )}
                    />
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SchemeApplicabilityDialog;

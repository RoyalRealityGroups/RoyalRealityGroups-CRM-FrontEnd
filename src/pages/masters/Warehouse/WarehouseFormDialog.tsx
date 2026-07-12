import React, { useEffect } from 'react';
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
import SearchableDropdown from '../../../components/common/SearchableDropdown';
import { API_ENDPOINTS } from '../../../utils/constants';
import type { Warehouse, WarehouseFormData } from '../../../types/masters.types';
import type { DropdownOption } from '../../../types/common.types';

interface WarehouseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WarehouseFormData) => Promise<void>;
  warehouse?: Warehouse | null;
  loading?: boolean;
}

const WarehouseFormDialog: React.FC<WarehouseFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  warehouse,
  loading = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarehouseFormData>({
    defaultValues: {
      code: '',
      name: '',
      location_id: '',
      erp_code: '',
      erp_id: '',
    },
  });

  const [selectedLocation, setSelectedLocation] = React.useState<DropdownOption | null>(null);

  // Reset form when dialog opens/closes or warehouse changes
  useEffect(() => {
    if (open) {
      reset({
        code: warehouse?.code || '',
        name: warehouse?.name || '',
        location_id: warehouse?.location?.id || '',
        erp_code: warehouse?.erp_code || '',
        erp_id: warehouse?.erp_id || '',
      });
      setSelectedLocation(
        warehouse?.location ? { id: warehouse.location.id, name: warehouse.location.name } : null
      );
    }
  }, [open, warehouse, reset]);

  const handleFormSubmit = async (data: WarehouseFormData) => {
    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    setSelectedLocation(null);
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
        {warehouse ? 'Edit Warehouse' : 'Add Warehouse'}
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
            {/* Warehouse Code Field */}
            {/* <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Warehouse Code
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

            {/* Warehouse Name Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Warehouse Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: 'Warehouse name is required',
                    maxLength: {
                      value: 100,
                      message: 'Warehouse name must not exceed 100 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Enter warehouse name"
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

            {/* Location Dropdown */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Location <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="location_id"
                  control={control}
                  rules={{
                    required: 'Location is required',
                  }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.LOCATIONS_DROPDOWN}
                      value={selectedLocation}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedLocation(selectedOption);
                        onChange(selectedOption?.id || '');
                      }}
                      placeholder="Select location"
                      error={!!errors.location_id}
                      helperText={errors.location_id?.message}
                      disabled={loading}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* ERP Code Field (Optional) */}
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
                  rules={{
                    maxLength: {
                      value: 50,
                      message: 'ERP code must not exceed 50 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Enter ERP code (optional)"
                      fullWidth
                      error={!!errors.erp_code}
                      helperText={errors.erp_code?.message}
                      disabled={loading}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* ERP ID Field (Optional) */}
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
                  rules={{
                    maxLength: {
                      value: 50,
                      message: 'ERP ID must not exceed 50 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Enter ERP ID (optional)"
                      fullWidth
                      error={!!errors.erp_id}
                      helperText={errors.erp_id?.message}
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
    </Dialog>
  );
};

export default WarehouseFormDialog;

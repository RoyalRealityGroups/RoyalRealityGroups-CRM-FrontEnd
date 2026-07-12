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
import type { OutletType, OutletTypeFormData } from '../../../types/masters.types';

interface OutletTypeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: OutletTypeFormData) => Promise<void>;
  outletType?: OutletType | null;
  loading?: boolean;
}

const OutletTypeFormDialog: React.FC<OutletTypeFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  outletType,
  loading = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OutletTypeFormData>({
    defaultValues: {
      code: '',
      name: '',
      erp_code: '',
      erp_id: '',
    },
  });

  // Reset form when dialog opens/closes or outletType changes
  useEffect(() => {
    if (open) {
      reset({
        code: outletType?.code || '',
        name: outletType?.name || '',
        erp_code: outletType?.erp_code || '',
        erp_id: outletType?.erp_id || '',
      });
    }
  }, [open, outletType, reset]);

  const handleFormSubmit = async (data: OutletTypeFormData) => {
    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    if (loading) return;
    reset();
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
        {outletType ? 'Edit Outlet Type' : 'Add Outlet Type'}
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
            {/* Outlet Type Code Field */}
            {/* <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Outlet Type Code
                </Typography>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      onBlur={field.onBlur}
                      name={field.name}
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

            {/* Outlet Type Name Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Outlet Type Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: 'Outlet type name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters',
                    },
                    maxLength: {
                      value: 180,
                      message: 'Name cannot exceed 180 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Auto-generated (e.g., OUT-1)"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message || 'Enter the full name of the outlet type'}
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
                  rules={{
                    maxLength: {
                      value: 50,
                      message: 'ERP code cannot exceed 50 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Enter ERP code"
                      fullWidth
                      error={!!errors.erp_code}
                      helperText={errors.erp_code?.message || 'Optional: Enter the ERP system code'}
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
                  rules={{
                    maxLength: {
                      value: 50,
                      message: 'ERP ID cannot exceed 50 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Enter ERP ID"
                      fullWidth
                      error={!!errors.erp_id}
                      helperText={errors.erp_id?.message || 'Optional: Enter the ERP system ID'}
                      disabled={loading}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleClose} 
            variant="outlined" 
            disabled={loading}
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={16} />}
            sx={{ minWidth: 100 }}
          >
            {loading ? 'Saving...' : outletType ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default OutletTypeFormDialog;

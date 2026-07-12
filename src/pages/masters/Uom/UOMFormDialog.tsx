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
import type { UOM, UOMFormData } from '../../../types/masters.types';

interface UOMFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UOMFormData) => Promise<void>;
  uom?: UOM | null;
  loading?: boolean;
}

const UOMFormDialog: React.FC<UOMFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  uom,
  loading = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UOMFormData>({
    defaultValues: {
      code: '',
      name: '',
      remarks: '',
      erp_code: '',
      erp_id: '',
    },
  });

  // Reset form when dialog opens/closes or uom changes
  useEffect(() => {
    if (open) {
      reset({
        code: uom?.code || '',
        name: uom?.name || '',
        remarks: uom?.remarks || '',
        erp_code: uom?.erp_code || '',
        erp_id: uom?.erp_id || '',
      });
    }
  }, [open, uom, reset]);

  const handleFormSubmit = async (data: UOMFormData) => {
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
        {uom ? 'Edit Unit of Measurement' : 'Add Unit of Measurement'}
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
            {/* UOM Code Field */}
            {/* <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  UOM Code
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

            {/* UOM Name Field */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  UOM Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: 'UOM name is required',
                    maxLength: {
                      value: 180,
                      message: 'UOM name must not exceed 180 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., Kilogram, Pieces, Box, Liter"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message || 'Enter the full name of the unit'}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                      disabled={loading}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* Remarks Field */}
            <Grid size={{ xs: 12 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Remarks
                </Typography>
                <Controller
                  name="remarks"
                  control={control}
                  rules={{
                    maxLength: {
                      value: 500,
                      message: 'Remarks must not exceed 500 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Additional notes or description (optional)"
                      fullWidth
                      multiline
                      rows={3}
                      error={!!errors.remarks}
                      helperText={errors.remarks?.message}
                      disabled={loading}
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
                      message: 'ERP Code must not exceed 50 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="ERP system code (optional)"
                      fullWidth
                      error={!!errors.erp_code}
                      helperText={errors.erp_code?.message || 'Code used in ERP system'}
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
                      message: 'ERP ID must not exceed 50 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="ERP system ID (optional)"
                      fullWidth
                      error={!!errors.erp_id}
                      helperText={errors.erp_id?.message || 'ID used in ERP system'}
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

export default UOMFormDialog;

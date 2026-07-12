import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  IconButton,
  CircularProgress,
  Typography,
  Box,
  Grid,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import type { Brand, BrandFormData } from '../../../types/masters.types';

interface BrandFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BrandFormData) => Promise<void>;
  brand: Brand | null;
  isSubmitting?: boolean;
}

const BRAND_DEFAULT_VALUES: BrandFormData = {
  code: '',
  name: '',
  description: '',
  is_active: true,
  erp_code: '',
  erp_id: '',
};

const BrandFormDialog: React.FC<BrandFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  brand,
  isSubmitting = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandFormData>({
    defaultValues: BRAND_DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      if (brand) {
        reset({
          code: brand.code,
          name: brand.name,
          description: brand.description || '',
          is_active: brand.is_active,
          erp_code: brand.erp_code || '',
          erp_id: brand.erp_id || '',
        });
      } else {
        reset(BRAND_DEFAULT_VALUES);
      }
    } else {
      reset(BRAND_DEFAULT_VALUES);
    }
  }, [open, brand, reset]);

  const handleFormSubmit = async (data: BrandFormData) => {
    await onSubmit(data);
    reset(BRAND_DEFAULT_VALUES);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset(BRAND_DEFAULT_VALUES);
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
      disableEscapeKeyDown={isSubmitting}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {brand ? 'Edit Brand' : 'Add New Brand'}
        <IconButton
          edge="end"
          onClick={handleClose}
          disabled={isSubmitting}
          aria-label="close"
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent sx={{ py: 1 }}>
          <Grid container spacing={2.5} sx={{ pt: 1 }}>
            {/* <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Code
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
                      disabled={isSubmitting}
                      error={!!errors.code}
                      helperText={errors.code?.message || 'Leave empty for auto-generation'}
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid> */}

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <TextField
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      placeholder="Enter brand name"
                      required
                      disabled={isSubmitting}
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Description
                </Typography>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      placeholder="Add a short description"
                      multiline
                      rows={3}
                      disabled={isSubmitting}
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid>

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
                      placeholder="ERP system code"
                      disabled={isSubmitting}
                      error={!!errors.erp_code}
                      helperText={errors.erp_code?.message}
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid>

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
                      placeholder="ERP system ID"
                      disabled={isSubmitting}
                      error={!!errors.erp_id}
                      helperText={errors.erp_id?.message}
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Active"
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} disabled={isSubmitting} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isSubmitting}
            startIcon={isSubmitting && <CircularProgress size={20} />}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BrandFormDialog;

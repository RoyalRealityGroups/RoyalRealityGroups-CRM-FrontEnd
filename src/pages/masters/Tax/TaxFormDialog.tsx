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
  Typography,
  Box,
  Grid,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  Chip,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import type { Tax, TaxFormData } from '../../../types/masters.types';

interface TaxFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaxFormData) => Promise<void>;
  tax: Tax | null;
  isSubmitting?: boolean;
}

const TAX_TYPE_OPTIONS = [
  { value: 'GST', label: 'GST' },
  { value: 'CESS', label: 'CESS' },
  { value: 'COMPENSATION_CESS', label: 'Compensation CESS' },
];

const TAX_DEFAULT_VALUES: TaxFormData = {
  code: '',
  name: '',
  tax_type: 'GST',
  tax_rate: 0,
  description: '',
  is_active: true,
};

const TaxFormDialog: React.FC<TaxFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  tax,
  isSubmitting = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TaxFormData>({
    defaultValues: TAX_DEFAULT_VALUES,
  });

  const watchedTaxType = watch('tax_type');
  const isCess = watchedTaxType === 'CESS' || watchedTaxType === 'COMPENSATION_CESS';

  useEffect(() => {
    if (open) {
      if (tax) {
        reset({
          code: tax.code,
          name: tax.name,
          tax_type: tax.tax_type,
          tax_rate: tax.tax_rate,
          description: tax.description || '',
          is_active: tax.is_active,
        });
      } else {
        reset(TAX_DEFAULT_VALUES);
      }
    } else {
      reset(TAX_DEFAULT_VALUES);
    }
  }, [open, tax, reset]);

  const handleFormSubmit = async (data: TaxFormData) => {
    await onSubmit(data);
    reset(TAX_DEFAULT_VALUES);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset(TAX_DEFAULT_VALUES);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        handleClose();
      }}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isSubmitting}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {tax ? 'Edit Tax' : 'Add New Tax'}
        <IconButton edge="end" onClick={handleClose} disabled={isSubmitting} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent sx={{ py: 1 }}>
          <Grid container spacing={2.5} sx={{ pt: 1 }}>
            {/* <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                Code
              </Typography>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    placeholder="Leave empty for auto-generation"
                    disabled={isSubmitting}
                    error={!!errors.code}
                    helperText={errors.code?.message || 'Leave empty for auto-generation'}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { height: 42 } }}
                  />
                )}
              />
            </Grid> */}

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                Tax Name <Box component="span" sx={{ color: '#f44336' }}>*</Box>
              </Typography>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Tax name is required', maxLength: { value: 180, message: 'Max 180 characters' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    placeholder="e.g., GST 18%, IGST 5%"
                    
                    disabled={isSubmitting}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { height: 42 } }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                Tax Type <Box component="span" sx={{ color: '#f44336' }}>*</Box>
              </Typography>
              <Controller
                name="tax_type"
                control={control}
                rules={{ required: 'Tax type is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.tax_type}>
                    <Select
                      {...field}
                      disabled={isSubmitting}
                      sx={{ height: 42 }}
                    >
                      {TAX_TYPE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.tax_type && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {errors.tax_type.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                Tax Rate (%) <Box component="span" sx={{ color: '#f44336' }}>*</Box>
              </Typography>
              <Controller
                name="tax_rate"
                control={control}
                rules={{
                  required: 'Tax rate is required',
                  min: { value: 0, message: 'Minimum 0%' },
                  max: { value: 100, message: 'Maximum 100%' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    placeholder="e.g., 5, 12, 18, 28"
                    
                    disabled={isSubmitting}
                    error={!!errors.tax_rate}
                    helperText={errors.tax_rate?.message}
                    fullWidth
                    inputProps={{ step: 0.01, min: 0, max: 100 }}
                    sx={{ '& .MuiOutlinedInput-root': { height: 42 } }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                CESS Tax
              </Typography>
              <Box sx={{ pt: 1 }}>
                <Chip 
                  label={isCess ? 'Yes' : 'No'} 
                  color={isCess ? 'success' : 'default'}
                  variant={isCess ? 'filled' : 'outlined'}
                  size="small"
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  Auto-calculated based on tax type
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              {/* Empty grid for spacing */}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                Description
              </Typography>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    placeholder="Additional information about this tax"
                    disabled={isSubmitting}
                    multiline
                    rows={3}
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        disabled={isSubmitting}
                      />
                    }
                    label="Active"
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

export default TaxFormDialog;

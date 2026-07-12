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
  Stack,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import type { Country, CountryFormData } from '../../../types/masters.types';

interface CountryFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CountryFormData) => Promise<void>;
  country?: Country | null;
  loading?: boolean;
}

const CountryFormDialog: React.FC<CountryFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  country,
  loading = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CountryFormData>({
    defaultValues: {
      code: '',
      name: '',
    },
  });

  // Reset form when dialog opens/closes or country changes
  useEffect(() => {
    if (open) {
      reset({
        code: country?.code || '',
        name: country?.name || '',
      });
    }
  }, [open, country, reset]);

  const handleFormSubmit = (data: CountryFormData) => {
    onSubmit(data);
  };

  const handleClose = () => {
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
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {country ? 'Edit Country' : 'Add Country'}
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
          <Stack spacing={2}>
            {/* Country Code Field */}
            {/* <Box>
              <Typography 
                variant="subtitle2" 
                sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
              >
                Country Code
              </Typography>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
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
            </Box> */}

            {/* Country Name Field */}
            <Box>
              <Typography 
                variant="subtitle2" 
                sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
              >
                Country Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
              </Typography>
              <Controller
                name="name"
                control={control}
                rules={{
                  required: 'Country name is required',
                  maxLength: {
                    value: 100,
                    message: 'Country name must not exceed 100 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    placeholder="e.g., United States, India"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    disabled={loading}
                  />
                )}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CountryFormDialog;

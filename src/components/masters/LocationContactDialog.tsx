import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import {
  CONTACT_EMAIL_REGEX,
  CONTACT_PHONE_MAX_LENGTH,
  CONTACT_PHONE_MIN_LENGTH,
  CONTACT_PHONE_REGEX,
  PHONE_FIELD_HELPER_TEXT,
  sanitizePhoneInput,
} from '../../utils/validation';

interface LocationContactFormData {
  contact_person: string;
  phone: string;
  email: string;
  designation: string;
  is_primary: boolean;
}

interface LocationContactDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LocationContactFormData) => void;
  initialData?: LocationContactFormData | null;
  isSubmitting?: boolean;
}

const LocationContactDialog: React.FC<LocationContactDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocationContactFormData>({
    defaultValues: initialData || {
      contact_person: '',
      phone: '',
      email: '',
      designation: '',
      is_primary: false,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset(initialData || {
        contact_person: '',
        phone: '',
        email: '',
        designation: '',
        is_primary: false,
      });
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = (data: LocationContactFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        {initialData ? 'Edit Contact' : 'Add Contact'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <form id="contact-form" onSubmit={handleSubmit(handleFormSubmit)}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Contact Person 
                </Typography>
                <Controller
                  name="contact_person"
                  control={control}
                  // rules={{ required: 'Contact person is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., John Doe"
                      fullWidth
                      size="small"
                      error={!!errors.contact_person}
                      helperText={errors.contact_person?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Phone
                </Typography>
                <Controller
                  name="phone"
                  control={control}
                  rules={{
                    pattern: {
                      value: CONTACT_PHONE_REGEX,
                      message: 'Please enter a valid phone number (e.g., +91 9876543210 or 040-12345678)',
                    },
                    minLength: {
                      value: CONTACT_PHONE_MIN_LENGTH,
                      message: 'Phone number must be at least 10 digits',
                    },
                    maxLength: {
                      value: CONTACT_PHONE_MAX_LENGTH,
                      message: 'Phone number cannot exceed 15 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., +91 9876543210 or 040-12345678"
                      fullWidth
                      size="small"
                      error={!!errors.phone}
                      helperText={errors.phone?.message || PHONE_FIELD_HELPER_TEXT}
                      disabled={isSubmitting}
                      inputProps={{ maxLength: CONTACT_PHONE_MAX_LENGTH }}
                      onChange={(e) => {
                        const value = sanitizePhoneInput(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Designation
                </Typography>
                <Controller
                  name="designation"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., Manager"
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Email
                </Typography>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    pattern: {
                      value: CONTACT_EMAIL_REGEX,
                      message: 'Please enter a valid email address (e.g., john@company.com)',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., john@company.com"
                      fullWidth
                      size="small"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="is_primary"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          {...field}
                          checked={field.value}
                          disabled={isSubmitting}
                        />
                      }
                      label="Primary Contact"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </form>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="contact-form"
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationContactDialog;
export { type LocationContactFormData };

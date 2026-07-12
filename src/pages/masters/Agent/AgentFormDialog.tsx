import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, CircularProgress, IconButton, Typography, Grid,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import type { Agent, AgentFormData } from '../../../types/masters.types';

interface AgentFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AgentFormData) => Promise<void>;
  agent?: Agent | null;
  loading?: boolean;
}

const AgentFormDialog: React.FC<AgentFormDialogProps> = ({ open, onClose, onSubmit, agent, loading = false }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<AgentFormData>({
    defaultValues: { code: '', name: '', phone: '', email: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        code: agent?.code || '',
        name: agent?.name || '',
        phone: agent?.phone || '',
        email: agent?.email || '',
      });
    }
  }, [open, agent, reset]);

  const handleFormSubmit = async (data: AgentFormData) => {
    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={(_e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') handleClose(); }} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {agent ? 'Edit Agent' : 'Add Agent'}
        <IconButton onClick={handleClose} size="small" disabled={loading} sx={{ color: 'text.secondary' }}><CloseIcon /></IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent sx={{ py: 1 }}>
          <Grid container spacing={2}>
            {/* <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>Code</Typography>
                <Controller name="code" control={control} render={({ field }) => (
                  <TextField {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} placeholder="Auto-generated" fullWidth disabled={loading} helperText="Leave empty for auto-generation" sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }} />
                )} />
              </Box>
            </Grid> */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>Name <Box component="span" sx={{ color: '#f44336' }}>*</Box></Typography>
                <Controller name="name" control={control} rules={{ required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } }} render={({ field }) => (
                  <TextField {...field} placeholder="Agent name" fullWidth error={!!errors.name} helperText={errors.name?.message} disabled={loading} sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }} />
                )} />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>Phone <Box component="span" sx={{ color: '#f44336' }}>*</Box></Typography>
                <Controller name="phone" control={control} rules={{ required: 'Phone is required', pattern: { value: /^[0-9]{10,15}$/, message: 'Enter valid phone number' } }} render={({ field }) => (
                  <TextField {...field} placeholder="Phone number" fullWidth error={!!errors.phone} helperText={errors.phone?.message} disabled={loading} sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }} />
                )} />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>Email</Typography>
                <Controller name="email" control={control} rules={{ pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } }} render={({ field }) => (
                  <TextField {...field} placeholder="Email (optional)" fullWidth error={!!errors.email} helperText={errors.email?.message} disabled={loading} sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }} />
                )} />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} variant="outlined" disabled={loading} sx={{ minWidth: 100 }}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading} startIcon={loading && <CircularProgress size={16} />} sx={{ minWidth: 100 }}>
            {loading ? 'Saving...' : agent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AgentFormDialog;

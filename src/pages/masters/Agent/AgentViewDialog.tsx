import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Grid, Box, Chip } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { Agent } from '../../../types/masters.types';

interface AgentViewDialogProps {
  open: boolean;
  onClose: () => void;
  agent: Agent | null;
}

const AgentViewDialog: React.FC<AgentViewDialogProps> = ({ open, onClose, agent }) => {
  if (!agent) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Agent Details
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Code</Typography>
            <Typography variant="body2" fontWeight={600}>{agent.code}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Name</Typography>
            <Typography variant="body2" fontWeight={600}>{agent.name}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Phone</Typography>
            <Typography variant="body2">{agent.phone}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Email</Typography>
            <Typography variant="body2">{agent.email || '-'}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Status</Typography>
            <Box><Chip label={agent.is_active ? 'Active' : 'Inactive'} color={agent.is_active ? 'success' : 'default'} size="small" /></Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AgentViewDialog;

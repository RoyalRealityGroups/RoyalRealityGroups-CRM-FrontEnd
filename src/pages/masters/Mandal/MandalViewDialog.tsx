import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { Mandal } from '../../../types/masters.types';

interface MandalViewDialogProps {
  open: boolean;
  onClose: () => void;
  mandal: Mandal | null;
}

const MandalViewDialog: React.FC<MandalViewDialogProps> = ({ open, onClose, mandal }) => {
  if (!mandal) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Mandal Details</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Code
            </Typography>
            <Typography variant="body1">{mandal.code || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body1">{mandal.name || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              District
            </Typography>
            <Typography variant="body1">{mandal.district?.name || '-'}</Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MandalViewDialog;

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
import type { District } from '../../../types/masters.types';

interface DistrictViewDialogProps {
  open: boolean;
  onClose: () => void;
  district: District | null;
}

const DistrictViewDialog: React.FC<DistrictViewDialogProps> = ({ open, onClose, district }) => {
  if (!district) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">District Details</Typography>
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
            <Typography variant="body1">{district.code || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body1">{district.name || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              State
            </Typography>
            <Typography variant="body1">{district.state?.name || '-'}</Typography>
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

export default DistrictViewDialog;

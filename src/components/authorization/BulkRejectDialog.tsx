import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface BulkRejectDialogProps {
  open: boolean;
  selectedCount: number;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

const BulkRejectDialog: React.FC<BulkRejectDialogProps> = ({
  open,
  selectedCount,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Reject {selectedCount} Record{selectedCount > 1 ? 's' : ''}
        <IconButton
          onClick={onClose}
          size="small"
          disabled={loading}
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Rejection Reason"
          placeholder="Enter reason for rejection..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          error={!reason.trim() && reason.length > 0}
          helperText={!reason.trim() && reason.length > 0 ? 'Rejection reason is required' : ''}
          disabled={loading}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={!reason.trim() || loading}
        >
          {loading ? 'Rejecting...' : 'Reject'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkRejectDialog;

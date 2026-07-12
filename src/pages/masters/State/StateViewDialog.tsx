import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { State } from '../../../types/masters.types';

interface StateViewDialogProps {
  open: boolean;
  onClose: () => void;
  state: State | null;
}

const cellLabel = { fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', width: '35%' };
const cellValue = { border: '1px solid #e0e0e0' };

const StateViewDialog: React.FC<StateViewDialogProps> = ({ open, onClose, state }) => {
  if (!state) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        View State
        <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={cellLabel}>State Code</TableCell>
                <TableCell sx={cellValue}>{state.code}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>State Name</TableCell>
                <TableCell sx={cellValue}>{state.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>GST Code</TableCell>
                <TableCell sx={cellValue}>{state.gst_code || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Country</TableCell>
                <TableCell sx={cellValue}>{state.country?.name || '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StateViewDialog;

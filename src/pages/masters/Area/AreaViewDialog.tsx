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
import type { Area } from '../../../types/masters.types';

interface AreaViewDialogProps {
  open: boolean;
  onClose: () => void;
  area: Area | null;
}

const cellLabel = { fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', width: '35%' };
const cellValue = { border: '1px solid #e0e0e0' };

const AreaViewDialog: React.FC<AreaViewDialogProps> = ({ open, onClose, area }) => {
  if (!area) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        View Area
        <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={cellLabel}>Village/Town Code</TableCell>
                <TableCell sx={cellValue}>{area.code}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Village/Town Name</TableCell>
                <TableCell sx={cellValue}>{area.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>City</TableCell>
                <TableCell sx={cellValue}>{area.city?.name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>State</TableCell>
                <TableCell sx={cellValue}>{area.state?.name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>PIN Code</TableCell>
                <TableCell sx={cellValue}>{area.pincode || '-'}</TableCell>
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

export default AreaViewDialog;

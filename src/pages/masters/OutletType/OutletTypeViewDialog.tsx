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
import type { OutletType } from '../../../types/masters.types';

interface OutletTypeViewDialogProps {
  open: boolean;
  onClose: () => void;
  outletType: OutletType | null;
}

const cellLabel = { fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', width: '35%' };
const cellValue = { border: '1px solid #e0e0e0' };

const OutletTypeViewDialog: React.FC<OutletTypeViewDialogProps> = ({ open, onClose, outletType }) => {
  if (!outletType) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        View Outlet Type
        <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={cellLabel}>Outlet Type Code</TableCell>
                <TableCell sx={cellValue}>{outletType.code}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Outlet Type Name</TableCell>
                <TableCell sx={cellValue}>{outletType.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>ERP Code</TableCell>
                <TableCell sx={cellValue}>{outletType.erp_code || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>ERP ID</TableCell>
                <TableCell sx={cellValue}>{outletType.erp_id || '-'}</TableCell>
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

export default OutletTypeViewDialog;

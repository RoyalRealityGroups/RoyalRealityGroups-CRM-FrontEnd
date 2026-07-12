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
  Chip,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { Tax } from '../../../types/masters.types';
import { formatDate } from '../../../utils/format';

interface TaxViewDialogProps {
  open: boolean;
  onClose: () => void;
  tax: Tax | null;
}

const cellLabel = { fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', width: '35%' };
const cellValue = { border: '1px solid #e0e0e0' };

const TaxViewDialog: React.FC<TaxViewDialogProps> = ({ open, onClose, tax }) => {
  if (!tax) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        View Tax
        <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={cellLabel}>Tax Code</TableCell>
                <TableCell sx={cellValue}>{tax.code}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Tax Name</TableCell>
                <TableCell sx={cellValue}>{tax.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Tax Type</TableCell>
                <TableCell sx={cellValue}>{tax.tax_type}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Tax Rate</TableCell>
                <TableCell sx={cellValue}>{tax.tax_rate}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Description</TableCell>
                <TableCell sx={cellValue}>{tax.description || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>CESS Tax</TableCell>
                <TableCell sx={cellValue}>
                  <Chip label={tax.is_cess ? 'Yes' : 'No'} color={tax.is_cess ? 'warning' : 'default'} size="small" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Status</TableCell>
                <TableCell sx={cellValue}>
                  <Chip label={tax.is_active ? 'Active' : 'Inactive'} color={tax.is_active ? 'success' : 'default'} size="small" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Created On</TableCell>
                <TableCell sx={cellValue}>{tax.created_on ? formatDate(tax.created_on, 'DD-MM-YYYY HH:mm') : '-'}</TableCell>
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

export default TaxViewDialog;

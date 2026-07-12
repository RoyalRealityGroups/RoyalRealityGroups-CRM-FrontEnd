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
import type { Brand } from '../../../types/masters.types';

interface BrandViewDialogProps {
  open: boolean;
  onClose: () => void;
  brand: Brand | null;
}

const cellLabel = { fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', width: '35%' };
const cellValue = { border: '1px solid #e0e0e0' };

const BrandViewDialog: React.FC<BrandViewDialogProps> = ({ open, onClose, brand }) => {
  if (!brand) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        View Brand
        <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={cellLabel}>Brand Code</TableCell>
                <TableCell sx={cellValue}>{brand.code}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Brand Name</TableCell>
                <TableCell sx={cellValue}>{brand.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Description</TableCell>
                <TableCell sx={cellValue}>{brand.description || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Status</TableCell>
                <TableCell sx={cellValue}>
                  <span style={{ color: brand.is_active ? 'green' : 'red' }}>
                    {brand.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>ERP Code</TableCell>
                <TableCell sx={cellValue}>{brand.erp_code || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>ERP ID</TableCell>
                <TableCell sx={cellValue}>{brand.erp_id || '-'}</TableCell>
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

export default BrandViewDialog;

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
import type { Retailer } from '../../../types/masters.types';

interface RetailerViewDialogProps {
  open: boolean;
  onClose: () => void;
  retailer: Retailer | null;
}

const cellLabel = { fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', width: '35%' };
const cellValue = { border: '1px solid #e0e0e0' };

const RetailerViewDialog: React.FC<RetailerViewDialogProps> = ({ open, onClose, retailer }) => {
  if (!retailer) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        View Retailer
        <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={cellLabel}>Code</TableCell>
                <TableCell sx={cellValue}>{retailer.code}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Name</TableCell>
                <TableCell sx={cellValue}>{retailer.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Company</TableCell>
                <TableCell sx={cellValue}>{retailer.company_name || '-'}</TableCell>
              </TableRow>
              {retailer.distributor_name && (
                <TableRow>
                  <TableCell sx={cellLabel}>Distributor</TableCell>
                  <TableCell sx={cellValue}>{retailer.distributor_name}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell sx={cellLabel}>Outlet Type</TableCell>
                <TableCell sx={cellValue}>{retailer.outlet_type_name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>State</TableCell>
                <TableCell sx={cellValue}>{retailer.state_name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>City</TableCell>
                <TableCell sx={cellValue}>{retailer.city_name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Address</TableCell>
                <TableCell sx={cellValue}>{retailer.address || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>GSTIN</TableCell>
                <TableCell sx={cellValue}>{retailer.gstin || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>PAN</TableCell>
                <TableCell sx={cellValue}>{retailer.pan || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Credit Limit</TableCell>
                <TableCell sx={cellValue}>{retailer.credit_limit || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Credit Days</TableCell>
                <TableCell sx={cellValue}>{retailer.credit_days ?? '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Status</TableCell>
                <TableCell sx={cellValue}>
                  <Chip label={retailer.is_active ? 'Active' : 'Inactive'} color={retailer.is_active ? 'success' : 'default'} size="small" />
                </TableCell>
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

export default RetailerViewDialog;

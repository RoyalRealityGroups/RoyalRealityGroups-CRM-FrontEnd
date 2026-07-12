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
import type { Location } from '../../../types/masters.types';

interface LocationViewDialogProps {
  open: boolean;
  onClose: () => void;
  location: Location | null;
}

const cellLabel = { fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', width: '35%' };
const cellValue = { border: '1px solid #e0e0e0' };

const LocationViewDialog: React.FC<LocationViewDialogProps> = ({ open, onClose, location }) => {
  if (!location) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        View Location
        <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={cellLabel}>Location Code</TableCell>
                <TableCell sx={cellValue}>{location.code}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Location Name</TableCell>
                <TableCell sx={cellValue}>{location.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Companies</TableCell>
                <TableCell sx={cellValue}>
                  {location.companies?.map((c) => c.name).join(', ') || '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>City</TableCell>
                <TableCell sx={cellValue}>{location.city?.name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>State</TableCell>
                <TableCell sx={cellValue}>{location.state?.name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Country</TableCell>
                <TableCell sx={cellValue}>{location.country?.name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Address</TableCell>
                <TableCell sx={cellValue}>{location.address || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>PIN Code</TableCell>
                <TableCell sx={cellValue}>{location.pincode || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>ERP Code</TableCell>
                <TableCell sx={cellValue}>{location.erp_code || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>ERP ID</TableCell>
                <TableCell sx={cellValue}>{location.erp_id || '-'}</TableCell>
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

export default LocationViewDialog;

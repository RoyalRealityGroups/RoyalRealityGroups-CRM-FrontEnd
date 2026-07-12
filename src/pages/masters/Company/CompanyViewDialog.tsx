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
  Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { Company } from '../../../types/masters.types';

interface CompanyViewDialogProps {
  open: boolean;
  onClose: () => void;
  company: Company | null;
}

const cellLabel = { fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', width: '35%' };
const cellValue = { border: '1px solid #e0e0e0' };

const CompanyViewDialog: React.FC<CompanyViewDialogProps> = ({ open, onClose, company }) => {
  if (!company) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        View Company
        <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={cellLabel}>Company Code</TableCell>
                <TableCell sx={cellValue}>{company.code}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Company Name</TableCell>
                <TableCell sx={cellValue}>{company.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Email</TableCell>
                <TableCell sx={cellValue}>{company.email || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Phone</TableCell>
                <TableCell sx={cellValue}>{company.phone || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>City</TableCell>
                <TableCell sx={cellValue}>{company.city?.name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>State</TableCell>
                <TableCell sx={cellValue}>{company.state?.name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Address</TableCell>
                <TableCell sx={cellValue}>{company.address || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>PAN Number</TableCell>
                <TableCell sx={cellValue}>{company.pan_number || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>GST Number</TableCell>
                <TableCell sx={cellValue}>{company.gst_number || '-'}</TableCell>
              </TableRow>
              {company.logo && (
                <TableRow>
                  <TableCell sx={cellLabel}>Logo</TableCell>
                  <TableCell sx={cellValue}>
                    <Box
                      component="img"
                      src={company.logo}
                      alt="Company Logo"
                      sx={{ maxHeight: 60, maxWidth: 120, objectFit: 'contain' }}
                    />
                  </TableCell>
                </TableRow>
              )}
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

export default CompanyViewDialog;

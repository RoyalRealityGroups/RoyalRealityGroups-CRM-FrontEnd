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
import type { Route } from '../../../types/masters.types';

interface RouteViewDialogProps {
  open: boolean;
  onClose: () => void;
  route: Route | null;
}

const cellLabel = { fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', width: '35%' };
const cellValue = { border: '1px solid #e0e0e0' };

const RouteViewDialog: React.FC<RouteViewDialogProps> = ({ open, onClose, route }) => {
  if (!route) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        View Route
        <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={cellLabel}>Route Code</TableCell>
                <TableCell sx={cellValue}>{route.code}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Route Name</TableCell>
                <TableCell sx={cellValue}>{route.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>States</TableCell>
                <TableCell sx={cellValue}>{route.location_summary?.states ?? 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Cities</TableCell>
                <TableCell sx={cellValue}>{route.location_summary?.cities ?? 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Areas</TableCell>
                <TableCell sx={cellValue}>{route.location_summary?.areas ?? route.coverages?.length ?? 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Status</TableCell>
                <TableCell sx={cellValue}>
                  <Chip label={route.is_active ? 'Active' : 'Inactive'} color={route.is_active ? 'success' : 'default'} size="small" />
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

export default RouteViewDialog;

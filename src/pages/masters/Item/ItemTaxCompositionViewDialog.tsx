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
import type { ItemTaxComposition } from '../../../types/masters.types';
import { formatDate } from '../../../utils/format';

interface ItemTaxCompositionViewDialogProps {
  open: boolean;
  onClose: () => void;
  composition: ItemTaxComposition | null;
}

const cellLabel = { fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', width: '35%' };
const cellValue = { border: '1px solid #e0e0e0' };

const ItemTaxCompositionViewDialog: React.FC<ItemTaxCompositionViewDialogProps> = ({ open, onClose, composition }) => {
  if (!composition) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        View Product Tax Composition
        <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={cellLabel}>Product</TableCell>
                <TableCell sx={cellValue}>{composition.item_name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Tax</TableCell>
                <TableCell sx={cellValue}>{composition.tax.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Tax Type</TableCell>
                <TableCell sx={cellValue}>{composition.tax.tax_type}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Tax Rate</TableCell>
                <TableCell sx={cellValue}>{composition.tax.tax_rate}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Composition Type</TableCell>
                <TableCell sx={cellValue}>
                  <Chip label={composition.composition_type} size="small" color={composition.composition_type === 'PRIMARY' ? 'primary' : 'secondary'} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>CESS</TableCell>
                <TableCell sx={cellValue}>
                  <Chip label={composition.tax.is_cess ? 'CESS' : 'GST'} size="small" color={composition.tax.is_cess ? 'warning' : 'info'} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Effective From</TableCell>
                <TableCell sx={cellValue}>{formatDate(composition.effective_from)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Effective To</TableCell>
                <TableCell sx={cellValue}>
                  {composition.effective_to ? formatDate(composition.effective_to) : <Chip label="Current" size="small" color="success" variant="outlined" />}
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

export default ItemTaxCompositionViewDialog;

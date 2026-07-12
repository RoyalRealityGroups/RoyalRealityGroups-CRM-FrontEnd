import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useToast } from '../../../contexts/ToastContext';
import { invoiceApi } from '../../../api/invoice.api';
import type { DispatchPlanForInvoice } from '../../../types/invoice.types';
import apiClient from '../../../api/axios.config';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CreateInvoiceFromDispatchDialog: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [location, setLocation] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedDispatch, setSelectedDispatch] = useState<string | null>(null);

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiClient.get('/api/usermanagement/dropdowns/locations/').then(res => res.data),
  });

  const { data: dispatches, isLoading } = useQuery({
    queryKey: ['availableDispatches'],
    queryFn: () => invoiceApi.getAvailableDispatches(),
    enabled: open,
  });

  useEffect(() => {
    if (location) {
      invoiceApi.generateInvoiceNumber(location).then(data => {
        setInvoiceNumber(data.invoice_number);
      });
    }
  }, [location]);

  const generateMutation = useMutation({
    mutationFn: invoiceApi.generateFromDispatch,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toastSuccess('Invoice generated successfully');
      onClose();
      navigate(`/sales/invoice/${data.id}`);
    },
    onError: (error: any) => {
      toastError(error.response?.data?.error || 'Failed to generate invoice');
    },
  });

  const handleGenerate = () => {
    if (!selectedDispatch || !location) {
      toastError('Please select dispatch plan and location');
      return;
    }

    generateMutation.mutate({
      dispatch_plan: selectedDispatch,
      location,
      invoice_date: invoiceDate,
      invoice_number: invoiceNumber,
    });
  };

  const handleClose = () => {
    setLocation('');
    setInvoiceDate(format(new Date(), 'yyyy-MM-dd'));
    setInvoiceNumber('');
    setSelectedDispatch(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Generate Invoice from Dispatch
        <IconButton onClick={handleClose} size="small" disabled={generateMutation.isPending}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth required>
            <InputLabel>Location</InputLabel>
            <Select
              value={location}
              label="Location"
              onChange={(e) => setLocation(e.target.value)}
            >
              {(Array.isArray(locations?.results || locations) ? (locations?.results || locations) : []).map((loc: any) => (
                <MenuItem key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {invoiceNumber && (
            <TextField
              label="Invoice Number"
              value={invoiceNumber}
              disabled
              fullWidth
            />
          )}

          <TextField
            label="Invoice Date"
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />

          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Select Dispatch Plan:
          </Typography>

          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Dispatch Number</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Order Number</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Loading...</TableCell>
                  </TableRow>
                ) : dispatches?.results?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No dispatch plans available</TableCell>
                  </TableRow>
                ) : (
                  dispatches?.results?.map((dispatch: DispatchPlanForInvoice) => (
                    <TableRow
                      key={dispatch.id}
                      selected={selectedDispatch === dispatch.id}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setSelectedDispatch(dispatch.id)}
                    >
                      <TableCell>{dispatch.dispatch_number}</TableCell>
                      <TableCell>{format(new Date(dispatch.dispatch_date), 'dd-MM-yyyy')}</TableCell>
                      <TableCell>{dispatch.order_number}</TableCell>
                      <TableCell>{dispatch.customer_name}</TableCell>
                      <TableCell align="right">
                        ₹{dispatch.total_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={selectedDispatch === dispatch.id ? 'Selected' : 'Select'}
                          color={selectedDispatch === dispatch.id ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={generateMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          disabled={!selectedDispatch || !location || generateMutation.isPending}
        >
          {generateMutation.isPending ? 'Generating...' : 'Generate Invoice'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateInvoiceFromDispatchDialog;

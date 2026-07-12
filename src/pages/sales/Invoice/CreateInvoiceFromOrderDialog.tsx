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
import type { SalesOrderForInvoice } from '../../../types/invoice.types';
import apiClient from '../../../api/axios.config';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CreateInvoiceFromOrderDialog: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [location, setLocation] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiClient.get('/api/usermanagement/dropdowns/locations/').then(res => res.data),
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['availableOrders'],
    queryFn: () => invoiceApi.getAvailableOrders(),
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
    mutationFn: invoiceApi.generateFromOrder,
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
    if (!selectedOrder || !location) {
      toastError('Please select sales order and location');
      return;
    }

    generateMutation.mutate({
      sales_order: selectedOrder,
      location,
      invoice_date: invoiceDate,
      invoice_number: invoiceNumber,
    });
  };

  const handleClose = () => {
    setLocation('');
    setInvoiceDate(format(new Date(), 'yyyy-MM-dd'));
    setInvoiceNumber('');
    setSelectedOrder(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Generate Invoice from Sales Order
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
            Select Sales Order:
          </Typography>

          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order Number</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer Type</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Loading...</TableCell>
                  </TableRow>
                ) : orders?.results?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No sales orders available</TableCell>
                  </TableRow>
                ) : (
                  orders?.results?.map((order: SalesOrderForInvoice) => (
                    <TableRow
                      key={order.id}
                      selected={selectedOrder === order.id}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setSelectedOrder(order.id)}
                    >
                      <TableCell>{order.order_number}</TableCell>
                      <TableCell>{format(new Date(order.order_date), 'dd-MM-yyyy')}</TableCell>
                      <TableCell>{order.customer_type}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell align="right">
                        ₹{order.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={selectedOrder === order.id ? 'Selected' : 'Select'}
                          color={selectedOrder === order.id ? 'primary' : 'default'}
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
          disabled={!selectedOrder || !location || generateMutation.isPending}
        >
          {generateMutation.isPending ? 'Generating...' : 'Generate Invoice'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateInvoiceFromOrderDialog;

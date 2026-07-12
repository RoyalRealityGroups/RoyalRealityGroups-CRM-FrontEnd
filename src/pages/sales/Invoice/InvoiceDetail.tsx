import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import {
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import ScreenHeader from '../../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { getPageContainerStyles, getHeaderSectionStyles, getContentSectionStyles } from '../../../utils/spacing';
import { invoiceApi } from '../../../api/invoice.api';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceApi.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Sales', path: '/sales', icon: <FolderIcon fontSize="small" /> },
      { label: 'Invoice', path: '/sales/invoice', icon: <ReceiptIcon fontSize="small" /> },
      { label: invoice?.invoice_number || 'Detail' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, invoice]);

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'default',
      PENDING: 'warning',
      CONFIRMED: 'primary',
      PAID: 'success',
      PARTIALLY_PAID: 'warning',
      CANCELLED: 'error',
    } as const;
    return colors[status as keyof typeof colors] || 'default';
  };

  if (isLoading) {
    return <Box sx={getPageContainerStyles()}><Typography>Loading...</Typography></Box>;
  }

  if (!invoice) {
    return <Box sx={getPageContainerStyles()}><Typography>Invoice not found</Typography></Box>;
  }

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ScreenHeader
            title={`Invoice: ${invoice.invoice_number}`}
            showBackButton={true}
            onBack={() => navigate('/sales/invoice')}
            disableBox
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<PrintIcon />}>
              Print
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <Typography variant="h6" gutterBottom>Invoice Information</Typography>
              <Typography variant="body2"><strong>Invoice Number:</strong> {invoice.invoice_number}</Typography>
              <Typography variant="body2"><strong>Invoice Date:</strong> {format(new Date(invoice.invoice_date), 'dd-MM-yyyy')}</Typography>
              <Typography variant="body2"><strong>Due Date:</strong> {format(new Date(invoice.due_date), 'dd-MM-yyyy')}</Typography>
              <Typography variant="body2"><strong>Source:</strong> <Chip label={invoice.source_type} size="small" /></Typography>
              <Typography variant="body2"><strong>Status:</strong> <Chip label={invoice.status} color={getStatusColor(invoice.status)} size="small" /></Typography>
            </Box>
            <Box>
              <Typography variant="h6" gutterBottom>Order Information</Typography>
              <Typography variant="body2"><strong>Order Number:</strong> {invoice.order_number}</Typography>
              <Typography variant="body2"><strong>Order Date:</strong> {format(new Date(invoice.order_date!), 'dd-MM-yyyy')}</Typography>
              {invoice.dispatch_number && (
                <Typography variant="body2"><strong>Dispatch Number:</strong> {invoice.dispatch_number}</Typography>
              )}
              <Typography variant="body2"><strong>Customer:</strong> {invoice.customer_name}</Typography>
              <Typography variant="body2"><strong>Type:</strong> {invoice.customer_type}</Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>Invoice Items</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>S.No</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Item Name</TableCell>
                  <TableCell>HSN Code</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Taxable</TableCell>
                  <TableCell align="right">CGST</TableCell>
                  <TableCell align="right">SGST</TableCell>
                  <TableCell align="right">IGST</TableCell>
                  <TableCell align="right">CESS</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items?.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.category_name || '-'}</TableCell>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>{item.hsn_code}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell>{item.unit_name}</TableCell>
                    <TableCell align="right">₹{Number(item.rate).toFixed(2)}</TableCell>
                    <TableCell align="right">₹{Number(item.taxable_amount).toFixed(2)}</TableCell>
                    <TableCell align="right">
                      {Number(item.cgst_rate) > 0 && `${item.cgst_rate}% - ₹${Number(item.cgst_amount).toFixed(2)}`}
                    </TableCell>
                    <TableCell align="right">
                      {Number(item.sgst_rate) > 0 && `${item.sgst_rate}% - ₹${Number(item.sgst_amount).toFixed(2)}`}
                    </TableCell>
                    <TableCell align="right">
                      {Number(item.igst_rate) > 0 && `${item.igst_rate}% - ₹${Number(item.igst_amount).toFixed(2)}`}
                    </TableCell>
                    <TableCell align="right">
                      {Number(item.cess_rate) > 0 && `${item.cess_rate}% - ₹${Number(item.cess_amount).toFixed(2)}`}
                    </TableCell>
                    <TableCell align="right">₹{Number(item.line_total).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              {invoice.payments && invoice.payments.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>Payments</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Mode</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Reference</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoice.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{format(new Date(payment.payment_date), 'dd-MM-yyyy')}</TableCell>
                            <TableCell>{payment.payment_mode}</TableCell>
                            <TableCell align="right">₹{Number(payment.amount).toFixed(2)}</TableCell>
                            <TableCell>{payment.reference_number}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>₹{Number(invoice.subtotal).toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Discount:</Typography>
                  <Typography>₹{Number(invoice.discount_amount).toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Taxable Amount:</Typography>
                  <Typography>₹{Number(invoice.taxable_amount).toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Tax Amount:</Typography>
                  <Typography>₹{Number(invoice.tax_amount).toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Freight Charges:</Typography>
                  <Typography>₹{Number(invoice.freight_charges).toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Other Charges:</Typography>
                  <Typography>₹{Number(invoice.other_charges).toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Round Off:</Typography>
                  <Typography>₹{Number(invoice.round_off).toFixed(2)}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Grand Total:</Typography>
                  <Typography variant="h6">₹{Number(invoice.grand_total).toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Paid Amount:</Typography>
                  <Typography color="success.main">₹{Number(invoice.paid_amount).toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Balance:</Typography>
                  <Typography variant="h6" color="error.main">₹{Number(invoice.balance_amount).toFixed(2)}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default InvoiceDetail;

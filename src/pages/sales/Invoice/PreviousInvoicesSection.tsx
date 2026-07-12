import React, { useEffect, useState } from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Box,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { invoiceApi } from '../../../api/invoice.api';
import type { PendingInvoice } from '../../../types/invoice.types';

interface Props {
  customerType: string | null;
  customerId: string | null;
}

const PreviousInvoicesSection: React.FC<Props> = ({ customerType, customerId }) => {
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);

  // Fetch pending invoices when customer changes
  const { data, isLoading, error } = useQuery({
    queryKey: ['pendingInvoices', customerType, customerId],
    queryFn: () => {
      if (!customerType || !customerId) {
        return Promise.resolve(null);
      }
      return invoiceApi.getPendingInvoices(customerType, customerId);
    },
    enabled: !!customerType && !!customerId,
  });

  useEffect(() => {
    if (data && data.results) {
      setPendingInvoices(data.results);
    } else {
      setPendingInvoices([]);
    }
  }, [data]);

  // Handler to open invoice in new tab
  const handleOpenInvoice = (invoiceId: string) => {
    const invoiceUrl = `/sales/invoice/${invoiceId}/view`;
    window.open(invoiceUrl, '_blank');
  };

  // Don't show section if no customer selected
  if (!customerType || !customerId) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
        Previous Invoices
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load pending invoices
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={30} />
        </Box>
      ) : pendingInvoices.length === 0 ? (
        <Alert severity="info">
          No pending invoices
        </Alert>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden',
            maxHeight: '400px',
          }}
        >
          {/* Fixed Header */}
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: '800px' }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      border: '1px solid #e0e0e0',
                      width: '8%',
                      minWidth: '60px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f5f5f5',
                      zIndex: 1,
                    }}
                  >
                    S.No
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      border: '1px solid #e0e0e0',
                      width: '20%',
                      minWidth: '140px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f5f5f5',
                      zIndex: 1,
                    }}
                  >
                    Invoice Date
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      border: '1px solid #e0e0e0',
                      width: '22%',
                      minWidth: '160px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f5f5f5',
                      zIndex: 1,
                    }}
                  >
                    Invoice No
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      border: '1px solid #e0e0e0',
                      textAlign: 'right',
                      width: '18%',
                      minWidth: '130px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f5f5f5',
                      zIndex: 1,
                    }}
                  >
                    Invoice Value
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      border: '1px solid #e0e0e0',
                      textAlign: 'right',
                      width: '18%',
                      minWidth: '130px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f5f5f5',
                      zIndex: 1,
                    }}
                  >
                    Pending Balance
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      border: '1px solid #e0e0e0',
                      textAlign: 'center',
                      width: '14%',
                      minWidth: '100px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f5f5f5',
                      zIndex: 1,
                    }}
                  >
                    Days
                  </TableCell>
                </TableRow>
              </TableHead>
            </Table>
          </Box>

          {/* Scrollable Body */}
          <Box
            sx={{
              flex: 1,
              overflowX: 'auto',
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                height: '8px',
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
                '&:hover': {
                  background: '#555',
                },
              },
            }}
          >
            <Table size="small" sx={{ minWidth: '800px' }}>
              <TableBody>
                {pendingInvoices.map((invoice, index) => (
                  <TableRow key={invoice.id} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                    <TableCell sx={{ border: '1px solid #e0e0e0', width: '8%', minWidth: '60px' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', width: '20%', minWidth: '140px' }}>
                      {invoice.invoice_date}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', width: '22%', minWidth: '160px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            color: '#1976d2',
                            cursor: 'pointer',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: '#1565c0',
                            },
                            flex: 1,
                          }}
                          onClick={() => handleOpenInvoice(invoice.id)}
                        >
                          {invoice.invoice_number}
                        </Typography>
                        <Tooltip title="Open in new tab">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenInvoice(invoice.id)}
                            sx={{
                              padding: '4px',
                              color: '#1976d2',
                              '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                              },
                            }}
                          >
                            <OpenInNewIcon sx={{ fontSize: '16px' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'right', width: '18%', minWidth: '130px' }}>
                      ₹{invoice.grand_total.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'right', fontWeight: 500, color: '#d32f2f', width: '18%', minWidth: '130px' }}>
                      ₹{invoice.balance_amount.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', width: '14%', minWidth: '100px' }}>
                      {invoice.days}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PreviousInvoicesSection;

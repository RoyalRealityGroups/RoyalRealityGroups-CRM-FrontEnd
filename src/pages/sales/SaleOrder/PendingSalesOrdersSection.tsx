import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { salesOrderApi } from '../../../api/sales.api';
import type { CustomerType } from '../../../types/sales.types';

interface PendingSalesOrdersSectionProps {
  customerType: CustomerType;
  customerId: string;
}

const PendingSalesOrdersSection: React.FC<PendingSalesOrdersSectionProps> = ({
  customerType,
  customerId,
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pendingSalesOrders', customerType, customerId],
    queryFn: () => salesOrderApi.getPendingOrders(customerType, customerId),
    enabled: !!customerType && !!customerId,
  });

  const handleOpenOrder = (orderId: string) => {
    window.open(`/sales/orders/${orderId}/view`, '_blank');
  };

  if (!customerType || !customerId) {
    return null;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading pending sales orders: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  if (!data?.results || data.results.length === 0) {
    return (
      <Box sx={{ mb: 3 }}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
          Pending Sales Orders
        </Typography>
        <Alert severity="info">No pending sales orders found.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
        Pending Sales Orders ({data.count})
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={30} />
        </Box>
      ) : (
        <Box
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '400px',
          }}
        >
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
                    width: '18%',
                    minWidth: '140px',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#f5f5f5',
                    zIndex: 1,
                  }}
                >
                  Order Date
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    border: '1px solid #e0e0e0',
                    width: '20%',
                    minWidth: '150px',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#f5f5f5',
                    zIndex: 1,
                  }}
                >
                  Order No
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    border: '1px solid #e0e0e0',
                    textAlign: 'right',
                    width: '18%',
                    minWidth: '140px',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#f5f5f5',
                    zIndex: 1,
                  }}
                >
                  Order Total (₹)
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    border: '1px solid #e0e0e0',
                    textAlign: 'right',
                    width: '20%',
                    minWidth: '160px',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#f5f5f5',
                    zIndex: 1,
                  }}
                >
                  UnInvoiced Amount (₹)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.results.map((order, index) => (
                <TableRow key={order.id} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                  <TableCell sx={{ border: '1px solid #e0e0e0', width: '8%', minWidth: '60px' }}>
                    {index + 1}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0', width: '18%', minWidth: '140px' }}>
                    {order.order_date}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0', width: '20%', minWidth: '150px' }}>
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
                        }}
                        onClick={() => handleOpenOrder(order.id)}
                      >
                        {order.order_number}
                      </Typography>
                      <Tooltip title="Open in new tab">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenOrder(order.id)}
                          sx={{
                            padding: '2px',
                            color: '#1976d2',
                            '&:hover': {
                              backgroundColor: 'rgba(25, 118, 210, 0.08)',
                            },
                          }}
                        >
                          <OpenInNewIcon sx={{ fontSize: '14px' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      border: '1px solid #e0e0e0',
                      textAlign: 'right',
                      width: '18%',
                      minWidth: '140px',
                    }}
                  >
                    ₹{order.grand_total.toFixed(2)}
                  </TableCell>
                  <TableCell
                    sx={{
                      border: '1px solid #e0e0e0',
                      textAlign: 'right',
                      fontWeight: 500,
                      color: '#d32f2f',
                      width: '20%',
                      minWidth: '160px',
                    }}
                  >
                    ₹{order.uninvoiced_amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {/* Total Footer Row */}
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell colSpan={4} sx={{ border: '1px solid #e0e0e0', fontWeight: 600, textAlign: 'right' }}>
                  Total UnInvoiced:
                </TableCell>
                <TableCell
                  sx={{
                    border: '1px solid #e0e0e0',
                    fontWeight: 600,
                    textAlign: 'right',
                    color: '#d32f2f',
                  }}
                >
                  ₹{data.results.reduce((sum, order) => sum + order.uninvoiced_amount, 0).toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default PendingSalesOrdersSection;

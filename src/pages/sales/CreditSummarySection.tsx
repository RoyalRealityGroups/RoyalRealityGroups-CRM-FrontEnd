import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { salesOrderApi } from '../../api/sales.api';
import type { CustomerType } from '../../types/sales.types';

interface CreditSummarySectionProps {
  customerType: CustomerType;
  customerId: string;
}

const CreditSummarySection: React.FC<CreditSummarySectionProps> = ({
  customerType,
  customerId,
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pendingSalesOrders', customerType, customerId],
    queryFn: () => salesOrderApi.getPendingOrders(customerType, customerId),
    enabled: !!customerType && !!customerId,
  });

  if (!customerType || !customerId) {
    return null;
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading credit summary: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  if (!data?.credit_summary) {
    return null;
  }

  const { credit_summary } = data;

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Credit Summary
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '50%' }}>Description</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', width: '50%' }}>
                Amount (₹)
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Total Credit Limit</TableCell>
              <TableCell align="right">
                {credit_summary.credit_limit.toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Existing Order Value (Uninvoiced)</TableCell>
              <TableCell align="right">
                {credit_summary.existing_order_value.toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Pending Invoice Balance</TableCell>
              <TableCell align="right">
                {credit_summary.pending_invoice_balance.toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Available Credit</TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 'bold',
                  color: credit_summary.available_credit < 0 ? 'error.main' : 'success.main',
                }}
              >
                {credit_summary.available_credit.toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default CreditSummarySection;

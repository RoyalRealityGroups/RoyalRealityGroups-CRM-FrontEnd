import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import CancelIcon from '@mui/icons-material/Cancel';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { format } from 'date-fns';
import { invoiceApi } from '../../../api/invoice.api';
import apiClient from '../../../api/axios.config';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import ScreenHeader from '../../../components/common/ScreenHeader';
import AuthorizationHistory from '../../../components/authorization/AuthorizationHistory';
import MediaImage from '../../../components/common/MediaImage';
import { getPageContainerStyles, getHeaderSectionStyles } from '../../../utils/spacing';
import type { Invoice } from '../../../types/invoice.types';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CompanyData {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  gst_number?: string;
}

const InvoiceView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchParams] = useSearchParams();
  const { error: toastError } = useToast();
  const { success: toastSuccess } = useToast();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const companyLogoUrl = company?.logo;

  const deleteMutation = useMutation({
    mutationFn: invoiceApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toastSuccess('Invoice deleted successfully');
      navigate('/sales/invoice');
    },
    onError: (err: any) => {
      toastError(err.response?.data?.error || 'Failed to delete invoice');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: invoiceApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setCancelDialogOpen(false);
      toastSuccess('Invoice cancelled successfully');
      loadInvoiceData();
    },
    onError: (err: any) => {
      toastError(err.response?.data?.error || 'Failed to cancel invoice');
    },
  });

  useEffect(() => {
    if (invoice) {
      setBreadcrumbs([
        { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
        { label: 'Sales', path: '/sales', icon: <FolderIcon fontSize="small" /> },
        { label: 'Invoice', path: '/sales/invoice', icon: <ReceiptIcon fontSize="small" /> },
        { label: 'View', icon: <PrintIcon fontSize="small" /> },
      ]);
    }
    return () => setBreadcrumbs([]);
  }, [invoice, setBreadcrumbs]);

  useEffect(() => {
    if (!id) {
      setError('No invoice ID provided');
      setLoading(false);
      return;
    }

    loadInvoiceData();
  }, [id]);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);
      const invoiceData = await invoiceApi.getById(id!);
      setInvoice(invoiceData);

      // Fetch company details if company ID exists
      if (invoiceData.company) {
        try {
          const companyResponse = await apiClient.get(`/api/masters/companies/${invoiceData.company}/`);
          setCompany(companyResponse.data);
        } catch (e) {
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice');
      toastError('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!id) return;
    navigate(`/sales/invoice/${id}/print?print=1`, { state: { from: location.pathname } });
  };

  const handleDownloadPdf = () => {
    if (!id) return;
    navigate(`/sales/invoice/${id}/print?download=pdf`, { state: { from: location.pathname } });
  };
  const handleEdit = () => {
    if (!id) return;
    navigate(`/sales/invoice/edit/${id}`);
  };

  const handleBack = () => {
    const returnTab = searchParams.get('returnTab');
    const returnPage = searchParams.get('returnPage');
    const returnPageSize = searchParams.get('returnPageSize');
    
    if (returnTab !== null) {
      navigate('/sales/invoice', {
        state: {
          activeTab: parseInt(returnTab),
          page: returnPage ? parseInt(returnPage) : 0,
          pageSize: returnPageSize ? parseInt(returnPageSize) : 10,
        },
      });
    } else {
      navigate('/sales/invoice');
    }
  };

  const getStatusColor = (status: string) => {
    const configs: Record<string, any> = {
      DRAFT: { bg: '#fff3cd', color: '#856404', label: 'Draft' },
      PENDING: { bg: '#fff3cd', color: '#856404', label: 'Pending' },
      CONFIRMED: { bg: '#d1ecf1', color: '#0c5460', label: 'Confirmed' },
      PAID: { bg: '#d4edda', color: '#155724', label: 'Paid' },
      PARTIALLY_PAID: { bg: '#fff3cd', color: '#856404', label: 'Partially Paid' },
      CANCELLED: { bg: '#f8d7da', color: '#721c24', label: 'Cancelled' },
    };
    return configs[status] || configs.DRAFT;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Failed to load invoice'}
        </Alert>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to List
        </Button>
      </Box>
    );
  }

  const statusConfig = getStatusColor(invoice.status);
  const canDownloadPdf = hasPermission(user, 'download_invoice');
  const canPrint = hasPermission(user, 'print_invoice');
  const isEditableStateNotFullyAuthorized =
    ['DRAFT', 'PENDING'].includes(invoice.status) && invoice.authorized_status !== 2;
  const canEdit = hasPermission(user, 'change_invoice') && isEditableStateNotFullyAuthorized;
  const canDelete = hasPermission(user, 'delete_invoice') && isEditableStateNotFullyAuthorized;
  const canCancel = hasPermission(user, 'cancel_invoice') && ['DRAFT', 'PENDING', 'CONFIRMED'].includes(invoice.status);

  return (
    <Box
      className="print-content"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#f5f5f5',
        overflow: 'auto',
        '@media print': {
          bgcolor: 'white',
          p: 2,
          overflow: 'visible',
        },
      }}
    >
      <Box sx={{ ...getHeaderSectionStyles(), '@media print': { display: 'none' } }}>
        <ScreenHeader
          title={`Invoice - ${invoice.invoice_number}`}
          showBackButton
          onBack={handleBack}
          disableBox
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canDownloadPdf && (
              <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPdf}>
                PDF
              </Button>
            )}
            {canEdit && (
              <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<CancelIcon />}
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel
              </Button>
            )}
            {canPrint && (
              <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
                Print
              </Button>
            )}
          </Box>
        </ScreenHeader>
      </Box>

      <Paper
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          p: 4,
          '@media print': {
            boxShadow: 'none',
            p: 0,
          },
        }}
      >
        {/* Header Section with Company Logo and Details */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            {/* Company Logo - Left */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {companyLogoUrl && (
                <MediaImage
                  src={companyLogoUrl}
                  alt={company?.name || 'Company'}
                  sx={{
                    height: 60,
                    width: 'auto',
                    maxWidth: 120,
                  }}
                />
              )}
            </Box>

            {/* Company Details - Center */}
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#006766',
                  mb: 1,
                  fontFamily: '"Space Grotesk", "Poppins", sans-serif',
                }}
              >
                {company?.name || 'Company Name'}
              </Typography>
              {company?.address && (
                <Box sx={{ mb: 1 }}>
                  {company.address.split(',').map((line, index, array) => {
                    const midPoint = Math.ceil(array.length / 2);
                    if (index === 0) {
                      const firstLine = array.slice(0, midPoint).join(',').trim();
                      const secondLine = array.slice(midPoint).join(',').trim();
                      return (
                        <Box key="address">
                          <Typography variant="body2" color="text.secondary">
                            {firstLine}
                          </Typography>
                          {secondLine && (
                            <Typography variant="body2" color="text.secondary">
                              {secondLine}
                            </Typography>
                          )}
                        </Box>
                      );
                    }
                    return null;
                  })}
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
                {company?.phone && (
                  <Typography variant="body2" color="text.secondary">
                    Phone: {company.phone}
                  </Typography>
                )}
                {company?.email && (
                  <Typography variant="body2" color="text.secondary">
                    Email: {company.email}
                  </Typography>
                )}
              </Box>
              {company?.gst_number && (
                <Typography variant="body2" color="text.secondary">
                  GST: {company.gst_number}
                </Typography>
              )}
            </Box>

            {/* Status - Right */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Chip
                label={getStatusColor(invoice.status).label}
                sx={{
                  backgroundColor: getStatusColor(invoice.status).bg,
                  color: getStatusColor(invoice.status).color,
                  fontWeight: 700,
                  fontSize: '1rem',
                  height: 40,
                  px: 2,
                  '@media print': {
                    border: `2px solid ${getStatusColor(invoice.status).color}`,
                  },
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: '#006766',
              textAlign: 'center',
              mb: 3,
            }}
          >
            INVOICE
          </Typography>
        </Box>

        {/* Invoice Details in Enhanced Tabular Format */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 3 }}>
            Invoice Details
          </Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Invoice Number
                  </TableCell>
                  <TableCell sx={{ width: '20%', border: '1px solid #e0e0e0' }}>
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Source Type
                  </TableCell>
                  <TableCell sx={{ width: '20%', border: '1px solid #e0e0e0' }}>
                    {invoice.source_type}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Order Number
                  </TableCell>
                  <TableCell sx={{ width: '15%', border: '1px solid #e0e0e0' }}>
                    {invoice.order_number}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Invoice Date
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {format(new Date(invoice.invoice_date), 'dd-MM-yyyy')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Due Date
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {format(new Date(invoice.due_date), 'dd-MM-yyyy')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Customer
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {invoice.customer_name}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Address Details */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 3 }}>
            Address Details
          </Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Billing Address
                  </TableCell>
                  <TableCell sx={{ width: '35%', border: '1px solid #e0e0e0' }}>
                    {invoice.billing_address}
                    <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                      State: {invoice.billing_state}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Shipping Address
                  </TableCell>
                  <TableCell sx={{ width: '35%', border: '1px solid #e0e0e0' }}>
                    {invoice.shipping_address}
                    <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                      State: {invoice.shipping_state}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Line Items */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
            Invoice Products
          </Typography>
          <TableContainer>
            <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#006766' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    S.No
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Category
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Product Code
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Product Name
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    HSN Code
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0', textAlign: 'right' }}>
                    Quantity
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0', textAlign: 'right' }}>
                    Rate
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0', textAlign: 'right' }}>
                    Discount
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0', textAlign: 'right' }}>
                    Taxable Amount
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0', textAlign: 'right' }}>
                    Tax Amount
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0', textAlign: 'right' }}>
                    Line Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items?.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                      {item.category_name || '-'}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                      {item.item_code}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                      {item.item_name}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                      {item.hsn_code}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'right' }}>
                      {Number(item.quantity).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'right' }}>
                      ₹{Number(item.rate).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'right' }}>
                      ₹{Number(item.discount_amount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'right' }}>
                      ₹{Number(item.taxable_amount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'right' }}>
                      ₹{Number(item.tax_amount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'right', fontWeight: 600 }}>
                      ₹{Number(item.line_total || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Invoice Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
          <Box sx={{ minWidth: 300 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Subtotal
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                    ₹{Number(invoice.subtotal || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Discount
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                    ₹{Number(invoice.discount_amount || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Taxable Amount
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                    ₹{Number(invoice.taxable_amount || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Tax Amount
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                    ₹{Number(invoice.tax_amount || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, border: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                    Grand Total
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 700, border: '1px solid #e0e0e0', backgroundColor: '#f5f5f5', color: '#006766' }}>
                    ₹{Number(invoice.grand_total || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Paid Amount
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0', color: 'success.main' }}>
                    ₹{Number(invoice.paid_amount || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, border: '1px solid #e0e0e0', backgroundColor: '#fff3cd' }}>
                    Balance Amount
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 700, border: '1px solid #e0e0e0', backgroundColor: '#fff3cd', color: 'error.main' }}>
                    ₹{Number(invoice.balance_amount || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>

        {/* Remarks */}
        {invoice.remarks && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
              Remarks
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
              <Typography variant="body2">{invoice.remarks}</Typography>
            </Paper>
          </Box>
        )}

        {/* Authorization History */}
        {invoice.id && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
              Authorization History
            </Typography>
            <AuthorizationHistory modelPath="invoice.invoice" instanceId={invoice.id} />
          </Box>
        )}

        {/* Footer */}
        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: '2px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            '@media print': {
              mt: 2,
              pt: 2,
              fontSize: '9px',
            },
          }}
        >
          <Typography variant="caption" sx={{ color: '#666', '@media print': { fontSize: '9px' } }}>
            Generated on {format(new Date(), 'dd-MM-yyyy, hh:mm a')}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666', '@media print': { fontSize: '9px' } }}>
            Invoice: {invoice.invoice_number}
          </Typography>
        </Box>
      </Paper>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          Delete Invoice
          <IconButton
            onClick={() => setDeleteDialogOpen(false)}
            size="small"
            disabled={deleteMutation.isPending}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete invoice <strong>{invoice.invoice_number}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(id!)}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>
          Cancel Invoice
          <IconButton
            onClick={() => setCancelDialogOpen(false)}
            size="small"
            disabled={cancelMutation.isPending}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel invoice <strong>{invoice.invoice_number}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelMutation.isPending}>
            Close
          </Button>
          <Button
            color="warning"
            variant="contained"
            disabled={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate(id!)}
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceView;

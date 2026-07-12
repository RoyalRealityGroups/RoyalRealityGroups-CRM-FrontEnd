import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import {
  Box, Paper, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
  Receipt as ReceiptIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { receiptApi } from '../../api/receipt.api';
import apiClient from '../../api/axios.config';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import ScreenHeader from '../../components/common/ScreenHeader';
import AuthorizationHistory from '../../components/authorization/AuthorizationHistory';
import MediaImage from '../../components/common/MediaImage';
import { getHeaderSectionStyles } from '../../utils/spacing';
import { resolveMediaUrl } from '../../utils/media';
import type { Receipt, CustomerLedgerEntry, CustomerLedgerSummary } from '../../types/receipt.types';
import type { RootState } from '../../store/store';
import { hasPermission } from '../../utils/permissions';
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

const ReceiptView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchParams] = useSearchParams();
  const { error: toastError, success: toastSuccess } = useToast();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customerLedgerSummary, setCustomerLedgerSummary] = useState<CustomerLedgerSummary | null>(null);
  const [customerLedgerEntries, setCustomerLedgerEntries] = useState<CustomerLedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  usePageTitle('View Receipt');

  useEffect(() => {
    if (receipt) {
      setBreadcrumbs([
        { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
        { label: 'Sales', path: '/sales', icon: <FolderIcon fontSize="small" /> },
        { label: 'Receipts', path: '/receipts', icon: <ReceiptIcon fontSize="small" /> },
        { label: 'View', icon: <PrintIcon fontSize="small" /> },
      ]);
    }
    return () => setBreadcrumbs([]);
  }, [receipt, setBreadcrumbs]);

  useEffect(() => {
    if (!id) {
      setError('No receipt ID provided');
      setLoading(false);
      return;
    }
    loadReceiptData();
  }, [id]);

  const loadReceiptData = async () => {
    try {
      setLoading(true);
      const data = await receiptApi.getById(id!);
      setReceipt(data);

      if (data.company) {
        try {
          const companyResponse = await apiClient.get(`/api/masters/companies/${data.company}/`);
          setCompany(companyResponse.data);
        } catch (e) {
        }
      }

      const customerId =
        data.customer_type === 'RETAILER' ? data.retailer :
        data.customer_type === 'DISTRIBUTOR' ? data.distributor :
        data.customer_type === 'SUPERSTOCKIST' ? data.superstockist : null;

      if (data.customer_type && customerId) {
        try {
          setLedgerLoading(true);
          setLedgerError(null);
          const [summary, ledger] = await Promise.all([
            receiptApi.getCustomerLedgerSummary(
              data.customer_type,
              String(customerId),
              undefined,
              data.receipt_date,
            ),
            receiptApi.getCustomerLedger({
              customer_type: data.customer_type,
              customer_id: String(customerId),
              posting_date_to: data.receipt_date,
              page: 1,
              page_size: 10,
              entry_status: 'ACTIVE',
            }),
          ]);

          setCustomerLedgerSummary(summary);
          setCustomerLedgerEntries(ledger.results || []);
        } catch (ledgerErr) {
          setLedgerError('Customer ledger is currently unavailable.');
        } finally {
          setLedgerLoading(false);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load receipt');
      toastError('Failed to load receipt details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const returnTab = searchParams.get('returnTab');
    const returnPage = searchParams.get('returnPage');
    const returnPageSize = searchParams.get('returnPageSize');
    
    if (returnTab !== null) {
      navigate('/receipts', {
        state: {
          activeTab: parseInt(returnTab),
          page: returnPage ? parseInt(returnPage) : 0,
          pageSize: returnPageSize ? parseInt(returnPageSize) : 10,
        },
      });
    } else {
      navigate('/receipts');
    }
  };

  const handlePrint = () => {
    if (!id) return;
    navigate(`/receipts/${id}/print?print=1`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const getStatusConfig = (status?: number) => {
    const map: Record<number, { label: string; bg: string; color: string }> = {
      0: { label: 'Draft', bg: '#fff3cd', color: '#664d03' },
      1: { label: 'Pending', bg: '#d1ecf1', color: '#0c5460' },
      2: { label: 'Approved', bg: '#d1e7dd', color: '#0f5132' },
      3: { label: 'Rejected', bg: '#f8d7da', color: '#842029' },
    };
    return map[status ?? 1] || map[1];
  };

  const handleDownloadPdf = () => {
    if (!id) return;
    navigate(`/receipts/${id}/print?download=pdf`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  };
  const handleEdit = () => {
    if (!id) return;
    navigate(`/receipts/edit/${id}`);
  };

  const deleteMutation = useMutation({
    mutationFn: receiptApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toastSuccess('Receipt deleted successfully');
      navigate('/receipts');
    },
    onError: (err: any) => {
      toastError(err.response?.data?.error || 'Failed to delete receipt');
    },
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !receipt) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Failed to load receipt'}
        </Alert>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to List
        </Button>
      </Box>
    );
  }

  const companyLogoUrl = company?.logo;
  const statusConfig = getStatusConfig(receipt.authorized_status);
  const canDownloadPdf = hasPermission(user, 'download_receipt');
  const canPrint = hasPermission(user, 'print_receipt');
  const isEditableStateNotFullyAuthorized = [0, 1].includes(receipt.authorized_status ?? 1);
  const canEdit = hasPermission(user, 'change_receipt') && isEditableStateNotFullyAuthorized;
  const canDelete = hasPermission(user, 'delete_receipt') && isEditableStateNotFullyAuthorized;
  const formatCurrency = (amount: number) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const receiptAttachments = (receipt.attachments || []) as any[];

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
        <ScreenHeader title={`Receipt - ${receipt.receipt_number}`} showBackButton onBack={handleBack} disableBox>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
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
              <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteDialogOpen(true)}>
                Delete
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
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {companyLogoUrl && (
                <MediaImage
                  src={companyLogoUrl}
                  alt={company?.name || receipt.company_name || 'Company'}
                  sx={{
                    height: 60,
                    width: 'auto',
                    maxWidth: 120,
                  }}
                />
              )}
            </Box>

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
                {company?.name || receipt.company_name || 'Company Name'}
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

            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Chip
                label={statusConfig.label}
                sx={{
                  backgroundColor: statusConfig.bg,
                  color: statusConfig.color,
                  fontWeight: 700,
                  fontSize: '1rem',
                  height: 40,
                  px: 2,
                  '@media print': { border: `2px solid ${statusConfig.color}` },
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 600, color: '#006766', textAlign: 'center', mb: 4 }}>
          RECEIPT
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 3 }}>
            Receipt Details
          </Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '20%', border: '1px solid #e0e0e0' }}>
                    Receipt Number
                  </TableCell>
                  <TableCell sx={{ width: '30%', border: '1px solid #e0e0e0' }}>
                    {receipt.receipt_number}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '20%', border: '1px solid #e0e0e0' }}>
                    Receipt Date
                  </TableCell>
                  <TableCell sx={{ width: '30%', border: '1px solid #e0e0e0' }}>
                    {format(new Date(receipt.receipt_date), 'dd-MM-yyyy')}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Payment Date
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {format(new Date(receipt.payment_date), 'dd-MM-yyyy')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Payment Mode
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {receipt.payment_mode_display}
                  </TableCell>
                </TableRow>
                {(receipt.reference_number || receipt.bank_name) && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                      Reference Number
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                      {receipt.reference_number}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                      Bank Name
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                      {receipt.bank_name || '-'}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Location
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {receipt.location_name || '-'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Company
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {receipt.company_name || '-'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Customer Type
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {receipt.customer_type}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Customer Name
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {receipt.customer_name}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
            Invoice Allocations
          </Typography>
          <TableContainer>
            <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#006766' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>S.No</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Invoice Number</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Invoice Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0', textAlign: 'right' }}>Invoice Amount</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0', textAlign: 'right' }}>Invoice Balance</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0', textAlign: 'right' }}>Allocated Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receipt.allocations?.map((alloc, index) => (
                  <TableRow key={alloc.id || index}>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>{index + 1}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>{alloc.invoice_number}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                      {alloc.invoice_date ? format(new Date(alloc.invoice_date), 'dd-MM-yyyy') : '-'}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'right' }}>
                      ₹{Number(alloc.invoice_amount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'right' }}>
                      ₹{Number(alloc.invoice_balance || 0).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'right', fontWeight: 600 }}>
                      ₹{Number(alloc.allocated_amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
          <Box sx={{ minWidth: 300 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>Total Amount</TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                    ₹{Number(receipt.total_amount).toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>Allocated Amount</TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0', color: 'success.main' }}>
                    ₹{Number(receipt.allocated_amount || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, border: '1px solid #e0e0e0', backgroundColor: '#fff3cd' }}>
                    Adjustment Amount
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 700, border: '1px solid #e0e0e0', backgroundColor: '#fff3cd' }}>
                    ₹{Number(receipt.adjustment_amount || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
            Customer Ledger Snapshot
          </Typography>

          {ledgerLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {!ledgerLoading && ledgerError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {ledgerError}
            </Alert>
          )}

          {!ledgerLoading && !ledgerError && customerLedgerSummary && (
            <>
              <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0', mb: 2 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                        Opening Balance
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                        {formatCurrency(customerLedgerSummary.opening_balance)}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                        Period Debit
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                        {formatCurrency(customerLedgerSummary.period_debit)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                        Period Credit
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                        {formatCurrency(customerLedgerSummary.period_credit)}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: '#e8f5e9', border: '1px solid #e0e0e0' }}>
                        Closing Balance
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 700, bgcolor: '#e8f5e9', border: '1px solid #e0e0e0' }}>
                        {formatCurrency(customerLedgerSummary.closing_balance)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                Recent Ledger Entries
              </Typography>
              <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#006766' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Date</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Document</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0', textAlign: 'right' }}>Debit</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0', textAlign: 'right' }}>Credit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customerLedgerEntries.length > 0 ? customerLedgerEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                          {format(new Date(entry.posting_date), 'dd-MM-yyyy')}
                        </TableCell>
                        <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                          {entry.document_type} - {entry.document_number}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                          {formatCurrency(entry.debit_amount)}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                          {formatCurrency(entry.credit_amount)}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ textAlign: 'center', py: 2, border: '1px solid #e0e0e0' }}>
                          No ledger entries found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>

        {receipt.remarks && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
              Remarks
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
              <Typography variant="body2">{receipt.remarks}</Typography>
            </Paper>
          </Box>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
            Attachments
          </Typography>
          {receiptAttachments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No attachments available
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {receiptAttachments.map((att: any, index: number) => {
                const fileUrl = resolveMediaUrl(typeof att.file === 'string' ? att.file : '');
                const fileName = att.file_name || (typeof att.file === 'string' ? att.file.split('/').pop() : '') || `Attachment ${index + 1}`;
                const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName || '');
                return (
                  <Box
                    key={att.id || index}
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      p: 2,
                      minWidth: 220,
                      maxWidth: 280,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    {isImage && fileUrl ? (
                      <MediaImage
                        src={fileUrl}
                        alt={fileName}
                        sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 1 }}
                      />
                    ) : null}
                    <Typography variant="body2" sx={{ wordBreak: 'break-word', fontWeight: 600 }}>
                      {fileName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {att.attachment_type || 'OTHER'}{att.remarks ? ` | ${att.remarks}` : ''}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        component="a"
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        disabled={!fileUrl}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        component="a"
                        href={fileUrl}
                        download={fileName}
                        disabled={!fileUrl}
                      >
                        Download
                      </Button>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {receipt.id && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
              Authorization History
            </Typography>
            <AuthorizationHistory modelPath="receipts.receipt" instanceId={receipt.id} />
          </Box>
        )}

        <Box sx={{ mt: 4, pt: 3, borderTop: '2px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#666' }}>
            Generated on {format(new Date(), 'dd-MM-yyyy, hh:mm a')}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            Receipt: {receipt.receipt_number}
          </Typography>
        </Box>
      </Paper>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          Delete Receipt
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
            Are you sure you want to delete receipt <strong>{receipt.receipt_number}</strong>?
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
    </Box>
  );
};

export default ReceiptView;

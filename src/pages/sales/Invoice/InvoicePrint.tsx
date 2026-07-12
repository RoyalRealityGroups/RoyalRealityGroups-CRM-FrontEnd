import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Close as CloseIcon, PictureAsPdf as PictureAsPdfIcon, Print as PrintIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { invoiceApi } from '../../../api/invoice.api';
import apiClient from '../../../api/axios.config';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import MediaImage from '../../../components/common/MediaImage';
import type { Invoice } from '../../../types/invoice.types';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';

interface CompanyData {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  gst_number?: string;
}

const InvoicePrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  usePageTitle('Print Invoice');
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const autoDownload = searchParams.get('download') === 'pdf';
  const autoPrint = searchParams.get('print') === '1';
  const canDownloadPdf = hasPermission(user, 'download_invoice');
  const canPrint = hasPermission(user, 'print_invoice');
  useEffect(() => {
    if (!canDownloadPdf && !canPrint) {
      navigate('/unauthorized', { replace: true });
    }
  }, [canDownloadPdf, canPrint, navigate]);
  const backPath = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from || '/sales/invoice';
  }, [location.state]);

  const { success: toastSuccess, error: toastError } = useToast();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ['invoice', id],
    queryFn: () => invoiceApi.getById(id!),
    enabled: Boolean(id),
  });

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!invoice?.company) return;
      try {
        const response = await apiClient.get(`/api/masters/companies/${invoice.company}/`);
        setCompany(response.data);
      } catch (err) {
      }
    };
    fetchCompanyDetails();
  }, [invoice?.company]);

  const formatDate = (value?: string | null) => (value ? format(new Date(value), 'dd-MM-yyyy') : '-');
  const formatCurrency = (value?: number | string | null) =>
    `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatQuantity = (value?: number | string | null) =>
    value !== undefined && value !== null && value !== ''
      ? Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '-';
  const createdByDisplay = invoice?.created_by_name
    || (invoice?.created_by_type && invoice?.created_by_identifier
      ? `${invoice.created_by_type}: ${invoice.created_by_identifier}`
      : invoice?.created_by_identifier)
    || '-';
  const companyLogoUrl = company?.logo;
  const formatAddress = (address?: string | null) => {
    if (!address) return '';
    const parts = address.split(',').map(p => p.trim()).filter(Boolean);
    const lines: string[] = [];
    let current = '';

    parts.forEach(part => {
      const next = current ? `${current}, ${part}` : part;
      if (next.length > 50 && current) {
        lines.push(current);
        current = part;
      } else {
        current = next;
      }
    });

    if (current) lines.push(current);
    return lines.slice(0, 2).join('\n');
  };

  // Print styles
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-print-style', 'invoice-print');
    style.innerHTML = `
      .print-container {
        max-width: 410mm;
        width: 100%;
        margin: 0 auto;
      }
      .print-container .MuiTableCell-root {
        padding: 6px 8px;
        font-size: 10px;
        line-height: 1.25;
        white-space: normal;
        word-break: break-word;
        vertical-align: top;
      }
      @media print {
        body { background: white; -webkit-print-color-adjust: exact; }
        body * { visibility: hidden !important; }
        .print-container, .print-container * { visibility: visible !important; }
        .print-container {
          position: absolute;
          left: 0;
          right: 0;
          margin: 0 auto !important;
          max-width: 410mm !important;
          box-shadow: none !important;
          border: 0 !important;
          padding: 8mm 6mm;
        }
        .no-print { display: none !important; }
        @page { size: A3 landscape; margin: 8mm; }
        .print-container table { border-collapse: collapse !important; }
        .print-container .MuiTableCell-root {
          padding: 4px 6px !important;
          font-size: 9px !important;
          line-height: 1.2 !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleBack = useCallback(() => {
    navigate(backPath);
  }, [backPath, navigate]);

  const handlePrint = useCallback(() => {
    window.print();
    handleBack();
  }, [handleBack]);

  const handleDownloadPdf = useCallback(
    async (isAuto = false) => {
      if (!contentRef.current || !invoice) return;
      try {
        setIsExportingPdf(true);
        const canvas = await html2canvas(contentRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a3');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        const topPad = 8;
        const bottomPad = 10;
        const usableHeight = pdfHeight - topPad - bottomPad;

        let heightLeft = imgHeight;
        let position = topPad;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= usableHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + topPad;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= usableHeight;
        }

        pdf.save(`invoice-${invoice.invoice_number || invoice.id || 'print'}.pdf`);
        if (!isAuto) {
          toastSuccess('PDF downloaded');
        }
      } catch (err) {
        if (!isAuto) toastError('Failed to download PDF');
      } finally {
        setIsExportingPdf(false);
        if (isAuto) {
          handleBack();
        }
      }
    },
    [handleBack, invoice, toastError, toastSuccess]
  );

  useEffect(() => {
    if (autoDownload && !canDownloadPdf) {
      toastError('You do not have permission to download Invoice PDF');
      handleBack();
      return;
    }
    if (autoPrint && !canPrint) {
      toastError('You do not have permission to print Invoice');
      handleBack();
      return;
    }
    if (!autoDownload || !invoice || isLoading || isExportingPdf) return;
    const timer = setTimeout(() => void handleDownloadPdf(true), 400);
    return () => clearTimeout(timer);
  }, [autoDownload, autoPrint, canDownloadPdf, canPrint, handleBack, handleDownloadPdf, invoice, isExportingPdf, isLoading, toastError]);

  useEffect(() => {
    if (autoPrint && !canPrint) return;
    if (!autoPrint || !invoice || isLoading || isExportingPdf) return;
    const timer = setTimeout(() => {
      window.print();
      handleBack();
    }, 500);
    return () => clearTimeout(timer);
  }, [autoPrint, canPrint, handleBack, invoice, isExportingPdf, isLoading]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Typography variant="h6" color="error">
          Invoice not found
        </Typography>
      </Box>
    );
  }

  const statusConfig = (() => {
    const configs: Record<string, any> = {
      DRAFT: { bg: '#fff3cd', color: '#856404', label: 'Draft' },
      PENDING: { bg: '#fff3cd', color: '#856404', label: 'Pending' },
      CONFIRMED: { bg: '#d1ecf1', color: '#0c5460', label: 'Confirmed' },
      PAID: { bg: '#d4edda', color: '#155724', label: 'Paid' },
      PARTIALLY_PAID: { bg: '#fff3cd', color: '#856404', label: 'Partially Paid' },
      CANCELLED: { bg: '#f8d7da', color: '#721c24', label: 'Cancelled' },
    };
    return configs[invoice.status] || configs.DRAFT;
  })();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6f8', py: 3, px: { xs: 2, md: 4 } }}>
      {/* Toolbar */}
      <Box
        className="no-print"
        sx={{
          display: autoDownload || autoPrint ? 'none' : 'flex',
          justifyContent: 'flex-end',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Button
          variant="text"
          color="inherit"
          startIcon={<CloseIcon />}
          onClick={handleBack}
          disabled={isExportingPdf}
        >
          Cancel
        </Button>
        {canDownloadPdf && (
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => void handleDownloadPdf(false)}
            disabled={isExportingPdf}
          >
            {isExportingPdf ? 'Preparing PDF...' : 'Download PDF'}
          </Button>
        )}
        {canPrint && (
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint} disabled={isExportingPdf}>
            Print
          </Button>
        )}
      </Box>

      {/* Print Content */}
      <Paper
        ref={contentRef}
        className="print-container"
        sx={{
          maxWidth: '410mm',
          width: '100%',
          mx: 'auto',
          p: { xs: 2, md: 2.5 },
          pt: { xs: 3, md: 3.5 },
          pb: { xs: 4, md: 5 },
          backgroundColor: 'white',
          boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
          borderRadius: 2,
          '@media print': {
            boxShadow: 'none',
            borderRadius: 0,
            maxWidth: '100%',
            width: '100%',
            p: '8mm 6mm',
            m: 0,
          },
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Box
            sx={{
              height: 72,
              width: 72,
              borderRadius: '50%',
              border: '1px solid #d6d8df',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              bgcolor: '#f9fafb',
              flexShrink: 0,
            }}
          >
            {companyLogoUrl ? (
              <MediaImage
                src={companyLogoUrl}
                alt={company?.name || 'Company'}
                sx={{ height: '100%', width: '100%', objectFit: 'contain' }}
              />
            ) : (
              <Typography variant="subtitle2" color="text.secondary">
                Logo
              </Typography>
            )}
          </Box>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.4, color: '#1f2d3d' }}>
              {company?.name || 'Company Name'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', mt: 0.5 }}>
              {formatAddress(company?.address)}
            </Typography>
            {(company?.phone || company?.email) && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {company?.phone} {company?.phone && company?.email ? ' | ' : ''} {company?.email}
              </Typography>
            )}
            {company?.gst_number && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                GST: {company.gst_number}
              </Typography>
            )}
          </Box>
          <Box sx={{ minWidth: 130, display: 'flex', justifyContent: 'flex-end' }}>
            <Chip
              label={statusConfig.label}
              sx={{
                backgroundColor: statusConfig.bg,
                color: statusConfig.color,
                fontWeight: 700,
                fontSize: '0.95rem',
                height: 36,
                px: 1.5,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography
          variant="subtitle1"
          sx={{ textAlign: 'center', fontWeight: 800, letterSpacing: 1, color: '#263343', mb: 2, textTransform: 'uppercase' }}
        >
          Invoice
        </Typography>

        {/* Summary */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e6e8f0', mb: 3 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Invoice Number</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0', fontWeight: 600 }}>{invoice.invoice_number}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Source Type</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0', fontWeight: 600 }}>{invoice.source_type}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Order Number</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0', fontWeight: 600 }}>{invoice.order_number}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Invoice Date</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{formatDate(invoice.invoice_date)}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Due Date</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{formatDate(invoice.due_date)}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Customer</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{invoice.customer_name}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Address Details */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e6e8f0', mb: 3 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', width: '15%', border: '1px solid #e6e8f0' }}>
                  Billing Address
                </TableCell>
                <TableCell sx={{ width: '35%', border: '1px solid #e6e8f0' }}>
                  {formatAddress(invoice.billing_address) || '-'}
                  <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                    State: {invoice.billing_state}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', width: '15%', border: '1px solid #e6e8f0' }}>
                  Shipping Address
                </TableCell>
                <TableCell sx={{ width: '35%', border: '1px solid #e6e8f0' }}>
                  {formatAddress(invoice.shipping_address) || '-'}
                  <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                    State: {invoice.shipping_state}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Invoice Items */}
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center', fontWeight: 800, letterSpacing: 1, color: '#263343', mb: 1, textTransform: 'uppercase' }}
        >
          Invoice Items
        </Typography>
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e6e8f0', mb: 3 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f7fb' }}>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0' }}>S.No</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0' }}>Item Code</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0' }}>Item Name</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0' }}>HSN Code</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right' }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right' }}>Rate</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right' }}>Discount</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right' }}>Taxable Amount</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right' }}>Tax Amount</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right' }}>Line Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!invoice.items || invoice.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ border: '1px solid #e6e8f0' }}>
                    No invoice items
                  </TableCell>
                </TableRow>
              ) : (
                invoice.items.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell sx={{ border: '1px solid #e6e8f0' }}>{index + 1}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0' }}>{item.item_code}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0' }}>{item.item_name}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0' }}>{item.hsn_code}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right' }}>{formatQuantity(item.quantity)}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right' }}>{formatCurrency(item.rate)}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right' }}>{formatCurrency(item.discount_amount || 0)}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right' }}>{formatCurrency(item.taxable_amount || 0)}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right' }}>{formatCurrency(item.tax_amount || 0)}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(item.line_total || 0)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Invoice Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Box sx={{ minWidth: 320 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Subtotal
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                    {formatCurrency(invoice.subtotal || 0)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Discount
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                    {formatCurrency(invoice.discount_amount || 0)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Taxable Amount
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                    {formatCurrency(invoice.taxable_amount || 0)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Tax Amount
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                    {formatCurrency(invoice.tax_amount || 0)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, border: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                    Grand Total
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 700, border: '1px solid #e0e0e0', backgroundColor: '#f5f5f5', color: '#006766' }}>
                    {formatCurrency(invoice.grand_total || 0)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Paid Amount
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0', color: 'success.main' }}>
                    {formatCurrency(invoice.paid_amount || 0)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, border: '1px solid #e0e0e0', backgroundColor: '#fff3cd' }}>
                    Balance Amount
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 700, border: '1px solid #e0e0e0', backgroundColor: '#fff3cd', color: 'error.main' }}>
                    {formatCurrency(invoice.balance_amount || 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>

        <Divider sx={{ mt: 2, mb: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2d3d' }}>
              Created By: {createdByDisplay}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {invoice.created_on ? format(new Date(invoice.created_on), 'dd-MM-yyyy hh:mm a') : '-'}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Generated on: {format(new Date(), 'dd-MM-yyyy, hh:mm a')}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default InvoicePrint;

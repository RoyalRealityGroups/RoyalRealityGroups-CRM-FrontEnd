import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
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

import { receiptApi } from '../../api/receipt.api';
import apiClient from '../../api/axios.config';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import MediaImage from '../../components/common/MediaImage';
import type { Receipt } from '../../types/receipt.types';
import type { RootState } from '../../store/store';
import { hasPermission } from '../../utils/permissions';

interface CompanyData {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  gst_number?: string;
}

const ReceiptPrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = useSelector((state: RootState) => state.auth.user);

  usePageTitle('Print Receipt');
  const autoDownload = searchParams.get('download') === 'pdf';
  const autoPrint = searchParams.get('print') === '1';
  const canDownloadPdf = hasPermission(user, 'download_receipt');
  const canPrint = hasPermission(user, 'print_receipt');
  useEffect(() => {
    if (!canDownloadPdf && !canPrint) {
      navigate('/unauthorized', { replace: true });
    }
  }, [canDownloadPdf, canPrint, navigate]);
  const backPath = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from || '/receipts';
  }, [location.state]);

  const { success: toastSuccess, error: toastError } = useToast();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: receipt, isLoading, isError } = useQuery<Receipt>({
    queryKey: ['receipt', id, 'print'],
    queryFn: () => receiptApi.getById(id!),
    enabled: Boolean(id),
  });

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!receipt?.company) return;
      try {
        const response = await apiClient.get(`/api/masters/companies/${receipt.company}/`);
        setCompany(response.data);
      } catch (err) {
      }
    };
    fetchCompanyDetails();
  }, [receipt?.company]);

  const formatDate = (value?: string | null) => (value ? format(new Date(value), 'dd-MM-yyyy') : '-');
  const formatCurrency = (value?: number | string | null) =>
    `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatAddress = (address?: string | null) => {
    if (!address) return '';
    const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
    const lines: string[] = [];
    let current = '';

    parts.forEach((part) => {
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

  const getStatusConfig = (status?: number) => {
    const map: Record<number, { label: string; bg: string; color: string }> = {
      0: { label: 'Draft', bg: '#fff3cd', color: '#664d03' },
      1: { label: 'Pending', bg: '#d1ecf1', color: '#0c5460' },
      2: { label: 'Approved', bg: '#d1e7dd', color: '#0f5132' },
      3: { label: 'Rejected', bg: '#f8d7da', color: '#842029' },
    };
    return map[status ?? 1] || map[1];
  };

  const statusConfig = getStatusConfig(receipt?.authorized_status);

  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-print-style', 'receipt-print');
    style.innerHTML = `
      .print-container {
        max-width: 210mm;
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
        html, body {
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          overflow: visible !important;
        }
        body * { visibility: hidden !important; }
        .print-container, .print-container * { visibility: visible !important; }
        .print-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          margin: 0 !important;
          max-width: none !important;
          width: 100% !important;
          box-sizing: border-box !important;
          box-shadow: none !important;
          border: 0 !important;
          padding-top: 6mm !important;
          padding-bottom: 8mm !important;
          padding-left: 6mm !important;
          padding-right: 6mm !important;
        }
        .no-print { display: none !important; }
        @page { size: A4 portrait; margin: 6mm; }
        .print-container table { border-collapse: collapse !important; }
        .print-container .MuiTableCell-root {
          padding: 4px 6px !important;
          font-size: 9px !important;
          line-height: 1.2 !important;
          white-space: normal !important;
          word-break: break-word !important;
          vertical-align: top !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.querySelector('[data-print-style="receipt-print"]')?.remove();
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
      if (!contentRef.current || !receipt) return;
      try {
        setIsExportingPdf(true);
        const canvas = await html2canvas(contentRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pageWidth) / canvas.width;
        const topPad = 6;
        const bottomPad = 8;
        const usableHeight = pageHeight - topPad - bottomPad;

        let heightLeft = imgHeight;
        let position = topPad;

        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= usableHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + topPad;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
          heightLeft -= usableHeight;
        }

        pdf.save(`receipt-${receipt.receipt_number || receipt.id || 'print'}.pdf`);
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
    [handleBack, receipt, toastError, toastSuccess]
  );

  useEffect(() => {
    if (!receipt || isLoading || isExportingPdf) return;
    if (autoDownload && !canDownloadPdf) {
      toastError('You do not have permission to download Receipt PDF');
      handleBack();
      return;
    }
    if (autoPrint && !canPrint) {
      toastError('You do not have permission to print Receipt');
      handleBack();
      return;
    }
    if (autoDownload) {
      const timer = setTimeout(() => void handleDownloadPdf(true), 400);
      return () => clearTimeout(timer);
    }
    if (autoPrint) {
      if (!canPrint) return;
      const timer = setTimeout(() => {
        window.print();
        handleBack();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, autoPrint, canDownloadPdf, canPrint, handleBack, handleDownloadPdf, isExportingPdf, isLoading, receipt, toastError]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !receipt) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load Receipt
        </Alert>
        <Button variant="contained" startIcon={<CloseIcon />} onClick={handleBack}>
          Back
        </Button>
      </Box>
    );
  }

  const companyLogoUrl = company?.logo;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6f8', py: 3, px: { xs: 2, md: 4 } }}>
      <Box
        className="no-print"
        sx={{
          display: autoDownload || autoPrint ? 'none' : 'flex',
          justifyContent: 'flex-end',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Button variant="text" color="inherit" startIcon={<CloseIcon />} onClick={handleBack} disabled={isExportingPdf}>
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

      <Paper
        ref={contentRef}
        className="print-container"
        sx={{
          maxWidth: '210mm',
          width: '100%',
          mx: 'auto',
          p: { xs: 2.5, md: 3 },
          pt: { xs: 3.5, md: 4 },
          pb: { xs: 4.5, md: 5.5 },
          backgroundColor: 'white',
          boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
          borderRadius: 2,
          '@media print': {
            boxShadow: 'none',
            borderRadius: 0,
            maxWidth: '100%',
            width: '100%',
            p: 0,
            m: 0,
          },
        }}
      >
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
                alt={company?.name || receipt.company_name || 'Company'}
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
              {company?.name || receipt.company_name || 'Company'}
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
          Receipt
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1f2d3d', mb: 1.2 }}>
            Receipt Details
          </Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', width: '20%', border: '1px solid #e2e8f0' }}>
                    Receipt Number
                  </TableCell>
                  <TableCell sx={{ width: '30%', border: '1px solid #e2e8f0' }}>
                    {receipt.receipt_number || '-'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', width: '20%', border: '1px solid #e2e8f0' }}>
                    Receipt Date
                  </TableCell>
                  <TableCell sx={{ width: '30%', border: '1px solid #e2e8f0' }}>
                    {formatDate(receipt.receipt_date)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    Payment Date
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e2e8f0' }}>
                    {formatDate(receipt.payment_date)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    Payment Mode
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e2e8f0' }}>
                    {receipt.payment_mode_display || receipt.payment_mode}
                  </TableCell>
                </TableRow>
                {(receipt.reference_number || receipt.bank_name) && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      Reference Number
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e2e8f0' }}>
                      {receipt.reference_number || '-'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      Bank Name
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e2e8f0' }}>
                      {receipt.bank_name || '-'}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    Customer Type
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e2e8f0' }}>
                    {receipt.customer_type}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    Customer Name
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e2e8f0' }}>
                    {receipt.customer_name || '-'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    Location
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e2e8f0' }}>
                    {receipt.location_name || '-'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    Company
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e2e8f0' }}>
                    {receipt.company_name || '-'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1f2d3d', mb: 1.2 }}>
            Invoice Allocations
          </Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#006766' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 700, border: '1px solid #e2e8f0' }}>S.No</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, border: '1px solid #e2e8f0' }}>Invoice Number</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, border: '1px solid #e2e8f0' }}>Invoice Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, border: '1px solid #e2e8f0', textAlign: 'right' }}>Invoice Amount</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, border: '1px solid #e2e8f0', textAlign: 'right' }}>Invoice Balance</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, border: '1px solid #e2e8f0', textAlign: 'right' }}>Allocated Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receipt.allocations?.map((alloc, index) => (
                  <TableRow key={alloc.id || index}>
                    <TableCell sx={{ border: '1px solid #e2e8f0' }}>{index + 1}</TableCell>
                    <TableCell sx={{ border: '1px solid #e2e8f0' }}>{alloc.invoice_number || '-'}</TableCell>
                    <TableCell sx={{ border: '1px solid #e2e8f0' }}>
                      {alloc.invoice_date ? formatDate(alloc.invoice_date) : '-'}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e2e8f0', textAlign: 'right' }}>
                      {formatCurrency(alloc.invoice_amount)}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e2e8f0', textAlign: 'right' }}>
                      {formatCurrency(alloc.invoice_balance)}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700 }}>
                      {formatCurrency(alloc.allocated_amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Box sx={{ minWidth: 320 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, border: '1px solid #e2e8f0' }}>Total Amount</TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e2e8f0' }}>
                    {formatCurrency(receipt.total_amount)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, border: '1px solid #e2e8f0' }}>Allocated Amount</TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e2e8f0', color: 'success.main' }}>
                    {formatCurrency(receipt.allocated_amount || 0)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, border: '1px solid #e2e8f0', backgroundColor: '#fff3cd' }}>
                    Adjustment Amount
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 700, border: '1px solid #e2e8f0', backgroundColor: '#fff3cd' }}>
                    {formatCurrency(receipt.adjustment_amount || 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>

        {receipt.remarks && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1f2d3d', mb: 1.2 }}>
              Remarks
            </Typography>
            <Paper sx={{ p: 1.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
              <Typography variant="body2">{receipt.remarks}</Typography>
            </Paper>
          </Box>
        )}

        <Box
          sx={{
            mt: 2,
            pt: 1.5,
            borderTop: '1px solid #d6d8df',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" sx={{ color: '#5f6b7a' }}>
            Generated on {format(new Date(), 'dd-MM-yyyy, hh:mm a')}
          </Typography>
          <Typography variant="caption" sx={{ color: '#5f6b7a' }}>
            Receipt: {receipt.receipt_number || '-'}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ReceiptPrint;

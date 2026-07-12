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
  TableRow,
  Typography,
} from '@mui/material';
import { Close as CloseIcon, PictureAsPdf as PictureAsPdfIcon, Print as PrintIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import dayjs from 'dayjs';

import { podApi } from '../../../api/pod.api';
import type { ProofOfDelivery } from '../../../types/pod.types';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import MediaImage from '../../../components/common/MediaImage';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';

const ProofOfDeliveryPrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = useSelector((state: RootState) => state.auth.user);

  usePageTitle('Print POD');
  const { success: toastSuccess, error: toastError } = useToast();
  const autoDownload = searchParams.get('download') === 'pdf';
  const autoPrint = searchParams.get('print') === '1';
  const canDownloadPdf = hasPermission(user, 'download_proofofdelivery');
  const canPrint = hasPermission(user, 'print_proofofdelivery');
  useEffect(() => {
    if (!canDownloadPdf && !canPrint) {
      navigate('/unauthorized', { replace: true });
    }
  }, [canDownloadPdf, canPrint, navigate]);
  const backPath = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from || '/sales/pod';
  }, [location.state]);

  const contentRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const { data, isLoading, isError } = useQuery<ProofOfDelivery>({
    queryKey: ['pod', id, 'print'],
    queryFn: () => podApi.getById(id!),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (isError) {
      toastError('Failed to load Proof of Delivery');
    }
  }, [isError, toastError]);

  const handleBack = useCallback(() => {
    navigate(backPath);
  }, [backPath, navigate]);

  const handlePrint = useCallback(() => {
    window.print();
    handleBack();
  }, [handleBack]);

  const formatDate = (value?: string | null) => (value ? dayjs(value).format('DD-MM-YYYY') : '-');
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

  const statusConfig = useMemo(() => {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      SUCCESS: { label: 'Delivered', bg: '#d1e7dd', color: '#0f5132' },
      PARTIAL: { label: 'Partial', bg: '#d1ecf1', color: '#0c5460' },
      FAILED: { label: 'Failed', bg: '#f8d7da', color: '#842029' },
      PENDING: { label: 'Pending', bg: '#fff3cd', color: '#664d03' },
    };
    return (data?.status && map[data.status]) || map.PENDING;
  }, [data?.status]);
  const companyLogoUrl = data?.company_logo;

  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-print-style', 'pod-print');
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
      document.head.querySelector('[data-print-style="pod-print"]')?.remove();
    };
  }, []);

  const handleDownloadPdf = useCallback(
    async (isAuto = false) => {
      if (!contentRef.current || !data) return;
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

        pdf.save(`pod-${data.pod_number || data.invoice_number || data.id || 'print'}.pdf`);
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
    [data, handleBack, toastError, toastSuccess]
  );

  useEffect(() => {
    if (!data || isLoading || isExportingPdf) return;
    if (autoDownload && !canDownloadPdf) {
      toastError('You do not have permission to download POD PDF');
      handleBack();
      return;
    }
    if (autoPrint && !canPrint) {
      toastError('You do not have permission to print POD');
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
  }, [autoDownload, autoPrint, canDownloadPdf, canPrint, data, handleBack, handleDownloadPdf, isExportingPdf, isLoading, toastError]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load Proof of Delivery
        </Alert>
        <Button variant="contained" startIcon={<CloseIcon />} onClick={handleBack}>
          Back
        </Button>
      </Box>
    );
  }

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
        {/* Company Header */}
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
                alt={data.company_name || 'Company'}
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
              {data.company_name || 'Company'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', mt: 0.5 }}>
              {formatAddress(data.company_address)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {data.company_phone} {data.company_phone && data.company_email ? ' | ' : ''} {data.company_email}
            </Typography>
            {data.company_gst && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                GST: {data.company_gst}
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
          Proof of Delivery Summary
        </Typography>

        {/* POD Info */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e6e8f0', mb: 3 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>POD Number</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0', fontWeight: 600 }}>{data.pod_number || '-'}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>POD Date</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0', fontWeight: 600 }}>{formatDate(data.pod_date)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Delivered Date</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{formatDate(data.delivered_date)}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Invoice Number</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{data.invoice_number || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Invoice Date</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{formatDate(data.invoice_date)}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Sales Order</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{data.order_number || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Order Date</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{formatDate(data.order_date)}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Customer</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{data.customer_name || '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Address */}
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center', fontWeight: 800, letterSpacing: 1, color: '#263343', mb: 1, textTransform: 'uppercase' }}
        >
          Address Details
        </Typography>
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e6e8f0', mb: 3 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', width: '20%', border: '1px solid #e6e8f0' }}>
                  Billing Address
                </TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0', whiteSpace: 'pre-line' }}>
                  {formatAddress(data.billing_address) || '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>
                  Shipping Address
                </TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0', whiteSpace: 'pre-line' }}>
                  {formatAddress(data.shipping_address) || '-'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Receiver */}
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center', fontWeight: 800, letterSpacing: 1, color: '#263343', mb: 1, textTransform: 'uppercase' }}
        >
          Receiver Details
        </Typography>
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e6e8f0', mb: 3 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0', width: '20%' }}>
                  Received By
                </TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{data.receiver_name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>
                  Receiver Contact
                </TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{data.receiver_phone || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>
                  Delivered By
                </TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{data.delivered_by || '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {data.remarks && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#263343', mb: 1 }}>
              Remarks
            </Typography>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #e6e8f0', bgcolor: '#f9fbff' }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {data.remarks}
              </Typography>
            </Paper>
          </Box>
        )}

        <Divider sx={{ mt: 2, mb: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2d3d' }}>
            POD Number: {data.pod_number || '-'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generated on: {dayjs().format('DD/MM/YYYY HH:mm')}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
export default ProofOfDeliveryPrint;

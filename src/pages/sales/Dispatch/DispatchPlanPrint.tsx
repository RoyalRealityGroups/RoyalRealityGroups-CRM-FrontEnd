import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
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
import dayjs from 'dayjs';
import { dispatchApi } from '../../../api/dispatch.api';
import apiClient from '../../../api/axios.config';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import MediaImage from '../../../components/common/MediaImage';
import type { DispatchPlan } from '../../../types/dispatch.types';
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

const DispatchPlanPrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  usePageTitle('Print Dispatch Plan');
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const autoDownload = searchParams.get('download') === 'pdf';
  const autoPrint = searchParams.get('print') === '1';
  const canDownloadPdf = hasPermission(user, 'download_dispatchplan');
  const canPrint = hasPermission(user, 'print_dispatchplan');
  useEffect(() => {
    if (!canDownloadPdf && !canPrint) {
      navigate('/unauthorized', { replace: true });
    }
  }, [canDownloadPdf, canPrint, navigate]);
  const backPath = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from || '/sales/dispatch';
  }, [location.state]);

  const { success: toastSuccess, error: toastError } = useToast();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: plan, isLoading } = useQuery<DispatchPlan>({
    queryKey: ['dispatchPlan', id],
    queryFn: () => dispatchApi.getById(id!),
    enabled: Boolean(id),
  });

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!plan?.company) return;
      try {
        const response = await apiClient.get(`/api/masters/companies/${plan.company}/`);
        setCompany(response.data);
      } catch (err) {
      }
    };
    fetchCompanyDetails();
  }, [plan?.company]);

  const formatDate = (value?: string | null) => (value ? dayjs(value).format('DD-MM-YYYY') : '-');
  const formatCurrency = (value?: number | string | null) =>
    `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatStatus = (status?: string | null) => (status ? status.replace(/_/g, ' ') : '-');
  const createdByDisplay = plan?.created_by_name
    || (plan?.created_by_type && plan?.created_by_identifier
      ? `${plan.created_by_type}: ${plan.created_by_identifier}`
      : plan?.created_by_identifier)
    || '-';
  const companyLogoUrl = company?.logo;
  const formatQuantity = (value?: number | string | null) =>
    value !== undefined && value !== null && value !== ''
      ? Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '-';
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

  const getRemainingQty = (item: any) => {
    const raw = item?.remaining_quantity;
    const parsedRaw = raw !== undefined && raw !== null ? Number(raw) : null;
    if (parsedRaw !== null && !Number.isNaN(parsedRaw) && parsedRaw >= 0) {
      return formatQuantity(parsedRaw);
    }
    const ordered = Number(item?.quantity_ordered);
    const dispatched = Number(item?.quantity_dispatched);
    if (!Number.isNaN(ordered) && !Number.isNaN(dispatched)) {
      const computed = Math.max(0, ordered - dispatched);
      return formatQuantity(computed);
    }
    return '-';
  };

  // Print styles
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-print-style', 'dispatch-plan-print');
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
          max-width: 410mm !important; /* A3 width for landscape */
          box-shadow: none !important;
          border: 0 !important;
          padding-top: 6mm !important;
          padding-bottom: 8mm !important;
          padding-left: 6mm !important;
          padding-right: 6mm !important;
        }
        .no-print { display: none !important; }
        @page { size: A3 landscape; margin: 8mm; }
        .print-container table { border-collapse: collapse !important; }
        .print-container .MuiTableCell-root {
          padding: 4px 6px !important;
          font-size: 8.5px !important;
          line-height: 1.2 !important;
          white-space: normal !important;
          word-break: break-word !important;
          vertical-align: top !important;
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
      if (!contentRef.current || !plan) return;
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

        pdf.save(`dispatch-plan-${plan.dispatch_number || plan.id || 'print'}.pdf`);
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
    [handleBack, plan, toastError, toastSuccess]
  );

  useEffect(() => {
    if (autoDownload && !canDownloadPdf) {
      toastError('You do not have permission to download Dispatch Plan PDF');
      handleBack();
      return;
    }
    if (autoPrint && !canPrint) {
      toastError('You do not have permission to print Dispatch Plan');
      handleBack();
      return;
    }
    if (!autoDownload || !plan || isLoading || isExportingPdf) return;
    const timer = setTimeout(() => void handleDownloadPdf(true), 400);
    return () => clearTimeout(timer);
  }, [autoDownload, autoPrint, canDownloadPdf, canPrint, handleBack, handleDownloadPdf, isExportingPdf, isLoading, plan, toastError]);

  useEffect(() => {
    if (autoPrint && !canPrint) return;
    if (!autoPrint || !plan || isLoading || isExportingPdf) return;
    const timer = setTimeout(() => {
      window.print();
      handleBack();
    }, 500);
    return () => clearTimeout(timer);
  }, [autoPrint, canPrint, handleBack, isExportingPdf, isLoading, plan]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!plan) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Typography variant="h6" color="error">
          Dispatch plan not found
        </Typography>
      </Box>
    );
  }

  const items = plan.items || [];

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
              label={formatStatus(plan.status)}
              sx={{
                backgroundColor: '#e6f4ea',
                color: '#0f5132',
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
          Dispatch Plan Summary
        </Typography>

        {/* Summary */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e6e8f0', mb: 3 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Dispatch Number</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0', fontWeight: 600 }}>{plan.dispatch_number}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Dispatch Date</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0', fontWeight: 600 }}>{formatDate(plan.dispatch_date)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Planned Dispatch Date</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{formatDate((plan as any)?.planned_dispatch_date)}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Company</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{plan.company_name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Location</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{plan.location_name || (plan as any)?.source_location_name || '-'}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Route</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{(plan as any)?.route_name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Vehicle Number</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{(plan as any)?.vehicle_number || '-'}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Vehicle Type / Capacity</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>
                  {(plan as any)?.vehicle_type || '-'}{(plan as any)?.vehicle_capacity ? ` | ${(plan as any)?.vehicle_capacity}` : ''}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Driver Name</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{(plan as any)?.driver_name || '-'}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Driver Phone / License</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>
                  {(plan as any)?.driver_phone || '-'}{(plan as any)?.driver_license ? ` | ${(plan as any)?.driver_license}` : ''}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dispatch Items */}
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center', fontWeight: 800, letterSpacing: 1, color: '#263343', mb: 1, textTransform: 'uppercase' }}
        >
          Dispatch Items
        </Typography>
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e6e8f0', mb: 3 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f7fb' }}>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'center', width: 60 }}>S.No</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0' }}>Order Date</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0' }}>Order No</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0' }}>Item Name</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0' }}>Shipping Address</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right' }}>Qty Ordered</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right' }}>Qty Dispatched</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right' }}>Remaining Qty</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'center' }}>Delivery Seq</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'center' }}>Loading Seq</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'center' }}>Unloading Seq</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ border: '1px solid #e6e8f0' }}>
                    No dispatch items added
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'center' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0', whiteSpace: 'nowrap' }}>{item.order_date ? formatDate(item.order_date) : '-'}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0', whiteSpace: 'nowrap' }}>{item.sales_order_number || item.sales_order || '-'}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0' }}>
                      {(() => {
                        const name = item.item_name || (item.order_items?.map((oi: any) => oi.item_name).filter(Boolean).join(', '));
                        return name || '--';
                      })()}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0' }}>{item.customer_name || '-'}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0' }}>
                      {item.shipping_address || '-'}
                      {item.shipping_city_name ? `, ${item.shipping_city_name}` : ''}
                      {item.shipping_state_name ? `, ${item.shipping_state_name}` : ''}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right' }}>{formatQuantity(item.quantity_ordered)}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right' }}>{formatQuantity(item.quantity_dispatched)}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right' }}>{getRemainingQty(item)}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'center' }}>{item.delivery_sequence ?? '-'}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'center' }}>{item.loading_sequence ?? '-'}</TableCell>
                    <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'center' }}>{(item as any)?.unloading_sequence ?? '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer */}
        <Divider sx={{ mt: 2, mb: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2d3d' }}>
            Created By: {createdByDisplay}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generated on: {dayjs().format('DD/MM/YYYY HH:mm')}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default DispatchPlanPrint;

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
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
import { salesOrderApi } from '../../../api/sales.api';
import apiClient from '../../../api/axios.config';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import MediaImage from '../../../components/common/MediaImage';
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

const SalesOrderPrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  usePageTitle('Print Sales Order');
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const autoDownload = searchParams.get('download') === 'pdf';
  const autoPrint = searchParams.get('print') === '1';
  const canDownloadPdf = hasPermission(user, 'download_salesorder');
  const canPrint = hasPermission(user, 'print_salesorder');
  useEffect(() => {
    if (!canDownloadPdf && !canPrint) {
      navigate('/unauthorized', { replace: true });
    }
  }, [canDownloadPdf, canPrint, navigate]);
  const backPath = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from || '/sales/orders';
  }, [location.state]);

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  const { data: order, isLoading } = useQuery({
    queryKey: ['salesOrder', id],
    queryFn: () => salesOrderApi.getById(id!),
    enabled: Boolean(id),
  });

  useEffect(()=>{
    console.log("ordere detaqils",order)
  },[order])
  useEffect(() => {
    const fetchCompany = async () => {
      if (!order?.company) return;
      try {
        const response = await apiClient.get(`/api/masters/companies/${order.company}/`);
        setCompany(response.data);
      } catch (err) {
      }
    };
    fetchCompany();
  }, [order?.company]);

  const showHsn = Boolean(order?.items?.some((item) => item.hsn_code));
  const schemeDiscountTotal = (order?.applied_schemes || []).reduce(
    (sum, scheme) => sum + Number(scheme.discount_amount || 0),
    0
  );
  const showDiscount = Boolean(order?.items?.some((item) => Number(item.discount_amount || 0) > 0)) || schemeDiscountTotal > 0;
  const showTaxAmount = true; // always show tax amount column per request
  const baseColumns = 10; // S.No, Category, Item Code, Item Name, Quantity, UOM, Rate, Taxable Value, Tax Rate, Line Total
  const totalColumns = baseColumns + Number(showHsn) + Number(showDiscount) + Number(showTaxAmount);
  const pageOrientation = totalColumns > 7 ? 'landscape' : 'portrait';
  const pageWidth = pageOrientation === 'landscape' ? '297mm' : '210mm';
  const items = order?.items || [];
  const sumItemField = (field: keyof typeof items[number]) =>
    items.reduce((acc: number, itm: any) => acc + Number(itm?.[field] || 0), 0);
  const computedBaseAmount = items.reduce((acc, itm: any) => acc + Number(itm?.rate || 0) * Number(itm?.quantity || 0), 0);
  const baseAmount = order?.base_amount !== undefined ? Number(order.base_amount) : computedBaseAmount;
  const itemDiscount = sumItemField('discount_amount');
  const totalDiscount = order?.discount_amount !== undefined
    ? Number(order.discount_amount)
    : itemDiscount + schemeDiscountTotal;
  const taxableAmount =
    order?.taxable_amount !== undefined ? Number(order.taxable_amount) : Math.max(baseAmount - totalDiscount, 0);
  const cgstAmount = order && (order as any)?.cgst_amount !== undefined ? Number((order as any)?.cgst_amount) : sumItemField('cgst_amount');
  const sgstAmount = order && (order as any)?.sgst_amount !== undefined ? Number((order as any)?.sgst_amount) : sumItemField('sgst_amount');
  const igstAmount = order && (order as any)?.igst_amount !== undefined ? Number((order as any)?.igst_amount) : sumItemField('igst_amount');
  const cessAmount = order && (order as any)?.cess_amount !== undefined ? Number((order as any)?.cess_amount) : sumItemField('cess_amount');
  const hasAnyTaxSplit = cgstAmount > 0 || sgstAmount > 0 || igstAmount > 0 || cessAmount > 0;
  const totalTax = hasAnyTaxSplit ? cgstAmount + sgstAmount + igstAmount + cessAmount : Number(order?.tax_amount || 0);
  const createdByDisplay = order?.created_by_name
    || (order?.created_by_type && order?.created_by_identifier
      ? `${order.created_by_type}: ${order.created_by_identifier}`
      : order?.created_by_identifier)
    || '-';
  const companyLogoUrl = company?.logo;

  const formatCurrency = (value?: number | string | null) =>
    `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatDate = (value?: string | null) => (value ? dayjs(value).format('DD-MM-YYYY') : '-');
  const formatStatus = (value?: string | null) => (value ? value.replace(/_/g, ' ') : '-');

  const numberToWords = (num?: number | string | null) => {
    const n = Number(num || 0);
    if (!isFinite(n)) return '';
    if (n === 0) return 'Zero Rupees';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = [
      { value: 10000000, label: 'Crore' },
      { value: 100000, label: 'Lakh' },
      { value: 1000, label: 'Thousand' },
      { value: 100, label: 'Hundred' },
    ];
    const buildWords = (val: number): string => {
      if (val < 20) return ones[val];
      if (val < 100) return `${tens[Math.floor(val / 10)]}${val % 10 ? ` ${ones[val % 10]}` : ''}`;
      for (const scale of scales) {
        if (val >= scale.value) {
          const quotient = Math.floor(val / scale.value);
          const remainder = val % scale.value;
          return `${buildWords(quotient)} ${scale.label}${remainder ? ` ${buildWords(remainder)}` : ''}`;
        }
      }
      return '';
    };
    const rupees = Math.floor(n);
    const paise = Math.round((n - rupees) * 100);
    const rupeeWords = `${buildWords(rupees)} Rupees`;
    const paiseWords = paise ? ` and ${buildWords(paise)} Paise` : '';
    return `${rupeeWords}${paiseWords} only`;
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-print-style', 'sales-order-print');
    style.innerHTML = `
      @media print {
        body { background: white; -webkit-print-color-adjust: exact; }
        body * { visibility: hidden !important; }
        .print-container, .print-container * { visibility: visible !important; }
        .print-container {
          position: absolute;
          left: 0;
          right: 0;
          margin: 0 auto !important;
          box-shadow: none !important;
          border: 0 !important;
          padding-top: 12mm !important;
          padding-bottom: 16mm !important;
          padding-left: 10mm !important;
          padding-right: 10mm !important;
        }
        .no-print { display: none !important; }
        @page { size: A4 ${pageOrientation}; margin: 10mm; }
        .print-container table { border-collapse: collapse !important; }
        .print-container .MuiTableCell-root {
          padding: 6px 8px !important;
          font-size: 10px !important;
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
  }, [pageOrientation]);

  const handleBack = useCallback(() => {
    navigate(backPath);
  }, [backPath, navigate]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPdf = useCallback(
    async () => {
      if (!contentRef.current || !order) return;
      try {
        setIsExportingPdf(true);
        const canvas = await html2canvas(contentRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF(pageOrientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        const topPad = 12; // mm
        const bottomPad = 16; // mm
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

        pdf.save(`sales-order-${order.order_number || order.id || 'print'}.pdf`);
        toastSuccess('PDF downloaded');
      } catch (err) {
        toastError('Failed to download PDF');
      } finally {
        setIsExportingPdf(false);
      }
    },
    [order, pageOrientation, toastError, toastSuccess]
  );

  const autoDownloadTriggered = useRef(false);

  useEffect(() => {
    if (autoDownload && !canDownloadPdf) {
      toastError('You do not have permission to download Sales Order PDF');
      handleBack();
      return;
    }
    if (autoPrint && !canPrint) {
      toastError('You do not have permission to print Sales Order');
      handleBack();
      return;
    }
    if (!autoDownload || !order || isLoading || isExportingPdf || autoDownloadTriggered.current) return;
    autoDownloadTriggered.current = true;
    const timer = setTimeout(() => void handleDownloadPdf(), 400);
    return () => clearTimeout(timer);
  }, [autoDownload, order, isLoading]);

  useEffect(() => {
    if (autoPrint && !canPrint) return;
    if (!autoPrint || !order || isLoading || isExportingPdf) return;
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, [autoPrint, canPrint, isExportingPdf, isLoading, order]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Typography variant="h6" color="error">
          Sales Order not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6f8', py: 3, px: { xs: 2, md: 4 } }}>
      {/* Toolbar */}
      <Box
        className="no-print"
        sx={{
          display: 'flex',
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
            onClick={() => void handleDownloadPdf()}
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
          maxWidth: pageWidth,
          width: '100%',
          mx: 'auto',
          p: { xs: 2.5, md: 3.5 },
          pt: { xs: 4, md: 5 },
          pb: { xs: 6, md: 8 },
          backgroundColor: 'white',
          boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
          borderRadius: 2,
          '@media print': {
            boxShadow: 'none',
            borderRadius: 0,
            maxWidth: 'none',
            width: '100%',
            p: '12mm 10mm 18mm 10mm',
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
              SALES ORDER
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
              {company?.address}
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
              label={formatStatus(order.status)}
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
          Sales Order Summary
        </Typography>

        {/* Summary Table */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e6e8f0', mb: 3 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Order Number</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0', fontWeight: 600 }}>{order.order_number}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Order Date</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0', fontWeight: 600 }}>{formatDate(order.order_date)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Customer</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{order.customer_name || '-'}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Customer Type</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{formatStatus(order.customer_type)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Tax Type</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{order.tax_type_display || formatStatus(order.tax_type)}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Credit Days</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{order.credit_days} days</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Billing State</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{order.billing_state_name || order.billing_state || '-'}</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f6f7fb', border: '1px solid #e6e8f0' }}>Shipping State</TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>{order.shipping_state_name || order.shipping_state || '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Address Details */}
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center', fontWeight: 800, letterSpacing: 1, color: '#263343', mb: 1, textTransform: 'uppercase' }}
        >
          Address Details
        </Typography>
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e6e8f0', mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f6f7fb' }}>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0' }}>Billing Address</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0' }}>Billing City</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0' }}>Shipping Address</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0' }}>Shipping City</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'center' }}>Same As Billing</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {order.billing_address || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    State: {order.billing_state_name || order.billing_state || '-'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>
                  {order.billing_city_name || order.billing_city || '-'}
                  {order.billing_area_name && `, ${order.billing_area_name}`}
                </TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {order.shipping_address || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    State: {order.shipping_state_name || order.shipping_state || '-'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0' }}>
                  {order.shipping_city_name || order.shipping_city || '-'}
                  {order.shipping_area_name && `, ${order.shipping_area_name}`}
                </TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'center' }}>
                  {order.same_as_billing ? 'Yes' : 'No'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Items Table */}
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center', fontWeight: 800, letterSpacing: 1, color: '#263343', mb: 1, textTransform: 'uppercase' }}
        >
          Order Items
        </Typography>
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e6e8f0', mb: 3, overflowX: 'auto' }}>
          <Table size="small" sx={{ tableLayout: 'auto', minWidth: '100%' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f7fb' }}>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', whiteSpace: 'nowrap' }}>S.No</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', minWidth: 100 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', whiteSpace: 'nowrap' }}>Product Code</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', minWidth: 150 }}>Product Name</TableCell>
                {showHsn && <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', whiteSpace: 'nowrap' }}>HSN Code</TableCell>}
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right', whiteSpace: 'nowrap' }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right', whiteSpace: 'nowrap' }}>UOM</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right', whiteSpace: 'nowrap' }}>Rate</TableCell>
                {showDiscount && (
                  <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right', whiteSpace: 'nowrap' }}>Discount</TableCell>
                )}
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right', whiteSpace: 'nowrap' }}>Taxable Value</TableCell>
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right', whiteSpace: 'nowrap' }}>Tax Rate</TableCell>
                {showTaxAmount && (
                  <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right', whiteSpace: 'nowrap' }}>Tax Amount</TableCell>
                )}
                <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', textAlign: 'right', whiteSpace: 'nowrap' }}>Line Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.items?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ border: '1px solid #e6e8f0' }}>{index + 1}</TableCell>
                  <TableCell sx={{ border: '1px solid #e6e8f0' }}>{item.category_name || '-'}</TableCell>
                  <TableCell sx={{ border: '1px solid #e6e8f0', whiteSpace: 'nowrap' }}>{item.item_code}</TableCell>
                  <TableCell sx={{ border: '1px solid #e6e8f0', wordBreak: 'break-word' }}>
                    {item.item_name}
                  </TableCell>
                  {showHsn && <TableCell sx={{ border: '1px solid #e6e8f0' }}>{item.hsn_code || '-'}</TableCell>}
                  <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right', whiteSpace: 'nowrap' }}>{Number(item.quantity).toFixed(2)}</TableCell>
                  <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right', whiteSpace: 'nowrap' }}>{item.uom_name}</TableCell>
                  <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(item.rate)}</TableCell>
                  {showDiscount && (
                    <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(item.discount_amount)}</TableCell>
                  )}
                  <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {formatCurrency(item.taxable_amount)}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {`${Number(item.tax_percentage || 0).toFixed(2)}%`}
                  </TableCell>
                  {showTaxAmount && (
                    <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(item.tax_amount)}</TableCell>
                  )}
                  <TableCell sx={{ border: '1px solid #e6e8f0', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{formatCurrency(item.line_total)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell sx={{ border: '1px solid #e6e8f0', bgcolor: '#f9fafb' }} colSpan={totalColumns - 1} align="right">
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Subtotal
                  </Typography>
                </TableCell>
                <TableCell sx={{ border: '1px solid #e6e8f0', bgcolor: '#f9fafb', textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(order.subtotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: order.remarks ? 'space-between' : 'flex-end',
            alignItems: 'flex-start',
            mb: 3,
          }}
        >
          {order.remarks && (
            <Box sx={{ flex: '1 1 300px', maxWidth: { md: '45%' } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#263343', mb: 1 }}>
                Remarks
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {order.remarks}
              </Typography>
            </Box>
          )}
          <Box sx={{ flex: '1 1 300px', maxWidth: { md: '45%' } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#263343', mb: 1 }}>
              Amount in Words
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {numberToWords(order.grand_total)}
            </Typography>
          </Box>
          <Box
            sx={{
              flex: '0 1 360px',
              maxWidth: { md: '50%' },
              ml: { md: 'auto' },
              width: { xs: '100%', md: 'auto' },
              alignSelf: 'flex-start',
            }}
          >
            <Table size="small" sx={{ border: '1px solid #e6e8f0' }}>
              <TableBody>
                {order.base_amount !== undefined && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: '1px solid #e6e8f0' }}>Base Amount</TableCell>
                    <TableCell sx={{ textAlign: 'right', border: '1px solid #e6e8f0' }}>{formatCurrency(order.base_amount)}</TableCell>
                  </TableRow>
                )}
                {itemDiscount > 0 && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: '1px solid #e6e8f0' }}>Discount</TableCell>
                    <TableCell sx={{ textAlign: 'right', border: '1px solid #e6e8f0', color: 'error.main', fontWeight: 600 }}>
                      -{formatCurrency(itemDiscount)}
                    </TableCell>
                  </TableRow>
                )}
                {schemeDiscountTotal > 0 && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: '1px solid #e6e8f0' }}>Scheme Discount</TableCell>
                    <TableCell sx={{ textAlign: 'right', border: '1px solid #e6e8f0', color: 'error.main', fontWeight: 600 }}>
                      -{formatCurrency(schemeDiscountTotal)}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e6e8f0' }}>Taxable Amount</TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e6e8f0' }}>{formatCurrency(taxableAmount)}</TableCell>
                </TableRow>
                {cgstAmount > 0 && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: '1px solid #e6e8f0', pl: 2 }}>CGST</TableCell>
                    <TableCell sx={{ textAlign: 'right', border: '1px solid #e6e8f0' }}>
                      {formatCurrency(cgstAmount)}
                    </TableCell>
                  </TableRow>
                )}
                {sgstAmount > 0 && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: '1px solid #e6e8f0', pl: 2 }}>SGST</TableCell>
                    <TableCell sx={{ textAlign: 'right', border: '1px solid #e6e8f0' }}>
                      {formatCurrency(sgstAmount)}
                    </TableCell>
                  </TableRow>
                )}
                {igstAmount > 0 && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: '1px solid #e6e8f0', pl: 2 }}>IGST</TableCell>
                    <TableCell sx={{ textAlign: 'right', border: '1px solid #e6e8f0' }}>
                      {formatCurrency(igstAmount)}
                    </TableCell>
                  </TableRow>
                )}
                {cessAmount > 0 && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: '1px solid #e6e8f0', pl: 2 }}>CESS</TableCell>
                    <TableCell sx={{ textAlign: 'right', border: '1px solid #e6e8f0' }}>
                      {formatCurrency(cessAmount)}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e6e8f0' }}>Total Tax</TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e6e8f0' }}>{formatCurrency(totalTax)}</TableCell>
                </TableRow>
                {order.round_off !== undefined && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: '1px solid #e6e8f0' }}>Round Off</TableCell>
                    <TableCell sx={{ textAlign: 'right', border: '1px solid #e6e8f0' }}>{formatCurrency(order.round_off)}</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, border: '1px solid #e6e8f0', backgroundColor: '#f6f7fb' }}>
                    {schemeDiscountTotal > 0 ? 'Grand Total (After Schemes)' : 'Grand Total'}
                  </TableCell>
                  <TableCell
                    sx={{
                      textAlign: 'right',
                      fontWeight: 800,
                      border: '1px solid #e6e8f0',
                      backgroundColor: '#f6f7fb',
                      color: '#1f2d3d',
                    }}
                  >
                    {formatCurrency(order.grand_total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>

        {/* Footer */}
        <Divider sx={{ mt: 2, mb: 1 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2d3d' }}>
              Created By: {(order as any)?.created_by?.full_name || '-'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {order.created_on ? dayjs(order.created_on).format('DD-MM-YYYY hh:mm A') : '-'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Generated on: {dayjs().format('DD/MM/YYYY HH:mm')}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default SalesOrderPrint;

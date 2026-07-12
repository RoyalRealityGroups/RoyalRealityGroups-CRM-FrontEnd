import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import { format } from 'date-fns';
import { salesOrderApi } from '../../../api/sales.api';
import apiClient from '../../../api/axios.config';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import ScreenHeader from '../../../components/common/ScreenHeader';
import AuthorizationHistory from '../../../components/authorization/AuthorizationHistory';
import MediaImage from '../../../components/common/MediaImage';
import { getPageContainerStyles, getHeaderSectionStyles } from '../../../utils/spacing';
import { resolveMediaUrl } from '../../../utils/media';
import type { SalesOrder } from '../../../types/sales.types';
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

const SalesOrderView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchParams] = useSearchParams();
  const { error: toastError } = useToast();
  const { setBreadcrumbs } = useBreadcrumbs();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const schemeDiscountTotal = (order?.applied_schemes || []).reduce(
    (sum, scheme) => sum + Number(scheme.discount_amount || 0),
    0
  );
  const itemDiscountTotal = (order?.items || []).reduce(
    (sum, item) => sum + Number(item.discount_amount || 0),
    0
  );
  const hasSchemeDiscount = schemeDiscountTotal > 0;
  const hasItemDiscount = itemDiscountTotal > 0;
  const companyLogoUrl = company?.logo;

  useEffect(() => {
    if (order) {
      setBreadcrumbs([
        { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
        { label: 'Sales', path: '/sales', icon: <FolderIcon fontSize="small" /> },
        { label: 'Sales Orders', path: '/sales/orders', icon: <ReceiptIcon fontSize="small" /> },
        { label: 'View', icon: <PrintIcon fontSize="small" /> },
      ]);
    }
    return () => setBreadcrumbs([]);
  }, [order, setBreadcrumbs]);

  useEffect(() => {
    if (!id) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    loadOrderData();
  }, [id]);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      const orderData = await salesOrderApi.getById(id!);
      setOrder(orderData);

      // Fetch company details if company ID exists
      if (orderData.company) {
        try {
          const companyResponse = await apiClient.get(`/api/masters/companies/${orderData.company}/`);
          setCompany(companyResponse.data);
        } catch (e) {
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
      toastError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!id) return;
    navigate(`/sales/orders/${id}/print?print=1`, { state: { from: location.pathname } });
  };

  const handleDownloadPdf = () => {
    if (!id) return;
    navigate(`/sales/orders/${id}/print?download=pdf`, { state: { from: location.pathname } });
  };
  const handleEdit = () => {
    if (!id) return;
    navigate(`/sales/orders/${id}`);
  };

  const handleBack = () => {
    // Read return parameters from URL
    const returnTab = searchParams.get('returnTab');
    const returnPage = searchParams.get('returnPage');
    const returnPageSize = searchParams.get('returnPageSize');
    
    // Build navigation path with state to restore tab and pagination
    if (returnTab !== null) {
      navigate('/sales/orders', {
        state: {
          activeTab: parseInt(returnTab),
          page: returnPage ? parseInt(returnPage) : 0,
          pageSize: returnPageSize ? parseInt(returnPageSize) : 10,
        },
      });
    } else {
      navigate('/sales/orders');
    }
  };

  const getStatusColor = (status: string) => {
    const configs: Record<string, any> = {
      DRAFT: { bg: '#fff3cd', color: '#856404', label: 'Draft' },
      PENDING: { bg: '#fff3cd', color: '#856404', label: 'Pending' },
      CONFIRMED: { bg: '#d1ecf1', color: '#0c5460', label: 'Confirmed' },
      PARTIALLY_DISPATCHED: { bg: '#d4edda', color: '#155724', label: 'Partially Dispatched' },
      DISPATCHED: { bg: '#d4edda', color: '#155724', label: 'Dispatched' },
      PARTIALLY_INVOICED: { bg: '#e2e3e5', color: '#383d41', label: 'Partially Invoiced' },
      INVOICED: { bg: '#e2e3e5', color: '#383d41', label: 'Invoiced' },
      DELIVERED: { bg: '#d4edda', color: '#155724', label: 'Delivered' },
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

  if (error || !order) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Failed to load order'}
        </Alert>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to List
        </Button>
      </Box>
    );
  }

  const statusConfig = getStatusColor(order.status);
  const canDownloadPdf = hasPermission(user, 'download_salesorder');
  const canPrint = hasPermission(user, 'print_salesorder');
  const canEdit = hasPermission(user, 'change_salesorder') && ['DRAFT', 'PENDING', 'CONFIRMED'].includes(order.status);
  const attachments = ((order as any)?.attachments || []) as any[];

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
          title={`Sales Order - ${order.order_number}`}
          showBackButton
          onBack={handleBack}
          disableBox
        >
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
          p: { xs: 1.5, sm: 2, md: 4 },
          '@media print': {
            boxShadow: 'none',
            p: 0,
          },
        }}
      >
        {/* Header Section with Company Logo and Details */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
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
            <Box sx={{ textAlign: 'center', flex: 1, order: { xs: -1, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}>
              {/* <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#006766',
                  mb: 1,
                  fontFamily: '"Space Grotesk", "Poppins", sans-serif',
                }}
              >
                {company?.name || 'Company Name'}
              </Typography> */}
               <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: '#006766',
              textAlign: 'center',
              mb: 3,
            }}
          >
            SALES ORDER
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
                label={getStatusColor(order.status).label}
                sx={{
                  backgroundColor: getStatusColor(order.status).bg,
                  color: getStatusColor(order.status).color,
                  fontWeight: 700,
                  fontSize: '1rem',
                  height: 40,
                  px: 2,
                  '@media print': {
                    border: `2px solid ${getStatusColor(order.status).color}`,
                  },
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

         
        </Box>

        {/* Order Details in Enhanced Tabular Format */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 3 }}>
            Order Details
          </Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0', overflowX: 'auto' }}>
            <Table size="small" sx={{ borderCollapse: 'collapse' }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Order Number
                  </TableCell>
                  <TableCell sx={{ width: '20%', border: '1px solid #e0e0e0' }}>
                    {order.order_number}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Customer Type
                  </TableCell>
                  <TableCell sx={{ width: '20%', border: '1px solid #e0e0e0' }}>
                    {order.customer_type}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Tax Type
                  </TableCell>
                  <TableCell sx={{ width: '15%', border: '1px solid #e0e0e0' }}>
                    {order.tax_type}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Order Date
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {format(new Date(order.order_date), 'dd-MM-yyyy')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Customer Name
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {order.customer_name}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Credit Days
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {order.credit_days} days
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
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0', overflowX: 'auto' }}>
            <Table size="small" sx={{ borderCollapse: 'collapse' }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    Billing Address
                  </TableCell>
                  <TableCell sx={{ width: '35%', border: '1px solid #e0e0e0' }}>
                    {order.billing_address}
                    <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                      State: {order.billing_state_name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Shipping Address
                  </TableCell>
                  <TableCell sx={{ width: '35%', border: '1px solid #e0e0e0' }}>
                    {order.shipping_address}
                    <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                      State: {order.shipping_state_name}
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
            Order Products
          </Typography>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ border: '1px solid #e0e0e0', borderCollapse: 'collapse' }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#006766' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    S.No
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Image
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
                    Company
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
                    Tax %
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
                {order.items.map((item, index) => (
                  <TableRow key={item.id || index}>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {index + 1}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {item.item_image ? (
                      <MediaImage
                        src={item.item_image}
                        alt={item.item_name || 'Product'}
                        sx={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 0.5 }}
                      />
                    ) : (
                      <Box sx={{ width: 36, height: 36, bgcolor: 'grey.100', borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="caption" color="text.disabled">-</Typography>
                      </Box>
                    )}
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
                      {item.company_name || '-'}
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
                      {Number(item.tax_percentage || 0).toFixed(2)}%
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

        {order.applied_schemes && order.applied_schemes.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
              Applied Schemes
            </Typography>
            <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
              <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#006766' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>
                      Code
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>
                      Type
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0', textAlign: 'right' }}>
                      Discount
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>
                      Free Products
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.applied_schemes.map((scheme) => (
                    <TableRow key={scheme.id}>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        {scheme.scheme_code}
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        {scheme.scheme_name}
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        {scheme.scheme_type_display || scheme.scheme_type}
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'right' }}>
                        ₹{Number(scheme.discount_amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        {(scheme.free_items || [])
                          .map((item) => `${item.item_name || item.item_id || 'Item'} x ${Number(item.quantity || 0)}`)
                          .join(', ') || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Order Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
          <Box sx={{ minWidth: 300 }}>
            <Table size="small" sx={{ borderCollapse: 'collapse' }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Subtotal
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                    ₹{Number(order.subtotal || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
                {hasItemDiscount && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>
                      Discount
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                      ₹{Number(itemDiscountTotal || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                )}
                {hasSchemeDiscount && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>
                      Scheme Discount
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                      ₹{Number(schemeDiscountTotal || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Taxable Amount
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                    ₹{Number(order.taxable_amount || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Tax Amount
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', border: '1px solid #e0e0e0' }}>
                    ₹{Number(order.tax_amount || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, border: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                    {hasSchemeDiscount ? 'Grand Total (After Schemes)' : 'Grand Total'}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 700, border: '1px solid #e0e0e0', backgroundColor: '#f5f5f5', color: '#006766' }}>
                    ₹{Number(order.grand_total || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>

        {/* Remarks */}
        {order.remarks && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
              Remarks
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: '#f9f9f9', overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{order.remarks}</Typography>
            </Paper>
          </Box>
        )}

        {/* Attachments */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
            Attachments
          </Typography>
          {attachments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No attachments available
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {attachments.map((att, index) => {
                const fileUrl = resolveMediaUrl(att.file_url || att.file);
                const fileName = att.original_filename || att.file?.split('/').pop() || `Attachment ${index + 1}`;
                const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName);
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
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                      {att.description || '-'}
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

        {/* Authorization History */}
        {order.id && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
              Authorization History
            </Typography>
            <AuthorizationHistory modelPath="sales.salesorder" instanceId={order.id} />
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
            Sales Order: {order.order_number}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default SalesOrderView;

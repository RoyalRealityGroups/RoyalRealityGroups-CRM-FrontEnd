import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Button,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
  LocalShipping as LocalShippingIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import ScreenHeader from '../../../components/common/ScreenHeader';
import AuthorizationHistory from '../../../components/authorization/AuthorizationHistory';
import MediaImage from '../../../components/common/MediaImage';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { getHeaderSectionStyles } from '../../../utils/spacing';
import { dispatchApi } from '../../../api/dispatch.api';
import apiClient from '../../../api/axios.config';
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

const DispatchPlanView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchParams] = useSearchParams();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const companyLogoUrl = company?.logo;

  const { data: plan, isLoading, error } = useQuery<DispatchPlan>({
    queryKey: ['dispatchPlan', id],
    queryFn: () => dispatchApi.getById(id!),
    enabled: Boolean(id),
  });
  const { data: attachments = [] } = useQuery<any[]>({
    queryKey: ['dispatchPlanAttachments', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/dispatch/${id}/attachments/`);
      return response.data || [];
    },
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (plan) {
      setBreadcrumbs([
        { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
        { label: 'Sales', path: '/sales', icon: <FolderIcon fontSize="small" /> },
        { label: 'Dispatch Planning', path: '/sales/dispatch', icon: <LocalShippingIcon fontSize="small" /> },
        { label: 'View', icon: <PrintIcon fontSize="small" /> },
      ]);

      if (plan.company) {
        loadCompanyData(plan.company);
      }
    }
    return () => setBreadcrumbs([]);
  }, [plan, setBreadcrumbs]);

  const loadCompanyData = async (companyId: string) => {
    try {
      const response = await apiClient.get(`/api/masters/companies/${companyId}/`);
      setCompany(response.data);
    } catch (err) {
    }
  };

  const handleBack = () => {
    const returnTab = searchParams.get('returnTab');
    const returnPage = searchParams.get('returnPage');
    const returnPageSize = searchParams.get('returnPageSize');
    
    if (returnTab !== null) {
      navigate('/sales/dispatch', {
        state: {
          activeTab: parseInt(returnTab),
          page: returnPage ? parseInt(returnPage) : 0,
          pageSize: returnPageSize ? parseInt(returnPageSize) : 10,
        },
      });
    } else {
      navigate('/sales/dispatch');
    }
  };
  const handleEdit = () => navigate(`/sales/dispatch/${id}/edit`);
  const handlePrint = () => id && navigate(`/sales/dispatch/${id}/print?print=1`, { state: { from: location.pathname } });
  const handleDownloadPdf = () =>
    id && navigate(`/sales/dispatch/${id}/print?download=pdf`, { state: { from: location.pathname } });

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
  const formatQuantity = (value?: number | string | null) =>
    value !== undefined && value !== null && value !== ''
      ? Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '-';

  const getRemainingQty = (item: any) => {
    const raw = item?.remaining_quantity;
    const parsedRaw = raw !== undefined && raw !== null ? Number(raw) : null;
    // If API sends a sensible non-negative number, use it
    if (parsedRaw !== null && !Number.isNaN(parsedRaw) && parsedRaw >= 0) {
      return formatQuantity(parsedRaw);
    }
    // Otherwise fall back to computed difference when both numbers exist
    const ordered = Number(item?.quantity_ordered);
    const dispatched = Number(item?.quantity_dispatched);
    if (!Number.isNaN(ordered) && !Number.isNaN(dispatched)) {
      const computed = Math.max(0, ordered - dispatched);
      return formatQuantity(computed);
    }
    return '-';
  };

  const getStatusColor = (status: string) => {
    const configs: Record<string, any> = {
      DRAFT: { bg: '#fff3cd', color: '#856404', label: 'Draft' },
      PENDING: { bg: '#fff3cd', color: '#856404', label: 'Pending' },
      CONFIRMED: { bg: '#d1ecf1', color: '#0c5460', label: 'Confirmed' },
      DELIVERED: { bg: '#d4edda', color: '#155724', label: 'Delivered' },
      CANCELLED: { bg: '#f8d7da', color: '#721c24', label: 'Cancelled' },
    };
    return configs[status] || configs.DRAFT;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !plan) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error instanceof Error ? error.message : 'Failed to load dispatch plan'}
        </Alert>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to List
        </Button>
      </Box>
    );
  }

  const statusConfig = getStatusColor(plan.status);
  const canDownloadPdf = hasPermission(user, 'download_dispatchplan');
  const canPrint = hasPermission(user, 'print_dispatchplan');
  const canEdit = hasPermission(user, 'change_dispatchplan') && plan.authorized_status !== 2;
  const items = plan.items || [];

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
        <ScreenHeader title={`Dispatch Plan - ${plan.dispatch_number}`} showBackButton onBack={handleBack} disableBox>
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

            {/* Company Name & Details - Center */}
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h5" fontWeight={700}>
                {plan?.company_name || 'Company Name'}
              </Typography>
              {company?.address && (
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                  {formatAddress(company.address)}
                </Typography>
              )}
              {(company?.phone || company?.email) && (
                <Typography variant="body2" color="text.secondary">
                  {company?.phone} {company?.phone && company?.email ? ' | ' : ''} {company?.email}
                </Typography>
              )}
            </Box>

            {/* Status Chip - Right */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={getStatusColor(plan.status).label}
                sx={{
                  backgroundColor: getStatusColor(plan.status).bg,
                  color: getStatusColor(plan.status).color,
                  fontWeight: 700,
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Dispatch Details */}
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Dispatch Number</TableCell>
                  <TableCell>{plan.dispatch_number}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Dispatch Date</TableCell>
                  <TableCell>{formatDate(plan.dispatch_date)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Planned Dispatch Date</TableCell>
                  <TableCell>{formatDate((plan as any)?.planned_dispatch_date)}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Company</TableCell>
                  <TableCell>{plan.company_name || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Location</TableCell>
                  <TableCell>{plan.location_name || (plan as any)?.source_location_name || '-'}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Route</TableCell>
                  <TableCell>{plan.route_name || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Vehicle Number</TableCell>
                  <TableCell>{plan.vehicle_number || '-'}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Vehicle Type / Capacity</TableCell>
                  <TableCell>
                    {(plan.vehicle_type || '-')}{plan.vehicle_capacity ? ` | ${plan.vehicle_capacity}` : ''}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Driver Name</TableCell>
                  <TableCell>{plan.driver_name || '-'}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Driver Phone / License</TableCell>
                  <TableCell>
                    {(plan.driver_phone || '-')} {plan.driver_license ? ` | ${plan.driver_license}` : ''}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Stock Insurance</TableCell>
                  <TableCell>{(plan as any).stock_insurance ? 'Yes' : 'No'}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>LR No</TableCell>
                  <TableCell>{(plan as any).lr_no || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        {/* Dispatch Items */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Dispatch Products
          </Typography>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              border: '1px solid #e0e0e0',
              maxHeight: 360,
              overflowX: 'auto',
              overflowY: 'auto',
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f7fb' }}>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center', width: 60 }}>S.No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Order Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Order No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Shipping Address</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Qty Ordered</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Qty Dispatched</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Remaining Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Delivery Seq</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Loading Seq</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Unloading Seq</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center">
                      No dispatch items added
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ textAlign: 'center' }}>{idx + 1}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.order_date ? formatDate(item.order_date) : '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.sales_order_number || item.sales_order || '-'}</TableCell>
                      <TableCell>{item.item_name || (item.order_items?.map((oi: any) => oi.item_name).filter(Boolean).join(', ')) || '--'}</TableCell>
                      <TableCell>{item.customer_name || '-'}</TableCell>
                      <TableCell>
                        {item.shipping_address || '-'}
                        {item.shipping_city_name ? `, ${item.shipping_city_name}` : ''}
                        {item.shipping_state_name ? `, ${item.shipping_state_name}` : ''}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>{formatQuantity(item.quantity_ordered)}</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>{formatQuantity(item.quantity_dispatched)}</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>{getRemainingQty(item)}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>{item.delivery_sequence ?? '-'}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>{item.loading_sequence ?? '-'}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>{(item as any)?.unloading_sequence ?? '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Remarks */}
        {plan.remarks && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Remarks
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {plan.remarks}
            </Typography>
          </Box>
        )}

        {/* Attachments */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Attachments
          </Typography>
          {attachments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No attachments available
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f7fb' }}>
                    <TableCell sx={{ fontWeight: 700, width: 60 }}>S.No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Attachment Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>File Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 220 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attachments.map((att: any, index: number) => (
                    <TableRow key={att.id || index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{att.attachment_type || '-'}</TableCell>
                      <TableCell>{att.original_filename || '-'}</TableCell>
                      <TableCell>{att.description || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            component="a"
                            href={att.file_url || att.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            disabled={!(att.file_url || att.file)}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            component="a"
                            href={att.file_url || att.file}
                            download={att.original_filename || true}
                            disabled={!(att.file_url || att.file)}
                          >
                            Download
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Authorization History */}
        {plan.id && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Authorization History
            </Typography>
            <AuthorizationHistory modelPath="dispatch.dispatchplan" instanceId={plan.id} />
          </Box>
        )}

        {/* Footer */}
        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: '1px solid #e0e0e0',
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
            Generated on {dayjs().format('DD-MM-YYYY HH:mm')}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666', '@media print': { fontSize: '9px' } }}>
            Dispatch Plan: {plan.dispatch_number}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default DispatchPlanView;

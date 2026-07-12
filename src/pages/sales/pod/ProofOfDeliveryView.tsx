import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import VerifiedIcon from '@mui/icons-material/Verified';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { podApi } from '../../../api/pod.api';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import ScreenHeader from '../../../components/common/ScreenHeader';
import AuthorizationHistory from '../../../components/authorization/AuthorizationHistory';
import MediaImage from '../../../components/common/MediaImage';
import { getHeaderSectionStyles } from '../../../utils/spacing';
import { resolveMediaUrl } from '../../../utils/media';
import type { ProofOfDelivery } from '../../../types/pod.types';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';






const ProofOfDeliveryView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const user = useSelector((state: RootState) => state.auth.user);
  const { setBreadcrumbs } = useBreadcrumbs();
  const { error: toastError } = useToast();

  const { data, isLoading, isError } = useQuery<ProofOfDelivery>({
    queryKey: ['pod', id],
    queryFn: () => podApi.getById(id!),
    enabled: Boolean(id),
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (isError) {
      toastError('Failed to load Proof of Delivery');
    }
  }, [isError, toastError]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Sales', path: '/sales', icon: <FolderIcon fontSize="small" /> },
      { label: 'Proof of Delivery', path: '/sales/pod', icon: <VerifiedIcon fontSize="small" /> },
      { label: 'View', icon: <VerifiedIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const handleBack = () => navigate('/sales/pod');
  const handlePrint = () => {
    if (!id) return;
    navigate(`/sales/pod/${id}/print?print=1`, { state: { from: location.pathname } });
  };
  const handleDownloadPdf = () => {
    if (!id) return;
    navigate(`/sales/pod/${id}/print?download=pdf`, { state: { from: location.pathname } });
  };
  const handleEdit = () => {
    if (!id) return;
    navigate(`/sales/pod/edit/${id}`);
  };

  const getStatusConfig = () => {
    return { label: 'Delivered', color: '#155724', bg: '#d4edda' };
  };

  const statusConfig = getStatusConfig();
  const companyLogoUrl = (data as any)?.company_logo;
  const canDownloadPdf = hasPermission(user, 'download_proofofdelivery');
  const canPrint = hasPermission(user, 'print_proofofdelivery');
  const canEdit = hasPermission(user, 'change_proofofdelivery');

  const formatDate = (d?: string) => (d ? format(new Date(d), 'dd-MM-yyyy') : '-');

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
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to List
        </Button>
      </Box>
    );
  }

  return (
    <Box
      className="print-content"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#f5f5f5',
        overflow: 'auto',
        '@media print': { bgcolor: 'white', p: 2, overflow: 'visible' },
      }}
    >
      <Box sx={{ ...getHeaderSectionStyles(), '@media print': { display: 'none' } }}>
        <ScreenHeader
          title={`Proof of Delivery - ${data.pod_number || data.invoice_number || data.id}`}
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
          p: 4,
          '@media print': { boxShadow: 'none', p: 0 },
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
                  alt={(data as any).company_name}
                  sx={{ height: 60, width: 'auto', maxWidth: 120 }}
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
                {(data as any).company_name || 'Company Name'}
              </Typography>
              {(data as any).company_address && (
                <Box sx={{ mb: 1 }}>
                  {(data as any).company_address.split(',').map((line: string, index: number, array: string[]) => {
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
                {(data as any).company_phone && (
                  <Typography variant="body2" color="text.secondary">
                    Phone: {(data as any).company_phone}
                  </Typography>
                )}
                {(data as any).company_email && (
                  <Typography variant="body2" color="text.secondary">
                    Email: {(data as any).company_email}
                  </Typography>
                )}
              </Box>
              {(data as any).company_gst && (
                <Typography variant="body2" color="text.secondary">
                  GST: {(data as any).company_gst}
                </Typography>
              )}
            </Box>

            {/* Status - Right */}
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

          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: '#006766', textAlign: 'center', mb: 3 }}
          >
            PROOF OF DELIVERY
          </Typography>
        </Box>

        {/* POD Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 3 }}>
            POD Information
          </Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    POD Number
                  </TableCell>
                  <TableCell sx={{ width: '20%', border: '1px solid #e0e0e0' }}>
                    {data.pod_number || '-'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Invoice Number
                  </TableCell>
                  <TableCell sx={{ width: '20%', border: '1px solid #e0e0e0' }}>
                    {data.invoice_number || '-'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Customer
                  </TableCell>
                  <TableCell sx={{ width: '15%', border: '1px solid #e0e0e0' }}>
                    {data.customer_name || '-'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    POD Date
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {formatDate((data as any).pod_date)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Invoice Date
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {formatDate((data as any).invoice_date)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Delivered On
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {formatDate((data as any).delivered_date)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Sales Order No
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {data.order_number || '-'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Order Date
                  </TableCell>
                  <TableCell colSpan={3} sx={{ border: '1px solid #e0e0e0' }}>
                    {formatDate((data as any).order_date)}
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
                    {(data as any).billing_address || '-'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Shipping Address
                  </TableCell>
                  <TableCell sx={{ width: '35%', border: '1px solid #e0e0e0' }}>
                    {(data as any).shipping_address || '-'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Receiver Details */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 3 }}>
            Receiver Details
          </Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Received By
                  </TableCell>
                  <TableCell sx={{ width: '35%', border: '1px solid #e0e0e0' }}>
                    {(data as any).receiver_name || '-'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Receiver Contact
                  </TableCell>
                  <TableCell sx={{ width: '35%', border: '1px solid #e0e0e0' }}>
                    {(data as any).receiver_phone || '-'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Delivered By
                  </TableCell>
                  <TableCell colSpan={3} sx={{ border: '1px solid #e0e0e0' }}>
                    {data.delivered_by || '-'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Remarks */}
        {data.remarks && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
              Remarks
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: '#f9f9f9', overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{data.remarks}</Typography>
            </Paper>
          </Box>
        )}

        {/* Attachments */}
        {data.files && data.files.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
              Attachments
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {data.files.map((file, idx) => {
                const fileName = file.original_filename || file.file?.split('/').pop() || `File ${idx + 1}`;
                const isImage = file.file?.match(/\.(jpg|jpeg|png|gif)$/i);
                const fileUrl = resolveMediaUrl(file.file);
                return (
                  <Box
                    key={file.id || idx}
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      minWidth: 150,
                    }}
                  >
                    {isImage ? (
                      <MediaImage
                        src={file.file}
                        alt={fileName}
                        sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1 }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 100,
                          height: 100,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: '#f5f5f5',
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="caption">File</Typography>
                      </Box>
                    )}
                    <Typography variant="caption" sx={{ textAlign: 'center', wordBreak: 'break-word', width: '100%' }}>
                      {fileName}
                    </Typography>
                    {file.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', wordBreak: 'break-word', width: '100%' }}>
                        {file.description}
                      </Typography>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      fullWidth
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      href={fileUrl}
                      download
                      fullWidth
                    >
                      Download
                    </Button>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Authorization History */}
        {data.id && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
              Authorization History
            </Typography>
            <AuthorizationHistory modelPath="delivery.proofofdelivery" instanceId={data.id} />
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
            '@media print': { mt: 2, pt: 2, fontSize: '9px' },
          }}
        >
          <Typography variant="caption" sx={{ color: '#666', '@media print': { fontSize: '9px' } }}>
            Generated on {format(new Date(), 'dd-MM-yyyy, hh:mm a')}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666', '@media print': { fontSize: '9px' } }}>
            POD: {data.pod_number}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProofOfDeliveryView;

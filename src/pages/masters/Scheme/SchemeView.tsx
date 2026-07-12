import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import apiClient from '../../../api/axios.config';
import { API_ENDPOINTS } from '../../../utils/constants';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import ScreenHeader from '../../../components/common/ScreenHeader';
import AuthorizationHistory from '../../../components/authorization/AuthorizationHistory';
import { getHeaderSectionStyles } from '../../../utils/spacing';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';
import type { Scheme } from '../../../types/masters.types';

const SchemeView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useSelector((state: RootState) => state.auth.user);
  const { error: toastError } = useToast();
  const { setBreadcrumbs } = useBreadcrumbs();

  const [loading, setLoading] = useState(true);
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePageTitle('Scheme View');

  useEffect(() => {
    if (scheme) {
      setBreadcrumbs([
        { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
        { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
        { label: 'Schemes', path: '/scheme', icon: <CardGiftcardIcon fontSize="small" /> },
        { label: 'View', icon: <VisibilityIcon fontSize="small" /> },
      ]);
    }
    return () => setBreadcrumbs([]);
  }, [scheme, setBreadcrumbs]);

  useEffect(() => {
    if (!id) {
      setError('No scheme ID provided');
      setLoading(false);
      return;
    }
    loadScheme();
  }, [id]);

  const loadScheme = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`${API_ENDPOINTS.SCHEMES}${id}/`);
      setScheme(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load scheme');
      toastError('Failed to load scheme details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate('/scheme');

  const handleEdit = () => {
    if (!id) return;
    navigate(`/scheme/${id}/edit`);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; color: string; label: string }> = {
      ACTIVE: { bg: '#d4edda', color: '#155724', label: 'Active' },
      INACTIVE: { bg: '#e2e3e5', color: '#383d41', label: 'Inactive' },
      DRAFT: { bg: '#fff3cd', color: '#856404', label: 'Draft' },
      PENDING_APPROVAL: { bg: '#fff3cd', color: '#856404', label: 'Pending Approval' },
      EXPIRED: { bg: '#f8d7da', color: '#721c24', label: 'Expired' },
    };
    return configs[status] || configs.ACTIVE;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !scheme) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Failed to load scheme'}</Alert>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>Back to List</Button>
      </Box>
    );
  }

  const statusConfig = getStatusConfig(scheme.status);
  const canEdit = hasPermission(user, 'change_scheme');
  const conditions = scheme.conditions || [];
  const benefits = scheme.benefits || [];
  const applicability = scheme.applicability || [];
  const items = scheme.items || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f5f5f5', overflow: 'auto' }}>
      <Box sx={getHeaderSectionStyles()}>
        <ScreenHeader
          title={`Scheme - ${scheme.code}`}
          showBackButton
          onBack={handleBack}
          disableBox
        >
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {canEdit && (
              <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>Edit</Button>
            )}
          </Box>
        </ScreenHeader>
      </Box>

      <Paper sx={{ maxWidth: 1200, mx: 'auto', p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#006766', mb: 1, fontFamily: '"Space Grotesk", "Poppins", sans-serif' }}>
                {scheme.name}
              </Typography>
            </Box>
            <Chip
              label={statusConfig.label}
              sx={{ backgroundColor: statusConfig.bg, color: statusConfig.color, fontWeight: 700, fontSize: '1rem', height: 40, px: 2 }}
            />
          </Box>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#006766', textAlign: 'center', mb: 3 }}>
            SCHEME DETAILS
          </Typography>
        </Box>

        {/* Basic Details */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 3 }}>Basic Information</Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>Code</TableCell>
                  <TableCell sx={{ width: '20%', border: '1px solid #e0e0e0' }}>{scheme.code}</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>Scheme Type</TableCell>
                  <TableCell sx={{ width: '20%', border: '1px solid #e0e0e0' }}>
                    <Chip label={scheme.scheme_type_display || scheme.scheme_type || scheme.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>Priority</TableCell>
                  <TableCell sx={{ width: '15%', border: '1px solid #e0e0e0' }}>{scheme.priority}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>Effective From</TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>{format(new Date(scheme.effective_from), 'dd-MM-yyyy')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>Effective To</TableCell>
                  <TableCell colSpan={3} sx={{ border: '1px solid #e0e0e0' }}>{scheme.effective_to ? format(new Date(scheme.effective_to), 'dd-MM-yyyy') : 'Ongoing'}</TableCell>
                </TableRow>
                {scheme.description && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>Description</TableCell>
                    <TableCell colSpan={5} sx={{ border: '1px solid #e0e0e0' }}>{scheme.description}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Conditions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
            Conditions ({conditions.length})
          </Typography>
          {conditions.length > 0 ? (
            <TableContainer>
              <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#006766' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>S.No</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Value From</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Value To</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Category</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Item</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Operator</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {conditions.map((c, i) => (
                    <TableRow key={i} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{i + 1}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        <Chip label={c.condition_type_display || c.condition_type} size="small" />
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{c.value_from ?? '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{c.value_to ?? '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{c.category_name || '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{c.item_name || '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{c.logical_operator || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">No conditions defined</Typography>
            </Paper>
          )}
        </Box>

        {/* Benefits */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
            Benefits ({benefits.length})
          </Typography>
          {benefits.length > 0 ? (
            <TableContainer>
              <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#006766' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>S.No</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0', textAlign: 'right' }}>Discount Value</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0', textAlign: 'right' }}>Max Discount</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Free Item</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0', textAlign: 'right' }}>Free Qty</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Apply To All</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Apply Category</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Apply Item</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {benefits.map((b, i) => (
                    <TableRow key={i} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{i + 1}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        <Chip label={b.benefit_type_display || b.benefit_type} size="small" />
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'right' }}>{b.discount_value ?? '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'right' }}>{b.max_discount_amount ?? '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{b.free_item_name || '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'right' }}>{b.free_quantity ?? '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{b.apply_to_all ? 'Yes' : 'No'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{b.apply_to_category_name || '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{b.apply_to_item_name || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">No benefits defined</Typography>
            </Paper>
          )}
        </Box>

        {/* Applicability */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
            Applicability ({applicability.length})
          </Typography>
          {applicability.length > 0 ? (
            <TableContainer>
              <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#006766' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>S.No</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Customer Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Apply to All</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>State</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>City</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Area</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Superstockist</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Distributor</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Retailer</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applicability.map((a, i) => (
                    <TableRow key={i} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{i + 1}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        <Chip label={a.customer_type_display || a.customer_type} size="small" />
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{a.apply_to_all ? 'Yes' : 'No'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{a.state_name || '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{a.city_name || '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{a.area_name || '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{a.superstockist_name || '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{a.distributor_name || '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{a.retailer_name || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">No applicability rules defined</Typography>
            </Paper>
          )}
        </Box>

        {/* Items */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
            Applicable Items ({items.length})
          </Typography>
          {items.length > 0 ? (
            <TableContainer>
              <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#006766' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>S.No</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Include All</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Category</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Item</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={i} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{i + 1}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{item.include_all_items ? 'Yes' : 'No'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{item.include_all_items ? '-' : (item.category_name || '-')}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{item.include_all_items ? '-' : (item.item_name || '-')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">No items defined</Typography>
            </Paper>
          )}
        </Box>

        {/* Authorization History */}
        {scheme.id && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
              Authorization History
            </Typography>
            <AuthorizationHistory modelPath="masters.scheme" instanceId={scheme.id} />
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '2px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#666' }}>
            Generated on {format(new Date(), 'dd-MM-yyyy, hh:mm a')}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            Scheme: {scheme.code} - {scheme.name}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default SchemeView;

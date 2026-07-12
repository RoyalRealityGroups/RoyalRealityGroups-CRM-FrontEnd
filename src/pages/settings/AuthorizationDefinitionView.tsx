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
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { authorizationApi } from '../../api/authorization.api';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import ScreenHeader from '../../components/common/ScreenHeader';
import { getHeaderSectionStyles, getContentSectionStyles, getPageContainerStyles } from '../../utils/spacing';
import type { RootState } from '../../store/store';
import { hasPermission } from '../../utils/permissions';

const cellLabel = { fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' };
const cellValue = { border: '1px solid #e0e0e0' };

const AuthorizationDefinitionView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useSelector((state: RootState) => state.auth.user);
  const { error: toastError } = useToast();
  const { setBreadcrumbs } = useBreadcrumbs();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  usePageTitle('View Authorization Definition');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Authorizations', path: '/settings/authorizations', icon: <CheckCircleIcon fontSize="small" /> },
      { label: 'View' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    if (!id) {
      setError('No ID provided');
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const result = await authorizationApi.getDefinition(id);
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to load');
        toastError('Failed to load authorization definition');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleBack = () => navigate('/settings/authorizations');
  const handleEdit = () => navigate(`/settings/authorization-definitions/${id}`);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Failed to load'}</Alert>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>Back to List</Button>
      </Box>
    );
  }

  const companies = Array.isArray(data.companies) ? data.companies : [];
  const locations = Array.isArray(data.locations) ? data.locations : [];
  const levelAuths = Array.isArray(data.level_authorizations) ? data.level_authorizations : [];

  const screenName = (() => {
    if (typeof data.screen === 'object' && data.screen) {
      return data.screen.content_type_detail?.name || data.screen.model || '-';
    }
    return data.screen_name || '-';
  })();

  const formatName = (name: string) => {
    const map: Record<string, string> = {
      Salesorder: 'Sales Order',
      Dispatchplan: 'Dispatch Plan',
      Proofofdelivery: 'Proof Of Delivery',
    };
    return map[name] || name;
  };

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <ScreenHeader
          title={`Authorization - ${data.authorization_name}`}
          showBackButton
          onBack={handleBack}
          disableBox
        >
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {hasPermission(user, 'change_authorizationdefinition') && (
              <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>Edit</Button>
            )}
          </Box>
        </ScreenHeader>
      </Box>

      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
          {/* Basic Information */}
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
            Basic Information
          </Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0', mb: 4 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ ...cellLabel, width: '20%' }}>Authorization Name</TableCell>
                  <TableCell sx={{ ...cellValue, width: '30%' }}>{data.authorization_name}</TableCell>
                  <TableCell sx={{ ...cellLabel, width: '20%' }}>Screen</TableCell>
                  <TableCell sx={{ ...cellValue, width: '30%' }}>{formatName(screenName)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={cellLabel}>Effective From</TableCell>
                  <TableCell sx={cellValue}>
                    {data.effective_from ? format(new Date(data.effective_from), 'dd-MM-yyyy') : '-'}
                  </TableCell>
                  <TableCell sx={cellLabel}>Status</TableCell>
                  <TableCell sx={cellValue}>
                    <Chip
                      label={data.status ? 'Active' : 'Inactive'}
                      color={data.status ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={cellLabel}>Final Level</TableCell>
                  <TableCell sx={cellValue}>
                    <Chip label={`L${data.level}`} color="primary" size="small" />
                  </TableCell>
                  <TableCell sx={cellLabel}>Auto-Approve Creator</TableCell>
                  <TableCell sx={cellValue}>
                    <Chip
                      label={data.auto_approve_creator_level ? 'Enabled' : 'Disabled'}
                      color={data.auto_approve_creator_level ? 'success' : 'default'}
                      size="small"
                      variant={data.auto_approve_creator_level ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Companies */}
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
            Companies
          </Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0', mb: 4 }}>
            <Table size="small">
              <TableBody>
                {data.has_all_companies ? (
                  <TableRow>
                    <TableCell sx={cellValue}>
                      <Chip label="All Companies" color="info" size="small" />
                    </TableCell>
                  </TableRow>
                ) : companies.length > 0 ? (
                  companies.map((c: any, i: number) => (
                    <TableRow key={c.id || i}>
                      <TableCell sx={{ ...cellValue, width: '10%' }}>{i + 1}</TableCell>
                      <TableCell sx={cellValue}>{c.name || c.id}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell sx={cellValue}>
                      <Typography variant="body2" color="text.secondary">No companies assigned</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Locations */}
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
            Locations
          </Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0', mb: 4 }}>
            <Table size="small">
              <TableBody>
                {data.has_all_locations ? (
                  <TableRow>
                    <TableCell sx={cellValue}>
                      <Chip label="All Locations" color="info" size="small" />
                    </TableCell>
                  </TableRow>
                ) : locations.length > 0 ? (
                  locations.map((l: any, i: number) => (
                    <TableRow key={l.id || i}>
                      <TableCell sx={{ ...cellValue, width: '10%' }}>{i + 1}</TableCell>
                      <TableCell sx={cellValue}>{l.name || l.id}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell sx={cellValue}>
                      <Typography variant="body2" color="text.secondary">No locations assigned</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Level Approvers */}
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
            Level Approvers ({levelAuths.length})
          </Typography>
          {levelAuths.length > 0 ? (
            <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0', mb: 4 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#006766' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Level</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Approver</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {levelAuths.map((auth: any, i: number) => {
                    const approverName = auth.type === 1
                      ? (auth.user?.fullname || auth.user?.username || auth.user_identifier || '-')
                      : (auth.group?.name || auth.group_name || '-');
                    return (
                      <TableRow key={i} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                        <TableCell sx={cellValue}>
                          <Chip label={`L${auth.level}`} color="primary" size="small" />
                        </TableCell>
                        <TableCell sx={cellValue}>{auth.type === 1 ? 'User' : 'Group'}</TableCell>
                        <TableCell sx={cellValue}>{approverName}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50', mb: 4 }}>
              <Typography variant="body2" color="text.secondary">No level approvers defined</Typography>
            </Paper>
          )}

          {/* Footer */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '2px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: '#666' }}>
              Generated on {format(new Date(), 'dd-MM-yyyy, hh:mm a')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
              Authorization: {data.authorization_name}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AuthorizationDefinitionView;

// @ts-nocheck
import React, { useEffect } from 'react';
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
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { usersApi, type UserDetail } from '../../api/users.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';
import { getHeaderSectionStyles } from '../../utils/spacing';
import type { RootState } from '../../store/store';
import { hasPermission } from '../../utils/permissions';

const labelCellSx = { fontWeight: 600, bgcolor: '#f8f9fa', width: '20%', border: '1px solid #e0e0e0' };
const valueCellSx = { width: '30%', border: '1px solid #e0e0e0' };

const UserView: React.FC = () => {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isProfileMode = !paramId || searchParams.get('profile') === 'true';
  const id = paramId || currentUser?.id;
  const { setBreadcrumbs } = useBreadcrumbs();

  usePageTitle('User View');

  const { data: user, isLoading, error } = useQuery<UserDetail>({
    queryKey: ['user', id],
    queryFn: () => usersApi.get(id!),
    enabled: !!id,
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      // { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      // { label: 'Users', path: '/settings/users', icon: <PeopleIcon fontSize="small" /> },
      { label: 'View', icon: <VisibilityIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{(error as any)?.message || 'Failed to load user'}</Alert>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate('/settings/users')}>
          Back to List
        </Button>
      </Box>
    );
  }

  const canEdit = isProfileMode || hasPermission(currentUser, 'change_user');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f5f5f5' }}>
      <Box sx={getHeaderSectionStyles()}>
        <ScreenHeader
          title={`User - ${user.username}`}
          showBackButton
          onBack={() => navigate('/')}
          disableBox
        >
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {canEdit && (
              <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(isProfileMode ? '/profile/edit' : `/settings/users/${id}`)}>
                Edit
              </Button>
            )}
          </Box>
        </ScreenHeader>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column' }}>
        <Paper sx={{ maxWidth: 1200, mx: 'auto', p: 4, width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              {/* Profile Picture */}
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid #006766',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#f0f0f0',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {user.profilepicture ? (
                  <Box
                    component="img"
                    src={user.profilepicture}
                    alt={user.fullname || user.first_name}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Typography variant="h3" sx={{ color: '#bdbdbd' }}>
                    {user.first_name?.[0]?.toUpperCase() || '?'}
                  </Typography>
                )}
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#006766', mb: 1 }}>
                {user.fullname || `${user.first_name} ${user.last_name}`.trim()}
              </Typography>
              <Typography variant="body1" color="text.secondary">@{user.username}</Typography>
            </Box>
            <Chip
              label={user.is_active ? 'Active' : 'Inactive'}
              sx={{
                backgroundColor: user.is_active ? '#d4edda' : '#e2e3e5',
                color: user.is_active ? '#155724' : '#383d41',
                fontWeight: 700,
                fontSize: '1rem',
                height: 40,
                px: 2,
              }}
            />
          </Box>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#006766', textAlign: 'center', mb: 3 }}>
            USER DETAILS
          </Typography>
        </Box>

        {/* Basic Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 3 }}>Basic Information</Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={labelCellSx}>Full Name</TableCell>
                  <TableCell sx={valueCellSx}>{user.fullname || `${user.first_name} ${user.last_name}`.trim() || '-'}</TableCell>
                  <TableCell sx={labelCellSx}>Username</TableCell>
                  <TableCell sx={valueCellSx}>{user.username || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={labelCellSx}>Email</TableCell>
                  <TableCell sx={valueCellSx}>{user.email || '-'}</TableCell>
                  <TableCell sx={labelCellSx}>Phone</TableCell>
                  <TableCell sx={valueCellSx}>{user.phone || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={labelCellSx}>Gender</TableCell>
                  <TableCell sx={valueCellSx}>{user.gender_name || '-'}</TableCell>
                  <TableCell sx={labelCellSx}>Status</TableCell>
                  <TableCell sx={valueCellSx}>
                    <Chip
                      label={user.is_active ? 'Active' : 'Inactive'}
                      color={user.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Employee Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 3 }}>Employee Information</Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={labelCellSx}>Designation</TableCell>
                  <TableCell sx={valueCellSx}>{user.designation || '-'}</TableCell>
                  <TableCell sx={labelCellSx}>Joining Date</TableCell>
                  <TableCell sx={valueCellSx}>
                    {user.joining_date ? format(new Date(user.joining_date), 'dd-MM-yyyy') : '-'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={labelCellSx}>Reporting Manager</TableCell>
                  <TableCell sx={valueCellSx}>{user.reporting_manager_name || '-'}</TableCell>
                  <TableCell sx={labelCellSx}>Team Size</TableCell>
                  <TableCell sx={valueCellSx}>{user.team_count ?? '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Performance Tracking */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 3 }}>Performance Tracking</Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={labelCellSx}>Leads Assigned</TableCell>
                  <TableCell sx={valueCellSx}>
                    <Chip label={user.leads_assigned ?? 0} color="primary" size="small" />
                  </TableCell>
                  <TableCell sx={labelCellSx}>Site Visits</TableCell>
                  <TableCell sx={valueCellSx}>
                    <Chip label={user.site_visits ?? 0} color="info" size="small" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={labelCellSx}>Bookings</TableCell>
                  <TableCell sx={valueCellSx}>
                    <Chip label={user.bookings ?? 0} color="success" size="small" />
                  </TableCell>
                  <TableCell sx={labelCellSx}>Registrations</TableCell>
                  <TableCell sx={valueCellSx}>
                    <Chip label={user.registrations ?? 0} color="warning" size="small" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

                {/* Security & Access */}
        {/* <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 3 }}>Security & Access</Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={labelCellSx}>Device Access</TableCell>
                  <TableCell sx={valueCellSx}>{user.device_access_name || '-'}</TableCell>
                  <TableCell sx={labelCellSx}>Email Verified</TableCell>
                  <TableCell sx={valueCellSx}>
                    <Chip label={user.is_email_verified ? 'Yes' : 'No'} color={user.is_email_verified ? 'success' : 'default'} size="small" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={labelCellSx}>Phone Verified</TableCell>
                  <TableCell sx={valueCellSx}>
                    <Chip label={user.is_phone_verified ? 'Yes' : 'No'} color={user.is_phone_verified ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell sx={labelCellSx}>Staff Status</TableCell>
                  <TableCell sx={valueCellSx}>
                    <Chip label={user.is_staff ? 'Yes' : 'No'} color={user.is_staff ? 'info' : 'default'} size="small" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box> */}

        {/* Groups */}
        {/* <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 3 }}>Groups</Typography>
          {user.groups && user.groups.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {user.groups.map((group) => (
                <Chip key={group.id} label={group.name} color="primary" variant="outlined" />
              ))}
            </Box>
          ) : (
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">No groups assigned</Typography>
            </Paper>
          )}
        </Box> */}

        {/* Company & Location Access */}
        {/* <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 3 }}>Company & Location Access</Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={labelCellSx}>Companies</TableCell>
                  <TableCell colSpan={3} sx={{ border: '1px solid #e0e0e0' }}>
                    {user.has_all_companies ? (
                      <Chip label="All Companies" color="info" size="small" />
                    ) : user.companies && user.companies.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {user.companies.map((c) => (
                          <Chip key={c.id} label={c.name} size="small" variant="outlined" />
                        ))}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={labelCellSx}>Locations</TableCell>
                  <TableCell colSpan={3} sx={{ border: '1px solid #e0e0e0' }}>
                    {user.has_all_locations ? (
                      <Chip label="All Locations" color="info" size="small" />
                    ) : user.locations && user.locations.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {user.locations.map((l) => (
                          <Chip key={l.id} label={l.name} size="small" variant="outlined" />
                        ))}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box> */}

        {/* Channel Partner */}
        {/* {user.channel_partner_type && user.channel_partner_type !== 'STAFF' && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 3 }}>Channel Partner</Typography>
            <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={labelCellSx}>Partner Type</TableCell>
                    <TableCell sx={valueCellSx}>
                      <Chip label={user.channel_partner_type_name || user.channel_partner_type} size="small" color="secondary" />
                    </TableCell>
                    <TableCell sx={labelCellSx}>
                      {user.channel_partner_type === 'SUPERSTOCKIST' && 'Superstockist'}
                      {user.channel_partner_type === 'DISTRIBUTOR' && 'Distributor'}
                      {user.channel_partner_type === 'RETAILER' && 'Retailer'}
                    </TableCell>
                    <TableCell sx={valueCellSx}>
                      {user.superstockist_name?.name || user.distributor_name?.name || user.retailer_name?.name || '-'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )} */}

        {/* Timestamps */}
        {/* <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 3 }}>Audit Information</Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={labelCellSx}>Created At</TableCell>
                  <TableCell sx={valueCellSx}>
                    {user.created_at ? format(new Date(user.created_at), 'dd-MM-yyyy, hh:mm a') : '-'}
                  </TableCell>
                  <TableCell sx={labelCellSx}>Updated At</TableCell>
                  <TableCell sx={valueCellSx}>
                    {user.updated_at ? format(new Date(user.updated_at), 'dd-MM-yyyy, hh:mm a') : '-'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box> */}

        {/* Footer */}
        <Box sx={{ mt: 'auto', pt: 3, borderTop: '2px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#666' }}>
            Generated on {format(new Date(), 'dd-MM-yyyy, hh:mm a')}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            User: {user.username} - {user.fullname || user.first_name}
          </Typography>
        </Box>
      </Paper>
      </Box>
    </Box>
  );
};

export default UserView;

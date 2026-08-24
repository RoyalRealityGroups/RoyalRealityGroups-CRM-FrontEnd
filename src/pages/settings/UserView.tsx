import React, { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box, Paper, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableRow, TableHead,
  Chip, CircularProgress, Alert, Divider,
} from '@mui/material';
import {
  Edit as EditIcon, Home as HomeIcon,
  Settings as SettingsIcon, People as PeopleIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckIcon, Cancel as CrossIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { usersApi } from '../../api/users.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';
import { getHeaderSectionStyles } from '../../utils/spacing';
import type { RootState } from '../../store/store';
import { usePermissions } from '../../contexts/PermissionContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const lc = { fontWeight: 600, bgcolor: 'grey.50', width: '22%', border: '1px solid #e0e0e0' };
const vc = { width: '28%', border: '1px solid #e0e0e0' };

const PermIcon: React.FC<{ value: boolean }> = ({ value }) =>
  value
    ? <CheckIcon sx={{ fontSize: 18, color: 'success.main' }} />
    : <CrossIcon sx={{ fontSize: 18, color: 'text.disabled' }} />;

const ScopeChip: React.FC<{ scope?: string }> = ({ scope }) => {
  const map: Record<string, 'success' | 'warning' | 'error'> = { ALL: 'success', TEAM: 'warning', OWN: 'error' };
  return <Chip label={scope || '—'} color={map[scope || ''] || 'default'} size="small" sx={{ fontWeight: 600 }} />;
};

// ─── Component ────────────────────────────────────────────────────────────────

const UserView: React.FC = () => {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { canEdit } = usePermissions();

  const isProfileMode = !paramId || searchParams.get('profile') === 'true';
  const id = paramId || currentUser?.id;
  const { setBreadcrumbs } = useBreadcrumbs();

  usePageTitle('User View');

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.get(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (isProfileMode) {
      setBreadcrumbs([
        { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
        { label: 'Profile', icon: <PeopleIcon fontSize="small" /> },
      ]);
    } else {
      setBreadcrumbs([
        { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
        { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
        { label: 'Users', path: '/settings/users', icon: <PeopleIcon fontSize="small" /> },
        { label: 'View', icon: <VisibilityIcon fontSize="small" /> },
      ]);
    }
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isProfileMode]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{(error as any)?.message || 'Failed to load user'}</Alert>
        <Button variant="contained" onClick={() => navigate('/settings/users')}>Back to List</Button>
      </Box>
    );
  }

  const canEditUser = isProfileMode || canEdit('USER_PERMISSION') || currentUser?.is_superuser;

  const grantedScreens = user.screen_permissions?.filter(
    (p) => p.can_view || p.can_add || p.can_edit || p.can_delete || p.can_export
  ) ?? [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'grey.100' }}>
      <Box sx={getHeaderSectionStyles()}>
        <ScreenHeader
          title={`User — ${user.username}`}
          showBackButton
          onBack={() => navigate(isProfileMode ? '/' : '/settings/users')}
          disableBox
        >
          {canEditUser && (
            <Button variant="outlined" startIcon={<EditIcon />}
              onClick={() => navigate(isProfileMode ? '/profile/edit' : `/settings/users/${id}`)}>
              Edit
            </Button>
          )}
        </ScreenHeader>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Paper sx={{ maxWidth: 1200, mx: 'auto', p: 4 }}>

          {/* Profile header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
            <Box sx={{
              width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
              border: '3px solid', borderColor: 'primary.main',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'grey.200', flexShrink: 0,
            }}>
              {user.profilepicture
                ? <Box component="img" src={user.profilepicture} alt={user.fullname}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Typography variant="h3" sx={{ color: 'grey.400' }}>{user.first_name?.[0]?.toUpperCase() || '?'}</Typography>
              }
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                {user.fullname || `${user.first_name} ${user.last_name}`.trim()}
              </Typography>
              <Typography variant="body2" color="text.secondary">@{user.username}</Typography>
              {user.designation && <Typography variant="body2" color="text.secondary">{user.designation}</Typography>}
            </Box>
            <Chip
              label={user.user_status || (user.is_active ? 'ACTIVE' : 'INACTIVE')}
              color={
                (user.user_status === 'ACTIVE' || (!user.user_status && user.is_active)) ? 'success'
                : user.user_status === 'SUSPENDED' ? 'warning' : 'default'
              }
              sx={{ fontWeight: 700 }}
            />
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Basic */}
          <Typography variant="h6" fontWeight={600} color="primary.main" sx={{ mb: 2 }}>Basic Information</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={lc}>Full Name</TableCell>
                  <TableCell sx={vc}>{`${user.first_name} ${user.last_name}`.trim() || '—'}</TableCell>
                  <TableCell sx={lc}>Username</TableCell>
                  <TableCell sx={vc}>{user.username || '—'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={lc}>Email</TableCell>
                  <TableCell sx={vc}>{user.email || '—'}</TableCell>
                  <TableCell sx={lc}>Phone</TableCell>
                  <TableCell sx={vc}>{user.phone || '—'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={lc}>Gender</TableCell>
                  <TableCell sx={vc}>{user.gender_name || '—'}</TableCell>
                  <TableCell sx={lc}>Active</TableCell>
                  <TableCell sx={vc}>
                    <Chip label={user.is_active ? 'Yes' : 'No'} color={user.is_active ? 'success' : 'default'} size="small" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {!isProfileMode && (
            <>
              {/* Employee Info */}
              <Typography variant="h6" fontWeight={600} color="primary.main" sx={{ mb: 2 }}>Employee Information</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={lc}>Designation</TableCell>
                      <TableCell sx={vc}>{user.designation || '—'}</TableCell>
                      <TableCell sx={lc}>Joining Date</TableCell>
                      <TableCell sx={vc}>{user.joining_date ? format(new Date(user.joining_date), 'dd-MM-yyyy') : '—'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={lc}>Reporting Manager</TableCell>
                      <TableCell sx={vc}>{user.reporting_manager_name || '—'}</TableCell>
                      <TableCell sx={lc}>Team Size</TableCell>
                      <TableCell sx={vc}>{user.team_count ?? '—'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={lc}>Device Access</TableCell>
                      <TableCell sx={vc}>{user.device_access_name || '—'}</TableCell>
                      <TableCell sx={lc}>Must Reset Password</TableCell>
                      <TableCell sx={vc}><PermIcon value={!!user.must_reset_password} /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Performance */}
              <Typography variant="h6" fontWeight={600} color="primary.main" sx={{ mb: 2 }}>Performance</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={lc}>Leads Assigned</TableCell>
                      <TableCell sx={vc}><Chip label={user.leads_assigned ?? 0} color="primary" size="small" /></TableCell>
                      <TableCell sx={lc}>Site Visits</TableCell>
                      <TableCell sx={vc}><Chip label={user.site_visits ?? 0} color="info" size="small" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={lc}>Bookings</TableCell>
                      <TableCell sx={vc}><Chip label={user.bookings ?? 0} color="success" size="small" /></TableCell>
                      <TableCell sx={lc}>Registrations</TableCell>
                      <TableCell sx={vc}><Chip label={user.registrations ?? 0} color="warning" size="small" /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Data Scope */}
              <Typography variant="h6" fontWeight={600} color="primary.main" sx={{ mb: 2 }}>Data Scope</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={lc}>Leads</TableCell>
                      <TableCell sx={vc}><ScopeChip scope={user.lead_data_scope} /></TableCell>
                      <TableCell sx={lc}>Follow-Ups</TableCell>
                      <TableCell sx={vc}><ScopeChip scope={user.followup_data_scope} /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={lc}>Site Visits</TableCell>
                      <TableCell sx={vc}><ScopeChip scope={user.sitevisit_data_scope} /></TableCell>
                      <TableCell sx={lc}>Bookings</TableCell>
                      <TableCell sx={vc}><ScopeChip scope={user.booking_data_scope} /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Screen Permissions */}
              <Typography variant="h6" fontWeight={600} color="primary.main" sx={{ mb: 2 }}>
                Screen Permissions
                {grantedScreens.length > 0 && (
                  <Chip label={`${grantedScreens.length} screen${grantedScreens.length !== 1 ? 's' : ''}`}
                    size="small" color="primary" sx={{ ml: 1.5 }} />
                )}
              </Typography>
              {grantedScreens.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.100' } }}>
                        <TableCell>Screen</TableCell>
                        <TableCell align="center">View</TableCell>
                        <TableCell align="center">Add</TableCell>
                        <TableCell align="center">Edit</TableCell>
                        <TableCell align="center">Delete</TableCell>
                        <TableCell align="center">Export</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {grantedScreens.map((p) => (
                        <TableRow key={p.menuitem_code}>
                          <TableCell><Typography variant="body2" fontWeight={500}>{p.menuitem_name}</Typography></TableCell>
                          <TableCell align="center"><PermIcon value={p.can_view} /></TableCell>
                          <TableCell align="center"><PermIcon value={p.can_add} /></TableCell>
                          <TableCell align="center"><PermIcon value={p.can_edit} /></TableCell>
                          <TableCell align="center"><PermIcon value={p.can_delete} /></TableCell>
                          <TableCell align="center"><PermIcon value={p.can_export} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Paper variant="outlined" sx={{ p: 3, mb: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography variant="body2" color="text.secondary">No screen permissions assigned.</Typography>
                </Paper>
              )}
            </>
          )}

          <Divider sx={{ mt: 2, mb: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              Joined: {user.joining_date ? format(new Date(user.joining_date), 'dd-MM-yyyy') : '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Created: {user.created_at ? format(new Date(user.created_at), 'dd-MM-yyyy') : '—'}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default UserView;

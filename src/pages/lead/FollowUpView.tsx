import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Divider,
  Chip,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Today as TodayIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { usePageTitle } from '../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import { leadApi } from '../../api/lead.api';
import type { LeadChoices } from '../../types/lead.types';
import { getPageContainerStyles, getContentSectionStyles } from '../../utils/spacing';

const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'NEW_LEAD': return 'default';
    case 'CONTACT_ATTEMPTED': return 'info';
    case 'CONNECTED': return 'primary';
    case 'INTERESTED': return 'success';
    case 'SITE_VISIT_SCHEDULED': return 'warning';
    case 'SITE_VISIT_COMPLETED': return 'success';
    case 'NEGOTIATION': return 'warning';
    case 'BOOKING': return 'primary';
    case 'REGISTRATION': return 'success';
    case 'LOST': return 'error';
    default: return 'default';
  }
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {label}
    </Typography>
    <Box sx={{ mt: 0.5, color: 'text.primary', fontSize: '0.9375rem' }}>
      {value || '-'}
    </Box>
  </Box>
);

const FollowUpView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();
  usePageTitle('View Follow-up');

  React.useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Lead Management', path: '/lead', icon: <PersonIcon fontSize="small" /> },
      { label: 'Follow-ups', path: '/lead/follow-ups', icon: <TodayIcon fontSize="small" /> },
      { label: 'View', path: `/lead/follow-ups/view/${id}`, icon: <TodayIcon fontSize="small" /> },
    ]);
  }, [setBreadcrumbs, id]);

  const { data: followUp, isLoading, isError, error } = useQuery({
    queryKey: ['follow-up', id],
    queryFn: () => leadApi.getFollowUp(id!),
    enabled: !!id,
  });

  const { data: choices } = useQuery<LeadChoices>({
    queryKey: ['lead-choices'],
    queryFn: () => leadApi.getChoices(),
  });

  const followUpTypeLabel = (value: string) =>
    choices?.follow_up_types?.find((t) => t.value === value)?.label || value;

  if (isLoading) {
    return (
      <Box sx={getPageContainerStyles()}>
        <ScreenHeader title="View Follow-up" showAddButton={false} />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (isError || !followUp) {
    return (
      <Box sx={getPageContainerStyles()}>
        <ScreenHeader title="View Follow-up" showAddButton={false} />
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load follow-up: {(error as any)?.message || 'Unknown error'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/lead/follow-ups')}
          sx={{ mt: 2 }}
        >
          Back to Follow-ups
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={getPageContainerStyles()}>
      <ScreenHeader title="View Follow-up" showAddButton={false} />

      <Paper sx={getContentSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Follow-up Details
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/lead/follow-ups')}
            variant="outlined"
            size="small"
          >
            Back
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Lead Section */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
          Lead Information
        </Typography>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoRow label="Name" value={followUp.lead?.name} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoRow label="Lead Code" value={followUp.lead?.code} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoRow label="Mobile" value={followUp.lead?.mobile} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Status
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={followUp.lead?.status || 'N/A'}
                  size="small"
                  color={getStatusColor(followUp.lead?.status || 'NEW_LEAD')}
                />
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoRow label="Assigned To" value={followUp.lead?.assigned_employee} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Follow-up Section */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
          Follow-up Information
        </Typography>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoRow
              label="Follow-up Date"
              value={followUp.follow_up_date ? new Date(followUp.follow_up_date).toLocaleDateString() : '-'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoRow
              label="Follow-up Type"
              value={<Chip label={followUpTypeLabel(followUp.follow_up_type)} size="small" variant="outlined" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoRow
              label="Next Follow-up Date"
              value={followUp.next_follow_up_date ? new Date(followUp.next_follow_up_date).toLocaleDateString() : '-'}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <InfoRow
              label="Discussion Notes"
              value={
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                  {followUp.discussion_notes || 'No notes recorded'}
                </Typography>
              }
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Audit Section */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
          Audit Information
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <InfoRow label="Logged By" value={followUp.created_by?.name} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <InfoRow
              label="Logged On"
              value={followUp.created_on ? new Date(followUp.created_on).toLocaleString() : '-'}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default FollowUpView;
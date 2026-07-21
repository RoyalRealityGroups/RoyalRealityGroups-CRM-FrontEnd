import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Today as TodayIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import { leadApi } from '../../api/lead.api';
import type { LeadChoices, LeadFollowUpFormData } from '../../types/lead.types';
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
  const location = useLocation();
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

  const queryClient = useQueryClient();
  const { success } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [newLeadStatus, setNewLeadStatus] = useState('');
  const [editForm, setEditForm] = useState<LeadFollowUpFormData>({
    follow_up_date: '',
    follow_up_time: '',
    follow_up_type: '',
    discussion_notes: '',
    next_follow_up_date: '',
    lead_id: '',
  });

  // Auto-enter edit mode when navigated from list page Edit icon
  React.useEffect(() => {
    if ((location.state as any)?.editing && followUp) {
      setEditForm({
        follow_up_date: followUp.follow_up_date || '',
        follow_up_time: followUp.follow_up_time || '',
        follow_up_type: followUp.follow_up_type || '',
        discussion_notes: followUp.discussion_notes || '',
        next_follow_up_date: followUp.next_follow_up_date || '',
        lead_id: followUp.lead!.id,
      });
      setNewLeadStatus(followUp.lead?.status || '');
      setIsEditing(true);
      // ponytail: clear state so refresh doesn't re-enter edit
      navigate(location.pathname, { replace: true });
    }
  }, [followUp]);

  const updateMutation = useMutation({
    mutationFn: (data: LeadFollowUpFormData) => leadApi.updateFollowUp(id!, data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['follow-up', id] });
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });

      // Un-dismiss this follow-up from the notification panel so it reappears
      const savedId = String(saved.id);
      try {
        const stored = sessionStorage.getItem('reminder_dismissed');
        if (stored) {
          const ids: string[] = JSON.parse(stored);
          const updated = ids.filter((i) => i !== savedId);
          sessionStorage.setItem('reminder_dismissed', JSON.stringify(updated));
        }
      } catch { /* ignore */ }

      // Refresh the notification bell immediately
      queryClient.invalidateQueries({ queryKey: ['followup-reminders'] });

      setIsEditing(false);
      success('Follow-up updated successfully', 5000);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: string }) =>
      leadApi.updateLeadStatus(leadId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up', id] });
      queryClient.invalidateQueries({ queryKey: ['lead', followUp?.lead?.id] });
      success('Follow-up status updated', 5000);
    },
  });

  const handleSave = () => {
    const payload = { ...editForm, lead_id: followUp!.lead!.id };
    // ponytail: time input sends HH:MM, Django expects HH:MM:SS
    if (payload.follow_up_time && payload.follow_up_time.length === 5) {
      payload.follow_up_time = `${payload.follow_up_time}:00`;
    }
    updateMutation.mutate(payload);
    if (newLeadStatus && followUp?.lead?.status !== newLeadStatus) {
      statusMutation.mutate({ leadId: followUp!.lead!.id.toString(), status: newLeadStatus });
    }
  };

  const startEditing = () => {
    setEditForm({
      follow_up_date: followUp.follow_up_date || '',
      follow_up_time: followUp.follow_up_time || '',
      follow_up_type: followUp.follow_up_type || '',
      discussion_notes: followUp.discussion_notes || '',
      next_follow_up_date: followUp.next_follow_up_date || '',
      lead_id: followUp.lead!.id,
    });
    setNewLeadStatus(followUp.lead?.status || '');
    setIsEditing(true);
  };

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
            <Box sx={{ display: 'flex', gap: 1 }}>
              {isEditing ? (
                <>
                  <Button variant="outlined" size="small" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained" size="small"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    startIcon={<EditIcon />}
                    variant="contained" size="small"
                    onClick={startEditing}
                  >
                    Edit
                  </Button>
                  <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/lead/follow-ups')}
                    variant="outlined" size="small"
                  >
                    Back
                  </Button>
                </>
              )}
            </Box>
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
            {isEditing ? (
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={newLeadStatus}
                  label="Status"
                  onChange={(e) => setNewLeadStatus(e.target.value)}
                >
                  {choices?.lead_statuses?.map((s) => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
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
            )}
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
            {isEditing ? (
              <TextField fullWidth label="Follow-up Date" type="date" size="small"
                InputLabelProps={{ shrink: true }}
                value={editForm.follow_up_date}
                onChange={(e) => setEditForm({ ...editForm, follow_up_date: e.target.value })}
              />
            ) : (
              <InfoRow label="Follow-up Date" value={followUp.follow_up_date ? new Date(followUp.follow_up_date).toLocaleDateString() : '-'} />
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {isEditing ? (
              <TextField fullWidth label="Follow-up Time" type="time" size="small"
                InputLabelProps={{ shrink: true }}
                value={editForm.follow_up_time}
                onChange={(e) => setEditForm({ ...editForm, follow_up_time: e.target.value })}
              />
            ) : (
              <InfoRow label="Follow-up Time" value={followUp.follow_up_time || '-'} />
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {isEditing ? (
              <FormControl fullWidth size="small">
                <InputLabel>Follow-up Type</InputLabel>
                <Select value={editForm.follow_up_type} label="Follow-up Type"
                  onChange={(e) => setEditForm({ ...editForm, follow_up_type: e.target.value })}
                >
                  {choices?.follow_up_types?.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <InfoRow label="Follow-up Type" value={<Chip label={followUpTypeLabel(followUp.follow_up_type)} size="small" variant="outlined" />} />
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {isEditing ? (
              <TextField fullWidth label="Next Follow-up Date" type="date" size="small"
                InputLabelProps={{ shrink: true }}
                value={editForm.next_follow_up_date}
                onChange={(e) => setEditForm({ ...editForm, next_follow_up_date: e.target.value })}
              />
            ) : (
              <InfoRow label="Next Follow-up Date" value={followUp.next_follow_up_date ? new Date(followUp.next_follow_up_date).toLocaleDateString() : '-'} />
            )}
          </Grid>
          <Grid size={{ xs: 12 }}>
            {isEditing ? (
              <TextField fullWidth label="Discussion Notes" multiline rows={3} size="small"
                value={editForm.discussion_notes}
                onChange={(e) => setEditForm({ ...editForm, discussion_notes: e.target.value })}
              />
            ) : (
              <InfoRow label="Discussion Notes" value={
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                  {followUp.discussion_notes || 'No notes recorded'}
                </Typography>
              } />
            )}
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
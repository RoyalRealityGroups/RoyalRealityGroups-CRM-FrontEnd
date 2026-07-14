import React, { useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import { Add as AddIcon, Today as TodayIcon, Warning as WarningIcon, Person as PersonIcon, EventAvailableOutlined, HistoryOutlined } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadApi } from '../../api/lead.api';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import type { LeadFollowUp, LeadFollowUpFormData, LeadChoices, Lead } from '../../types/lead.types';
import Autocomplete from '@mui/material/Autocomplete';
import { getPageContainerStyles, getContentSectionStyles } from '../../utils/spacing';

const FollowUps: React.FC = () => {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();
  usePageTitle('Follow-ups');

  const [activeTab, setActiveTab] = useState<'due_today' | 'overdue' | 'all'>('due_today');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<LeadFollowUpFormData>>({
    follow_up_date: new Date().toISOString().split('T')[0],
    follow_up_type: '',
    discussion_notes: '',
    next_follow_up_date: '',
  });

  React.useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Lead Management', path: '/lead', icon: <PersonIcon fontSize="small" /> },
      { label: 'Follow-ups', path: '/lead/follow-ups', icon: <TodayIcon fontSize="small" /> },
    ]);
  }, [setBreadcrumbs]);

  // Fetch follow-ups for all tabs (cheap queries; powers summary counts)
  const {
    data: dueTodayData,
    isLoading: dueTodayLoading,
    isError: dueTodayError,
    error: dueTodayErr,
  } = useQuery({
    queryKey: ['follow-ups-due-today'],
    queryFn: () => leadApi.getDueTodayFollowUps(),
  });

  const {
    data: overdueData,
    isLoading: overdueLoading,
    isError: overdueError,
    error: overdueErr,
  } = useQuery({
    queryKey: ['follow-ups-overdue'],
    queryFn: () => leadApi.getOverdueFollowUps(),
  });

  const {
    data: allData,
    isLoading: allLoading,
    isError: allError,
    error: allErr,
  } = useQuery({
    queryKey: ['follow-ups-all'],
    queryFn: () => leadApi.getFollowUps(),
  });

  // Fetch choices
  const { data: choices } = useQuery({
    queryKey: ['lead-choices'],
    queryFn: () => leadApi.getChoices(),
  });

  // Lead search for new follow-up dialog
  const { data: leadSearchData } = useQuery({
    queryKey: ['lead-search', leadSearchQuery],
    queryFn: () => leadApi.getLeads({ search: leadSearchQuery, page_size: 20 }),
    enabled: leadSearchQuery.length > 0,
  });
  const leadOptions = leadSearchData?.results || [];

  // Create follow-up mutation
  const createMutation = useMutation({
    mutationFn: (data: LeadFollowUpFormData) => leadApi.createFollowUp(data),
    onSuccess: () => {
      toastSuccess('Follow-up logged successfully');
      setDialogOpen(false);
      setSelectedLead(null);
      setFormData({
        follow_up_date: new Date().toISOString().split('T')[0],
        follow_up_type: '',
        discussion_notes: '',
        next_follow_up_date: '',
      });
      setActiveTab('all');
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to log follow-up');
    },
  });

  const rawData = activeTab === 'due_today' ? dueTodayData : activeTab === 'overdue' ? overdueData : allData;
  const currentData = Array.isArray(rawData) ? rawData : rawData?.results;
  const isLoading = activeTab === 'due_today' ? dueTodayLoading : activeTab === 'overdue' ? overdueLoading : allLoading;
  const queryErr =
    activeTab === 'due_today' ? dueTodayErr
    : activeTab === 'overdue' ? overdueErr
    : allErr;
  const queryFailed =
    activeTab === 'due_today' ? dueTodayError
    : activeTab === 'overdue' ? overdueError
    : allError;

  // ponytail: trivial counts derived once per tab switch â€” used by summary cards.
  const dueTodayCount = Array.isArray(dueTodayData)
    ? dueTodayData.length
    : (dueTodayData?.results?.length ?? 0);
  const overdueCount = Array.isArray(overdueData)
    ? overdueData.length
    : (overdueData?.results?.length ?? 0);
  const allCount = Array.isArray(allData)
    ? allData.length
    : (allData?.results?.length ?? 0);

  const handleOpenDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData({
      follow_up_date: new Date().toISOString().split('T')[0],
      follow_up_type: '',
      discussion_notes: '',
      next_follow_up_date: '',
    });
    setDialogOpen(true);
  };

  const handleSaveFollowUp = () => {
    if (!selectedLead || !formData.follow_up_type || !formData.follow_up_date) {
      toastError('Please fill all required fields');
      return;
    }
    createMutation.mutate({
      lead_id: selectedLead.id,
      follow_up_date: formData.follow_up_date,
      follow_up_type: formData.follow_up_type,
      discussion_notes: formData.discussion_notes || '',
      next_follow_up_date: formData.next_follow_up_date,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW_LEAD': return 'default';
      case 'CONTACT_ATTEMPTED': return 'info';
      case 'CONNECTED': return 'primary';
      case 'INTERESTED': return 'success';
      case 'SITE_VISIT_SCHEDULED': return 'warning';
      case 'SITE_VISIT_COMPLETED': return 'success';
      case 'NEGOTIATION': return 'warning';
      case 'BOOKING': return 'success';
      case 'REGISTRATION': return 'success';
      case 'LOST': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={getPageContainerStyles()}>
      <ScreenHeader
        title="Follow-ups"
        
        showAddButton={true}
        addButtonText="New Follow-up"
        onAdd={() => { setSelectedLead(null); setDialogOpen(true); }}
      />

      <Paper sx={getContentSectionStyles()}>
        {/* Summary stat cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              onClick={() => setActiveTab('due_today')}
              role="button"
              tabIndex={0}
              sx={{
                p: 2,
                borderRadius: 1,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: activeTab === 'due_today' ? 'primary.main' : 'divider',
                backgroundColor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                transition: 'border-color 120ms ease',
                '&:hover': { borderColor: activeTab === 'due_today' ? 'primary.main' : 'primary.light' },
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', fontWeight: 500 }}>
                Due today
              </Typography>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'primary.main', lineHeight: 1 }}>
                {dueTodayCount}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              onClick={() => setActiveTab('overdue')}
              role="button"
              tabIndex={0}
              sx={{
                p: 2,
                borderRadius: 1,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: activeTab === 'overdue' ? 'error.main' : 'divider',
                backgroundColor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                transition: 'border-color 120ms ease',
                '&:hover': { borderColor: activeTab === 'overdue' ? 'error.main' : 'error.light' },
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', fontWeight: 500 }}>
                Overdue
              </Typography>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'error.main', lineHeight: 1 }}>
                {overdueCount}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              onClick={() => setActiveTab('all')}
              role="button"
              tabIndex={0}
              sx={{
                p: 2,
                borderRadius: 1,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: activeTab === 'all' ? 'primary.main' : 'divider',
                backgroundColor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                transition: 'border-color 120ms ease',
                '&:hover': { borderColor: activeTab === 'all' ? 'primary.main' : 'primary.light' },
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', fontWeight: 500 }}>
                All follow-ups
              </Typography>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
                {allCount}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : queryFailed ? (
          <Alert severity="error">
            Failed to load follow-ups: {(queryErr as any)?.message || 'Unknown error'}
          </Alert>
        ) : currentData && Array.isArray(currentData) && currentData.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Lead</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Next Follow-up</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(currentData as LeadFollowUp[]).map((followUp, index) => (
                  <TableRow key={followUp.id}>
                    <TableCell>{followUp.lead?.name}</TableCell>
                    <TableCell>{followUp.lead?.code}</TableCell>
                    <TableCell>{followUp.lead?.mobile || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={followUp.lead?.status || 'N/A'}
                        size="small"
                        color={getStatusColor(followUp.lead?.status || 'NEW_LEAD')}
                      />
                    </TableCell>
                    <TableCell>{followUp.lead?.assigned_employee || '-'}</TableCell>
                    <TableCell>
                      <Chip label={followUp.follow_up_type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {followUp.next_follow_up_date
                        ? new Date(followUp.next_follow_up_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog({
                          id: followUp.lead?.id || '',
                          name: followUp.lead?.name || '',
                          code: followUp.lead?.code || '',
                          mobile: followUp.lead?.mobile || '',
                          status: followUp.lead?.status || '',
                          lead_source: '',
                          assigned_employee: { id: '', name: followUp.lead?.assigned_employee || '', code: '' },
                          cross_lead_override: false,
                          created_on: '',
                          modified_on: '',
                        })}
                      >
                        Log Follow-up
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box
            sx={{
              py: 6,
              px: 4,
              textAlign: 'center',
              borderRadius: 1,
              border: '1px dashed',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
            }}
          >
            {activeTab === 'overdue' ? (
              <WarningIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
            ) : (
              <EventAvailableOutlined sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
            )}
            <Typography variant="h3" sx={{ fontSize: '1.125rem', fontWeight: 600, mb: 0.5 }}>
              {activeTab === 'due_today'
                ? 'All caught up'
                : activeTab === 'overdue'
                ? 'No overdue items'
                : 'No follow-ups yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto' }}>
              {activeTab === 'due_today'
                ? 'Nothing scheduled for today.'
                : activeTab === 'overdue'
                ? 'No follow-ups are past their scheduled date.'
                : 'Click "New Follow-up" above to log your first interaction.'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Quick Follow-up Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon color="primary" />
            <span>Log Follow-up</span>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Lead Selection / Info */}
          {selectedLead ? (
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2">{selectedLead.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedLead.code} | {selectedLead.mobile}
                </Typography>
              </Box>
              <Button size="small" onClick={() => setSelectedLead(null)}>Change</Button>
            </Paper>
          ) : (
            <Autocomplete
              options={leadOptions}
              getOptionLabel={(opt) => `${opt.name} (${opt.code})`}
              onInputChange={(_, val) => setLeadSearchQuery(val)}
              onChange={(_, val) => setSelectedLead(val)}
              renderInput={(params) => (
                <TextField {...params} label="Search Lead *" required />
              )}
              sx={{ mb: 2 }}
            />
          )}
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Follow-up Date"
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Follow-up Type</InputLabel>
                <Select
                  value={formData.follow_up_type}
                  label="Follow-up Type"
                  onChange={(e) => setFormData({ ...formData, follow_up_type: e.target.value })}
                >
                  {choices?.follow_up_types.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Discussion Notes"
                value={formData.discussion_notes}
                onChange={(e) => setFormData({ ...formData, discussion_notes: e.target.value })}
                placeholder="What was discussed in this follow-up?"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Next Follow-up Date"
                type="date"
                value={formData.next_follow_up_date}
                onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button
            onClick={handleSaveFollowUp}
            variant="contained"
            disabled={createMutation.isPending}
            startIcon={createMutation.isPending ? undefined : <AddIcon />}
          >
            {createMutation.isPending ? 'Saving...' : 'Save Follow-up'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FollowUps;

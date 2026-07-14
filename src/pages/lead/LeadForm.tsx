import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Add as AddIcon, Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadApi } from '../../api/lead.api';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import type { LeadFormData, LeadChoices, CrossCheckResult } from '../../types/lead.types';
import { getPageContainerStyles, getContentSectionStyles } from '../../utils/spacing';

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  NEW_LEAD: 'info',
  CONTACT_ATTEMPTED: 'warning',
  CONNECTED: 'primary',
  INTERESTED: 'success',
  SITE_VISIT_SCHEDULED: 'secondary',
  SITE_VISIT_COMPLETED: 'success',
  NEGOTIATION: 'warning',
  BOOKING: 'primary',
  REGISTRATION: 'success',
  LOST: 'error',
};

const LeadForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const isEdit = Boolean(id);
  const isViewMode = location.pathname.includes('/view/');
  const isEditMode = location.pathname.includes('/edit/');

  usePageTitle(isViewMode ? 'View Lead' : isEdit ? 'Edit Lead' : 'Add Lead');

  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    mobile: '',
    alternate_number: '',
    email: '',
    budget: '',
    preferred_area: '',
    property_requirement: '',
    lead_source: '',
    status: 'NEW_LEAD',
    assigned_employee_id: '',
    remarks: '',
  });

  const [crossCheckOpen, setCrossCheckOpen] = useState(false);
  const [crossCheckResult, setCrossCheckResult] = useState<CrossCheckResult | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Lead Management', path: '/lead', icon: <PersonIcon fontSize="small" /> },
      { label: isEdit ? 'Edit Lead' : 'Add Lead', path: isEdit ? `/lead/edit/${id}` : '/lead/add', icon: <PersonIcon fontSize="small" /> },
    ]);
  }, [setBreadcrumbs, isEdit, id]);

  // Fetch choices
  const { data: choices } = useQuery({
    queryKey: ['lead-choices'],
    queryFn: () => leadApi.getChoices(),
  });

  // Fetch users for assignment
  const { data: users } = useQuery({
    queryKey: ['lead-users'],
    queryFn: () => leadApi.getUsers(),
  });

  // Fetch lead data if editing
  const { data: leadData, isLoading: leadLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadApi.getLead(id!),
    enabled: Boolean(id),
  });

  // Populate form when lead data loads
  useEffect(() => {
    if (leadData) {
      setFormData({
        name: leadData.name,
        mobile: leadData.mobile,
        alternate_number: leadData.alternate_number || '',
        email: leadData.email || '',
        budget: leadData.budget || '',
        preferred_area: leadData.preferred_area || '',
        property_requirement: leadData.property_requirement || '',
        lead_source: leadData.lead_source,
        status: leadData.status || 'NEW_LEAD',
        assigned_employee_id: leadData.assigned_employee?.id || '',
        remarks: leadData.remarks || '',
      });
    }
  }, [leadData]);

  // Cross-check mutation
  const crossCheckMutation = useMutation({
    mutationFn: (data: { mobile?: string; alternate_number?: string; email?: string }) =>
      leadApi.crossCheck(data),
    onSuccess: (result) => {
      if (result.has_duplicates) {
        setCrossCheckResult(result);
        setCrossCheckOpen(true);
      }
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: LeadFormData) =>
      isEdit ? leadApi.updateLead(id!, data) : leadApi.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toastSuccess(`Lead ${isEdit ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      navigate('/lead/list');
    },
    onError: (error: any) => {
      const data = error.response?.data;
      if (data?.has_duplicates && Array.isArray(data.duplicates)) {
        // Group duplicates by matched field so the message is field-aware
        // instead of a generic "Validation failed" toast.
        const grouped: Record<string, { value: string; leadName: string; code: string }[]> = {};
        for (const dup of data.duplicates) {
          const field = dup.match_field || 'unknown';
          if (!grouped[field]) grouped[field] = [];
          grouped[field].push({
            value: dup.match_value,
            leadName: dup.lead?.name || '',
            code: dup.lead?.code || '',
          });
        }
        const fieldLabels: Record<string, string> = {
          mobile: 'Mobile',
          alternate_number: 'Alternate Mobile',
          email: 'Email',
        };
        const orderedFields = ['mobile', 'alternate_number', 'email'].filter((f) => grouped[f]);
        const lines = orderedFields.map((f) => {
          const label = fieldLabels[f] || f;
          const samples = grouped[f]
            .slice(0, 2)
            .map((d) => (d.code ? `${d.value} (${d.code})` : d.value))
            .join(', ');
          const more = grouped[f].length > 2 ? ` +${grouped[f].length - 2} more` : '';
          return `${label}: ${samples}${more}`;
        });
        const msg =
          lines.length > 0
            ? `Duplicate ${lines.join(' • ')}`
            : data.non_field_errors?.[0] || 'Duplicate lead detected';

        setCrossCheckResult({
          has_duplicates: true,
          duplicates: data.duplicates,
          message: data.non_field_errors?.[0] || msg,
          matchedFields: orderedFields,
        });
        setCrossCheckOpen(true);
        toastWarning(msg, 8000);
        return;
      }
      toastError(typeof data === 'string' ? data : data?.detail || data?.message || `Failed to ${isEdit ? 'update' : 'create'} lead`);
    },
  });

  const handleChange = (field: keyof LeadFormData) => (event: any) => {
    let value = event.target?.value ?? event;
    // ponytail: strip non-digits + cap at 10 for phone fields
    if (field === 'mobile' || field === 'alternate_number') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMobileBlur = () => {
    if (formData.mobile && !isEdit) {
      crossCheckMutation.mutate({
        mobile: formData.mobile,
        alternate_number: formData.alternate_number,
        email: formData.email,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      assigned_employee: formData.assigned_employee_id || null,
      cross_lead_override: crossCheckResult?.has_duplicates ? true : false,
      cross_lead_override_reason: crossCheckResult?.has_duplicates ? overrideReason : '',
    };
    delete (submitData as any).assigned_employee_id;
    
    saveMutation.mutate(submitData);
  };

  const handleCrossCheckProceed = () => {
    setCrossCheckOpen(false);
    // Continue with save
    const submitData = {
      ...formData,
      assigned_employee: formData.assigned_employee_id || null,
      cross_lead_override: true,
      cross_lead_override_reason: overrideReason,
    };
    delete (submitData as any).assigned_employee_id;
    saveMutation.mutate(submitData);
  };

  const handleCrossCheckCancel = () => {
    setCrossCheckOpen(false);
    setCrossCheckResult(null);
    setOverrideReason('');
  };

  if (leadLoading) {
    return <Box p={3}>Loading...</Box>;
  }

  // View mode - show read-only dialog
  if (isViewMode && leadData) {
    return (
      <Dialog open fullWidth maxWidth="md" onClose={() => navigate('/lead/list')}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Lead Details
          <Chip 
            label={choices?.lead_statuses.find(s => s.value === leadData.status)?.label || leadData.status} 
            color={statusColors[leadData.status] || 'default'} 
          />
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Lead ID</Typography>
              <Typography variant="body1" gutterBottom>{leadData.code}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Name</Typography>
              <Typography variant="body1" gutterBottom>{leadData.name}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Mobile</Typography>
              <Typography variant="body1" gutterBottom>{leadData.mobile}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Alternate Number</Typography>
              <Typography variant="body1" gutterBottom>{leadData.alternate_number || '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Email</Typography>
              <Typography variant="body1" gutterBottom>{leadData.email || '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Lead Source</Typography>
              <Typography variant="body1" gutterBottom>{choices?.lead_sources.find(s => s.value === leadData.lead_source)?.label || leadData.lead_source}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Budget</Typography>
              <Typography variant="body1" gutterBottom>{leadData.budget || '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Preferred Area</Typography>
              <Typography variant="body1" gutterBottom>{leadData.preferred_area || '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Property Requirement</Typography>
              <Typography variant="body1" gutterBottom>{leadData.property_requirement || '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Assigned Employee</Typography>
              <Typography variant="body1" gutterBottom>{leadData.assigned_employee?.name || '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Created On</Typography>
              <Typography variant="body1" gutterBottom>{new Date(leadData.created_on).toLocaleString()}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Remarks</Typography>
              <Typography variant="body1" gutterBottom>{leadData.remarks || '-'}</Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/lead/list')}>Close</Button>
          <Button variant="contained" onClick={() => navigate(`/lead/edit/${id}`)}>Edit</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Box sx={getPageContainerStyles()}>
      <ScreenHeader
        title={isEditMode ? 'Edit Lead' : 'Add Lead'}
        
        showAddButton={false}
      />

      <Paper sx={getContentSectionStyles()}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Customer Information */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={handleChange('name')}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Mobile Number"
                value={formData.mobile}
                onChange={handleChange('mobile')}
                onBlur={handleMobileBlur}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Alternate Number"
                value={formData.alternate_number}
                onChange={handleChange('alternate_number')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
              />
            </Grid>

            {/* Requirement Details */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Requirement Details
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Budget"
                value={formData.budget}
                onChange={handleChange('budget')}
                placeholder="e.g., 50L - 80L"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Preferred Area"
                value={formData.preferred_area}
                onChange={handleChange('preferred_area')}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Property Requirement"
                value={formData.property_requirement}
                onChange={handleChange('property_requirement')}
                placeholder="e.g., 2BHK, 3BHK, Plot, Villa"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Lead Source</InputLabel>
                <Select
                  value={formData.lead_source}
                  label="Lead Source"
                  onChange={handleChange('lead_source')}
                  required
                >
                  {choices?.lead_sources.map((source) => (
                    <MenuItem key={source.value} value={source.value}>
                      {source.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Assigned Employee</InputLabel>
                <Select
                  value={formData.assigned_employee_id}
                  label="Assigned Employee"
                  onChange={handleChange('assigned_employee_id')}
                >
                  <MenuItem value="">-- Select --</MenuItem>
                  {users?.map((user: any) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.fullname || user.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={handleChange('status')}
                >
                  {choices?.lead_statuses.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      {s.label}
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
                label="Remarks"
                value={formData.remarks}
                onChange={handleChange('remarks')}
              />
            </Grid>

            {/* Actions */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<BackIcon />}
                  onClick={() => navigate('/lead/list')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={saveMutation.isPending}
                >
                  {isEdit ? 'Update Lead' : 'Save Lead'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Cross Check Warning */}
      {crossCheckResult?.has_duplicates && !crossCheckOpen && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="warning" sx={{ mb: 1 }}>
            Duplicate lead(s) detected — notification sent to your inbox
          </Alert>
          {crossCheckResult.duplicates.map((dup, i) => (
            <Box key={i} sx={{ mb: 1, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight={600}>{dup.lead.name} ({dup.lead.code})</Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Owner: {dup.lead.assigned_employee?.name || 'Unassigned'} | Status: {dup.lead.status} | Last Follow-up: {dup.lead.last_follow_up_date || 'N/A'}
              </Typography>
              <Chip label={dup.match_field} size="small" color="warning" variant="outlined" sx={{ mt: 0.5 }} />
            </Box>
          ))}
        </Box>
      )}

      {/* Cross Check Warning Dialog */}
      <Dialog open={crossCheckOpen} onClose={handleCrossCheckCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'warning.main' }}>Duplicate Lead Found!</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {crossCheckResult?.matchedFields?.length
              ? `Duplicate ${crossCheckResult.matchedFields
                  .map((f) =>
                    f === 'mobile'
                      ? 'Mobile'
                      : f === 'alternate_number'
                      ? 'Alternate Mobile'
                      : f === 'email'
                      ? 'Email'
                      : f
                  )
                  .join(' & ')} found. Review the matches below before proceeding.`
              : crossCheckResult?.message ||
                'Similar leads exist in the system. Please review before proceeding.'}
          </Alert>

          {crossCheckResult?.duplicates.map((dup, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2">
                <Chip label={dup.match_field} size="small" sx={{ mr: 1 }} />
                Match: {dup.match_value}
              </Typography>
              <Typography variant="body2">
                <strong>{dup.lead.name}</strong> (Code: {dup.lead.code})
              </Typography>
              <Typography variant="body2">
                Status: {dup.lead.status} | Assigned to: {dup.lead.assigned_employee?.name || 'Unassigned'}
              </Typography>
            </Box>
          ))}
          
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Reason for Override"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Explain why you're creating this lead despite the warning..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCrossCheckCancel}>Cancel</Button>
          <Button 
            onClick={handleCrossCheckProceed} 
            variant="contained" 
            color="warning"
            disabled={!overrideReason}
          >
            Proceed Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeadForm;

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Divider,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import BusinessIcon from '@mui/icons-material/Business';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { isSuperuser } from '../../utils/permissions';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import { generalSettingsApi } from '../../api/masters.api';

interface GeneralSettingsState {
  company_scoped_item_enforcement: boolean;
  allow_multiple_schemes: boolean;
  enable_email_notifications: boolean;
  enable_push_notifications: boolean;
  notify_manager_on_booking: boolean;
  notify_employee_on_lead_assignment: boolean;
  company_name: string;
  date_format: string;
  currency_symbol: string;
  pagination_size: number;
  session_timeout: number;
  force_password_reset_on_first_login: boolean;
  password_expiry_days: number;
  max_login_attempts: number;
}

const defaultSettings: GeneralSettingsState = {
  company_scoped_item_enforcement: false,
  allow_multiple_schemes: true,
  enable_email_notifications: true,
  enable_push_notifications: true,
  notify_manager_on_booking: true,
  notify_employee_on_lead_assignment: true,
  company_name: 'Royal Reality Groups',
  date_format: 'DD-MM-YYYY',
  currency_symbol: '₹',
  pagination_size: 20,
  session_timeout: 60,
  force_password_reset_on_first_login: true,
  password_expiry_days: 0,
  max_login_attempts: 5,
};

const GeneralSettings: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = isSuperuser(user);
  const [settings, setSettings] = useState<GeneralSettingsState>(defaultSettings);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  usePageTitle('General Settings');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'General Settings', icon: <TuneIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['generalSettings'],
    queryFn: generalSettingsApi.getGeneralSettings,
  });

  useEffect(() => {
    if (data) {
      setSettings({
        company_scoped_item_enforcement: data.company_scoped_item_enforcement ?? false,
        allow_multiple_schemes: data.allow_multiple_schemes ?? true,
        enable_email_notifications: data.enable_email_notifications ?? true,
        enable_push_notifications: data.enable_push_notifications ?? true,
        notify_manager_on_booking: data.notify_manager_on_booking ?? true,
        notify_employee_on_lead_assignment: data.notify_employee_on_lead_assignment ?? true,
        company_name: data.company_name || 'Royal Reality Groups',
        date_format: data.date_format || 'DD-MM-YYYY',
        currency_symbol: data.currency_symbol || '₹',
        pagination_size: data.pagination_size || 20,
        session_timeout: data.session_timeout || 60,
        force_password_reset_on_first_login: data.force_password_reset_on_first_login ?? true,
        password_expiry_days: data.password_expiry_days || 0,
        max_login_attempts: data.max_login_attempts || 5,
      });
      if (data.company_logo) {
        setLogoPreview(data.company_logo);
      }
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: generalSettingsApi.updateGeneralSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generalSettings'] });
      toastSuccess('Settings saved successfully');
    },
    onError: (error: any) => {
      toastError(error?.response?.data?.detail || 'Failed to save settings');
    },
  });

  const handleSave = () => {
    if (logoFile) {
      // Use FormData when uploading a file
      const formData = new FormData();
      Object.entries(settings).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      formData.append('company_logo', logoFile);
      mutation.mutate(formData as any);
    } else if (!logoPreview && !logoFile && data?.company_logo) {
      // Logo was removed — send flag to clear it
      mutation.mutate({ ...settings, company_logo: null } as any);
    } else {
      mutation.mutate(settings as any);
    }
  };

  const handleToggle = (field: keyof GeneralSettingsState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((prev) => ({ ...prev, [field]: e.target.checked }));
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load general settings.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, overflow: 'auto', height: '100%' }}>
      <Paper sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1, mb: 2 }}>
        <ScreenHeader
          title="General Settings"
          showBackButton
          onBack={() => navigate('/settings')}
          showAddButton={false}
          disableBox
        />
        {isAdmin && (
          <Button
            variant="contained"
            size="small"
            startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
            onClick={handleSave}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </Paper>

      {/* Notifications Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <NotificationsIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Notifications
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={<Switch checked={settings.enable_email_notifications} onChange={handleToggle('enable_email_notifications')} disabled={!isAdmin} />}
              label="Enable Email Notifications"
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
              Send email notifications for important events
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={<Switch checked={settings.enable_push_notifications} onChange={handleToggle('enable_push_notifications')} disabled={!isAdmin} />}
              label="Enable Push Notifications"
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
              Send push notifications via Firebase
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={<Switch checked={settings.notify_manager_on_booking} onChange={handleToggle('notify_manager_on_booking')} disabled={!isAdmin} />}
              label="Notify Manager on New Booking"
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
              Send notification to reporting manager when a booking is created
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={<Switch checked={settings.notify_employee_on_lead_assignment} onChange={handleToggle('notify_employee_on_lead_assignment')} disabled={!isAdmin} />}
              label="Notify Employee on Lead Assignment"
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
              Send notification when a lead is assigned to an employee
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* System Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <BusinessIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            System
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Company Logo</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {(logoPreview || logoFile) && (
                <Box
                  component="img"
                  src={logoFile ? URL.createObjectURL(logoFile) : logoPreview || ''}
                  alt="Logo"
                  sx={{ height: 50, maxWidth: 160, objectFit: 'contain', border: '1px solid #e0e0e0', borderRadius: 1, p: 0.5 }}
                />
              )}
              {isAdmin && (
                <Button variant="outlined" size="small" component="label">
                  {logoPreview || logoFile ? 'Change' : 'Upload'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLogoFile(file);
                        setLogoPreview(null);
                      }
                    }}
                  />
                </Button>
              )}
              {isAdmin && (logoPreview || logoFile) && (
                <Button variant="outlined" size="small" color="error" onClick={() => { setLogoFile(null); setLogoPreview(null); }}>
                  Remove
                </Button>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">Recommended: 200×60px, PNG/JPG</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Company Name"
              value={settings.company_name}
              onChange={(e) => setSettings((prev) => ({ ...prev, company_name: e.target.value }))}
              disabled={!isAdmin}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Format</InputLabel>
              <Select
                value={settings.date_format}
                label="Date Format"
                onChange={(e) => setSettings((prev) => ({ ...prev, date_format: e.target.value }))}
                disabled={!isAdmin}
              >
                <MenuItem value="DD-MM-YYYY">DD-MM-YYYY</MenuItem>
                <MenuItem value="MM-DD-YYYY">MM-DD-YYYY</MenuItem>
                <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Currency Symbol"
              value={settings.currency_symbol}
              onChange={(e) => setSettings((prev) => ({ ...prev, currency_symbol: e.target.value }))}
              disabled={!isAdmin}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Records Per Page"
              value={settings.pagination_size}
              onChange={(e) => setSettings((prev) => ({ ...prev, pagination_size: Number(e.target.value) || 20 }))}
              disabled={!isAdmin}
              inputProps={{ min: 5, max: 100 }}
              helperText="Default pagination size (5-100)"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Session Timeout (minutes)"
              value={settings.session_timeout}
              onChange={(e) => setSettings((prev) => ({ ...prev, session_timeout: Number(e.target.value) || 0 }))}
              disabled={!isAdmin}
              inputProps={{ min: 0 }}
              helperText="0 = no timeout"
            />
          </Grid>
        </Grid>
      </Paper>

    </Box>
  );
};

export default GeneralSettings;

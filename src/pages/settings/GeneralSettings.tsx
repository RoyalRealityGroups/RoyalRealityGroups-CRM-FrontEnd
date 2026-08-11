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
  Grid,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import EmailIcon from '@mui/icons-material/Email';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { isSuperuser } from '../../utils/permissions';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import apiClient from '../../api/axios.config';

interface EmailGateway {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  use_tls: boolean;
  from_email: string;
}

const defaultGateway: EmailGateway = {
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  smtp_password: '',
  use_tls: true,
  from_email: '',
};

const GeneralSettings: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = isSuperuser(user);
  const [settings, setSettings] = useState<EmailGateway>(defaultGateway);

  usePageTitle('Email Settings');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Email Settings', icon: <EmailIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['emailConfig'],
    queryFn: async () => {
      const response = await apiClient.get('/api/system/settings/preferences/EMAIL_CONFIG/');
      return response.data;
    },
  });

  useEffect(() => {
    if (data?.preferences) {
      const gateway = data.preferences.Default || data.preferences.default || {};
      setSettings({
        smtp_host: gateway.smtp_host || '',
        smtp_port: gateway.smtp_port || 587,
        smtp_user: gateway.smtp_user || '',
        smtp_password: gateway.smtp_password || '',
        use_tls: gateway.use_tls ?? true,
        from_email: gateway.from_email || '',
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (config: EmailGateway) => {
      const response = await apiClient.post('/api/system/settings/preferences/', {
        preferences_code: 'EMAIL_CONFIG',
        preferences: {
          Default: config,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailConfig'] });
      toastSuccess('Email settings saved successfully');
    },
    onError: () => {
      toastError('Failed to save email settings');
    },
  });

  const handleSave = () => {
    mutation.mutate(settings);
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
        <Alert severity="error">Failed to load email settings.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, overflow: 'auto', height: '100%' }}>
      <Paper sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1, mb: 2 }}>
        <ScreenHeader
          title="Email Settings"
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

      {/* Email Configuration Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <EmailIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Email Configuration
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="SMTP Host"
              placeholder="smtp.gmail.com"
              value={settings.smtp_host}
              onChange={(e) => setSettings((prev) => ({ ...prev, smtp_host: e.target.value }))}
              disabled={!isAdmin}
              helperText="SMTP server hostname"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="SMTP Port"
              placeholder="587"
              value={settings.smtp_port}
              onChange={(e) => setSettings((prev) => ({ ...prev, smtp_port: Number(e.target.value) || 587 }))}
              disabled={!isAdmin}
              helperText="Usually 587 (TLS) or 465 (SSL)"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="SMTP Username"
              placeholder="your-email@gmail.com"
              value={settings.smtp_user}
              onChange={(e) => setSettings((prev) => ({ ...prev, smtp_user: e.target.value }))}
              disabled={!isAdmin}
              helperText="Email address used to authenticate"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              type="password"
              label="SMTP Password"
              placeholder="••••••••"
              value={settings.smtp_password}
              onChange={(e) => setSettings((prev) => ({ ...prev, smtp_password: e.target.value }))}
              disabled={!isAdmin}
              helperText="App password or SMTP credentials"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="From Email"
              placeholder="noreply@company.com"
              value={settings.from_email}
              onChange={(e) => setSettings((prev) => ({ ...prev, from_email: e.target.value }))}
              disabled={!isAdmin}
              helperText="Sender email address shown to recipients"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.use_tls}
                  onChange={(e) => setSettings((prev) => ({ ...prev, use_tls: e.target.checked }))}
                  disabled={!isAdmin}
                />
              }
              label="Use TLS"
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
              Enable TLS encryption for secure email sending
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default GeneralSettings;

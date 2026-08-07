/**
 * Notification Settings — Firebase FCM Configuration
 *
 * Allows admin to:
 *   - Upload google-services.json / GoogleService-Info.plist to auto-fill
 *   - Manually enter Firebase config (project ID, sender ID, app IDs, VAPID key)
 *   - Paste service account JSON for server-side push sending
 *   - Toggle FCM enabled/disabled
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  Notifications as NotifIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generalSettingsApi } from '../../api/masters.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';

interface FcmConfig {
  fcm_enabled: boolean;
  fcm_service_account_json: string;
  fcm_project_id: string;
  fcm_sender_id: string;
  fcm_web_app_id: string;
  fcm_android_app_id: string;
  fcm_ios_app_id: string;
  fcm_api_key: string;
  fcm_auth_domain: string;
  fcm_storage_bucket: string;
  fcm_vapid_key: string;
  // Notification toggles
  enable_push_notifications: boolean;
  notify_manager_on_booking: boolean;
  notify_employee_on_lead_assignment: boolean;
}

const defaultConfig: FcmConfig = {
  fcm_enabled: false,
  fcm_service_account_json: '',
  fcm_project_id: '',
  fcm_sender_id: '',
  fcm_web_app_id: '',
  fcm_android_app_id: '',
  fcm_ios_app_id: '',
  fcm_api_key: '',
  fcm_auth_domain: '',
  fcm_storage_bucket: '',
  fcm_vapid_key: '',
  enable_push_notifications: true,
  notify_manager_on_booking: true,
  notify_employee_on_lead_assignment: true,
};

const NotificationSettings: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const { setBreadcrumbs } = useBreadcrumbs();
  usePageTitle('Notification Settings');

  const [config, setConfig] = useState<FcmConfig>(defaultConfig);
  const [androidFileName, setAndroidFileName] = useState<string>('');
  const [iosFileName, setIosFileName] = useState<string>('');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Notifications' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['generalSettings'],
    queryFn: generalSettingsApi.getGeneralSettings,
  });

  useEffect(() => {
    if (data) {
      setConfig({
        fcm_enabled: data.fcm_enabled ?? false,
        fcm_service_account_json: data.fcm_service_account_json ?? '',
        fcm_project_id: data.fcm_project_id ?? '',
        fcm_sender_id: data.fcm_sender_id ?? '',
        fcm_web_app_id: data.fcm_web_app_id ?? '',
        fcm_android_app_id: data.fcm_android_app_id ?? '',
        fcm_ios_app_id: data.fcm_ios_app_id ?? '',
        fcm_api_key: data.fcm_api_key ?? '',
        fcm_auth_domain: data.fcm_auth_domain ?? '',
        fcm_storage_bucket: data.fcm_storage_bucket ?? '',
        fcm_vapid_key: data.fcm_vapid_key ?? '',
        enable_push_notifications: data.enable_push_notifications ?? true,
        notify_manager_on_booking: data.notify_manager_on_booking ?? true,
        notify_employee_on_lead_assignment: data.notify_employee_on_lead_assignment ?? true,
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: generalSettingsApi.updateGeneralSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generalSettings'] });
      toastSuccess('Notification settings saved');
    },
    onError: () => toastError('Failed to save settings'),
  });

  const handleSave = () => {
    mutation.mutate(config);
  };

  // Parse google-services.json (Android)
  const handleAndroidUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAndroidFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const client = json.client?.[0];
        const projectInfo = json.project_info;

        setConfig((prev) => ({
          ...prev,
          fcm_project_id: projectInfo?.project_id || prev.fcm_project_id,
          fcm_sender_id: projectInfo?.project_number || prev.fcm_sender_id,
          fcm_storage_bucket: projectInfo?.storage_bucket || prev.fcm_storage_bucket,
          fcm_android_app_id: client?.client_info?.mobilesdk_app_id || prev.fcm_android_app_id,
          fcm_api_key: client?.api_key?.[0]?.current_key || prev.fcm_api_key,
        }));
        toastSuccess('Android config parsed — fields auto-filled');
      } catch {
        toastError('Invalid google-services.json file');
      }
    };
    reader.readAsText(file);
  };

  // Parse GoogleService-Info.plist (iOS) — basic XML parsing
  const handleIosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIosFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const getValue = (key: string) => {
          const regex = new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`);
          return regex.exec(text)?.[1] || '';
        };

        setConfig((prev) => ({
          ...prev,
          fcm_ios_app_id: getValue('GOOGLE_APP_ID') || prev.fcm_ios_app_id,
          fcm_project_id: getValue('PROJECT_ID') || prev.fcm_project_id,
          fcm_sender_id: getValue('GCM_SENDER_ID') || prev.fcm_sender_id,
          fcm_storage_bucket: getValue('STORAGE_BUCKET') || prev.fcm_storage_bucket,
          fcm_api_key: getValue('API_KEY') || prev.fcm_api_key,
        }));
        toastSuccess('iOS config parsed — fields auto-filled');
      } catch {
        toastError('Invalid GoogleService-Info.plist file');
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const isConfigured = !!(config.fcm_project_id && config.fcm_service_account_json);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <ScreenHeader title="Notification Settings" showBackButton onBack={() => navigate('/settings')} />

      {/* Status Banner */}
      <Alert
        severity={isConfigured && config.fcm_enabled ? 'success' : 'info'}
        icon={isConfigured && config.fcm_enabled ? <CheckIcon /> : <NotifIcon />}
        sx={{ mb: 3 }}
      >
        {isConfigured && config.fcm_enabled
          ? 'Push notifications are configured and enabled'
          : isConfigured
            ? 'Firebase is configured but push notifications are disabled'
            : 'Configure Firebase to enable push notifications'}
      </Alert>

      {/* Push Notification Toggles */}
      <Paper sx={{ p: 3, mb: 3, border: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Notification Preferences
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControlLabel
              control={<Switch checked={config.enable_push_notifications} onChange={(e) => setConfig((p) => ({ ...p, enable_push_notifications: e.target.checked }))} />}
              label={<Box><Typography variant="body2" fontWeight={500}>Push Notifications</Typography><Typography variant="caption" color="text.secondary">Enable/disable all push notifications</Typography></Box>}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControlLabel
              control={<Switch checked={config.notify_manager_on_booking} onChange={(e) => setConfig((p) => ({ ...p, notify_manager_on_booking: e.target.checked }))} />}
              label={<Box><Typography variant="body2" fontWeight={500}>Booking Alerts</Typography><Typography variant="caption" color="text.secondary">Notify manager when a new booking is created</Typography></Box>}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControlLabel
              control={<Switch checked={config.notify_employee_on_lead_assignment} onChange={(e) => setConfig((p) => ({ ...p, notify_employee_on_lead_assignment: e.target.checked }))} />}
              label={<Box><Typography variant="body2" fontWeight={500}>Lead Assignment Alerts</Typography><Typography variant="caption" color="text.secondary">Notify employee when a lead is assigned</Typography></Box>}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Firebase FCM Configuration */}
      <Paper sx={{ p: 3, mb: 3, border: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>Firebase FCM Configuration</Typography>
          <FormControlLabel
            control={<Switch checked={config.fcm_enabled} onChange={(e) => setConfig((p) => ({ ...p, fcm_enabled: e.target.checked }))} color="primary" />}
            label={<Chip label={config.fcm_enabled ? 'Enabled' : 'Disabled'} color={config.fcm_enabled ? 'success' : 'default'} size="small" />}
          />
        </Box>

        {/* Mobile App Config Files Upload */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
            📱 Mobile App Config Files
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Upload your Firebase config files to auto-fill the configuration below
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ textAlign: 'center', p: 2, border: '2px dashed #E5E7EB', borderRadius: 2, bgcolor: 'white' }}>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>Android (google-services.json)</Typography>
                <Button variant="outlined" component="label" startIcon={<UploadIcon />} size="small" color="success">
                  {androidFileName || 'Upload google-services.json'}
                  <input type="file" hidden accept=".json" onChange={handleAndroidUpload} />
                </Button>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                  From Firebase Console
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ textAlign: 'center', p: 2, border: '2px dashed #E5E7EB', borderRadius: 2, bgcolor: 'white' }}>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>iOS (GoogleService-Info.plist)</Typography>
                <Button variant="outlined" component="label" startIcon={<UploadIcon />} size="small" color="primary">
                  {iosFileName || 'Upload GoogleService-Info.plist'}
                  <input type="file" hidden accept=".plist" onChange={handleIosUpload} />
                </Button>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                  From Firebase Console
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ mt: 2, py: 0.5 }}>
            Download these files from <b>Firebase Console → Project Settings → Your apps</b>. The uploaded files are only parsed locally — their contents are extracted into the fields below.
          </Alert>
        </Paper>

        <Divider sx={{ my: 3 }} />

        {/* Firebase Configuration Fields */}
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Firebase Project Configuration
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Project ID" placeholder="my-project-12345"
              value={config.fcm_project_id} onChange={(e) => setConfig((p) => ({ ...p, fcm_project_id: e.target.value }))}
              helperText="Usually <project-id>.firebaseapp.com" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Sender ID (Cloud Messaging)" placeholder="123456789012"
              value={config.fcm_sender_id} onChange={(e) => setConfig((p) => ({ ...p, fcm_sender_id: e.target.value }))}
              helperText="Firebase Console → Project Settings → Cloud Messaging → Sender ID" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Web App ID" placeholder="1:123:web:abc123"
              value={config.fcm_web_app_id} onChange={(e) => setConfig((p) => ({ ...p, fcm_web_app_id: e.target.value }))}
              helperText="Firebase Console → Project Settings → Your apps → Web App ID" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Android App ID" placeholder="1:123:android:abc123"
              value={config.fcm_android_app_id} onChange={(e) => setConfig((p) => ({ ...p, fcm_android_app_id: e.target.value }))}
              helperText="Auto-filled from google-services.json (mobilesdk_app_id)" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="iOS App ID" placeholder="1:123:ios:abc123"
              value={config.fcm_ios_app_id} onChange={(e) => setConfig((p) => ({ ...p, fcm_ios_app_id: e.target.value }))}
              helperText="Auto-filled from GoogleService-Info.plist (GOOGLE_APP_ID)" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Storage Bucket" placeholder="project-id.firebasestorage.app"
              value={config.fcm_storage_bucket} onChange={(e) => setConfig((p) => ({ ...p, fcm_storage_bucket: e.target.value }))}
              helperText="Firebase Storage bucket URL (optional)" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="API Key" placeholder="AIzaSy..."
              value={config.fcm_api_key} onChange={(e) => setConfig((p) => ({ ...p, fcm_api_key: e.target.value }))}
              helperText="Firebase Web API Key" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Auth Domain" placeholder="project-id.firebaseapp.com"
              value={config.fcm_auth_domain} onChange={(e) => setConfig((p) => ({ ...p, fcm_auth_domain: e.target.value }))}
              helperText="Firebase Auth Domain" />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* VAPID Key */}
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Web Push (VAPID Key)
        </Typography>
        <TextField fullWidth size="small" label="VAPID Key" placeholder="BJFGYai7k8hBlgQk1A1..."
          value={config.fcm_vapid_key} onChange={(e) => setConfig((p) => ({ ...p, fcm_vapid_key: e.target.value }))}
          helperText="Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Key pair" />

        <Divider sx={{ my: 3 }} />

        {/* Service Account JSON */}
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          Service Account JSON (Server-side)
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Required for sending push notifications from the backend. Download from Firebase Console → Project Settings → Service Accounts → Generate new private key.
        </Typography>
        <TextField
          fullWidth size="small" multiline rows={6}
          placeholder='{"type": "service_account", "project_id": "...", ...}'
          value={config.fcm_service_account_json}
          onChange={(e) => setConfig((p) => ({ ...p, fcm_service_account_json: e.target.value }))}
          sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
        />
      </Paper>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate('/settings')}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};

export default NotificationSettings;

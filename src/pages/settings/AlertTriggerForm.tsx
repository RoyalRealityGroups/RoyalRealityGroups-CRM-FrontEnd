import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  TextField,
  InputAdornment,
  Chip,
  FormControlLabel,
  Switch,
  Autocomplete,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  NotificationsActive as TriggerIcon,
  Sms as SmsIcon,
  Email as EmailIcon,
  Notifications as PushIcon,
  FolderOpen as ModuleIcon,
  ChevronRight as ChevronRightIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertTriggerApi } from '../../api/alertTrigger.api';
import { groupsApi } from '../../api/groups.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';
import type {
  AlertTriggerPayload,
  ModuleInfo,
  ScreenInfo,
  ChoiceItem,
  TemplateMini,
  AlertConfigUser,
} from '../../types/alertTrigger.types';

const steps = ['Select Event', 'Channel & Priority', 'Recipients', 'Template & Options'];

const AlertTriggerForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'create';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  usePageTitle(isEdit ? 'Edit Alert Trigger' : 'Create Alert Trigger');

  const [activeStep, setActiveStep] = useState(0);

  // Form state
  const [selectedModule, setSelectedModule] = useState<ModuleInfo | null>(null);
  const [selectedScreen, setSelectedScreen] = useState<ScreenInfo | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ChoiceItem | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<number>(1);
  const [selectedNotificationType, setSelectedNotificationType] = useState<number>(1);
  const [senderType, setSenderType] = useState<number>(1);
  const [selectedGroups, setSelectedGroups] = useState<{ id: number; name: string }[]>([]);
  const [alertUsers, setAlertUsers] = useState<AlertConfigUser[]>([]);
  const [variableField, setVariableField] = useState('');
  const [valueField, setValueField] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMini | null>(null);
  const [selectedSubjectTemplate, setSelectedSubjectTemplate] = useState<TemplateMini | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [moduleSearch, setModuleSearch] = useState('');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Alert Triggers', path: '/settings/alert-triggers', icon: <TriggerIcon fontSize="small" /> },
      { label: isEdit ? 'Edit' : 'Create' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEdit]);

  // Fetch metadata
  const { data: metadata, isLoading: metaLoading } = useQuery({
    queryKey: ['alertTriggerMetadata'],
    queryFn: alertTriggerApi.getEventsMetadata,
  });

  // Fetch existing trigger for edit
  const { data: existingTrigger } = useQuery({
    queryKey: ['alertTrigger', id],
    queryFn: () => alertTriggerApi.get(Number(id)),
    enabled: isEdit,
  });

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => alertTriggerApi.getTemplates(),
  });

  // Fetch groups for recipient selection
  const { data: groupsData } = useQuery({
    queryKey: ['groups-list'],
    queryFn: () => groupsApi.list({ page_size: 100 }),
  });

  // Populate form when editing
  useEffect(() => {
    if (existingTrigger && metadata) {
      // Find module/screen
      const screen = existingTrigger.screen;
      if (screen) {
        const mod = metadata.modules.find((m) => m.app_label === screen.app_label);
        if (mod) {
          setSelectedModule(mod);
          const scr = mod.screens.find((s) => s.id === screen.id);
          if (scr) setSelectedScreen(scr);
        }
      }
      // Event
      if (existingTrigger.event_type) {
        const ev = metadata.events.find((e) => e.id === existingTrigger.event_type);
        if (ev) setSelectedEvent(ev);
      }
      // Channel
      setSelectedChannel(existingTrigger.type);
      setSelectedPriority(existingTrigger.message_priority || 1);
      setSelectedNotificationType(existingTrigger.notification_type || 1);
      // Recipients
      setSenderType(existingTrigger.sender_type || 1);
      setSelectedGroups(existingTrigger.send_to_groups || []);
      setAlertUsers(existingTrigger.alert_users || []);
      setVariableField(existingTrigger.variable || '');
      setValueField(existingTrigger.value || '');
      // Templates
      setSelectedTemplate(existingTrigger.template || null);
      setSelectedSubjectTemplate(existingTrigger.subject_template || null);
      // Options
      setIsScheduled(existingTrigger.is_scheduled);
      setIsActive(existingTrigger.is_active);
    }
  }, [existingTrigger, metadata]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (payload: AlertTriggerPayload) => alertTriggerApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertTriggers'] });
      toastSuccess('Alert trigger created successfully');
      navigate('/settings/alert-triggers');
    },
    onError: () => toastError('Failed to create trigger'),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (payload: Partial<AlertTriggerPayload>) =>
      alertTriggerApi.update(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertTriggers'] });
      toastSuccess('Alert trigger updated successfully');
      navigate('/settings/alert-triggers');
    },
    onError: () => toastError('Failed to update trigger'),
  });

  const handleSubmit = () => {
    if (!selectedScreen || !selectedEvent || !selectedChannel) {
      toastError('Please complete all required steps');
      return;
    }

    const payload: AlertTriggerPayload = {
      screen_id: selectedScreen.id,
      event_type: selectedEvent.id,
      type: selectedChannel,
      sender_type: senderType,
      message_priority: selectedPriority,
      notification_type: selectedNotificationType,
      is_scheduled: isScheduled,
      is_active: isActive,
      send_doc: false,
      is_attachment: false,
    };

    if (selectedTemplate) payload.template_id = selectedTemplate.id;
    if (selectedSubjectTemplate) payload.subject_template_id = selectedSubjectTemplate.id;

    // Recipients
    if (senderType === 2) {
      payload.send_to_group_ids = selectedGroups.map((g) => g.id);
    } else if (senderType === 3) {
      payload.alert_users = alertUsers;
    } else if (senderType === 4) {
      payload.variable = variableField;
    } else if (senderType === 5) {
      payload.value = valueField;
    }

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  // Filtered modules by search
  const filteredModules = useMemo(() => {
    if (!metadata?.modules) return [];
    if (!moduleSearch) return metadata.modules;
    const q = moduleSearch.toLowerCase();
    return metadata.modules.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.screens.some((s) => s.name.toLowerCase().includes(q))
    );
  }, [metadata?.modules, moduleSearch]);

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return !!selectedScreen && !!selectedEvent;
      case 1:
        return !!selectedChannel;
      case 2:
        if (senderType === 2) return selectedGroups.length > 0;
        if (senderType === 3) return alertUsers.length > 0;
        if (senderType === 4) return !!variableField;
        if (senderType === 5) return !!valueField;
        return true; // CreatedBy needs no extra config
      case 3:
        return true; // Template is optional
      default:
        return false;
    }
  };

  if (metaLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const renderStep0 = () => (
    <Box sx={{ display: 'flex', minHeight: 400, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      {/* Left panel — Modules */}
      <Box sx={{ width: 280, borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
        <Box sx={{ p: 1.5 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search modules..."
            value={moduleSearch}
            onChange={(e) => setModuleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <List dense disablePadding>
          {filteredModules.map((mod) => (
            <ListItemButton
              key={mod.app_label}
              selected={selectedModule?.app_label === mod.app_label}
              onClick={() => {
                setSelectedModule(mod);
                setSelectedScreen(null);
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ModuleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={mod.name}
                secondary={`${mod.screens.length} screen(s)`}
              />
              <Badge badgeContent={mod.screens.length} color="primary" sx={{ mr: 1 }} />
              <ChevronRightIcon fontSize="small" color="action" />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* Right panel — Screens + Events */}
      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        {!selectedModule ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
            }}
          >
            <TriggerIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
            <Typography variant="h6">Select a Module</Typography>
            <Typography variant="body2">
              Choose a module from the left panel to see its screens and events
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {selectedModule.name} — Select Screen
            </Typography>
            <Grid container spacing={1} sx={{ mb: 3 }}>
              {selectedModule.screens.map((scr) => (
                <Grid size={{ xs: 6, sm: 4 }} key={scr.id}>
                  <Paper
                    onClick={() => setSelectedScreen(scr)}
                    sx={{
                      p: 1.5,
                      cursor: 'pointer',
                      border: 2,
                      borderColor:
                        selectedScreen?.id === scr.id ? 'primary.main' : 'divider',
                      bgcolor:
                        selectedScreen?.id === scr.id ? 'primary.50' : 'background.paper',
                      '&:hover': { borderColor: 'primary.light' },
                      textAlign: 'center',
                    }}
                    elevation={0}
                  >
                    <Typography variant="body2" fontWeight={500}>
                      {scr.name}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {selectedScreen && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Select Event
                </Typography>
                <Grid container spacing={1}>
                  {metadata?.events.map((ev) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={ev.id}>
                      <Paper
                        onClick={() => setSelectedEvent(ev)}
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          border: 2,
                          borderColor:
                            selectedEvent?.id === ev.id ? 'primary.main' : 'divider',
                          bgcolor:
                            selectedEvent?.id === ev.id ? 'primary.50' : 'background.paper',
                          '&:hover': { borderColor: 'primary.light' },
                          textAlign: 'center',
                        }}
                        elevation={0}
                      >
                        <Typography variant="body2" fontWeight={500}>
                          {ev.name}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  );

  const renderStep1 = () => (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Notification Channel
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {metadata?.channels.map((ch) => {
          const iconMap: Record<number, React.ReactNode> = {
            1: <SmsIcon fontSize="large" />,
            2: <EmailIcon fontSize="large" />,
            3: <PushIcon fontSize="large" />,
          };
          return (
            <Grid size={{ xs: 12, sm: 4 }} key={ch.id}>
              <Paper
                onClick={() => setSelectedChannel(ch.id)}
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  border: 2,
                  borderColor: selectedChannel === ch.id ? 'primary.main' : 'divider',
                  bgcolor: selectedChannel === ch.id ? 'primary.50' : 'background.paper',
                  '&:hover': { borderColor: 'primary.light' },
                  textAlign: 'center',
                }}
                elevation={0}
              >
                <Box sx={{ mb: 1, color: selectedChannel === ch.id ? 'primary.main' : 'action.active' }}>
                  {iconMap[ch.id] || <PushIcon fontSize="large" />}
                </Box>
                <Typography variant="body1" fontWeight={500}>
                  {ch.name}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" gutterBottom>
            Message Priority
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {metadata?.priorities.map((p) => (
              <Chip
                key={p.id}
                label={p.name}
                onClick={() => setSelectedPriority(p.id)}
                color={selectedPriority === p.id ? 'primary' : 'default'}
                variant={selectedPriority === p.id ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" gutterBottom>
            Notification Type
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {metadata?.notification_types.map((nt) => (
              <Chip
                key={nt.id}
                label={nt.name}
                onClick={() => setSelectedNotificationType(nt.id)}
                color={selectedNotificationType === nt.id ? 'primary' : 'default'}
                variant={selectedNotificationType === nt.id ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );

  const renderStep2 = () => {
    const recipientTypes = metadata?.recipient_types || [];
    const groups = groupsData?.results || groupsData || [];

    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Who should receive this notification?
        </Typography>

        <Grid container spacing={1} sx={{ mb: 3 }}>
          {recipientTypes.map((rt) => (
            <Grid size={{ xs: 6, sm: 4, md: 'auto' }} key={rt.id}>
              <Chip
                label={rt.name}
                onClick={() => setSenderType(rt.id)}
                color={senderType === rt.id ? 'primary' : 'default'}
                variant={senderType === rt.id ? 'filled' : 'outlined'}
                sx={{ width: '100%' }}
              />
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Conditional fields based on sender_type */}
        {senderType === 1 && (
          <Alert severity="info">
            Notification will be sent to the user who created the record.
          </Alert>
        )}

        {senderType === 2 && (
          <Autocomplete
            multiple
            options={Array.isArray(groups) ? groups : []}
            getOptionLabel={(option: any) => option.name}
            value={selectedGroups}
            onChange={(_, value) => setSelectedGroups(value)}
            renderInput={(params) => (
              <TextField {...params} label="Select Groups" size="small" />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        )}

        {senderType === 3 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Add users who should receive this notification.
            </Typography>
            {alertUsers.map((u, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  label="User Type"
                  value={u.user_type}
                  onChange={(e) => {
                    const updated = [...alertUsers];
                    updated[idx] = { ...updated[idx], user_type: e.target.value };
                    setAlertUsers(updated);
                  }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="User ID"
                  value={u.user_identifier}
                  onChange={(e) => {
                    const updated = [...alertUsers];
                    updated[idx] = { ...updated[idx], user_identifier: e.target.value };
                    setAlertUsers(updated);
                  }}
                  sx={{ flex: 1 }}
                />
                <Button
                  size="small"
                  color="error"
                  onClick={() => setAlertUsers(alertUsers.filter((_, i) => i !== idx))}
                >
                  Remove
                </Button>
              </Box>
            ))}
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                setAlertUsers([...alertUsers, { user_type: 'User', user_identifier: '' }])
              }
            >
              + Add User
            </Button>
          </Box>
        )}

        {senderType === 4 && (
          <TextField
            fullWidth
            size="small"
            label="Model Variable (e.g. assigned_employee)"
            value={variableField}
            onChange={(e) => setVariableField(e.target.value)}
            helperText="The field name on the model instance that holds the recipient user"
          />
        )}

        {senderType === 5 && (
          <TextField
            fullWidth
            size="small"
            label="Value (email or phone)"
            value={valueField}
            onChange={(e) => setValueField(e.target.value)}
            helperText="A fixed email or phone number to send to"
          />
        )}
      </Box>
    );
  };

  const renderStep3 = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" gutterBottom>
            Subject Template
          </Typography>
          <Autocomplete
            options={templates || []}
            getOptionLabel={(option) => option.name}
            value={selectedSubjectTemplate}
            onChange={(_, value) => setSelectedSubjectTemplate(value)}
            renderInput={(params) => (
              <TextField {...params} size="small" placeholder="Select subject template" />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" gutterBottom>
            Body Template
          </Typography>
          <Autocomplete
            options={templates || []}
            getOptionLabel={(option) => option.name}
            value={selectedTemplate}
            onChange={(_, value) => setSelectedTemplate(value)}
            renderInput={(params) => (
              <TextField {...params} size="small" placeholder="Select body template" />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </Grid>

        {selectedTemplate && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedTemplate.message}
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Options
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControlLabel
            control={
              <Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            }
            label="Enabled"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
              />
            }
            label="Scheduled Alert"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <ScreenHeader
        title={isEdit ? 'Edit Alert Trigger' : 'Create Alert Trigger'}
        showBackButton
        onBack={() => navigate('/settings/alert-triggers')}
      />

      {/* Summary chips */}
      {(selectedScreen || selectedEvent || selectedChannel) && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {selectedModule && (
            <Chip label={`Module: ${selectedModule.name}`} size="small" variant="outlined" />
          )}
          {selectedScreen && (
            <Chip label={`Screen: ${selectedScreen.name}`} size="small" variant="outlined" />
          )}
          {selectedEvent && (
            <Chip label={`Event: ${selectedEvent.name}`} size="small" color="primary" />
          )}
          {selectedChannel && (
            <Chip
              label={`Channel: ${metadata?.channels.find((c) => c.id === selectedChannel)?.name}`}
              size="small"
              color="success"
            />
          )}
        </Box>
      )}

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 3 }} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Content */}
      <Paper sx={{ p: 3, mb: 3 }}>{renderStepContent()}</Paper>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => setActiveStep((prev) => prev - 1)}
          disabled={activeStep === 0}
        >
          Back
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => navigate('/settings/alert-triggers')}>
            Cancel
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => setActiveStep((prev) => prev + 1)}
              disabled={!canProceed()}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSaving || !canProceed()}
            >
              {isSaving ? (
                <CircularProgress size={20} color="inherit" />
              ) : isEdit ? (
                'Update Trigger'
              ) : (
                'Create Trigger'
              )}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AlertTriggerForm;

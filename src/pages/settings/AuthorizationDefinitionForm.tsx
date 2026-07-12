import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  CircularProgress,
  Divider,
  FormControlLabel,
  Switch,
  MenuItem,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { toDateString } from '../../utils/format';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import { authorizationApi } from '../../api/authorization.api';
import { API_ENDPOINTS } from '../../utils/constants';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { DropdownOption } from '../../types/common.types';
import type { Authorization } from '../../types/authorization.types';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../../utils/spacing';

interface FormData {
  authorization_name: string;
  effective_from: string;
  company_ids: string[];
  has_all_companies: boolean;
  location_ids: string[];
  has_all_locations: boolean;
  status: boolean;
  auto_approve_creator_level: boolean;
  screen_id: string;
  level: number;
  send_email: boolean;
  send_sms: boolean;
  send_notification: boolean;
}

const AuthorizationDefinitionForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const isEditMode = Boolean(id && id !== 'new');

  usePageTitle(isEditMode ? 'Edit Authorization Definition' : 'Add Authorization Definition');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      authorization_name: '',
      effective_from: '',
      company_ids: [],
      has_all_companies: false,
      location_ids: [],
      has_all_locations: false,
      status: true,
      auto_approve_creator_level: false,
      screen_id: '',
      level: undefined,
      send_email: false,
      send_sms: false,
      send_notification: false,
    },
  });

  const [selectedCompanies, setSelectedCompanies] = useState<DropdownOption[]>([]);
  const [hasAllCompanies, setHasAllCompanies] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<DropdownOption[]>([]);
  const [hasAllLocations, setHasAllLocations] = useState(false);
  const [screenHasLocationFilter, setScreenHasLocationFilter] = useState(true);
  const [selectedScreen, setSelectedScreen] = useState<DropdownOption | null>(null);
  const [levelAuthorizations, setLevelAuthorizations] = useState<Authorization[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<{ [key: number]: DropdownOption | null }>({});
  const [selectedGroups, setSelectedGroups] = useState<{ [key: number]: DropdownOption | null }>({});

  const watchLevel = watch('level');

  const getScreenModel = (screenOption: any): string => {
    if (!screenOption) return '';
    return String(
      screenOption?.contenttype?.model ||
      screenOption?.model ||
      ''
    ).toLowerCase();
  };

  const getScreenHasLocationFilter = (screenOption: any): boolean => {
    if (!screenOption) return true;
    if (typeof screenOption.has_location_filter === 'boolean') {
      return screenOption.has_location_filter;
    }
    if (typeof screenOption.contenttype?.has_location_filter === 'boolean') {
      return screenOption.contenttype.has_location_filter;
    }
    return true;
  };

  const isDispatchPlanScreen = getScreenModel(selectedScreen) === 'dispatchplan';

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Authorizations', path: '/settings/authorizations', icon: <CheckCircleIcon fontSize="small" /> },
      { label: isEditMode ? 'Edit' : 'Add' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode]);

  const { data: authDefData, isLoading: loadingAuthDef } = useQuery({
    queryKey: ['authorizationDefinition', id],
    queryFn: () => authorizationApi.getDefinition(id!),
    enabled: isEditMode && id !== 'new',
  });

  useEffect(() => {
    if (authDefData && isEditMode) {
      reset({
        authorization_name: authDefData.authorization_name || '',
        effective_from: authDefData.effective_from || '',
        company_ids: authDefData.companies?.map((c: any) => c.id) || [],
        has_all_companies: authDefData.has_all_companies || false,
        location_ids: authDefData.locations?.map((l: any) => l.id) || [],
        has_all_locations: authDefData.has_all_locations || false,
        status: authDefData.status ?? true,
        auto_approve_creator_level: authDefData.auto_approve_creator_level ?? false,
        screen_id: typeof authDefData.screen === 'number' ? String(authDefData.screen) : (authDefData.screen as any)?.id?.toString() || '',
        level: authDefData.level,
        send_email: authDefData.send_email,
        send_sms: authDefData.send_sms,
        send_notification: authDefData.send_notification,
      });
      
      if (authDefData.companies) {
        setSelectedCompanies(authDefData.companies);
      }
      setHasAllCompanies(authDefData.has_all_companies || false);
      
      if (authDefData.locations) {
        setSelectedLocations(authDefData.locations);
      }
      setHasAllLocations(authDefData.has_all_locations || false);
      
      if (authDefData.screen && typeof authDefData.screen === 'object') {
        const screenData = authDefData.screen as any;
        const screenName = screenData.content_type_detail?.name || screenData.model || '';
        const formatName = (name: string) => {
          const replacements: Record<string, string> = {
            'Salesorder': 'Sales Order',
            'Dispatchplan': 'Dispatch Plan',
            'Proofofdelivery': 'Proof Of Delivery',
          };
          return replacements[name] || name;
        };
        const hasLocation = typeof screenData.has_location_filter === 'boolean' ? screenData.has_location_filter : true;
        setSelectedScreen({ 
          id: screenData.id?.toString() || '', 
          name: formatName(screenName),
          has_location_filter: hasLocation,
          contenttype: {
            id: screenData.id || 0,
            app_label: screenData.app_label || '',
            model: screenData.model || '',
            has_location_filter: hasLocation,
          }
        } as any);
        setScreenHasLocationFilter(hasLocation);
      }
      
      if (authDefData.level_authorizations) {
        setLevelAuthorizations(authDefData.level_authorizations);
        const users: { [key: number]: DropdownOption | null } = {};
        const groups: { [key: number]: DropdownOption | null } = {};
        
        authDefData.level_authorizations.forEach((auth, index) => {
          if (auth.type === 1 && auth.user) {
            const fullName = (auth.user.fullname || `${auth.user.first_name || ''} ${auth.user.last_name || ''}`).trim();
            users[index] = {
              id: auth.user.id,
              name: fullName || auth.user.username || '',
            };
          } else if (auth.type === 2 && (auth.group || auth.group_id)) {
            groups[index] = {
              id: auth.group?.id?.toString() || auth.group_id?.toString() || '',
              name: auth.group?.name || auth.group_name || '',
            };
          }
        });
        
        setSelectedUsers(users);
        setSelectedGroups(groups);
      }
    }
  }, [authDefData, isEditMode, reset]);

  useEffect(() => {
    if (!screenHasLocationFilter) {
      setHasAllLocations(true);
      setSelectedLocations([]);
      setValue('location_ids', []);
      setValue('has_all_locations', true);
    }
  }, [screenHasLocationFilter, setValue]);

  useEffect(() => {
    if (isDispatchPlanScreen) {
      setHasAllCompanies(true);
      setSelectedCompanies([]);
      setValue('company_ids', []);
      setValue('has_all_companies', true);
    }
  }, [isDispatchPlanScreen, setValue]);

  useEffect(() => {
    const currentLevel = watchLevel || 1;
    const currentLevels = levelAuthorizations.length;
    
    if (currentLevel > currentLevels) {
      const newLevels = [...levelAuthorizations];
      for (let i = currentLevels + 1; i <= currentLevel; i++) {
        newLevels.push({
          level: i,
          type: 1,
          user_identifier: '',
          user_type: 'User',
          send_email: false,
          send_sms: false,
          send_notification: false,
        });
      }
      setLevelAuthorizations(newLevels);
    }
  }, [watchLevel]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => isEditMode ? authorizationApi.updateDefinition(id!, data) : authorizationApi.createDefinition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorizationDefinitions'] });
      if (isEditMode && id) {
        queryClient.invalidateQueries({ queryKey: ['authorizationDefinition', id] });
      }
      toastSuccess(isEditMode ? 'Authorization definition updated successfully' : 'Authorization definition created successfully');
      navigate('/settings/authorizations');
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to save authorization definition';
      if (error.response?.data) {
        const data = error.response.data;
        if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        } else if (data.detail) {
          errorMessage = data.detail;
        }
      }
      toastError(errorMessage);
    },
  });

  const onSubmit = async (data: FormData) => {
    const levelAuths = levelAuthorizations.slice(0, data.level);
    for (let i = 0; i < levelAuths.length; i++) {
      const auth = levelAuths[i];
      if (auth.type === 1) {
        if (!auth.user_identifier && !auth.user?.id && !selectedUsers[i]?.id) {
          toastError(`Select a user for Level ${auth.level}`);
          return;
        }
      } else if (auth.type === 2) {
        if (!auth.group_id && !auth.group?.id && !selectedGroups[i]?.id) {
          toastError(`Select a group for Level ${auth.level}`);
          return;
        }
      }
    }

    const effectiveHasAllLocations = !screenHasLocationFilter || hasAllLocations;
    const effectiveHasAllCompanies = isDispatchPlanScreen || hasAllCompanies;
    const payload: any = {
      authorization_name: data.authorization_name,
      effective_from: data.effective_from,
      company_ids: effectiveHasAllCompanies ? [] : data.company_ids,
      has_all_companies: effectiveHasAllCompanies,
      location_ids: effectiveHasAllLocations ? [] : data.location_ids,
      has_all_locations: effectiveHasAllLocations,
      status: data.status,
      auto_approve_creator_level: data.auto_approve_creator_level,
      screen_id: typeof data.screen_id === 'string' ? parseInt(data.screen_id) : data.screen_id,
      level: data.level,
      send_email: data.send_email,
      send_sms: data.send_sms,
      send_notification: data.send_notification,
      level_authorizations: levelAuths.map((auth, index) => ({
        level: auth.level,
        type: auth.type,
        user_identifier: auth.user_identifier || auth.user?.id || (selectedUsers[index]?.id ? String(selectedUsers[index]!.id) : ''),
        user_type: auth.user_type,
        group_id: auth.group_id || auth.group?.id || (selectedGroups[index]?.id ? parseInt(String(selectedGroups[index]!.id)) : undefined),
        send_email: auth.send_email || false,
        send_sms: auth.send_sms || false,
        send_notification: auth.send_notification || false,
      })),
    };

    await saveMutation.mutateAsync(payload);
  };

  const isSubmitting = saveMutation.isPending;

  if (isEditMode && loadingAuthDef) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <ScreenHeader
            title={isEditMode ? 'Edit Authorization Definition' : 'Add Authorization Definition'}
            showBackButton
            onBack={() => navigate('/settings/authorizations')}
            disableBox
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button variant="outlined" color="secondary" size="small" onClick={() => navigate('/settings/authorizations')} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="auth-def-form"
              variant="contained"
              color="primary"
              size="small"
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ p: 3, borderRadius: 0, maxWidth: '100%' }}>
          <form id="auth-def-form" onSubmit={handleSubmit(onSubmit)}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Basic Information
            </Typography>
            <Grid container spacing={3} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Authorization Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="authorization_name"
                  control={control}
                  rules={{ required: 'Authorization name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., Sales Order Authorization"
                      fullWidth
                      size="small"
                      error={!!errors.authorization_name}
                      helperText={errors.authorization_name?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Effective Date <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="effective_from"
                  control={control}
                  rules={{ required: 'Effective from date is required' }}
                  render={({ field }) => (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(date) => field.onChange(toDateString(date) || '')}
                        format="DD-MM-YYYY"
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            error: !!errors.effective_from,
                            helperText: errors.effective_from?.message,
                          },
                        }}
                        disabled={isSubmitting}
                      />
                    </LocalizationProvider>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Status
                </Typography>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={field.value ? 'active' : 'inactive'}
                      onChange={(e) => field.onChange(e.target.value === 'active')}
                      SelectProps={{ native: true }}
                      InputProps={{ sx: { height: 42 } }}
                      disabled={isSubmitting}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </TextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Auto-Approve Creator Level
                </Typography>
                <Controller
                  name="auto_approve_creator_level"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          disabled={isSubmitting}
                          size="small"
                        />
                      }
                      label={field.value ? 'Enabled' : 'Disabled'}
                    />
                  )}
                />
                <Typography variant="caption" color="text.secondary">
                  If the creator is an approver, levels up to their level are auto-approved.
                </Typography>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Companies <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                  </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                        checked={isDispatchPlanScreen || hasAllCompanies}
                        onChange={(e) => {
                          if (isDispatchPlanScreen) return;
                          setHasAllCompanies(e.target.checked);
                          if (e.target.checked) {
                            setSelectedCompanies([]);
                            setValue('company_ids', []);
                          }
                        }}
                        disabled={isSubmitting || isDispatchPlanScreen}
                        size="small"
                      />
                    }
                    label={isDispatchPlanScreen ? 'All Companies (Fixed for Dispatch Plan)' : 'All Companies'}
                  />
                </Box>
                <Controller
                  name="company_ids"
                  control={control}
                  rules={{ validate: (value) => isDispatchPlanScreen || hasAllCompanies || value.length > 0 || 'At least one company is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.COMPANIES_DROPDOWN}
                      value={selectedCompanies}
                      onChange={(selectedOptions: DropdownOption | DropdownOption[] | null) => {
                        const options = Array.isArray(selectedOptions) ? selectedOptions : [];
                        setSelectedCompanies(options);
                        onChange(options.map(o => o.id));
                      }}
                      error={!!errors.company_ids}
                      helperText={errors.company_ids?.message}
                      disabled={isSubmitting || isDispatchPlanScreen || hasAllCompanies}
                      placeholder={isDispatchPlanScreen ? "All companies fixed for Dispatch Plan" : (hasAllCompanies ? "All companies selected" : "Select companies")}
                      multiple
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Locations <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!screenHasLocationFilter || hasAllLocations}
                        onChange={(e) => {
                          if (!screenHasLocationFilter) return;
                          setHasAllLocations(e.target.checked);
                          if (e.target.checked) {
                            setSelectedLocations([]);
                            setValue('location_ids', []);
                          }
                        }}
                        disabled={isSubmitting || !screenHasLocationFilter || (!(isDispatchPlanScreen || hasAllCompanies) && selectedCompanies.length === 0)}
                        size="small"
                      />
                    }
                    label={!screenHasLocationFilter ? "All Locations (Fixed for this screen)" : "All Locations"}
                  />
                </Box>
                <Controller
                  name="location_ids"
                  control={control}
                  rules={{ validate: (value) => !screenHasLocationFilter || hasAllLocations || value.length > 0 || 'At least one location is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint="/api/usermanagement/dropdowns/locations/"
                      additionalFilters={!(isDispatchPlanScreen || hasAllCompanies) && selectedCompanies.length > 0 ? { company_ids: selectedCompanies.map(c => c.id).join(',') } : {}}
                      value={selectedLocations}
                      onChange={(selectedOptions: DropdownOption | DropdownOption[] | null) => {
                        const options = Array.isArray(selectedOptions) ? selectedOptions : [];
                        setSelectedLocations(options);
                        onChange(options.map(o => o.id));
                      }}
                      error={!!errors.location_ids}
                      helperText={errors.location_ids?.message || (!(isDispatchPlanScreen || hasAllCompanies) && selectedCompanies.length === 0 ? 'Please select companies first' : '')}
                      disabled={isSubmitting || !screenHasLocationFilter || hasAllLocations || (!(isDispatchPlanScreen || hasAllCompanies) && selectedCompanies.length === 0)}
                      placeholder={
                        !screenHasLocationFilter
                          ? "All locations fixed for selected screen"
                          : hasAllLocations 
                          ? "All locations selected" 
                          : (!(isDispatchPlanScreen || hasAllCompanies) && selectedCompanies.length === 0)
                            ? "Select companies first"
                            : "Select locations"
                      }
                      multiple
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Screen <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="screen_id"
                  control={control}
                  rules={{ required: 'Screen is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint="/api/users/authorization_contenttypes/"
                      value={selectedScreen}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedScreen(selectedOption);
                        setScreenHasLocationFilter(getScreenHasLocationFilter(selectedOption));
                        const contenttypeId = (selectedOption as any)?.contenttype?.id;
                        onChange(contenttypeId || '');
                      }}
                      error={!!errors.screen_id}
                      helperText={errors.screen_id?.message}
                      disabled={isSubmitting}
                      placeholder="Select a screen"
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Final Authorization Level <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="level"
                  control={control}
                  rules={{ required: 'Level is required', min: { value: 1, message: 'Level must be at least 1' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      size="small"
                      error={!!errors.level}
                      helperText={errors.level?.message}
                      disabled={isSubmitting}
                      placeholder="Enter level"
                      inputProps={{ min: 1, style: { MozAppearance: 'textfield' } }}
                      sx={{
                        '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                          display: 'none',
                        },
                        '& input[type=number]': {
                          MozAppearance: 'textfield',
                        },
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Level Approvers
            </Typography>
            {levelAuthorizations.slice(0, watchLevel).map((auth, index) => (
              <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Level {auth.level} Approver
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      Type <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={auth.type}
                      onChange={(e) => {
                        const newAuths = [...levelAuthorizations];
                        newAuths[index].type = parseInt(e.target.value) as 1 | 2;
                        newAuths[index].user_identifier = '';
                        newAuths[index].group_id = undefined;
                        setLevelAuthorizations(newAuths);
                      }}
                      disabled={isSubmitting}
                    >
                      <MenuItem value={1}>User</MenuItem>
                      <MenuItem value={2}>Group</MenuItem>
                    </TextField>
                  </Grid>

                  {auth.type === 1 ? (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                        Select User <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                      </Typography>
                      {(() => {
                        const userCompanyId = selectedCompanies[0]?.id;
                        const userLocationId = selectedLocations[0]?.id;
                        const allowAllUsers = hasAllCompanies && hasAllLocations;
                        const canLoadUsers = allowAllUsers || Boolean(userCompanyId || userLocationId);
                        const helperText = !canLoadUsers
                          ? 'Select at least one company or location, or choose All Companies + All Locations'
                          : undefined;
                        const additionalFilters: Record<string, string> = {};
                        if (allowAllUsers) {
                          additionalFilters.all = '1';
                        } else {
                          if (userCompanyId) {
                            additionalFilters.company = String(userCompanyId);
                          }
                          if (userLocationId) {
                            additionalFilters.location = String(userLocationId);
                          }
                        }
                        return (
                      <SearchableDropdown
                        label=""
                        apiEndpoint="/api/users/users-by-company-location/"
                        additionalFilters={canLoadUsers ? additionalFilters : {}}
                        labelKey="username"
                        value={selectedUsers[index] || null}
                        onChange={(selectedOption: DropdownOption | null) => {
                          setSelectedUsers({ ...selectedUsers, [index]: selectedOption });
                          const newAuths = [...levelAuthorizations];
                          newAuths[index].user_identifier = selectedOption?.id ? String(selectedOption.id) : '';
                          setLevelAuthorizations(newAuths);
                        }}
                        error={false}
                        disabled={isSubmitting || !canLoadUsers}
                        helperText={helperText}
                        placeholder="Select a user"
                      />
                        );
                      })()}
                    </Grid>
                  ) : (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                        Select Group <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                      </Typography>
                      <SearchableDropdown
                        label=""
                        apiEndpoint="/api/users/groups/"
                        value={selectedGroups[index] || null}
                        onChange={(selectedOption: DropdownOption | null) => {
                          setSelectedGroups({ ...selectedGroups, [index]: selectedOption });
                          const newAuths = [...levelAuthorizations];
                          newAuths[index].group_id = selectedOption?.id ? parseInt(String(selectedOption.id)) : undefined;
                          setLevelAuthorizations(newAuths);
                        }}
                        error={false}
                        disabled={isSubmitting}
                        placeholder="Select a group"
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
            ))}
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default AuthorizationDefinitionForm;

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Grid,
  CircularProgress,
  Typography,
  FormControl,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import ScreenPermissionPicker from '../../components/settings/ScreenPermissionPicker';
import {
  Save as SaveIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Visibility,
  VisibilityOff,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelRuleIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { useAppDispatch } from '../../store/hooks';
import { setUser } from '../../store/slices/authSlice';
import { authApi } from '../../api/auth.api';
import { usersApi, type UserFormData, type ScreenPermissionInput, type ScreenItem } from '../../api/users.api';
import { menuApi } from '../../api/menu.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';
import { getPageContainerStyles, getHeaderSectionStyles, getContentSectionStyles } from '../../utils/spacing';
import {
  CONTACT_EMAIL_REGEX,
  CONTACT_PHONE_MAX_LENGTH,
  CONTACT_PHONE_MIN_LENGTH,
  CONTACT_PHONE_REGEX,
  PHONE_FIELD_HELPER_TEXT,
  sanitizePhoneInput,
} from '../../utils/validation';
import { PASSWORD_RULES, isPasswordValid } from '../../utils/passwordValidation';

// ─── Constants ────────────────────────────────────────────────────────────────

const GENDER_CHOICES = [
  { value: 1, label: 'Male' },
  { value: 2, label: 'Female' },
  { value: 3, label: 'Others' },
];

const DEVICE_ACCESS_CHOICES = [
  { value: 1, label: 'Only Mobile' },
  { value: 2, label: 'Only Web' },
  { value: 3, label: 'Both' },
  { value: 4, label: 'None' },
];

const USER_STATUS_CHOICES = [
  { value: 'ACTIVE',    label: 'Active' },
  { value: 'INACTIVE',  label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

// ─── Main Form ────────────────────────────────────────────────────────────────

const UserForm: React.FC = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const dispatch = useAppDispatch();
  const isProfileMode = !paramId || searchParams.get('profile') === 'true';
  const id = paramId || currentUser?.id || 'new';
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle(isProfileMode ? 'Edit Profile' : id === 'new' ? 'Create User' : 'Edit User');
  const isEditMode = id !== 'new';

  const [showPassword, setShowPassword] = useState(false);
  const [selectedReportingManager, setSelectedReportingManager] = useState<any>(null);
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

  // Permission state: keyed by screen_code
  const [permissionsMap, setPermissionsMap] = useState<Record<string, ScreenPermissionInput>>({});

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<UserFormData>({
    defaultValues: {
      username: '', email: '', phone: '',
      first_name: '', last_name: '',
      password: '', gender: '', device_access: 3,
      is_active: true, user_status: 'ACTIVE',
      must_reset_password: true,
      designation: '', joining_date: '', reporting_manager: null,
      lead_data_scope: 'OWN', followup_data_scope: 'OWN',
      sitevisit_data_scope: 'OWN', booking_data_scope: 'OWN',
    },
  });

  const isActive = watch('is_active');

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
        { label: isEditMode ? 'Edit User' : 'Add User' },
      ]);
    }
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode, isProfileMode]);

  // Fetch all menu items for permission picker (from sidebar menus API)
  const { data: menuData } = useQuery({
    queryKey: ['allMenuItems'],
    queryFn: async () => {
      // Use user_menu which returns the full menu tree with submenus and menuitems
      const userMenu = await menuApi.getUserMenu();
      // Extract all menuitems from the nested structure
      const allItems: Array<{ id: number; code: string; name: string; sequence: number }> = [];
      
      userMenu.menus.forEach((menu) => {
        // Get menuitems directly under menu
        if (menu.menuitems) {
          menu.menuitems.forEach((item) => {
            if (item.code && item.name) {
              allItems.push({ id: item.id, code: item.code, name: item.name, sequence: item.sequence });
            }
          });
        }
        // Get menuitems from submenus
        const submenus = menu.submenus || menu.submenu || [];
        submenus.forEach((submenu) => {
          if (submenu.menuitems) {
            submenu.menuitems.forEach((item) => {
              if (item.code && item.name) {
                allItems.push({ id: item.id, code: item.code, name: item.name, sequence: item.sequence });
              }
            });
          }
          // Handle nested submenus if any
          if (submenu.submenus) {
            submenu.submenus.forEach((nestedSubmenu) => {
              if (nestedSubmenu.menuitems) {
                nestedSubmenu.menuitems.forEach((item) => {
                  if (item.code && item.name) {
                    allItems.push({ id: item.id, code: item.code, name: item.name, sequence: item.sequence });
                  }
                });
              }
            });
          }
        });
      });
      
      return allItems;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Convert menu items to screen format for ScreenPermissionPicker
  const availableScreens: ScreenItem[] = useMemo(() => {
    if (!menuData || !Array.isArray(menuData)) return [];
    // Remove duplicates by code and sort by sequence
    const uniqueByCode = new Map<string, ScreenItem>();
    menuData.forEach((item, idx) => {
      if (!uniqueByCode.has(item.code)) {
        uniqueByCode.set(item.code, {
          id: item.id,
          code: item.code,
          name: item.name,
          order: item.sequence ?? idx,
        });
      }
    });
    return Array.from(uniqueByCode.values()).sort((a, b) => a.order - b.order);
  }, [menuData]);

  // Fetch user data in edit mode
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.get(id!),
    enabled: isEditMode,
  });

  // Populate form when data loads
  useEffect(() => {
    if (!userData) return;
    if (userData.profilepicture) setProfilePicturePreview(userData.profilepicture);

    reset({
      username: userData.username || '',
      email: userData.email || '',
      phone: userData.phone || '',
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      gender: userData.gender || '',
      device_access: userData.device_access || 3,
      is_active: userData.is_active,
      user_status: userData.user_status || 'ACTIVE',
      must_reset_password: userData.must_reset_password ?? true,
      designation: userData.designation || '',
      joining_date: userData.joining_date || '',
      reporting_manager: userData.reporting_manager || null,
      lead_data_scope: userData.lead_data_scope || 'OWN',
      followup_data_scope: userData.followup_data_scope || 'OWN',
      sitevisit_data_scope: userData.sitevisit_data_scope || 'OWN',
      booking_data_scope: userData.booking_data_scope || 'OWN',
    });

    if (userData.reporting_manager) {
      setSelectedReportingManager({
        id: userData.reporting_manager,
        fullname: userData.reporting_manager_name || '',
      });
    }

    // Populate permission map from existing data
    if (userData.screen_permissions?.length) {
      const map: Record<string, ScreenPermissionInput> = {};
      userData.screen_permissions.forEach((p) => {
        map[p.screen_code] = {
          screen_code: p.screen_code,
          can_view: p.can_view,
          can_add: p.can_add,
          can_edit: p.can_edit,
          can_delete: p.can_delete,
          can_export: p.can_export,
        };
      });
      setPermissionsMap(map);
    }
  }, [userData, reset]);

  const parseApiErrors = (data: any) => {
    const errs: Record<string, string> = {};
    const src = data?.errors || data;
    if (src && typeof src === 'object') {
      Object.keys(src).forEach((k) => {
        if (k === 'detail' || k === 'error') return;
        const v = src[k];
        errs[k] = Array.isArray(v) ? v.join(' ') : String(v);
      });
    }
    return errs;
  };

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toastSuccess('User created successfully');
      setApiErrors({});
      setTimeout(() => navigate('/settings/users'), 800);
    },
    onError: (err: any) => {
      const errs = parseApiErrors(err.response?.data);
      setApiErrors(errs);
      if (!Object.keys(errs).length) {
        toastError(err.response?.data?.detail || 'Failed to create user');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UserFormData) => usersApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toastSuccess('User updated successfully');
      setApiErrors({});
      if (isProfileMode) {
        authApi.getCurrentUser().then((u) => dispatch(setUser({ ...currentUser, ...u }))).catch(() => {});
      }
      setTimeout(() => navigate(backPath), 800);
    },
    onError: (err: any) => {
      const errs = parseApiErrors(err.response?.data);
      setApiErrors(errs);
      if (!Object.keys(errs).length) {
        toastError(err.response?.data?.detail || 'Failed to update user');
      }
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (isEditMode && !data.password) delete (data as any).password;
    if ((data.gender as any) === '') delete (data as any).gender;

    if (isProfileMode) {
      updateMutation.mutate({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        gender: data.gender || undefined,
        ...(profilePictureFile ? { profilepicture: profilePictureFile } : {}),
        ...(!profilePictureFile && !profilePicturePreview && isEditMode ? { remove_profilepicture: true } : {}),
      } as UserFormData);
      return;
    }

    // Build screen_permissions_input — only screens with at least one action
    const screen_permissions_input: ScreenPermissionInput[] = Object.values(permissionsMap).filter(
      (p) => p.can_view || p.can_add || p.can_edit || p.can_delete || p.can_export
    );

    const submitData: UserFormData = {
      ...data,
      screen_permissions_input,
      ...(profilePictureFile ? { profilepicture: profilePictureFile } : {}),
      ...(!profilePictureFile && !profilePicturePreview && isEditMode ? { remove_profilepicture: true } : {}),
    };

    isEditMode ? updateMutation.mutate(submitData) : createMutation.mutate(submitData);
  };

  const backPath = isProfileMode ? '/profile' : '/settings/users';
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (userLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const SectionTitle = ({ title }: { title: string }) => (
    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>{title}</Typography>
  );

  const FieldLabel = ({ label, required }: { label: string; required?: boolean }) => (
    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
      {label}
      {required && <Box component="span" sx={{ color: 'error.main', ml: 0.3 }}>*</Box>}
    </Typography>
  );

  return (
    <Box sx={getPageContainerStyles()}>
      {/* Header */}
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <ScreenHeader
            title={isProfileMode ? 'Edit Profile' : isEditMode ? 'Edit User' : 'Add User'}
            showBackButton onBack={() => navigate(backPath)} disableBox
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" color="secondary" size="small" onClick={() => navigate(backPath)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit" form="user-form" variant="contained" size="small"
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : isEditMode ? 'Update User' : 'Create User'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ p: 3, borderRadius: 0 }}>
          <form id="user-form" onSubmit={handleSubmit(onSubmit)}>

            {/* Profile Picture */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Box sx={{
                width: 110, height: 110, borderRadius: '50%',
                overflow: 'hidden', border: '3px solid', borderColor: 'primary.main',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: 'grey.100', mb: 1.5,
              }}>
                {profilePicturePreview
                  ? <Box component="img" src={profilePicturePreview} alt="Profile" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Typography variant="h3" sx={{ color: 'grey.400' }}>{watch('first_name')?.[0]?.toUpperCase() || '?'}</Typography>
                }
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" component="label" disabled={isSubmitting}>
                  {profilePicturePreview ? 'Change Photo' : 'Upload Photo'}
                  <input type="file" hidden accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { toastError('Max 5MB'); return; }
                      setProfilePictureFile(file);
                      setProfilePicturePreview(URL.createObjectURL(file));
                    }} />
                </Button>
                {profilePicturePreview && (
                  <Button variant="outlined" size="small" color="error" disabled={isSubmitting}
                    onClick={() => { setProfilePictureFile(null); setProfilePicturePreview(null); }}>
                    Remove
                  </Button>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>JPG, PNG or WebP. Max 5MB.</Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* ── Basic Information ── */}
            <SectionTitle title="Basic Information" />
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FieldLabel label="First Name" required />
                <Controller name="first_name" control={control} rules={{ required: 'First name is required' }}
                  render={({ field }) => (
                    <TextField {...field} placeholder="John" fullWidth size="small"
                      error={!!errors.first_name || !!apiErrors.first_name}
                      helperText={errors.first_name?.message || apiErrors.first_name}
                      disabled={isSubmitting} />
                  )} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FieldLabel label="Last Name" />
                <Controller name="last_name" control={control}
                  render={({ field }) => (
                    <TextField {...field} placeholder="Doe" fullWidth size="small" disabled={isSubmitting} />
                  )} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FieldLabel label="Username" />
                <Controller name="username" control={control}
                  rules={{ pattern: { value: /^[a-zA-Z0-9]*$/, message: 'Alphanumeric only' } }}
                  render={({ field }) => (
                    <TextField {...field} placeholder="Auto-generated if blank" fullWidth size="small"
                      error={!!errors.username || !!apiErrors.username}
                      helperText={errors.username?.message || apiErrors.username || 'Leave blank to auto-generate'}
                      disabled={isSubmitting || isEditMode} />
                  )} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FieldLabel label="Email" required={!isProfileMode} />
                <Controller name="email" control={control}
                  rules={{
                    required: !isProfileMode ? 'Email is required' : false,
                    pattern: { value: CONTACT_EMAIL_REGEX, message: 'Enter a valid email' },
                  }}
                  render={({ field }) => (
                    <TextField {...field} type="email" placeholder="user@company.com" fullWidth size="small"
                      error={!!errors.email || !!apiErrors.email}
                      helperText={errors.email?.message || apiErrors.email}
                      disabled={isSubmitting}
                      onChange={(e) => { field.onChange(e.target.value.replace(/\s/g, '')); setApiErrors((p) => ({ ...p, email: '' })); }} />
                  )} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FieldLabel label="Phone" />
                <Controller name="phone" control={control}
                  rules={{
                    pattern: { value: CONTACT_PHONE_REGEX, message: 'Enter a valid phone number' },
                    minLength: { value: CONTACT_PHONE_MIN_LENGTH, message: 'Minimum 10 digits' },
                    maxLength: { value: CONTACT_PHONE_MAX_LENGTH, message: 'Maximum 15 characters' },
                  }}
                  render={({ field }) => (
                    <TextField {...field} placeholder="+91 9876543210" fullWidth size="small"
                      error={!!errors.phone || !!apiErrors.phone}
                      helperText={errors.phone?.message || apiErrors.phone || PHONE_FIELD_HELPER_TEXT}
                      disabled={isSubmitting} inputProps={{ maxLength: CONTACT_PHONE_MAX_LENGTH }}
                      onChange={(e) => field.onChange(sanitizePhoneInput(e.target.value))} />
                  )} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FieldLabel label="Gender" />
                <Controller name="gender" control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <Select {...field} value={field.value ?? ''} disabled={isSubmitting} displayEmpty>
                        <MenuItem value=""><em>Select gender</em></MenuItem>
                        {GENDER_CHOICES.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )} />
              </Grid>
            </Grid>

            {!isProfileMode && (
              <>
                <Divider sx={{ my: 3 }} />

                {/* ── Employee Information ── */}
                <SectionTitle title="Employee Information" />
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <FieldLabel label="Designation" />
                    <Controller name="designation" control={control}
                      render={({ field }) => (
                        <TextField {...field} value={field.value || ''} placeholder="e.g., Team Leader"
                          fullWidth size="small" disabled={isSubmitting} />
                      )} />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <FieldLabel label="Joining Date" />
                    <Controller name="joining_date" control={control}
                      render={({ field }) => (
                        <TextField {...field} value={field.value || ''} type="date"
                          fullWidth size="small" disabled={isSubmitting} InputLabelProps={{ shrink: true }} />
                      )} />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <FieldLabel label="Reporting Manager" />
                    <Controller name="reporting_manager" control={control}
                      render={({ field }) => (
                        <SearchableDropdown
                          label="" apiEndpoint="/api/usermanagement/dropdowns/reporting-managers/"
                          value={selectedReportingManager}
                          onChange={(v: any) => { setSelectedReportingManager(v || null); field.onChange(v?.id || null); }}
                          disabled={isSubmitting} placeholder="Select reporting manager" size="small"
                        />
                      )} />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* ── Security ── */}
                <SectionTitle title="Security" />
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <FieldLabel label="Password" required={!isEditMode} />
                    <Controller name="password" control={control}
                      rules={!isEditMode
                        ? { required: 'Password is required', validate: (v) => !v || isPasswordValid(v) || 'Does not meet requirements' }
                        : { validate: (v) => !v || isPasswordValid(v) || 'Does not meet requirements' }}
                      render={({ field }) => (
                        <>
                          <TextField {...field} type={showPassword ? 'text' : 'password'}
                            placeholder={isEditMode ? 'Leave blank to keep current' : 'Enter password'}
                            fullWidth size="small" error={!!errors.password}
                            helperText={errors.password?.message || (isEditMode ? 'Leave blank to keep current' : '')}
                            disabled={isSubmitting}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton onClick={() => setShowPassword(!showPassword)} size="small" edge="end">
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }} />
                          {field.value && (
                            <Box sx={{ mt: 1 }}>
                              {PASSWORD_RULES.map((rule, i) => {
                                const ok = rule.test(field.value || '');
                                return (
                                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                                    {ok
                                      ? <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                      : <CancelRuleIcon sx={{ fontSize: 14, color: 'error.main' }} />}
                                    <Typography variant="caption" sx={{ color: ok ? 'success.main' : 'error.main' }}>
                                      {rule.label}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
                        </>
                      )} />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <FieldLabel label="Device Access" />
                    <Controller name="device_access" control={control}
                      render={({ field }) => (
                        <FormControl fullWidth size="small">
                          <Select {...field} disabled={isSubmitting}>
                            {DEVICE_ACCESS_CHOICES.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                          </Select>
                        </FormControl>
                      )} />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <FieldLabel label="User Status" />
                    <Controller name="user_status" control={control}
                      render={({ field }) => (
                        <FormControl fullWidth size="small">
                          <Select {...field} disabled={isSubmitting}>
                            {USER_STATUS_CHOICES.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                          </Select>
                        </FormControl>
                      )} />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller name="is_active" control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch {...field} checked={!!field.value} disabled={isSubmitting} />}
                          label={
                            <Box>
                              <Typography variant="body2" fontWeight={600}>Active Account</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {isActive ? 'User can log in' : 'User cannot log in'}
                              </Typography>
                            </Box>
                          }
                        />
                      )} />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Controller name="must_reset_password" control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch {...field} checked={!!field.value} disabled={isSubmitting} />}
                          label={
                            <Box>
                              <Typography variant="body2" fontWeight={600}>Force Password Reset</Typography>
                              <Typography variant="caption" color="text.secondary">On first login</Typography>
                            </Box>
                          }
                        />
                      )} />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* ── Screen Permissions ── */}
                <SectionTitle title="Screen Permissions" />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Search and add screens this user can access, then set their allowed actions.
                </Typography>
                <ScreenPermissionPicker
                  availableScreens={availableScreens}
                  value={permissionsMap}
                  onChange={setPermissionsMap}
                  disabled={isSubmitting}
                />
              </>
            )}
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default UserForm;

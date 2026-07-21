// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Grid,
  CircularProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Radio,
  Switch,
  Divider,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import type { DropdownOption } from '../../types/common.types';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
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
import { usersApi, type UserFormData } from '../../api/users.api';
import { groupsApi } from '../../api/groups.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import type { Group } from '../../types/auth.types';
import ScreenHeader from '../../components/common/ScreenHeader';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../../utils/spacing';
import {
  CONTACT_EMAIL_REGEX,
  CONTACT_PHONE_MAX_LENGTH,
  CONTACT_PHONE_MIN_LENGTH,
  CONTACT_PHONE_REGEX,
  PHONE_FIELD_HELPER_TEXT,
  sanitizePhoneInput,
} from '../../utils/validation';
import { PASSWORD_RULES, isPasswordValid } from '../../utils/passwordValidation';

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

  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile picture state
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    defaultValues: {
      username: '',
      email: '',
      phone: '',
      first_name: '',
      password: '',
      gender: '',
      device_access: 3,
      is_active: true,
      group_ids: [],
      designation: '',
      joining_date: '',
      reporting_manager: '',
    },
  });

  const isActive = watch('is_active');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Users', path: '/settings/users', icon: <PeopleIcon fontSize="small" /> },
      { label: isEditMode ? 'Edit User' : 'Add User' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode]);

  // Fetch user data if editing
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.get(id!),
    enabled: isEditMode,
  });

  // Populate form when user data is loaded
  useEffect(() => {
    if (userData) {
      // Set profile picture preview from existing data
      if (userData.profilepicture) {
        setProfilePicturePreview(userData.profilepicture);
      }
      
      reset({
        username: userData.username,
        email: userData.email || '',
        phone: userData.phone || '',
        first_name: userData.first_name || '',
        gender: userData.gender,
        device_access: userData.device_access || 3,
        is_active: userData.is_active,
        group_ids: userData.groups?.map((g) => g.id) || [],
        designation: userData.designation || '',
        joining_date: userData.joining_date || '',
        reporting_manager: userData.reporting_manager || '',
      });
      
      if (userData.groups) {
        setSelectedGroups(userData.groups);
      }
    }
  }, [userData, reset]);

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => usersApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toastSuccess('User created successfully');
      setTimeout(() => navigate('/settings/users'), 1000);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || error.response?.data?.username?.[0] || error.response?.data?.detail || 'Failed to create user';
      toastError(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UserFormData) => usersApi.update(id!, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toastSuccess('User updated successfully');
      // Refresh auth user data to update AppBar avatar
      if (isProfileMode) {
        authApi.getCurrentUser().then((userData) => {
          dispatch(setUser({ ...currentUser, ...userData }));
        }).catch(() => {});
      }
      setTimeout(() => navigate(backPath), 1000);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || error.response?.data?.username?.[0] || error.response?.data?.detail || 'Failed to update user';
      toastError(errorMsg);
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (!isProfileMode) {
      // Validate that at least one group is selected
      if (selectedGroups.length === 0) {
        toastError('At least one group must be selected');
        return;
      }
    }

    const safeData = { ...data } as UserFormData & { is_staff?: boolean };
    delete safeData.is_staff;

    let submitData: any;

    if (isProfileMode) {
      // Profile mode: only send basic info fields
      submitData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        gender: data.gender === '' ? undefined : data.gender,
        ...(profilePictureFile && { profilepicture: profilePictureFile }),
        ...(!profilePictureFile && !profilePicturePreview && isEditMode && { remove_profilepicture: true }),
      };
    } else {
      submitData = {
        ...safeData,
        group_ids: selectedGroups.map((g) => g.id),
        gender: data.gender === '' ? undefined : data.gender,
        ...(isEditMode && !data.password && { password: undefined }),
        ...(profilePictureFile && { profilepicture: profilePictureFile }),
        ...(!profilePictureFile && !profilePicturePreview && isEditMode && { remove_profilepicture: true }),
      };
    }


    if (isEditMode) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const backPath = isProfileMode ? '/profile' : '/settings/users';

  const handleCancel = () => {
    navigate(backPath);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoading = userLoading;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={getPageContainerStyles()}>
      {/* Fixed Header with Title and Actions */}
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <ScreenHeader
            title={isProfileMode ? 'Edit Profile' : isEditMode ? 'Edit User' : 'Add User'}
            showBackButton
            onBack={() => navigate(backPath)}
            disableBox
          />
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="user-form"
              variant="contained"
              color="primary"
              size="small"
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Scrollable Content Area */}
      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ p: 3, borderRadius: 0 }}>
          <form id="user-form" onSubmit={handleSubmit(onSubmit)}>
            {/* Profile Picture Section */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid',
                  borderColor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#f0f0f0',
                  mb: 1.5,
                  position: 'relative',
                }}
              >
                {profilePicturePreview ? (
                  <Box
                    component="img"
                    src={profilePicturePreview}
                    alt="Profile"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Typography variant="h3" sx={{ color: '#bdbdbd' }}>
                    {watch('first_name')?.[0]?.toUpperCase() || '?'}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  component="label"
                  disabled={isSubmitting}
                >
                  {profilePicturePreview ? 'Change Photo' : 'Upload Photo'}
                  <input
                    type="file"
                    hidden
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toastError('Image size must be less than 5MB');
                          return;
                        }
                        setProfilePictureFile(file);
                        setProfilePicturePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </Button>
                {profilePicturePreview && (
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    disabled={isSubmitting}
                    onClick={() => {
                      setProfilePictureFile(null);
                      setProfilePicturePreview(null);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                JPG, PNG or WebP. Max 5MB.
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Basic Information Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Basic Information
            </Typography>
            <Grid container spacing={3}>
              {/* Name */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="first_name"
                  control={control}
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., John Doe"
                      fullWidth
                      size="small"
                      error={!!errors.first_name}
                      helperText={errors.first_name?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Username
                </Typography>
                <Controller
                  name="username"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[a-zA-Z0-9]+$/,
                      message: 'Username should only contain alphanumeric characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Auto-generated if left blank"
                      fullWidth
                      size="small"
                      error={!!errors.username}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Email */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Email
                </Typography>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    pattern: {
                      value: CONTACT_EMAIL_REGEX,
                      message: 'Please enter a valid email address (e.g., john@company.com)',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., user@company.com"
                      type="email"
                      fullWidth
                      size="small"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, '');
                        field.onChange(value);
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Phone */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Phone
                </Typography>
                <Controller
                  name="phone"
                  control={control}
                  rules={{
                    pattern: {
                      value: CONTACT_PHONE_REGEX,
                      message: 'Please enter a valid phone number (e.g., +91 9876543210 or 040-12345678)',
                    },
                    minLength: {
                      value: CONTACT_PHONE_MIN_LENGTH,
                      message: 'Phone number must be at least 10 digits',
                    },
                    maxLength: {
                      value: CONTACT_PHONE_MAX_LENGTH,
                      message: 'Phone number cannot exceed 15 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., +91 9876543210"
                      fullWidth
                      size="small"
                      error={!!errors.phone}
                      helperText={errors.phone?.message || PHONE_FIELD_HELPER_TEXT}
                      disabled={isSubmitting}
                      inputProps={{ maxLength: CONTACT_PHONE_MAX_LENGTH }}
                      onChange={(e) => {
                        const value = sanitizePhoneInput(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Gender */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Gender
                </Typography>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <Select {...field} disabled={isSubmitting} displayEmpty>
                        <MenuItem value="">
                          <em>Select gender</em>
                        </MenuItem>
                        {GENDER_CHOICES.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {!isProfileMode && (<>
            {/* Employee Information Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Employee Information
            </Typography>
            <Grid container spacing={3}>
              {/* Designation */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Designation
                </Typography>
                <Controller
                  name="designation"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., Team Leader, Director"
                      fullWidth
                      size="small"
                      value={field.value || ''}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Joining Date */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Joining Date
                </Typography>
                <Controller
                  name="joining_date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      fullWidth
                      size="small"
                      value={field.value || ''}
                      disabled={isSubmitting}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              {/* Reporting Manager */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Reporting Manager
                </Typography>
                <Controller
                  name="reporting_manager"
                  control={control}
                  render={({ field }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint="/api/usermanagement/dropdowns/reporting-managers/"
                      value={field.value ? { id: field.value, name: userData?.reporting_manager_name || '' } as any : null}
                      onChange={(newValue: any) => {
                        field.onChange(newValue?.id || null);
                      }}
                      disabled={isSubmitting}
                      placeholder="Select reporting manager"
                      size="small"
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Security Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Security
            </Typography>
            <Grid container spacing={3}>
              {/* Password */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Password {!isEditMode && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}
                </Typography>
                <Controller
                  name="password"
                  control={control}
                  rules={
                    !isEditMode
                      ? {
                          required: 'Password is required',
                          validate: (value: string) => {
                            if (!value) return 'Password is required';
                            if (!isPasswordValid(value)) return 'Password does not meet all requirements';
                            return true;
                          },
                        }
                      : {
                          validate: (value: string) => {
                            if (value && !isPasswordValid(value)) return 'Password does not meet all requirements';
                            return true;
                          },
                        }
                  }
                  render={({ field }) => (
                    <>
                      <TextField
                        {...field}
                        placeholder={isEditMode ? "Leave blank to keep current" : "Enter password"}
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        size="small"
                        error={!!errors.password}
                        helperText={errors.password?.message || (isEditMode ? 'Leave blank to keep current password' : '')}
                        disabled={isSubmitting}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                size="small"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      {/* Password requirements checklist */}
                      {field.value && (
                        <Box sx={{ mt: 1 }}>
                          {PASSWORD_RULES.map((rule, index) => {
                            const passed = rule.test(field.value || '');
                            return (
                              <Box
                                key={index}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  mb: 0.25,
                                }}
                              >
                                {passed ? (
                                  <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                ) : (
                                  <CancelRuleIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                )}
                                <Typography
                                  variant="caption"
                                  sx={{ color: passed ? 'success.main' : 'error.main' }}
                                >
                                  {rule.label}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </>
                  )}
                />
              </Grid>

              {/* Device Access */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Device Access
                </Typography>
                <Controller
                  name="device_access"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <Select {...field} disabled={isSubmitting}>
                        {DEVICE_ACCESS_CHOICES.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Groups & Permissions Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Groups & Permissions
            </Typography>
            <Grid container spacing={3}>
              {/* Groups */}
              <Grid size={{ xs: 12 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Groups <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <SearchableDropdown
                  label=""
                  apiEndpoint="/api/users/groups/"
                  value={selectedGroups}
                  onChange={(newValue) => setSelectedGroups(Array.isArray(newValue) ? newValue : [])}
                  disabled={isSubmitting}
                  placeholder="Select groups (at least 1 required)"
                  helperText={`${selectedGroups.length} group(s) selected`}
                  error={selectedGroups.length === 0}
                  multiple
                  size="small"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Status Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Status
            </Typography>
            <Grid container spacing={3}>
              {/* Active Status */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          {...field}
                          checked={field.value}
                          disabled={isSubmitting}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">
                            Active Status
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                              {isActive ? 'User can login' : 'User cannot login'}
                            </Typography>
                          </Box>
                        }
                      />
                    )}
                  />
                </Grid>
            </Grid>
          </>)}
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default UserForm;

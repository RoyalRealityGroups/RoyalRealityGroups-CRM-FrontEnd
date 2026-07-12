import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, PersonOutline, LockOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Button, TextField } from '../common';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';
import { storage } from '../../utils/storage';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember_me: false,
  });

  const [validationErrors, setValidationErrors] = useState({
    username: '',
    password: '',
  });
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const toErrorText = (value: unknown): string => {
    if (Array.isArray(value)) return String(value[0] ?? '');
    return String(value ?? '');
  };

  const getFriendlyFieldError = (field: 'username' | 'password', rawValue: unknown): string => {
    const message = toErrorText(rawValue).trim();
    const normalized = message.toLowerCase();
    if (field === 'username') {
      if (normalized.includes('required') || normalized.includes('blank'))
        return 'Please enter your username.';
      if (normalized.includes('not found')) return 'No account found with this username.';
    }
    if (field === 'password') {
      if (normalized.includes('required') || normalized.includes('blank'))
        return 'Please enter your password.';
      if (normalized.includes('incorrect')) return 'The password you entered is incorrect.';
    }
    return message;
  };

  const getFriendlyGeneralError = (err: any): string => {
    if (!err?.response)
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    const data = err.response?.data || {};
    const rawMessage = data?.detail || data?.message || data?.error || '';
    const message = String(rawMessage).trim();
    const normalized = message.toLowerCase();
    if (normalized.includes('inactive'))
      return 'Your account is inactive. Please contact your administrator.';
    if (normalized.includes('device not allowed'))
      return 'This device is not allowed for login. Please contact your administrator.';
    return message || 'Login failed. Please verify your credentials and try again.';
  };

  const extractLoginErrors = (backendData: any) => {
    const source =
      backendData?.errors && typeof backendData.errors === 'object' ? backendData.errors : backendData;
    return { username: source?.username, password: source?.password };
  };

  useEffect(() => {
    const saved = storage.getSavedCredentials();
    if (saved) {
      setFormData((prev) => ({
        ...prev,
        username: saved.username,
        password: saved.password,
        remember_me: true,
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formError) setFormError('');
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = { username: '', password: '' };
    if (!formData.username.trim()) errors.username = 'Please enter your username.';
    if (!formData.password) errors.password = 'Please enter your password.';
    else if (!formData.password.trim()) errors.password = 'Password cannot be empty spaces.';
    setValidationErrors(errors);
    return !errors.username && !errors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    try {
      const payload = { ...formData, username: formData.username.trim() };
      if (payload.remember_me) storage.setSavedCredentials(payload.username, payload.password);
      else storage.clearSavedCredentials();
      await login(payload);
    } catch (err: any) {
      if (err.response?.data) {
        const extracted = extractLoginErrors(err.response.data);
        const nextErrors = {
          username: extracted.username ? getFriendlyFieldError('username', extracted.username) : '',
          password: extracted.password ? getFriendlyFieldError('password', extracted.password) : '',
        };
        setValidationErrors(nextErrors);
        if (!nextErrors.username && !nextErrors.password) setFormError(getFriendlyGeneralError(err));
      } else {
        setFormError(getFriendlyGeneralError(err));
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        backgroundColor: '#F5F7F8',
      }}
    >
      {/* Left brand panel — solid teal, restrained */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 5,
          backgroundColor: '#003D52',
          color: '#FFFFFF',
          flexDirection: 'column',
          justifyContent: 'space-between',
          px: 6,
          py: 6,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              overflow: 'hidden',
              backgroundColor: '#001218',
            }}
          >
            <Box
              component="img"
              src="/logo.jpeg"
              alt="Royal Reality Groups"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 38%', display: 'block' }}
            />
          </Box>
          <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600 }}>
            Royal Reality Groups
          </Typography>
        </Box>

        <Box sx={{ maxWidth: 460 }}>
          <Typography sx={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            Run your real-estate business with one calm workspace.
          </Typography>
          <Typography sx={{ mt: 2, fontSize: '0.9375rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
            Projects, leads, follow-ups, and dashboards — for the teams that build the homes.
          </Typography>
        </Box>

        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>
          © {new Date().getFullYear()} Royal Reality Groups
        </Typography>
      </Box>

      {/* Right form panel — plain white */}
      <Box
        sx={{
          flex: { xs: 1, md: 6 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, sm: 5, md: 8 },
          py: 6,
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile-only brand mark */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                overflow: 'hidden',
                backgroundColor: '#001218',
              }}
            >
              <Box
                component="img"
                src="/logo.jpeg"
                alt="Royal Reality Groups"
                sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 38%', display: 'block' }}
              />
            </Box>
            <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600 }}>
              Royal Reality Groups
            </Typography>
          </Box>

          <Typography variant="h2" sx={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
            Sign in
          </Typography>
          <Typography sx={{ mt: 0.75, mb: 4, fontSize: '0.875rem', color: 'text.secondary' }}>
            Use your work account to continue.
          </Typography>

          {(formError || error) && !validationErrors.username && !validationErrors.password && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {formError || error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Box sx={{ mb: 2 }}>
              <TextField
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                error={!!validationErrors.username}
                helperText={validationErrors.username}
                required
                fullWidth
                autoFocus
                disabled={isLoading}
                placeholder="Enter your username"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutline fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ mb: 2.5 }}>
              <TextField
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={!!validationErrors.password}
                helperText={validationErrors.password}
                required
                fullWidth
                disabled={isLoading}
                placeholder="Enter your password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={isLoading}
                        size="small"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.remember_me}
                    onChange={handleChange}
                    name="remember_me"
                    disabled={isLoading}
                    size="small"
                  />
                }
                label={<Typography sx={{ fontSize: '0.8125rem' }}>Remember me</Typography>}
              />
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                disabled={isLoading}
                sx={{ fontSize: '0.8125rem' }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
